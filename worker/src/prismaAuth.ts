import { PrismaClient } from '@prisma/client';
import { AuthenticationCreds, AuthenticationState, BufferJSON, initAuthCreds, SignalDataTypeMap } from '@whiskeysockets/baileys';

export const usePrismaAuthState = async (prisma: PrismaClient) => {
    const writeData = async (data: any, id: string) => {
        try {
            await prisma.session.upsert({
                where: { id },
                update: { data: JSON.stringify(data, BufferJSON.replacer) },
                create: { id, data: JSON.stringify(data, BufferJSON.replacer) }
            });
        } catch (e) {
            console.error('Error writing session data', e);
        }
    };

    const readData = async (id: string) => {
        try {
            const session = await prisma.session.findUnique({ where: { id } });
            if (session) {
                return JSON.parse(session.data, BufferJSON.reviver);
            }
        } catch (e) {
            console.error('Error reading session data', e);
        }
        return null;
    };

    const removeData = async (id: string) => {
        try {
            await prisma.session.delete({ where: { id } });
        } catch (e) {
            // ignore if not found
        }
    };

    const creds: AuthenticationCreds = (await readData('creds')) || initAuthCreds();

    return {
        state: {
            creds,
            keys: {
                get: async (type: keyof SignalDataTypeMap, ids: string[]) => {
                    const data: { [key: string]: any } = {};
                    await Promise.all(
                        ids.map(async (id) => {
                            const value = await readData(`${type}-${id}`);
                            if (type === 'app-state-sync-key' && value) {
                                data[id] = SignalDataTypeMap[type](value);
                            } else if (value) {
                                data[id] = value;
                            }
                        })
                    );
                    return data;
                },
                set: async (data: any) => {
                    const tasks: Promise<void>[] = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const key = `${category}-${id}`;
                            if (value) {
                                tasks.push(writeData(value, key));
                            } else {
                                tasks.push(removeData(key));
                            }
                        }
                    }
                    await Promise.all(tasks);
                }
            }
        },
        saveCreds: () => writeData(creds, 'creds')
    };
};
