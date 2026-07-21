/** Shared Firebase web defaults for client + Render server (public client key). */
export const FIREBASE_DEFAULTS = {
  apiKey: 'AIzaSyBNjUOJ1rndoimtdzG6BKZ30val-8AiDZ4',
  authDomain: 'prodica1.firebaseapp.com',
  projectId: 'prodica1',
  storageBucket: 'prodica1.firebasestorage.app',
  messagingSenderId: '257310785255',
  appId: '1:257310785255:web:26a620256f4bb70d38ec42',
  measurementId: 'G-6JY2FCJG3Z',
} as const

/** Gemini Developer API model used by Firebase AI Logic + server fallback */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash'
