import type { FirebaseOptions } from 'firebase/app'
import { FIREBASE_DEFAULTS } from './defaults'

/**
 * Firebase web config (client-safe). Restrict this API key by HTTP referrer:
 * localhost, prodica.vercel.app, prodica.onrender.com
 */
export const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FIREBASE_DEFAULTS.apiKey,
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FIREBASE_DEFAULTS.authDomain,
  projectId:
    import.meta.env.VITE_FIREBASE_PROJECT_ID || FIREBASE_DEFAULTS.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    FIREBASE_DEFAULTS.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    FIREBASE_DEFAULTS.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FIREBASE_DEFAULTS.appId,
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ||
    FIREBASE_DEFAULTS.measurementId,
}
