import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ensureFreshClientBuild } from './bootCache'
import { initFirebaseAnalytics } from './firebase/app'
import { initFirebaseAppCheck } from './firebase/appCheck'

async function boot() {
  await ensureFreshClientBuild()

  registerSW({
    immediate: true,
    onNeedRefresh() {
      window.location.reload()
    },
  })

  await initFirebaseAppCheck()
  void initFirebaseAnalytics()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
