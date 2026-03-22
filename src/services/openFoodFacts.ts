import type { NutritionFact, ProductCategory, ProductResult } from '../domain/types'
import { toConfidenceLevel } from '../domain/intelligence'

/** Required by Open Food Facts API usage policy */
export const OPEN_FOOD_FACTS_UA =
  'Prodica/1.0 (https://github.com/ibude7/prodica)'

const FETCH_OPTS: RequestInit = {
  headers: { 'User-Agent': OPEN_FOOD_FACTS_UA },
  signal: AbortSignal.timeout(15_000),
}

function humanizeAllergens(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/,|;/)
    .map((s) =>
      s
        .replace(/^en:/gi, '')
        .replace(/_/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

function nutrimentsToFacts(n: Record<string, unknown> | undefined): NutritionFact[] {
  if (!n) return []
  const rows: NutritionFact[] = []
  const num = (k: string) => {
    const v = n[k]
    return typeof v === 'number' ? v : null
  }
  const push = (label: string, k: string, unit: string) => {
    const v = num(k)
    if (v != null) rows.push({ label, value: `${Math.round(v * 10) / 10} ${unit}` })
  }
  push('Energy (per 100g / 100ml)', 'energy-kcal_100g', 'kcal')
  if (!num('energy-kcal_100g')) {
    const kj = num('energy-kj_100g')
    if (kj != null) rows.push({ label: 'Energy (per 100g / 100ml)', value: `${Math.round(kj)} kJ` })
  }
  push('Fat', 'fat_100g', 'g')
  push('Saturated fat', 'saturated-fat_100g', 'g')
  push('Carbohydrates', 'carbohydrates_100g', 'g')
  push('Sugars', 'sugars_100g', 'g')
  push('Fiber', 'fiber_100g', 'g')
  push('Proteins', 'proteins_100g', 'g')
  push('Salt', 'salt_100g', 'g')
  const abv = num('alcohol_100g')
  if (abv != null) rows.push({ label: 'Alcohol', value: `${abv}%` })
  return rows
}

function mapOffProduct(
  raw: Record<string, unknown>,
  meta: { source: 'barcode' | 'ocr'; code?: string },
): ProductResult {
  const code = String(meta.code ?? raw.code ?? raw._id ?? '')
  const name = String(raw.product_name ?? raw.abbreviated_product_name ?? 'Unknown product')
  const brandRaw = String(raw.brands ?? '').split(',')[0]?.trim() || null
  const origin =
    String(raw.countries ?? raw.origins ?? raw.manufacturing_places ?? '')
      .split(',')[0]
      ?.trim() || null
  const ingredients = String(raw.ingredients_text ?? '').trim() || null
  const quantity = String(raw.quantity ?? '').trim() || null
  const nut = raw.nutriments as Record<string, unknown> | undefined
  const nutritionArr = nutrimentsToFacts(nut)
  const allergens = humanizeAllergens(
    String(raw.allergens_imported ?? raw.allergens ?? ''),
  )
  const traces = humanizeAllergens(String(raw.traces_imported ?? raw.traces ?? ''))
  const warnings: string[] = []
  if (allergens.length) warnings.push(`Allergens: ${allergens.join(', ')}`)
  if (traces.length) warnings.push(`May contain: ${traces.join(', ')}`)

  const tags = Array.isArray(raw.categories_tags)
    ? raw.categories_tags.map(String)
    : []
  const catTag = tags[0] ?? ''
  const lowerTags = tags.join(' ').toLowerCase()
  const category: ProductCategory =
    lowerTags.includes('wine') ||
    lowerTags.includes('champagne') ||
    lowerTags.includes('sparkling-wine') ||
    lowerTags.includes('spirits')
      ? 'wine'
      : 'food'

  const alcoholNum =
    nut && typeof nut['alcohol_100g'] === 'number' ? (nut['alcohol_100g'] as number) : null

  const conf = meta.source === 'barcode' ? 0.9 : 0.62

  return {
    id: `off-${code}`,
    name: { value: name, provenance: 'confirmed' },
    brand: { value: brandRaw, provenance: 'confirmed' },
    category: { value: category, provenance: 'confirmed' },
    origin: { value: origin, provenance: 'confirmed' },
    ingredients: { value: ingredients, provenance: 'confirmed' },
    contents: { value: quantity, provenance: 'confirmed' },
    nutritionFacts: {
      value: nutritionArr.length ? nutritionArr : null,
      provenance: 'confirmed',
    },
    alcoholPercent: { value: alcoholNum, provenance: 'confirmed' },
    warnings: { value: warnings.length ? warnings : null, provenance: 'confirmed' },
    storage: { value: null, provenance: 'inferred' },
    pairings: { value: null, provenance: 'inferred' },
    doNotPair: { value: null, provenance: 'inferred' },
    confidence: conf,
    confidenceLevel: toConfidenceLevel(conf),
    source: meta.source,
    scanNotes:
      catTag
        ? `Open Food Facts · ${catTag.replace(/^..:/, '')}. Community data — verify on pack.`
        : 'Open Food Facts (community-sourced). Verify allergens and nutrition on the package.',
  }
}

export async function lookupOpenFoodFactsByBarcode(
  code: string,
): Promise<ProductResult | null> {
  const clean = code.replace(/\D/g, '')
  if (clean.length < 8 || clean.length > 14) return null
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(clean)}.json`
  let res: Response
  try {
    res = await fetch(url, FETCH_OPTS)
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = (await res.json()) as {
    status?: number
    product?: Record<string, unknown>
  }
  if (data.status === 0 || !data.product || Object.keys(data.product).length === 0) {
    return null
  }
  return mapOffProduct(data.product, { source: 'barcode', code: clean })
}

/** Best-effort search when OCR text is available (first hit). */
export async function searchOpenFoodFactsByText(
  text: string,
): Promise<ProductResult | null> {
  const q = text.replace(/\s+/g, ' ').trim().slice(0, 120)
  if (q.length < 4) return null
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=1&search_terms=${encodeURIComponent(q)}`
  let res: Response
  try {
    res = await fetch(url, FETCH_OPTS)
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = (await res.json()) as {
    products?: Record<string, unknown>[]
  }
  const first = data.products?.[0]
  if (!first) return null
  const code = String(first.code ?? first._id ?? '')
  return mapOffProduct(first, { source: 'ocr', code })
}
