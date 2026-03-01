/**
 * Background Service Worker
 *
 * Orchestrates the entire recording lifecycle:
 *   1. Detect user is in a meeting
 *   2. Capture tab audio via chrome.tabCapture
 *   3. Stream chunks to an offscreen document for MediaRecorder
 *   4. Upload chunks to the API for processing
 *   5. Poll / receive the final summary and store it
 */

import { RecordingState } from '../shared/constants.js';
import { getAuthToken, clearAuthToken } from './auth.js';
import { uploadChunk, finalizeMeeting, createMeeting } from './api.js';

// ── State ────────────────────────────────────────────────────────────────────

let state = {
  status: RecordingState.IDLE,
  meetingId: null,
  tabId: null,
  streamId: null,
  startedAt: null,
  platform: null,
  title: null,
  chunkIndex: 0,
};

// ── Message router ────────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'START_RECORDING':
      handleStartRecording(msg, sender).then(sendResponse).catch(err => {
        console.error('[BG] start error', err);
        sendResponse({ ok: false, error: err.message });
      });
      return true; // async

    case 'STOP_RECORDING':
      handleStopRecording().then(sendResponse).catch(err => {
        console.error('[BG] stop error', err);
        sendResponse({ ok: false, error: err.message });
      });
      return true;

    case 'GET_STATE':
      sendResponse({ ok: true, state });
      break;

    case 'AUDIO_CHUNK':
      // Forwarded from offscreen document
      handleAudioChunk(msg.chunk).catch(console.error);
      break;

    case 'RECORDING_STOPPED':
      // Offscreen document finished — finalize
      handleFinalizeRecording().catch(console.error);
      break;
  }
});

// ── Tab events ────────────────────────────────────────────────────────────────

chrome.tabs.onRemoved.addListener(tabId => {
  if (state.tabId === tabId && state.status === RecordingState.RECORDING) {
    handleStopRecording().catch(console.error);
  }
});

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handleStartRecording({ platform, title }, sender) {
  if (state.status !== RecordingState.IDLE) {
    return { ok: false, error: 'Already recording' };
  }

  const token = await getAuthToken();
  if (!token) return { ok: false, error: 'Not authenticated' };

  const tab = await chrome.tabs.get(sender.tab.id);

  // Capture tab audio stream (bot-free — only this browser tab)
  const streamId = await new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tab.id }, id => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(id);
    });
  });

  // Create meeting record on the server
  const meeting = await createMeeting({ platform, title: title || tab.title, token });

  state = {
    status: RecordingState.RECORDING,
    meetingId: meeting.id,
    tabId: tab.id,
    streamId,
    startedAt: Date.now(),
    platform,
    title: title || tab.title,
    chunkIndex: 0,
  };

  // Spin up offscreen document for MediaRecorder (service workers can't use MediaRecorder)
  await ensureOffscreenDocument();

  // Tell offscreen to start recording using the captured stream ID
  await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'START_CAPTURE',
    streamId,
  });

  // Update badge
  chrome.action.setBadgeText({ text: 'REC' });
  chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });

  return { ok: true, meetingId: meeting.id };
}

async function handleStopRecording() {
  if (state.status !== RecordingState.RECORDING) {
    return { ok: false, error: 'Not recording' };
  }

  state.status = RecordingState.PROCESSING;

  await chrome.runtime.sendMessage({
    target: 'offscreen',
    type: 'STOP_CAPTURE',
  });

  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

  return { ok: true };
}

async function handleAudioChunk(chunkBase64) {
  const token = await getAuthToken();
  if (!token || !state.meetingId) return;

  await uploadChunk({
    meetingId: state.meetingId,
    chunkIndex: state.chunkIndex++,
    chunkBase64,
    token,
  });
}

async function handleFinalizeRecording() {
  const token = await getAuthToken();
  if (!token || !state.meetingId) return;

  const duration = Math.round((Date.now() - state.startedAt) / 1000);

  await finalizeMeeting({ meetingId: state.meetingId, duration, token });

  chrome.action.setBadgeText({ text: '' });
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon48.png',
    title: 'Meeting recorded!',
    message: `"${state.title}" is being transcribed. You'll be notified when it's ready.`,
  });

  // Reset state
  state = {
    status: RecordingState.IDLE,
    meetingId: null,
    tabId: null,
    streamId: null,
    startedAt: null,
    platform: null,
    title: null,
    chunkIndex: 0,
  };
}

// ── Offscreen document ────────────────────────────────────────────────────────

let offscreenCreating = false;

async function ensureOffscreenDocument() {
  const existing = await chrome.offscreen.hasDocument?.();
  if (existing) return;

  if (offscreenCreating) {
    await new Promise(r => setTimeout(r, 100));
    return;
  }

  offscreenCreating = true;
  await chrome.offscreen.createDocument({
    url: 'src/offscreen/index.html',
    reasons: ['USER_MEDIA'],
    justification: 'Record tab audio for meeting transcription',
  });
  offscreenCreating = false;
}
