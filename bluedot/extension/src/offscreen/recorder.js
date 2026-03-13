/**
 * Offscreen Recorder
 *
 * Service workers cannot use MediaRecorder or getUserMedia.
 * Chrome Offscreen API lets us do this in a hidden document
 * that can communicate back to the service worker.
 *
 * Flow:
 *   BG → START_CAPTURE (streamId)
 *        → getUserMedia({ audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId } } })
 *        → MediaRecorder records in chunks
 *        → Each chunk → base64 → BG message AUDIO_CHUNK
 *   BG → STOP_CAPTURE
 *        → MediaRecorder.stop()
 *        → BG message RECORDING_STOPPED
 */

import { CHUNK_INTERVAL_MS } from '../shared/constants.js';

let recorder = null;
let stream   = null;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.target !== 'offscreen') return;

  if (msg.type === 'START_CAPTURE') {
    await startCapture(msg.streamId);
  } else if (msg.type === 'STOP_CAPTURE') {
    stopCapture();
  }
});

async function startCapture(streamId) {
  if (recorder) {
    console.warn('[Offscreen] Already recording');
    return;
  }

  // Access the captured tab stream
  stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      mandatory: {
        chromeMediaSource: 'tab',
        chromeMediaSourceId: streamId,
      },
    },
    video: false,
  });

  // Pick best available codec
  const mimeType = getSupportedMimeType();

  recorder = new MediaRecorder(stream, {
    mimeType,
    audioBitsPerSecond: 128_000,
  });

  recorder.ondataavailable = async (event) => {
    if (event.data && event.data.size > 0) {
      const base64 = await blobToBase64(event.data);
      chrome.runtime.sendMessage({
        type: 'AUDIO_CHUNK',
        chunk: base64,
      });
    }
  };

  recorder.onstop = () => {
    stream.getTracks().forEach(t => t.stop());
    stream   = null;
    recorder = null;
    chrome.runtime.sendMessage({ type: 'RECORDING_STOPPED' });
  };

  recorder.start(CHUNK_INTERVAL_MS);
  console.log('[Offscreen] Recording started, mimeType:', mimeType);
}

function stopCapture() {
  if (recorder && recorder.state !== 'inactive') {
    recorder.stop();
  }
}

function getSupportedMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) return type;
  }
  return '';
}

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.onerror  = reject;
    reader.readAsDataURL(blob);
  });
}
