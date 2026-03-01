# Bluedot HQ Integration for Perfex CRM

This module integrates [Bluedot HQ](https://bluedothq.com) — an AI-powered, bot-free meeting recorder — with Perfex CRM. After each recorded meeting, Bluedot sends a webhook containing the AI-generated summary, full transcript, action items, and participant list. This module processes that data and automatically creates notes and activities inside Perfex CRM.

---

## Features

- **Webhook receiver** — Accepts Bluedot meeting payloads via HTTP POST
- **HMAC-SHA256 signature verification** — Optional security using `X-Bluedot-Signature`
- **Automatic CRM Notes** — Creates a formatted note on the matched customer record
- **Automatic CRM Activities** — Logs the meeting as an activity (e.g. "Call")
- **Contact matching** — Matches meeting participants to existing Perfex contacts by email
- **Action items** — Includes Bluedot action items in the CRM note
- **Transcript storage** — Optionally includes the full transcript in the note
- **Meeting log dashboard** — View all received meetings, their status, and linked CRM records
- **Re-process** — Re-create notes/activities from any stored meeting
- **Staff notifications** — Optionally notify a staff member via Perfex internal notification
- **Bilingual** — English and Turkish language files included

---

## Installation

1. Copy the `bluedot` folder to `application/modules/bluedot/`
2. Log in to Perfex CRM admin panel
3. Go to **Setup → Modules** and activate **Bluedot HQ Integration**
4. Navigate to **Bluedot → Settings** and copy the **Webhook URL**

---

## Bluedot Configuration

1. Open the [Bluedot dashboard](https://app.bluedothq.com)
2. Go to **Automation → Webhook**
3. Paste your Perfex webhook URL (e.g. `https://yourcrm.com/bluedot/webhook/receive`)
4. Optionally, copy the webhook secret and paste it into Perfex CRM settings
5. Save

Bluedot will now send meeting data to Perfex automatically after each recorded meeting.

---

## Settings Reference

| Setting | Description |
|---|---|
| Webhook Secret | HMAC secret for signature verification. Leave blank to disable. |
| Note Prefix | Text prepended to auto-created note/activity titles. Default: `[Bluedot] ` |
| Create Notes | Toggle automatic CRM note creation. |
| Create Activities | Toggle automatic CRM activity creation. |
| Match by Email | Match participants to Perfex contacts by email address. |
| Include Action Items | Add Bluedot action items to the note body. |
| Include Transcript | Add the full transcript to the note body (can be very long). |
| Notify Staff | Send an internal Perfex notification to a selected staff member. |
| Default Activity Type | Which Perfex activity type to use for auto-created activities. |

---

## Webhook Payload

Bluedot sends a JSON payload with the following structure:

```json
{
  "meeting": {
    "id": "unique-meeting-id",
    "title": "Meeting Title",
    "date": "2026-03-01T10:00:00Z",
    "platform": "google_meet",
    "url": "https://meet.google.com/xxx",
    "duration": 3600
  },
  "summary": "AI-generated meeting summary...",
  "transcript": "Speaker 1: Hello...\nSpeaker 2: Hi...",
  "actionItems": ["Follow up with John", "Send proposal by Friday"],
  "participants": [
    {"name": "John Doe", "email": "john@example.com"},
    {"name": "Jane Smith", "email": "jane@example.com"}
  ],
  "recordingUrl": "https://app.bluedothq.com/recording/xxx"
}
```

The module handles multiple payload shapes for forward/backward compatibility.

---

## Database

The module creates one table: `tblbluedot_meetings`

| Column | Description |
|---|---|
| `bluedot_id` | Unique Bluedot meeting identifier (used for idempotency) |
| `title` | Meeting title |
| `meeting_date` | Meeting date/time |
| `platform` | Platform (google_meet, zoom, teams, etc.) |
| `summary` | AI summary text |
| `transcript` | Full transcript |
| `action_items` | JSON array of action items |
| `participants` | JSON array of participants |
| `note_id` | Linked Perfex note ID |
| `activity_id` | Linked Perfex activity ID |
| `contact_id` | Matched Perfex contact ID |
| `customer_id` | Matched Perfex customer ID |
| `raw_payload` | Original raw JSON payload |

---

## Requirements

- Perfex CRM 2.3 or higher
- PHP 7.4+
- MySQL 5.7+ / MariaDB 10.3+
- Bluedot HQ Pro plan or higher (webhook support required)

---

## Version

1.0.0
