import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initFirebaseAnalytics } from './firebase/app'
import { initFirebaseAppCheck } from './firebase/appCheck'

async function boot() {
  await initFirebaseAppCheck()
  void initFirebaseAnalytics()

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void boot()
