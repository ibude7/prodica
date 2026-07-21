/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_FIREBASE_AI_MODEL?: string
  /** Fallback model when primary is unavailable (default gemini-2.5-flash) */
  readonly VITE_FIREBASE_AI_FALLBACK_MODEL?: string
  /** Vertex AI region for Firebase AI Logic (default global) */
  readonly VITE_FIREBASE_VERTEX_LOCATION?: string
  /** reCAPTCHA site key from Firebase Console → App Check → Web app */
  readonly VITE_FIREBASE_APPCHECK_SITE_KEY?: string
  /** `enterprise` for ReCaptchaEnterpriseProvider; default is reCAPTCHA v3 */
  readonly VITE_FIREBASE_APPCHECK_PROVIDER?: string
  /** Registered debug token string, or omit / `true` to print a new one locally */
  readonly VITE_FIREBASE_APPCHECK_DEBUG_TOKEN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
