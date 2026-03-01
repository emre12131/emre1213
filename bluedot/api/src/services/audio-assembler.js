/**
 * Assembles audio chunks into a single file, then triggers the AI worker.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../utils/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR  = path.join(__dirname, '../../uploads');
const CHUNKS_DIR   = path.join(UPLOADS_DIR, 'chunks');
const MEETINGS_DIR = path.join(UPLOADS_DIR, 'meetings');
const AI_WORKER_URL = process.env.AI_WORKER_URL || 'http://localhost:8000';
const INTERNAL_SECRET = process.env.INTERNAL_SECRET;
const API_URL = process.env.API_URL || 'http://localhost:4000';

export async function assembleAndProcess(meetingId, userId) {
  console.log(`[Assembler] Starting for meeting ${meetingId}`);

  await fs.mkdir(MEETINGS_DIR, { recursive: true });

  // Fetch all chunks in order
  const chunks = await prisma.audioChunk.findMany({
    where:   { meetingId },
    orderBy: { chunkIndex: 'asc' },
  });

  if (chunks.length === 0) {
    console.warn(`[Assembler] No chunks for meeting ${meetingId}`);
    await prisma.meeting.update({ where: { id: meetingId }, data: { status: 'FAILED' } });
    return;
  }

  // Concatenate chunk binaries
  const buffers = await Promise.all(
    chunks.map(c => fs.readFile(c.filePath))
  );
  const combined = Buffer.concat(buffers);

  const audioPath = path.join(MEETINGS_DIR, `${meetingId}.webm`);
  await fs.writeFile(audioPath, combined);

  // Update meeting with audio path
  await prisma.meeting.update({
    where: { id: meetingId },
    data:  { audioPath },
  });

  // Trigger AI worker
  const callbackUrl = `${API_URL}/api/ai-callback`;

  const response = await fetch(`${AI_WORKER_URL}/transcription/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      meeting_id:   meetingId,
      audio_path:   audioPath,
      callback_url: callbackUrl,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`AI worker returned ${response.status}: ${text}`);
  }

  console.log(`[Assembler] Meeting ${meetingId} handed off to AI worker`);

  // Clean up chunks from disk (keep DB records for auditing)
  for (const chunk of chunks) {
    await fs.unlink(chunk.filePath).catch(() => {});
  }
  const chunkDir = path.join(CHUNKS_DIR, meetingId);
  await fs.rmdir(chunkDir).catch(() => {});
}
