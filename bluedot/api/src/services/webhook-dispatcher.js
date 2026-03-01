/**
 * Webhook dispatcher
 *
 * When a meeting completes (or fails), we find all matching webhooks for
 * that user and deliver the event payload with HMAC-SHA256 signing.
 * Failed deliveries are retried up to 3 times with exponential backoff.
 */

import crypto from 'crypto';
import { prisma } from '../utils/db.js';

const MAX_RETRIES = 3;

export async function dispatchWebhooks({ meetingId, event }) {
  const meeting = await prisma.meeting.findUnique({
    where:   { id: meetingId },
    include: { summary: true, transcript: { select: { id: true } } },
  });

  if (!meeting) return;

  const webhooks = await prisma.webhook.findMany({
    where: {
      userId: meeting.userId,
      active: true,
      events: { has: event },
    },
  });

  if (webhooks.length === 0) return;

  const payload = buildPayload(event, meeting);

  await Promise.allSettled(
    webhooks.map(wh => deliverWithRetry(wh, payload, event, meetingId))
  );
}

async function deliverWithRetry(webhook, payload, event, meetingId, attempt = 1) {
  const body      = JSON.stringify(payload);
  const signature = webhook.secret
    ? 'sha256=' + crypto.createHmac('sha256', webhook.secret).update(body).digest('hex')
    : undefined;

  let statusCode = null;
  let success    = false;
  let responseText = '';

  try {
    const res = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'X-Bluedot-Event':    event,
        'X-Bluedot-Delivery': crypto.randomUUID(),
        ...(signature ? { 'X-Bluedot-Signature': signature } : {}),
      },
      body,
      signal: AbortSignal.timeout(10_000),
    });

    statusCode   = res.status;
    responseText = await res.text().catch(() => '');
    success      = res.ok;
  } catch (err) {
    responseText = err.message;
  }

  await prisma.webhookDelivery.create({
    data: {
      webhookId:  webhook.id,
      meetingId,
      event,
      statusCode,
      success,
      attempts:   attempt,
      payload,
      response:   responseText.slice(0, 1000),
    },
  });

  if (!success && attempt < MAX_RETRIES) {
    const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
    await new Promise(r => setTimeout(r, delay));
    return deliverWithRetry(webhook, payload, event, meetingId, attempt + 1);
  }
}

function buildPayload(event, meeting) {
  return {
    event,
    created_at: new Date().toISOString(),
    meeting: {
      id:         meeting.id,
      title:      meeting.title,
      platform:   meeting.platform,
      status:     meeting.status,
      started_at: meeting.startedAt,
      ended_at:   meeting.endedAt,
      duration:   meeting.duration,
      language:   meeting.language,
      summary:    meeting.summary?.text    || null,
      action_items: meeting.summary?.actionItems || [],
      key_decisions: meeting.summary?.keyDecisions || [],
      follow_up_email: meeting.summary?.followUpEmail || null,
      has_transcript: !!meeting.transcript,
    },
  };
}
