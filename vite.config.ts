import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Inherited shell VITE_* vars (e.g. from an earlier prodica-app session) beat
// .env.local in Vite's default merge. Force project file to win.
loadDotenv({ path: '.env.local', override: true })

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3030',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
