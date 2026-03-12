"""
WhisperService — Groq Whisper Large V3 ile ses transkripsiyon (ucretsiz).

Groq ucretsiz tier: gunde 2 saat ses.
Model: whisper-large-v3 — cok hizli, yuksek dogruluk.
Dosya limiti: 25 MB (buyuk dosyalar otomatik parcalanir)
"""

import os
import math
from pathlib import Path

from groq import Groq
from pydub import AudioSegment

WHISPER_MAX_BYTES = 24 * 1024 * 1024  # 24 MB guvenlik payi


class WhisperService:
    def __init__(self):
        self.client = Groq(api_key=os.environ["GROQ_API_KEY"])

    def transcribe(self, audio_path: str, language: str | None = None) -> dict:
        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"Ses dosyasi bulunamadi: {audio_path}")

        file_size = path.stat().st_size

        if file_size <= WHISPER_MAX_BYTES:
            return self._transcribe_single(path, language)
        else:
            return self._transcribe_chunked(path, language)

    def _transcribe_single(self, path: Path, language: str | None) -> dict:
        with open(path, "rb") as f:
            response = self.client.audio.transcriptions.create(
                model="whisper-large-v3",
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
            "speakers": [],
        }

    def _transcribe_chunked(self, path: Path, language: str | None) -> dict:
        audio         = AudioSegment.from_file(str(path))
        total_ms      = len(audio)
        file_size     = path.stat().st_size
        chunk_duration = math.floor((WHISPER_MAX_BYTES / file_size) * total_ms * 0.9)

        all_text     = []
        all_segments = []
        detected_lang = language
        offset_ms    = 0

        chunk_dir = path.parent / f"{path.stem}_chunks"
        chunk_dir.mkdir(exist_ok=True)

        try:
            i = 0
            while offset_ms < total_ms:
                chunk      = audio[offset_ms: offset_ms + chunk_duration]
                chunk_path = chunk_dir / f"chunk_{i:04d}.webm"
                chunk.export(str(chunk_path), format="webm")

                result = self._transcribe_single(chunk_path, detected_lang)
                all_text.append(result["text"].strip())

                offset_s = offset_ms / 1000
                for seg in result["segments"]:
                    all_segments.append({
                        "start": round(seg["start"] + offset_s, 2),
                        "end":   round(seg["end"]   + offset_s, 2),
                        "text":  seg["text"],
                    })

                if not detected_lang:
                    detected_lang = result["language"]

                chunk_path.unlink()
                offset_ms += chunk_duration
                i += 1
        finally:
            if chunk_dir.exists():
                chunk_dir.rmdir()

        return {
            "text":     " ".join(all_text),
            "language": detected_lang or "tr",
            "segments": all_segments,
            "speakers": [],
        }
