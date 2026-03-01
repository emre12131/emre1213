/**
 * Popup script — handles auth UI and recording controls.
 */

const API_BASE = 'http://localhost:4000/api';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const $ = id => document.getElementById(id);
const authSection   = $('auth-section');
const statusSection = $('status-section');
const emailInput    = $('email');
const passwordInput = $('password');
const loginBtn      = $('login-btn');
const authError     = $('auth-error');
const recordBtn     = $('record-btn');
const dashboardBtn  = $('dashboard-btn');
const logoutBtn     = $('logout-btn');
const statusDot     = $('status-dot');
const statusLabel   = $('status-label');
const statusSub     = $('status-sub');
const timerEl       = $('timer');
const userEmail     = $('user-email');

// ── State ─────────────────────────────────────────────────────────────────────

let timerInterval = null;
let timerSeconds  = 0;

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { authToken, userInfo } = await chrome.storage.local.get(['authToken', 'userInfo']);

  if (authToken) {
    showLoggedIn(userInfo);
    await refreshState();
  } else {
    showAuth();
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────────

loginBtn.addEventListener('click', async () => {
  authError.textContent = '';
  loginBtn.innerHTML = '<span class="spinner"></span>';
  loginBtn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email:    emailInput.value.trim(),
        password: passwordInput.value,
      }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.error || 'Login failed');

    await chrome.storage.local.set({ authToken: data.token, userInfo: data.user });
    showLoggedIn(data.user);
  } catch (err) {
    authError.textContent = err.message;
  } finally {
    loginBtn.textContent = 'Sign In';
    loginBtn.disabled = false;
  }
});

logoutBtn.addEventListener('click', async () => {
  await chrome.storage.local.remove(['authToken', 'userInfo']);
  showAuth();
});

// ── Recording controls ────────────────────────────────────────────────────────

recordBtn.addEventListener('click', async () => {
  const { state } = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

  if (state.status === 'idle') {
    // Need to find active meeting tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.runtime.sendMessage({
      type: 'START_RECORDING',
      platform: detectPlatformFromUrl(tab?.url),
      title: tab?.title,
    });
  } else if (state.status === 'recording') {
    await chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
  }

  await refreshState();
});

dashboardBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: 'http://localhost:3000' });
});

// ── UI helpers ────────────────────────────────────────────────────────────────

function showAuth() {
  authSection.style.display    = 'block';
  statusSection.style.display  = 'none';
}

function showLoggedIn(user) {
  authSection.style.display    = 'none';
  statusSection.style.display  = 'block';
  userEmail.textContent        = user?.email || '';
}

async function refreshState() {
  const { state } = await chrome.runtime.sendMessage({ type: 'GET_STATE' });

  if (state.status === 'recording') {
    statusDot.className   = 'dot recording';
    statusLabel.textContent = 'Recording';
    statusSub.textContent   = state.title || '';
    recordBtn.textContent   = 'Stop Recording';
    recordBtn.className     = 'btn btn-danger';
    timerEl.style.display   = 'block';
    startTimer(state.startedAt);
  } else if (state.status === 'processing') {
    statusDot.className     = 'dot processing';
    statusLabel.textContent = 'Processing…';
    statusSub.textContent   = 'Transcribing your meeting';
    recordBtn.textContent   = 'Processing…';
    recordBtn.disabled      = true;
    timerEl.style.display   = 'none';
    stopTimer();
  } else {
    statusDot.className     = 'dot';
    statusLabel.textContent = 'Ready';
    statusSub.textContent   = 'Open a meeting to start recording';
    recordBtn.textContent   = 'Start Recording';
    recordBtn.className     = 'btn btn-primary';
    recordBtn.disabled      = false;
    timerEl.style.display   = 'none';
    stopTimer();
  }
}

function startTimer(startedAt) {
  stopTimer();
  const start = startedAt || Date.now();
  timerInterval = setInterval(() => {
    timerSeconds = Math.floor((Date.now() - start) / 1000);
    timerEl.textContent = formatTime(timerSeconds);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerSeconds = 0;
}

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function detectPlatformFromUrl(url = '') {
  if (url.includes('meet.google.com')) return 'google_meet';
  if (url.includes('zoom.us'))          return 'zoom';
  if (url.includes('teams.microsoft'))  return 'teams';
  return 'unknown';
}

// ── Start ─────────────────────────────────────────────────────────────────────
init();
