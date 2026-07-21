# Prodica

Universal visual identifier — point the camera at **anything** (food, books, pets, cars, movies, furniture, and more) and get deep, kind-specific details.

## How it works

1. **Barcode** (ZXing) → Open Food Facts for packaged food/drink  
2. **OCR** (Tesseract) → Open Food Facts text search  
3. **Vision** → [Firebase AI Logic](https://firebase.google.com/docs/ai-logic) (Gemini Developer API via project `prodica1`) in the browser, with Render `/v1/identify` as fallback

## Setup

```bash
npm install
```

### Firebase (client — Analytics + AI Logic + App Check)

1. In [Firebase console](https://console.firebase.google.com/) → **prodica1**, enable **AI Logic** (Gemini Developer API).
2. **App Check** (required — new projects enforce it for AI Logic):
   - Console → **App Check** → register your **Web** app with **reCAPTCHA** (v3 or Enterprise).
   - Copy the site key → set `VITE_FIREBASE_APPCHECK_SITE_KEY` (local `.env.local` + Vercel/Render build env).
   - For **localhost**: open the app, DevTools → Console → copy `AppCheck debug token: "…"`.
   - App Check → your web app **⋮** → **Manage debug tokens** → add that token.
3. API key HTTP referrers must include `http://localhost:5173/*` (see below).
4. Config defaults live in [`src/firebase/defaults.ts`](src/firebase/defaults.ts).

### Optional server fallback

```bash
export GEMINI_API_KEY=your_gemini_key
# or AI_GATEWAY_API_KEY=…
```

## Develop

Run API + Vite together:

```bash
npm run dev:full
```

- Frontend: Vite (proxies `/api` → `http://127.0.0.1:3030`)  
- API: Express on port `3030`

Or separately:

```bash
npm run dev:api   # Express + /v1/identify + /v1/entities/lookup
npm run dev       # Vite only
```

### Environment

| Variable | Where | Purpose |
|----------|--------|---------|
| `VITE_FIREBASE_*` | client (optional) | Override Firebase web config / `VITE_FIREBASE_AI_MODEL` |
| `GEMINI_API_KEY` | server | Fallback Gemini key for `/v1/identify` |
| `GEMINI_MODEL` | server (optional) | Gemini model id (default `gemini-2.5-flash`) |
| `AI_GATEWAY_API_KEY` | server | Alternative server fallback via Vercel AI Gateway |
| `PORT` | server | API port (default `3030`) |
| `VITE_API_BASE` | client (optional) | Absolute API origin; on `*.vercel.app` defaults to `https://prodica.onrender.com` |

### Deploy targets

- **Render (full stack):** [prodica.onrender.com](https://prodica.onrender.com) — static SPA + API. Client uses Firebase AI; server `/v1/identify` uses the same Firebase `prodica1` Gemini Developer API key by default.
- **Vercel UI + Render API:** [prodica.vercel.app](https://prodica.vercel.app) calls Render for server fallback.

In Google Cloud → Credentials → your Firebase **web** API key → **HTTP referrers**, add exactly:

```
http://localhost:5173/*
http://127.0.0.1:5173/*
https://prodica.vercel.app/*
https://prodica.onrender.com/*
```

Vite’s origin is `http://localhost:5173` — a bare `localhost` entry often does **not** match. Wait ~1–5 minutes after saving.

For Render **server** fallback only: create a **second** key with Application restrictions = None (API restriction: Generative Language API) and set `GEMINI_API_KEY` on Render. Do not put HTTP referrers on that server key.

## Production

```bash
npm run build
NODE_ENV=production GEMINI_API_KEY=… npm start
```

Serves the Vite `dist/` build and the API from one process.

## API

- `POST /v1/identify` — `multipart/form-data` with `image` (+ optional `ocrText`, `barcode`)  
- `POST /v1/entities/lookup` — JSON `LookupRequest` (`barcode` / `ocr`) via Open Food Facts  
- `GET /health`
