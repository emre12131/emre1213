"""
WhisperService — wraps OpenAI Whisper API for audio transcription.

Supports:
  - Automatic language detection
  - Timestamp-level word segments (for speaker labelling)
  - Long audio via chunked transcription (Whisper has a 25 MB limit)
"""

import os
import math
from pathlib import Path

from openai import OpenAI
from pydub import AudioSegment

WHISPER_MAX_BYTES = 24 * 1024 * 1024  # 24 MB safety margin


class WhisperService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])

    def transcribe(self, audio_path: str, language: str | None = None) -> dict:
        """
        Transcribe audio file. Splits into chunks if > WHISPER_MAX_BYTES.

        Returns:
            {
                "text":     str,
                "language": str,
                "segments": list[dict],   # {start, end, text}
                "speakers": list[dict],   # placeholder for diarization
            }
        """
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        file_size = path.stat().st_size

        if file_size <= WHISPER_MAX_BYTES:
            return self._transcribe_single(path, language)
        else:
            return self._transcribe_chunked(path, language)

    def _transcribe_single(self, path: Path, language: str | None) -> dict:
        with open(path, "rb") as f:
            response = self.client.audio.transcriptions.create(
                model="whisper-1",
                file=f,
                response_format="verbose_json",
                timestamp_granularities=["segment"],
                **({ "language": language } if language else {}),
            )

        segments = [
            {"start": s.start, "end": s.end, "text": s.text}
            for s in (response.segments or [])
        ]

        return {
            "text":     response.text,
            "language": response.language,
            "segments": segments,
            "speakers": [],  # full diarization requires external service
        }

    def _transcribe_chunked(self, path: Path, language: str | None) -> dict:
        """Split audio into ~20 MB chunks and stitch transcripts together."""
        audio  = AudioSegment.from_file(str(path))
        total_ms       = len(audio)
        file_size      = path.stat().st_size
        # Estimate chunk duration proportionally to target size
        chunk_duration = math.floor((WHISPER_MAX_BYTES / file_size) * total_ms * 0.9)

        all_text      = []
        all_segments  = []
        detected_lang = language
        offset_ms     = 0

        chunk_dir = path.parent / f"{path.stem}_chunks"
        chunk_dir.mkdir(exist_ok=True)

        try:
            i = 0
            while offset_ms < total_ms:
                chunk       = audio[offset_ms: offset_ms + chunk_duration]
                chunk_path  = chunk_dir / f"chunk_{i:04d}.webm"
                chunk.export(str(chunk_path), format="webm")

                result = self._transcribe_single(chunk_path, detected_lang)

                all_text.append(result["text"].strip())

                # Adjust segment timestamps
                offset_s = offset_ms / 1000
                for seg in result["segments"]:
                    all_segments.append({
                        "start": round(seg["start"] + offset_s, 2),
                        "end":   round(seg["end"]   + offset_s, 2),
                        "text":  seg["text"],
                    })

                if not detected_lang:
                    detected_lang = result["language"]

                chunk_path.unlink()  # cleanup chunk
                offset_ms += chunk_duration
                i += 1
        finally:
            if chunk_dir.exists():
                chunk_dir.rmdir()

        return {
            "text":     " ".join(all_text),
            "language": detected_lang or "en",
            "segments": all_segments,
            "speakers": [],
        }
