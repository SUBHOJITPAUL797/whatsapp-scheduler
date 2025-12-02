import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import pino from 'pino';
import { toZonedTime, format } from 'date-fns-tz';
import { usePrismaAuthState } from './prismaAuth';

const prisma = new PrismaClient();
const logger = pino({ level: 'info' });

// Timezone Configuration
const TIMEZONE = 'Asia/Kolkata';

async function connectToWhatsApp() {
    const { state, saveCreds } = await usePrismaAuthState(prisma);

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: logger as any,
        browser: ["WhatsApp Scheduler", "Chrome", "1.0.0"]
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect?.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('opened connection');
        }
    });

    return sock;
}

// Global socket instance
let socket: any;

// Helper: Check if current hour is within exclusive window
function isWithinExclusiveWindow(nowIST: Date, start: string, end: string): boolean {
    // start/end format "HH:mm"
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const currentH = nowIST.getHours();
    const currentM = nowIST.getMinutes();
    const currentTotal = currentH * 60 + currentM;
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    // Exclusive end: if current hour is the end hour, DO NOT SEND.
    if (currentH === endH) return false;

    // Handle overnight windows (e.g. 22:00 to 06:00)
    if (startTotal < endTotal) {
        // Standard day window
        return currentTotal >= startTotal && currentTotal < endTotal;
    } else {
        // Overnight window
        return currentTotal >= startTotal || currentTotal < endTotal;
    }
}

async function runScheduler() {
    // Convert UTC server time to IST
    const now = new Date();
    const nowIST = toZonedTime(now, TIMEZONE);

    // Format hourKey in IST: "YYYY-MM-DD-HH"
    const hourKey = format(nowIST, 'yyyy-MM-dd-HH', { timeZone: TIMEZONE });

    console.log(`Running scheduler... Server Time: ${now.toISOString()}, IST Time: ${format(nowIST, 'yyyy-MM-dd HH:mm:ss', { timeZone: TIMEZONE })}`);

    // Fetch active campaigns
    const campaigns = await prisma.campaign.findMany({
        where: { isActive: true }
    });

    for (const campaign of campaigns) {
        // 1. Check Window (using IST time)
        if (!isWithinExclusiveWindow(nowIST, campaign.startTime, campaign.endTime)) {
            // console.log(`Campaign ${campaign.name} outside window.`);
            continue;
        }

        // 2. Check Duplicate (Delivery)
        const existing = await prisma.delivery.findUnique({
            where: {
                campaignId_hourKey: {
                    campaignId: campaign.id,
                    hourKey: hourKey
                }
            }
        });

        if (existing) {
            console.log(`Campaign ${campaign.name} already sent this hour (${hourKey}).`);
            continue;
        }

        // 3. Calculate Delay & Update Minute
        // Increment minute 0-10
        const nextMinute = (campaign.lastMinute + 1) % 11;
        await prisma.campaign.update({
            where: { id: campaign.id },
            data: { lastMinute: nextMinute }
        });

        const delayMs = nextMinute * 60 * 1000;
        console.log(`Scheduling ${campaign.name} in ${nextMinute} minutes.`);

        // 4. Schedule Send
        setTimeout(async () => {
            try {
                console.log(`Sending campaign ${campaign.name}...`);

                let recipients: string[] = [];
                if (campaign.groupId) {
                    const group = await prisma.group.findUnique({ where: { id: campaign.groupId } });
                    if (group) recipients.push(group.jid);
                } else {
                    const groups = await prisma.group.findMany();
                    recipients = groups.map(g => g.jid);
                }

                for (const jid of recipients) {
                    if (socket) {
                        await socket.sendMessage(jid, { text: campaign.messageText });
                    }
                }

                // 5. Record Delivery
                await prisma.delivery.create({
                    data: {
                        campaignId: campaign.id,
                        hourKey: hourKey,
                        status: 'SENT'
                    }
                });
                console.log(`Sent ${campaign.name} to ${recipients.length} groups.`);

            } catch (err) {
                console.error(`Failed to send ${campaign.name}:`, err);
            }
        }, delayMs);
    }
}

// Start
(async () => {
    socket = await connectToWhatsApp();

    // Schedule cron: Run at minute 0 of every hour
    cron.schedule('0 * * * *', () => {
        runScheduler();
    });

    console.log('Worker started. Scheduler active (IST configured).');
})();
