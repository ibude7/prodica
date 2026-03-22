import type { ProductCategory } from '../domain/types'

/** Internal record — all optional fields for category-specific data */
export interface CatalogRecord {
  id: string
  barcodes: string[]
  nameTokens: string[]
  visualLabels: string[]
  category: ProductCategory
  name: string
  brand: string
  origin: string
  ingredients: string
  contents: string
  nutritionFacts: { label: string; value: string }[]
  alcoholPercent: number | null
  warnings: string[]
  storage: string
  pairings: string[]
  doNotPair: string[]
  region?: string
  grapeVariety?: string
  activeIngredients?: string[]
  dosageWarnings?: string
}

export const CATALOG: CatalogRecord[] = [
  {
    id: 'wine-bordeaux-01',
    barcodes: ['3760123456789'],
    nameTokens: ['bordeaux', 'château', 'chateau', 'margaux'],
    visualLabels: ['red wine bottle', 'wine bottle'],
    category: 'wine',
    name: 'Château de Lumière Bordeaux Supérieur',
    brand: 'Vignobles du Médoc',
    origin: 'France',
    ingredients: 'Grapes, sulfites',
    contents: '750 ml',
    nutritionFacts: [
      { label: 'Energy', value: '85 kcal per 100 ml (typical)' },
      { label: 'Carbohydrates', value: '2.6 g per 100 ml (typical)' },
    ],
    alcoholPercent: 13.5,
    warnings: ['Contains sulfites', 'Alcohol — not for minors'],
    storage: 'Store lying down in a cool, dark place. Serve 16–18°C.',
    pairings: ['Roast lamb', 'Hard cheese', 'Mushroom dishes'],
    doNotPair: ['Very spicy food — can clash with tannins'],
    region: 'Bordeaux Supérieur AOC',
    grapeVariety: 'Merlot, Cabernet Sauvignon',
  },
  {
    id: 'food-oats-01',
    barcodes: ['5412345678901'],
    nameTokens: ['crunchy', 'oats', 'honey', 'bar'],
    visualLabels: ['granola bar', 'snack bar', 'cereal bar'],
    category: 'food',
    name: 'Crunchy Oats & Honey Bar',
    brand: 'Morning Trail Foods',
    origin: 'Belgium',
    ingredients:
      'Whole grain oats (42%), glucose syrup, honey (8%), palm oil, salt, natural vanilla flavor.',
    contents: '6 × 28 g (168 g)',
    nutritionFacts: [
      { label: 'Energy', value: '420 kJ / 100 kcal per bar' },
      { label: 'Fat', value: '3.2 g per bar' },
      { label: 'Carbohydrates', value: '15 g per bar' },
      { label: 'Protein', value: '2.1 g per bar' },
      { label: 'Salt', value: '0.12 g per bar' },
    ],
    alcoholPercent: null,
    warnings: ['May contain traces of nuts, soy, and milk'],
    storage: 'Keep in a cool, dry place.',
    pairings: ['Coffee', 'Tea', 'Yogurt'],
    doNotPair: [],
  },
  {
    id: 'med-placeholder',
    barcodes: ['5901234123457'],
    nameTokens: ['acetaminophen', 'paracetamol'],
    visualLabels: ['medicine box'],
    category: 'medicine',
    name: 'PainRelief Extra (example)',
    brand: 'PharmaCo Demo',
    origin: 'Poland',
    ingredients: 'Tablet core: lactose, starch. Film coat: hypromellose, titanium dioxide.',
    contents: '24 tablets',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'Do not exceed stated dose',
      'Consult a doctor if symptoms persist',
      'Not for children under 12 without medical advice',
    ],
    storage: 'Below 25°C, dry place, out of reach of children.',
    pairings: [],
    doNotPair: ['Alcohol — may increase liver risk when combined with paracetamol'],
    activeIngredients: ['Paracetamol 500 mg per tablet'],
    dosageWarnings: 'Max 8 tablets in 24 hours for adults unless prescribed otherwise.',
  },
]
