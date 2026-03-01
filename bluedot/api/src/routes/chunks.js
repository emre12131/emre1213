/**
 * Audio chunk upload route.
 *
 * The Chrome extension records in 30-second WebM chunks and sends each one
 * as base64. We decode and write to disk keyed by meeting + chunk index.
 * After finalize, audio-assembler.js stitches them into one file.
 */

import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../utils/db.js';
import { requireAuth } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads/chunks');

const router = Router();

// POST /api/meetings/:id/chunks
router.post('/:id/chunks', requireAuth, async (req, res, next) => {
  try {
    const { chunkIndex, data } = req.body;

    if (typeof chunkIndex !== 'number' || !data) {
      return res.status(422).json({ error: 'Missing chunkIndex or data' });
    }

    const meeting = await prisma.meeting.findFirst({
      where: { id: req.params.id, userId: req.userId, status: 'RECORDING' },
    });
    if (!meeting) return res.status(404).json({ error: 'Active meeting not found' });

    // Decode base64 → binary
    const buffer = Buffer.from(data, 'base64');

    const chunkDir = path.join(UPLOADS_DIR, meeting.id);
    await fs.mkdir(chunkDir, { recursive: true });

    const filename = `chunk_${String(chunkIndex).padStart(6, '0')}.webm`;
    const filePath = path.join(chunkDir, filename);

    await fs.writeFile(filePath, buffer);

    await prisma.audioChunk.upsert({
      where:  { meetingId_chunkIndex: { meetingId: meeting.id, chunkIndex } },
      create: { meetingId: meeting.id, chunkIndex, filePath, sizeBytes: buffer.length },
      update: { filePath, sizeBytes: buffer.length },
    });

    res.json({ ok: true, chunkIndex });
  } catch (err) {
    next(err);
  }
});

export default router;
