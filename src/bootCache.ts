/** One-time cache/SW bust so users aren't stuck on a crashing PWA bundle. */
const BUILD_ID = 'prodica-2026-07-21c'

export async function ensureFreshClientBuild(): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const prev = localStorage.getItem('prodica-build')
    if (prev === BUILD_ID) return
    localStorage.setItem('prodica-build', BUILD_ID)

    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }

    // Only reload when we actually cleared something older
    if (prev) {
      window.location.reload()
    }
  } catch {
    // ignore — app can still boot
  }
}
