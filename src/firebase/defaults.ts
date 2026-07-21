/** Shared Firebase web defaults for client + docs (public client config). */
export const FIREBASE_DEFAULTS = {
  apiKey: 'AIzaSyBNjUOJ1rndoimtdzG6BKZ30val-8AiDZ4',
  authDomain: 'prodica1.firebaseapp.com',
  projectId: 'prodica1',
  storageBucket: 'prodica1.firebasestorage.app',
  messagingSenderId: '257310785255',
  appId: '1:257310785255:web:26a620256f4bb70d38ec42',
  measurementId: 'G-6JY2FCJG3Z',
} as const

/** Vertex AI Gemini model used by Firebase AI Logic + server fallback */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'

/** Vertex AI region for Firebase AI Logic + server */
export const DEFAULT_VERTEX_LOCATION = 'us-central1'
