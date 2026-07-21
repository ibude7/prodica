import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { firebaseConfig } from './config'

let app: FirebaseApp | null = null
let analytics: Analytics | null = null
let analyticsInit: Promise<Analytics | null> | null = null

export function getFirebaseApp(): FirebaseApp {
  if (app) return app
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  return app
}

/** Best-effort Analytics (no-op when unsupported, e.g. some browsers / SSR). */
export function initFirebaseAnalytics(): Promise<Analytics | null> {
  if (analyticsInit) return analyticsInit
  analyticsInit = (async () => {
    try {
      const supported = await isSupported()
      if (!supported) return null
      analytics = getAnalytics(getFirebaseApp())
      return analytics
    } catch (e) {
      console.warn('Firebase Analytics unavailable', e)
      return null
    }
  })()
  return analyticsInit
}

export function getFirebaseAnalytics(): Analytics | null {
  return analytics
}
