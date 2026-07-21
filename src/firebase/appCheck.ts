import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  ReCaptchaV3Provider,
  type AppCheck,
} from 'firebase/app-check'
import { getFirebaseApp } from './app'

declare global {
  var FIREBASE_APPCHECK_DEBUG_TOKEN: boolean | string | undefined
}

let appCheck: AppCheck | null = null
let initPromise: Promise<AppCheck | null> | null = null

function isLocalHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

/**
 * Firebase AI Logic requires App Check when enforced (default for new projects).
 * - Localhost: debug provider (register the console token in Firebase App Check).
 * - Production: reCAPTCHA site key from Firebase Console → App Check → Web.
 */
export function initFirebaseAppCheck(): Promise<AppCheck | null> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try {
      const siteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY?.trim()
      const debugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?.trim()
      const local = isLocalHost() || import.meta.env.DEV

      if (local) {
        // true → SDK prints a token to register; or paste a registered token string
        globalThis.FIREBASE_APPCHECK_DEBUG_TOKEN =
          debugToken && debugToken !== 'true' ? debugToken : true
      }

      if (!siteKey) {
        if (local) {
          console.warn(
            '[App Check] No VITE_FIREBASE_APPCHECK_SITE_KEY. Using debug mode only. ' +
              'Open DevTools → Console, copy “AppCheck debug token”, then Firebase Console → ' +
              'App Check → your web app ⋮ → Manage debug tokens.',
          )
        } else {
          console.error(
            '[App Check] Missing VITE_FIREBASE_APPCHECK_SITE_KEY — Firebase AI will fail with 401.',
          )
          return null
        }
      }

      const provider = siteKey
        ? import.meta.env.VITE_FIREBASE_APPCHECK_PROVIDER === 'enterprise'
          ? new ReCaptchaEnterpriseProvider(siteKey)
          : new ReCaptchaV3Provider(siteKey)
        : // Local debug-only: provider object is still required; debug token bypasses attestation
          new ReCaptchaV3Provider('debug-unused-site-key')

      appCheck = initializeAppCheck(getFirebaseApp(), {
        provider,
        isTokenAutoRefreshEnabled: true,
      })
      return appCheck
    } catch (e) {
      console.error('[App Check] init failed', e)
      return null
    }
  })()
  return initPromise
}

export function getFirebaseAppCheck(): AppCheck | null {
  return appCheck
}
