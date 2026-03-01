export const RecordingState = {
  IDLE:       'idle',
  RECORDING:  'recording',
  PROCESSING: 'processing',
};

export const PLATFORMS = {
  GOOGLE_MEET: 'google_meet',
  ZOOM:        'zoom',
  TEAMS:       'teams',
};

/** How often to cut and upload an audio chunk (ms) */
export const CHUNK_INTERVAL_MS = 30_000; // 30 seconds
