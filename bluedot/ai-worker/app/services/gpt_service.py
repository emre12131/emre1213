"""
GPTService — uses GPT-4o to analyse meeting transcripts.

Generates:
  - Concise meeting title
  - Structured summary (3-5 paragraphs)
  - Action items (with owner and due-date hints where possible)
  - Key decisions
  - Follow-up email draft
"""

import json
import os
from openai import AsyncOpenAI

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
        self.client = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

    async def analyse(self, transcript: str, language: str = "en") -> dict:
        """
        Analyse a meeting transcript with GPT-4o.

        Returns:
            {
                "title":          str,
                "summary":        str,
                "action_items":   list[dict],
                "key_decisions":  list[str],
                "follow_up_email": str,
            }
        """
        if not transcript or not transcript.strip():
            return self._empty_analysis()

        # Truncate extremely long transcripts to fit context window
        truncated = transcript[:60_000]

        response = await self.client.chat.completions.create(
            model="gpt-4o",
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
            # Fallback — extract what we can
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
            "title":           "Empty Meeting",
            "summary":         "No transcript content available.",
            "action_items":    [],
            "key_decisions":   [],
            "follow_up_email": "",
        }
