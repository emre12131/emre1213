import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';
import { dispatchWebhooks } from '../services/webhook-dispatcher.js';

const router = Router();

// GET /api/meetings
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const meetings = await prisma.meeting.findMany({
      where:   { userId: req.userId },
      orderBy: { startedAt: 'desc' },
      include: { summary: true, transcript: { select: { id: true } } },
    });
    res.json(meetings);
  } catch (err) {
    next(err);
  }
});

// GET /api/meetings/:id
router.get('/:id', requireAuth, async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findFirst({
      where:   { id: req.params.id, userId: req.userId },
      include: { summary: true, transcript: true, participants: true },
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });
    res.json(meeting);
  } catch (err) {
    next(err);
  }
});

// POST /api/meetings — create meeting (called by extension at recording start)
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { platform, title, meetingUrl } = req.body;

    const meeting = await prisma.meeting.create({
      data: {
        userId:     req.userId,
        title:      title || 'Untitled Meeting',
        platform,
        meetingUrl,
        status:     'RECORDING',
      },
    });

    res.status(201).json(meeting);
  } catch (err) {
    next(err);
  }
});

// POST /api/meetings/:id/finalize — called by extension when recording stops
router.post('/:id/finalize', requireAuth, async (req, res, next) => {
  try {
    const { duration } = req.body;

    const meeting = await prisma.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    // Mark as PROCESSING and trigger AI worker
    const updated = await prisma.meeting.update({
      where: { id: meeting.id },
      data: {
        status:  'PROCESSING',
        endedAt: new Date(),
        duration,
      },
    });

    // Assemble audio and kick off transcription (async)
    const { assembleAndProcess } = await import('../services/audio-assembler.js');
    assembleAndProcess(meeting.id, req.userId).catch(console.error);

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/meetings/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const meeting = await prisma.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId },
    });
    if (!meeting) return res.status(404).json({ error: 'Meeting not found' });

    await prisma.meeting.delete({ where: { id: meeting.id } });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
