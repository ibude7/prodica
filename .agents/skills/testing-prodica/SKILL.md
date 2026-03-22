# Testing Prodica

## Dev Server Setup

Prodica has two servers that need to run:
- **Frontend**: Vite dev server (default port 5173, falls back to 5174+)
- **Backend**: Express API on port 3030

Start both with:
```bash
npx concurrently -k "npx vite --host 0.0.0.0" "npx tsx watch server/index.ts"
```

Alternatively use `npm run dev:full` if concurrently is installed.

The Vite config proxies `/api` requests to `http://127.0.0.1:3030`.

## Testing Without a Camera

The VM has no camera, so the app will show a camera denied error. This is expected. Use the **"Upload from gallery"** button to upload test images instead.

The camera error message should read: "Camera access was denied or unavailable. You can still upload a photo below."

## Creating Test Images

Use ImageMagick to create test images with text that matches catalog entries:

```bash
# Image that matches a catalog product (uses nameTokens/visualLabels matching)
convert -size 400x300 xc:white -font DejaVu-Sans -pointsize 36 \
  -gravity center -annotate +0+0 "Omega-3 Fish Oil\n1000 mg\nSupplement" \
  /home/ubuntu/test-omega3.jpg

# Image that triggers no-match state
convert -size 400x300 xc:white -font DejaVu-Sans -pointsize 36 \
  -gravity center -annotate +0+0 "Random Unknown\nProduct XYZ\nNoMatch" \
  /home/ubuntu/test-nomatch.jpg

# Wine image (tests wine-specific fields like Region, Grape, ABV)
convert -size 400x300 xc:white -font DejaVu-Sans -pointsize 36 \
  -gravity center -annotate +0+0 "Bordeaux Wine\nChateau Margaux\nRed Wine Bottle" \
  /home/ubuntu/test-wine.jpg
```

Note: Use `DejaVu-Sans` font (not Helvetica) — it's available on Ubuntu by default.

## Scan Pipeline Flow

The scan pipeline runs in this order:
1. **Barcode** (ZXing) — will fail on text-only test images
2. **OCR** (Tesseract.js) — extracts text from the image
3. **Visual classification** — matches OCR text against catalog `visualLabels` and `nameTokens`
4. If all fail → **no-match** state

For text-based test images, OCR extraction triggers either:
- Direct OCR text search against catalog `nameTokens` (higher confidence, ~81%)
- Visual label matching (lower confidence, ~55-70%)

## Key Test Flows

### 1. Upload → Preview → Scan → Product Match
- Click "Upload from gallery" → select image → verify preview with Scan/Retake buttons → click "Scan this photo" → verify product result screen
- Expected: Product name, brand, category, origin, confidence banner, captured image preview at top

### 2. Collapsible Sections
- On result screen: Ingredients, Nutrition, Warnings default to **expanded** (▲)
- Storage, Pairings, Scan trace default to **collapsed** (▼)
- Click toggle buttons to verify expand/collapse

### 3. Copy Product Info
- Click "Copy info" button in result header
- Button text should change to "Copied" for ~2 seconds
- Note: Clipboard API may not work on localhost without HTTPS

### 4. No-Match Flow
- Upload an image with unrecognized text
- Should show "No match" heading, "No catalog match" warning, suggestions list, "Back to camera" button, scan trace

### 5. Retake from Preview
- Upload image → on preview screen click "Retake" → should return to camera screen without scanning

### 6. Wine-Specific Fields
- Upload wine-related image → result should show Region, Grape/Blend, and Alcohol (ABV) fields

## Catalog Products Available for Testing

Match test images against these catalog nameTokens:
- **Wine**: bordeaux, château, chateau, margaux
- **Food**: crunchy, oats, honey, bar
- **Medicine**: acetaminophen, paracetamol
- **Fragrance**: vetiver, cologne, perfume, rose, parfum
- **Supplements**: omega, fish, oil, vitamin, d3
- **Cosmetics**: moisturizer, cream, sunscreen, spf
- **Household**: cleaner, spray, detergent, laundry, pods

## Known Considerations

- The multi-step loading indicator uses fixed 1800ms timers (cosmetic, not tied to actual pipeline progress)
- Visual label collision: shared labels like "supplement bottle" always return the first matching catalog entry
- The loading overlay may appear very briefly if OCR/scan completes quickly — you might not see it
- The "Scan this photo" button on the preview screen requires clicking precisely within the button area
