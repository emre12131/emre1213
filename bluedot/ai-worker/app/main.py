"""
Bluedot AI Worker — FastAPI service

Responsibilities:
  1. Receive audio chunk batches from the Node API
  2. Assemble and transcribe with OpenAI Whisper
  3. Generate AI summary, action items and title with GPT-4o
  4. Identify speakers via speaker diarization hints
  5. Push results back to Node API via internal callback
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.routers import transcription, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("AI Worker starting up…")
    yield
    # Shutdown
    print("AI Worker shutting down…")


app = FastAPI(
    title="Bluedot AI Worker",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4000"],  # Node API only
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(transcription.router, prefix="/transcription")
