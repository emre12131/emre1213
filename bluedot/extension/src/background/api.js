/**
 * API client used by the background service worker.
 * All requests go to the Node.js API server.
 */

const API_BASE = 'http://localhost:4000/api'; // swapped to env var in production

async function apiFetch(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

export async function createMeeting({ platform, title, token }) {
  return apiFetch('/meetings', {
    method: 'POST',
    body: { platform, title },
    token,
  });
}

export async function uploadChunk({ meetingId, chunkIndex, chunkBase64, token }) {
  return apiFetch(`/meetings/${meetingId}/chunks`, {
    method: 'POST',
    body: { chunkIndex, data: chunkBase64 },
    token,
  });
}

export async function finalizeMeeting({ meetingId, duration, token }) {
  return apiFetch(`/meetings/${meetingId}/finalize`, {
    method: 'POST',
    body: { duration },
    token,
  });
}
