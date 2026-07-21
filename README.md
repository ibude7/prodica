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

### Firebase (client — Analytics + AI Logic)

1. In [Firebase console](https://console.firebase.google.com/) → project **prodica1**, enable **Firebase AI Logic** and choose the **Gemini Developer API** provider.
2. Restrict the web API key by HTTP referrer (`localhost`, `prodica.vercel.app`, etc.).
3. Config is already in [`src/firebase/config.ts`](src/firebase/config.ts) (overridable with `VITE_FIREBASE_*` env vars).

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

In Google Cloud credentials, allow HTTP referrers: `localhost/*`, `prodica.vercel.app/*`, `prodica.onrender.com/*`.

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
