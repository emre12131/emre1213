/**
 * Internal callback route — called by the Python AI worker when processing is done.
 * This endpoint is NOT exposed to users; it should be behind a firewall or
 * validated with a shared secret in production.
 */

import { Router } from 'express';
import { prisma } from '../utils/db.js';
import { dispatchWebhooks } from '../services/webhook-dispatcher.js';

const router = Router();

// POST /api/ai-callback
router.post('/', async (req, res, next) => {
  // Verify internal secret
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { meeting_id, status, transcript, summary, title, action_items, key_decisions, follow_up_email, language, error } = req.body;

    if (!meeting_id) return res.status(422).json({ error: 'Missing meeting_id' });

    if (status === 'completed') {
      // Save transcript
      if (transcript) {
        await prisma.transcript.upsert({
          where:  { meetingId: meeting_id },
          create: { meetingId: meeting_id, text: transcript },
          update: { text: transcript },
        });
      }

      // Save summary
      await prisma.summary.upsert({
        where:  { meetingId: meeting_id },
        create: {
          meetingId:     meeting_id,
          title,
          text:          summary || '',
          actionItems:   action_items || [],
          keyDecisions:  key_decisions || [],
          followUpEmail: follow_up_email || '',
        },
        update: {
          title,
          text:          summary || '',
          actionItems:   action_items || [],
          keyDecisions:  key_decisions || [],
          followUpEmail: follow_up_email || '',
        },
      });

      // Update meeting
      await prisma.meeting.update({
        where: { id: meeting_id },
        data: {
          status:   'COMPLETED',
          title:    title || undefined,
          language: language || undefined,
        },
      });

      // Fire user webhooks
      dispatchWebhooks({ meetingId: meeting_id, event: 'meeting.completed' }).catch(console.error);

    } else {
      // Processing failed
      await prisma.meeting.update({
        where: { id: meeting_id },
        data: { status: 'FAILED' },
      });

      dispatchWebhooks({ meetingId: meeting_id, event: 'meeting.failed' }).catch(console.error);
    }

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

export default router;
