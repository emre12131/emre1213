import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import crypto from 'crypto';

const router = Router();

// GET /api/webhooks
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const webhooks = await prisma.webhook.findMany({
      where:   { userId: req.userId },
      include: { deliveries: { orderBy: { createdAt: 'desc' }, take: 5 } },
    });
    res.json(webhooks);
  } catch (err) {
    next(err);
  }
});

// POST /api/webhooks
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(422).json({ error: 'URL is required' });

    const secret = crypto.randomBytes(24).toString('hex');

    const webhook = await prisma.webhook.create({
      data: {
        userId: req.userId,
        url,
        secret,
        events: events || ['meeting.completed'],
      },
    });

    res.status(201).json(webhook);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/webhooks/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const wh = await prisma.webhook.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!wh) return res.status(404).json({ error: 'Webhook not found' });

    await prisma.webhook.delete({ where: { id: wh.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
