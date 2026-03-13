import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import authRouter     from './routes/auth.js';
import meetingsRouter from './routes/meetings.js';
import chunksRouter   from './routes/chunks.js';
import webhooksRouter from './routes/webhooks.js';
import aiCallbackRouter from './routes/ai-callback.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: [
    'http://localhost:3000',   // Next.js dashboard
    'chrome-extension://*',    // Chrome extension
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded audio files (in production: use S3 or similar)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/api/auth',         authRouter);
app.use('/api/meetings',     meetingsRouter);
app.use('/api/meetings',     chunksRouter);       // /api/meetings/:id/chunks
app.use('/api/webhooks',     webhooksRouter);
app.use('/api/ai-callback',  aiCallbackRouter);   // called by Python AI worker

// ── Health ────────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ── Error handler ─────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Bluedot API running on http://localhost:${PORT}`);
});
