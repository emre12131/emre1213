"""
Transcription router

POST /transcription/process
  Body: { meeting_id, audio_path, language?, callback_url }

  1. Calls WhisperService to transcribe the audio file
  2. Calls GPTService to generate summary, action items, title
  3. POSTs results to callback_url (Node API)
"""

import asyncio
import httpx
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel

from app.services.whisper_service import WhisperService
from app.services.gpt_service import GPTService

router = APIRouter()

whisper = WhisperService()
gpt     = GPTService()


class ProcessRequest(BaseModel):
    meeting_id:   str
    audio_path:   str
    language:     str | None = None
    callback_url: str


@router.post("/process")
async def process_meeting(req: ProcessRequest, background: BackgroundTasks):
    """Kick off async processing — returns immediately."""
    background.add_task(run_pipeline, req)
    return {"status": "queued", "meeting_id": req.meeting_id}


async def run_pipeline(req: ProcessRequest):
    result = {
        "meeting_id":   req.meeting_id,
        "status":       "error",
        "transcript":   None,
        "summary":      None,
        "title":        None,
        "action_items": [],
        "language":     None,
        "speakers":     [],
        "error":        None,
    }

    try:
        # ── Step 1: Transcribe ─────────────────────────────────────────────
        print(f"[AI] Transcribing {req.meeting_id}…")
        transcription = await asyncio.to_thread(
            whisper.transcribe,
            audio_path=req.audio_path,
            language=req.language,
        )

        result["transcript"] = transcription["text"]
        result["language"]   = transcription["language"]
        result["speakers"]   = transcription.get("speakers", [])

        # ── Step 2: AI Analysis ────────────────────────────────────────────
        print(f"[AI] Analysing {req.meeting_id}…")
        analysis = await gpt.analyse(
            transcript=transcription["text"],
            language=transcription["language"],
        )

        result["summary"]      = analysis["summary"]
        result["title"]        = analysis["title"]
        result["action_items"] = analysis["action_items"]
        result["status"]       = "completed"

    except Exception as exc:
        print(f"[AI] Pipeline error for {req.meeting_id}: {exc}")
        result["error"]  = str(exc)
        result["status"] = "error"

    # ── Step 3: Callback ───────────────────────────────────────────────────
    await _send_callback(req.callback_url, result)


async def _send_callback(url: str, data: dict):
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            res = await client.post(url, json=data)
            res.raise_for_status()
            print(f"[AI] Callback delivered to {url} ({res.status_code})")
    except Exception as exc:
        print(f"[AI] Callback failed: {exc}")
