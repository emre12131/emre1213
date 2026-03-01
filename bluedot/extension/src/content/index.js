/**
 * Content Script
 *
 * Injected into Google Meet / Zoom / Teams pages.
 * Detects meeting state (joined / left) and communicates with the background.
 * Also injects the floating recording control bar into the page.
 */

import { PLATFORMS } from '../shared/constants.js';

// ── Platform detection ────────────────────────────────────────────────────────

function detectPlatform() {
  const host = location.hostname;
  if (host.includes('meet.google.com')) return PLATFORMS.GOOGLE_MEET;
  if (host.includes('zoom.us'))          return PLATFORMS.ZOOM;
  if (host.includes('teams.microsoft'))  return PLATFORMS.TEAMS;
  return 'unknown';
}

function getMeetingTitle() {
  // Google Meet
  const gmTitle = document.querySelector('[data-meeting-title]')?.textContent
    || document.querySelector('c-wiz[data-meeting-id] .NzPR9b')?.textContent;
  if (gmTitle) return gmTitle.trim();

  // Zoom
  const zmTitle = document.querySelector('.meeting-topic')?.textContent;
  if (zmTitle) return zmTitle.trim();

  return document.title || 'Untitled Meeting';
}

// ── Floating control bar ──────────────────────────────────────────────────────

let controlBar = null;
let isRecording = false;

function injectControlBar() {
  if (controlBar) return;

  controlBar = document.createElement('div');
  controlBar.id = 'bluedot-bar';
  controlBar.innerHTML = `
    <style>
      #bluedot-bar {
        position: fixed;
        bottom: 80px;
        right: 20px;
        z-index: 999999;
        background: #1e293b;
        color: #f8fafc;
        border-radius: 12px;
        padding: 10px 16px;
        display: flex;
        align-items: center;
        gap: 10px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.4);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        font-size: 13px;
        user-select: none;
      }
      #bluedot-bar .bd-logo {
        width: 20px;
        height: 20px;
        background: #3b82f6;
        border-radius: 50%;
      }
      #bluedot-bar .bd-btn {
        background: #ef4444;
        border: none;
        color: #fff;
        border-radius: 8px;
        padding: 5px 12px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 600;
      }
      #bluedot-bar .bd-btn.idle {
        background: #3b82f6;
      }
      #bluedot-bar .bd-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #6b7280;
      }
      #bluedot-bar .bd-dot.recording {
        background: #ef4444;
        animation: bd-pulse 1.2s ease-in-out infinite;
      }
      @keyframes bd-pulse {
        0%, 100% { opacity: 1; }
        50%       { opacity: 0.3; }
      }
    </style>
    <div class="bd-logo"></div>
    <span class="bd-dot" id="bd-dot"></span>
    <span id="bd-status">Bluedot ready</span>
    <button class="bd-btn idle" id="bd-toggle">Record</button>
    <button id="bd-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:16px;">×</button>
  `;

  document.body.appendChild(controlBar);

  document.getElementById('bd-toggle').addEventListener('click', toggleRecording);
  document.getElementById('bd-close').addEventListener('click', () => {
    controlBar.remove();
    controlBar = null;
  });
}

async function toggleRecording() {
  const btn    = document.getElementById('bd-toggle');
  const status = document.getElementById('bd-status');
  const dot    = document.getElementById('bd-dot');

  if (!isRecording) {
    btn.textContent    = 'Stop';
    btn.className      = 'bd-btn';
    status.textContent = 'Recording…';
    dot.className      = 'bd-dot recording';
    isRecording        = true;

    const response = await chrome.runtime.sendMessage({
      type:     'START_RECORDING',
      platform: detectPlatform(),
      title:    getMeetingTitle(),
    });

    if (!response?.ok) {
      setIdle(`Error: ${response?.error || 'unknown'}`);
    }
  } else {
    btn.disabled       = true;
    status.textContent = 'Processing…';
    dot.className      = 'bd-dot';

    await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    setIdle('Done! Check dashboard.');
  }
}

function setIdle(message = 'Bluedot ready') {
  isRecording = false;
  const btn    = document.getElementById('bd-toggle');
  const status = document.getElementById('bd-status');
  const dot    = document.getElementById('bd-dot');
  if (!btn) return;
  btn.textContent    = 'Record';
  btn.className      = 'bd-btn idle';
  btn.disabled       = false;
  status.textContent = message;
  dot.className      = 'bd-dot';
}

// ── Auto-inject on meeting pages ─────────────────────────────────────────────

function init() {
  // Only inject if we appear to be inside an active meeting
  const isMeeting = (
    location.pathname.length > 2 && detectPlatform() !== 'unknown'
  );

  if (isMeeting) {
    // Small delay to let the page settle
    setTimeout(injectControlBar, 2000);
  }
}

init();

// Listen for state updates from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_UPDATE') {
    // Sync UI with background state if needed
  }
});
