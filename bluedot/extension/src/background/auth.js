/**
 * Auth helpers for the background service worker.
 * Token is stored in chrome.storage.local after the user logs in via the popup.
 */

export async function getAuthToken() {
  const { authToken } = await chrome.storage.local.get('authToken');
  return authToken || null;
}

export async function setAuthToken(token) {
  await chrome.storage.local.set({ authToken: token });
}

export async function clearAuthToken() {
  await chrome.storage.local.remove('authToken');
}
