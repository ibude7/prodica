import type { IdentifiedEntity, NutritionFact } from '../domain/types'
import { toConfidenceLevel } from '../domain/intelligence'

/** Required by Open Food Facts API usage policy */
export const OPEN_FOOD_FACTS_UA =
  'Prodica/1.0 (https://github.com/ibude7/prodica)'

const FETCH_OPTS: RequestInit = {
  headers: { 'User-Agent': OPEN_FOOD_FACTS_UA },
  signal: AbortSignal.timeout(15_000),
}

const OCR_STOP = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'this',
  'that',
  'ingredients',
  'ingredient',
  'nutrition',
  'facts',
  'serving',
  'contains',
  'allergen',
  'allergens',
  'net',
  'wt',
  'weight',
  'product',
  'of',
  'to',
  'in',
  'a',
  'an',
  'or',
  'by',
  'per',
  'g',
  'mg',
  'ml',
  'oz',
  'kg',
  'lb',
])

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
    if (kj != null)
      rows.push({ label: 'Energy (per 100g / 100ml)', value: `${Math.round(kj)} kJ` })
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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length >= 3 && !OCR_STOP.has(t) && !/^\d+$/.test(t))
}

/** Pull a short brand/name-like query from noisy OCR instead of dumping the whole label. */
export function extractSearchQuery(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length >= 3 && /[a-zA-Z]/.test(l))

  const candidates = (lines.length ? lines : [text.replace(/\s+/g, ' ').trim()])
    .map((line) => {
      const tokens = tokenize(line)
      return {
        line,
        tokens,
        score: tokens.reduce((s, t) => s + Math.min(t.length, 10), 0),
      }
    })
    .filter((c) => c.tokens.length >= 2)
    .sort((a, b) => b.score - a.score)

  const best = candidates[0]
  if (!best) {
    const tokens = tokenize(text)
    if (tokens.length < 2) return null
    return tokens.slice(0, 6).join(' ')
  }
  return best.tokens.slice(0, 6).join(' ')
}

function overlapScore(ocrTokens: string[], productText: string): number {
  const productTokens = new Set(tokenize(productText))
  if (productTokens.size === 0 || ocrTokens.length === 0) return 0
  let hits = 0
  for (const t of ocrTokens) {
    for (const p of productTokens) {
      if (
        t === p ||
        (t.length >= 4 && p.length >= 4 && (t.includes(p) || p.includes(t)))
      ) {
        hits += 1
        break
      }
    }
  }
  return hits / Math.max(ocrTokens.length, 2)
}

function isAlcoholCategory(tags: string[]): boolean {
  const lower = tags.join(' ').toLowerCase()
  return (
    lower.includes('wine') ||
    lower.includes('champagne') ||
    lower.includes('sparkling-wine') ||
    lower.includes('spirits') ||
    lower.includes('beer') ||
    lower.includes('alcohol')
  )
}

function mapOffProduct(
  raw: Record<string, unknown>,
  meta: { source: 'barcode' | 'ocr'; code?: string },
): IdentifiedEntity {
  const code = String(meta.code ?? raw.code ?? raw._id ?? '')
  const name = String(
    raw.product_name ?? raw.abbreviated_product_name ?? 'Unknown product',
  )
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
  const alcoholNum =
    nut && typeof nut['alcohol_100g'] === 'number'
      ? (nut['alcohol_100g'] as number)
      : null
  const asAlcohol = isAlcoholCategory(tags) || (alcoholNum != null && alcoholNum > 0.5)

  const conf = meta.source === 'barcode' ? 0.9 : 0.55
  const fieldProv = meta.source === 'barcode' ? 'confirmed' : 'inferred'
  const scanNotes =
    meta.source === 'ocr'
      ? 'Open Food Facts text match — verify name and details on the package.'
      : catTag
        ? `Open Food Facts · ${catTag.replace(/^..:/, '')}. Community data — verify on pack.`
        : 'Open Food Facts (community-sourced). Verify allergens and nutrition on the package.'

  if (asAlcohol) {
    return {
      id: `off-${code}`,
      kind: 'alcohol',
      name: { value: name, provenance: fieldProv },
      subtitle: { value: brandRaw, provenance: fieldProv },
      summary: brandRaw
        ? `${name} by ${brandRaw}${alcoholNum != null ? ` · ${alcoholNum}% ABV` : ''}.`
        : name,
      confidence: conf,
      confidenceLevel: toConfidenceLevel(conf),
      source: meta.source,
      tags: tags.slice(0, 6).map((t) => t.replace(/^..:/, '')),
      warnings,
      scanNotes,
      facets: {
        abv: alcoholNum,
        style: catTag.replace(/^..:/, '') || null,
        region: origin,
        grapesOrGrains: null,
        tastingNotes: [],
        pairings: [],
        servingTemp: null,
        contents: quantity,
        origin,
        ingredients,
      },
    }
  }

  return {
    id: `off-${code}`,
    kind: 'food',
    name: { value: name, provenance: fieldProv },
    subtitle: { value: brandRaw, provenance: fieldProv },
    summary: brandRaw ? `${name} by ${brandRaw}.` : name,
    confidence: conf,
    confidenceLevel: toConfidenceLevel(conf),
    source: meta.source,
    tags: tags.slice(0, 6).map((t) => t.replace(/^..:/, '')),
    warnings,
    scanNotes,
    facets: {
      ingredients,
      allergens,
      nutritionFacts: nutritionArr,
      contents: quantity,
      origin,
      storage: null,
      pairings: [],
      doNotPair: [],
    },
  }
}

export async function lookupOpenFoodFactsByBarcode(
  code: string,
): Promise<IdentifiedEntity | null> {
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

/**
 * Search OFF by OCR text. Rejects weak first-hits that don't share tokens with the label.
 */
export async function searchOpenFoodFactsByText(
  text: string,
): Promise<IdentifiedEntity | null> {
  const q = extractSearchQuery(text)
  if (!q) return null

  const ocrTokens = tokenize(text).slice(0, 24)
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_simple=1&action=process&json=1&page_size=8&search_terms=${encodeURIComponent(q)}`
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
  const products = data.products ?? []
  if (!products.length) return null

  let best: { product: Record<string, unknown>; score: number } | null = null
  for (const product of products) {
    const name = String(product.product_name ?? '')
    const brands = String(product.brands ?? '')
    const score = overlapScore(ocrTokens, `${name} ${brands}`)
    if (!best || score > best.score) best = { product, score }
  }

  if (!best || best.score < 0.35) return null

  const code = String(best.product.code ?? best.product._id ?? '')
  return mapOffProduct(best.product, { source: 'ocr', code })
}
