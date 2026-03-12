"""
LLMService — Groq Llama 3.3 70B ile toplanti analizi (ucretsiz).

Groq ucretsiz tier: cok cömert, gunluk binlerce sorgu.
Model: llama-3.3-70b-versatile — GPT-4o kalitesinde, tamamen ucretsiz.
"""

import json
import os
from groq import AsyncGroq

ANALYSIS_SYSTEM_PROMPT = """\
You are an expert meeting analyst. Given a meeting transcript, extract structured information.
Always respond in valid JSON with exactly this structure:

{
  "title":        "<concise, descriptive meeting title, max 80 chars>",
  "summary":      "<3-5 paragraph executive summary of what was discussed>",
  "action_items": [
    {"text": "<what needs to be done>", "owner": "<name or null>", "due": "<date hint or null>"}
  ],
  "key_decisions": ["<decision 1>", "<decision 2>"],
  "follow_up_email": "<ready-to-send follow-up email in plain text>"
}

Be concise. Focus on what matters. Do not invent information not present in the transcript.
Respond in the same language as the transcript.
"""


class GPTService:
    def __init__(self):
        self.client = AsyncGroq(api_key=os.environ["GROQ_API_KEY"])

    async def analyse(self, transcript: str, language: str = "en") -> dict:
        if not transcript or not transcript.strip():
            return self._empty_analysis()

        # Llama 3.3 70B context: 128k tokens — transkript icin yeterli
        truncated = transcript[:80_000]

        response = await self.client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"Meeting language hint: {language}\n\nTranscript:\n{truncated}",
                },
            ],
        )

        raw = response.choices[0].message.content

        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            return {
                "title":           "Meeting Summary",
                "summary":         raw,
                "action_items":    [],
                "key_decisions":   [],
                "follow_up_email": "",
            }

        return {
            "title":           data.get("title", "Meeting Summary"),
            "summary":         data.get("summary", ""),
            "action_items":    data.get("action_items", []),
            "key_decisions":   data.get("key_decisions", []),
            "follow_up_email": data.get("follow_up_email", ""),
        }

    def _empty_analysis(self) -> dict:
        return {
            "title":           "Bos Toplanti",
            "summary":         "Transkript icerigi bulunamadi.",
            "action_items":    [],
            "key_decisions":   [],
            "follow_up_email": "",
        }
