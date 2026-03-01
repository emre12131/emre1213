# Bluedot — AI Meeting Recorder (Open Source Clone)

A full-stack, self-hosted alternative to Bluedot HQ. Records your Google Meet, Zoom, and Teams meetings silently via a Chrome Extension (no bot joins the call), transcribes with OpenAI Whisper, and generates summaries with GPT-4o.

---

## Architecture

```
bluedot/
├── extension/        Chrome Extension (Manifest V3) — bot-free tab audio capture
├── api/              Node.js / Express API — auth, storage, webhooks (PostgreSQL + Prisma)
├── ai-worker/        Python FastAPI — Whisper transcription + GPT-4o summarization
└── web/              Next.js 15 Dashboard — dark-mode UI
```

### Data flow

```
Browser Tab Audio
      │
      ▼
Chrome Extension (tabCapture API)
      │  30-second WebM chunks (base64)
      ▼
Node.js API  ──────────────────────────────►  PostgreSQL
      │  Assembled .webm file
      ▼
Python AI Worker
  ├─ OpenAI Whisper  → transcript + segments
  └─ GPT-4o          → title, summary, action items, follow-up email
      │  POST /api/ai-callback
      ▼
Node.js API  ──► Webhooks ──► Your app (Zapier, etc.)
```

---

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY at minimum

docker compose up --build
```

Services:
| Service | URL |
|---|---|
| Dashboard | http://localhost:3000 |
| API | http://localhost:4000 |
| AI Worker | http://localhost:8000 |

---

## Quick Start (Local Dev)

### 1. Database

```bash
# Start Postgres
docker compose up db -d
```

### 2. API

```bash
cd api
cp ../.env.example .env   # edit DATABASE_URL etc.
npm install
npx prisma db push
npm run dev
```

### 3. AI Worker

```bash
cd ai-worker
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 4. Web Dashboard

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

### 5. Chrome Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Sign in via the extension popup

---

## Features

- **Bot-free recording** — Uses `chrome.tabCapture` API, zero visible participant in the meeting
- **Chunked upload** — 30-second audio chunks, resilient to network issues
- **Whisper transcription** — OpenAI Whisper API with automatic language detection, 100+ languages
- **GPT-4o analysis** — Meeting title, executive summary, action items (with owner + due date), key decisions, follow-up email draft
- **Timestamp segments** — Transcript displayed segment-by-segment with timestamps
- **Webhook system** — HMAC-SHA256 signed payloads with automatic retry (3 attempts, exponential backoff)
- **Dark-mode dashboard** — Built with Next.js 15 + Tailwind CSS
- **JWT auth** — Secure token-based authentication

---

## API Reference

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login`    | Get JWT token |
| GET  | `/api/auth/me`       | Get current user |

### Meetings
| Method | Path | Description |
|---|---|---|
| GET    | `/api/meetings`               | List all meetings |
| GET    | `/api/meetings/:id`           | Get meeting detail |
| POST   | `/api/meetings`               | Create meeting (extension) |
| POST   | `/api/meetings/:id/chunks`    | Upload audio chunk |
| POST   | `/api/meetings/:id/finalize`  | Finalize recording |
| DELETE | `/api/meetings/:id`           | Delete meeting |

### Webhooks
| Method | Path | Description |
|---|---|---|
| GET    | `/api/webhooks`     | List webhooks |
| POST   | `/api/webhooks`     | Create webhook |
| DELETE | `/api/webhooks/:id` | Delete webhook |

---

## Webhook Payload

```json
{
  "event": "meeting.completed",
  "created_at": "2026-03-01T12:00:00.000Z",
  "meeting": {
    "id": "uuid",
    "title": "Q1 Planning Call",
    "platform": "google_meet",
    "status": "COMPLETED",
    "started_at": "2026-03-01T11:00:00.000Z",
    "duration": 3600,
    "language": "en",
    "summary": "We discussed Q1 roadmap priorities…",
    "action_items": [
      { "text": "Send proposal to John", "owner": "Alice", "due": "Friday" }
    ],
    "key_decisions": ["Move launch to March 15"],
    "follow_up_email": "Hi team,\n\nGreat meeting today…",
    "has_transcript": true
  }
}
```

All webhooks are signed with `X-Bluedot-Signature: sha256=<hmac_hex>`.

---

## Environment Variables

See `.env.example` for all variables.

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | JWT signing secret (use a long random string) |
| `OPENAI_API_KEY` | ✅ | OpenAI API key (for Whisper + GPT-4o) |
| `INTERNAL_SECRET` | ✅ | Shared secret between API and AI Worker |
| `AI_WORKER_URL` | ✅ | URL of the Python AI Worker |
| `API_URL` | ✅ | Public URL of the Node API (for callbacks) |
