import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Groups
app.get('/groups', async (req, res) => {
  const groups = await prisma.group.findMany();
  res.json(groups);
});

app.post('/groups', async (req, res) => {
  const { jid, name } = req.body;
  try {
    const group = await prisma.group.create({
      data: { jid, name },
    });
    res.json(group);
  } catch (e) {
    res.status(400).json({ error: 'Group already exists or invalid data' });
  }
});

app.delete('/groups/:id', async (req, res) => {
  await prisma.group.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Campaigns
app.get('/campaigns', async (req, res) => {
  const campaigns = await prisma.campaign.findMany({
    include: { _count: { select: { deliveries: true } } }
  });
  res.json(campaigns);
});

app.post('/campaigns', async (req, res) => {
  const { name, messageText, startTime, endTime, groupId } = req.body;
  const campaign = await prisma.campaign.create({
    data: {
      name,
      messageText,
      startTime,
      endTime,
      groupId,
      lastMinute: 0 // Start at 0
    }
  });
  res.json(campaign);
});

app.put('/campaigns/:id', async (req, res) => {
  const { isActive, messageText, startTime, endTime } = req.body;
  const campaign = await prisma.campaign.update({
    where: { id: req.params.id },
    data: { isActive, messageText, startTime, endTime }
  });
  res.json(campaign);
});

app.delete('/campaigns/:id', async (req, res) => {
  await prisma.campaign.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Deliveries (Stats)
app.get('/deliveries', async (req, res) => {
  const deliveries = await prisma.delivery.findMany({
    orderBy: { sentAt: 'desc' },
    take: 50,
    include: { campaign: true }
  });
  res.json(deliveries);
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
