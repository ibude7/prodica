# Prodica

Universal visual identifier — point the camera at **anything** (food, books, pets, cars, movies, furniture, and more) and get deep, kind-specific details.

## How it works

1. **Barcode** (ZXing) → Open Food Facts for packaged food/drink  
2. **OCR** (Tesseract) → Open Food Facts text search  
3. **Vision** → multimodal LLM (Gemini API key or [Vercel AI Gateway](https://vercel.com/docs/ai-gateway)) returns a structured `IdentifiedEntity` with deep per-kind facets

## Setup

```bash
npm install
```

Set a **server-side** key (never put this in Vite client env). Either:

```bash
# Google AI Studio / Gemini (used first if present)
export GEMINI_API_KEY=your_gemini_key
```

or

```bash
export AI_GATEWAY_API_KEY=your_gateway_key
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
| `GEMINI_API_KEY` | server | Gemini key for `/v1/identify` (also `GOOGLE_GENERATIVE_AI_API_KEY` / `GOOGLE_API_KEY`) |
| `GEMINI_MODEL` | server (optional) | Gemini model id (default `gemini-2.5-flash`) |
| `AI_GATEWAY_API_KEY` | server | Alternative to Gemini via Vercel AI Gateway |
| `PORT` | server | API port (default `3030`) |
| `VITE_API_BASE` | client (optional) | Absolute API origin if not using the Vite proxy / same-origin deploy |

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
