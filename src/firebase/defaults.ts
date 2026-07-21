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

/** Primary Vertex AI Gemini model */
export const DEFAULT_GEMINI_MODEL = 'gemini-3.5-flash'

/** Used when the primary model is unavailable in the region / project */
export const FALLBACK_GEMINI_MODEL = 'gemini-2.5-flash'

/**
 * Vertex location. Prefer `global` so gemini-3.5-flash is reachable;
 * us-central1 does not host 3.5 Flash.
 */
export const DEFAULT_VERTEX_LOCATION = 'global'

/** Ordered model ids to try (primary, then fallback; de-duped). */
export function geminiModelCandidates(
  primary?: string | null,
  fallback?: string | null,
): string[] {
  const first = primary?.trim() || DEFAULT_GEMINI_MODEL
  const second = fallback?.trim() || FALLBACK_GEMINI_MODEL
  return first === second ? [first] : [first, second]
}
