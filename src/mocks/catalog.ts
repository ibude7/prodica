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
  {
    id: 'fragrance-vetiver-01',
    barcodes: ['8411061777770'],
    nameTokens: ['vetiver', 'eau', 'toilette', 'cologne', 'fragrance', 'perfume'],
    visualLabels: ['perfume bottle', 'fragrance bottle', 'cologne bottle'],
    category: 'fragrance',
    name: 'Vetiver Classique Eau de Toilette',
    brand: 'Maison Éclat',
    origin: 'France',
    ingredients:
      'Alcohol denat., aqua, parfum, limonene, linalool, coumarin, citronellol, geraniol.',
    contents: '100 ml',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'Flammable — keep away from open flames',
      'Avoid contact with eyes',
      'For external use only',
    ],
    storage: 'Store at room temperature away from direct sunlight.',
    pairings: ['Casual daywear', 'Summer evenings'],
    doNotPair: ['Strong-scented body lotion — may clash'],
  },
  {
    id: 'fragrance-rose-01',
    barcodes: ['3614270000001'],
    nameTokens: ['rose', 'parfum', 'floral', 'eau de parfum'],
    visualLabels: ['perfume bottle', 'fragrance bottle'],
    category: 'fragrance',
    name: 'Rose Pétale Eau de Parfum',
    brand: 'Atelier Lumière',
    origin: 'France',
    ingredients:
      'Alcohol denat., aqua, parfum, citronellol, geraniol, hydroxycitronellal, linalool.',
    contents: '50 ml',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'Flammable',
      'Avoid contact with eyes and broken skin',
    ],
    storage: 'Keep in a cool, dry place. Store upright.',
    pairings: ['Evening wear', 'Romantic occasions'],
    doNotPair: [],
  },
  {
    id: 'supplement-omega3-01',
    barcodes: ['7350049430013'],
    nameTokens: ['omega', 'fish', 'oil', 'supplement', 'capsule'],
    visualLabels: ['supplement bottle', 'vitamin bottle', 'pill bottle'],
    category: 'supplements',
    name: 'Omega-3 Fish Oil 1000 mg',
    brand: 'VitaCore Nutrition',
    origin: 'Norway',
    ingredients:
      'Fish oil concentrate (anchovy, sardine), gelatin capsule, glycerin, d-alpha tocopherol (vitamin E).',
    contents: '90 softgel capsules',
    nutritionFacts: [
      { label: 'EPA', value: '360 mg per capsule' },
      { label: 'DHA', value: '240 mg per capsule' },
      { label: 'Total Omega-3', value: '700 mg per capsule' },
    ],
    alcoholPercent: null,
    warnings: [
      'Contains fish (anchovy, sardine)',
      'Consult a healthcare provider if pregnant, nursing, or on blood thinners',
    ],
    storage: 'Store in a cool, dry place. Refrigerate after opening.',
    pairings: ['Take with a meal for better absorption'],
    doNotPair: ['Blood-thinning medications without medical advice'],
    activeIngredients: ['EPA 360 mg', 'DHA 240 mg'],
    dosageWarnings: '1–2 capsules daily with food, or as directed by a healthcare professional.',
  },
  {
    id: 'supplement-vitd-01',
    barcodes: ['5060000000017'],
    nameTokens: ['vitamin', 'vitamin d', 'd3', 'sunshine', 'supplement'],
    visualLabels: ['supplement bottle', 'vitamin bottle'],
    category: 'supplements',
    name: 'Vitamin D3 2000 IU',
    brand: 'SunVit Labs',
    origin: 'United Kingdom',
    ingredients:
      'Olive oil, cholecalciferol (vitamin D3), softgel shell (gelatin, glycerin, purified water).',
    contents: '120 softgel capsules',
    nutritionFacts: [
      { label: 'Vitamin D3', value: '50 µg (2000 IU) per capsule' },
    ],
    alcoholPercent: null,
    warnings: [
      'Do not exceed recommended dose',
      'Keep out of reach of children',
    ],
    storage: 'Store below 25°C in a dry place.',
    pairings: ['Take with a fatty meal for best absorption'],
    doNotPair: [],
    activeIngredients: ['Cholecalciferol (Vitamin D3) 50 µg / 2000 IU'],
    dosageWarnings: '1 capsule daily with food. Do not exceed 4000 IU per day without medical advice.',
  },
  {
    id: 'cosmetics-moisturizer-01',
    barcodes: ['4005800000010'],
    nameTokens: ['moisturizer', 'cream', 'face', 'hydrating', 'skincare'],
    visualLabels: ['cream jar', 'moisturizer jar', 'skincare product'],
    category: 'cosmetics',
    name: 'Hydra-Glow Daily Moisturizer',
    brand: 'DermaSoft',
    origin: 'Germany',
    ingredients:
      'Aqua, glycerin, cetearyl alcohol, caprylic/capric triglyceride, niacinamide, hyaluronic acid, tocopheryl acetate, phenoxyethanol.',
    contents: '50 ml',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'For external use only',
      'Discontinue use if irritation occurs',
      'Avoid contact with eyes',
    ],
    storage: 'Store at room temperature. Use within 12 months of opening.',
    pairings: ['Apply after cleansing', 'Layer under sunscreen'],
    doNotPair: ['Retinol products at the same time — may cause irritation'],
  },
  {
    id: 'cosmetics-sunscreen-01',
    barcodes: ['8809000000012'],
    nameTokens: ['sunscreen', 'spf', 'sun', 'protection', 'uv'],
    visualLabels: ['sunscreen tube', 'skincare product', 'lotion tube'],
    category: 'cosmetics',
    name: 'UV Shield SPF 50+ Sunscreen',
    brand: 'SolarGuard',
    origin: 'South Korea',
    ingredients:
      'Aqua, homosalate, ethylhexyl salicylate, butyl methoxydibenzoylmethane, octocrylene, glycerin, dimethicone, tocopheryl acetate.',
    contents: '60 ml',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'For external use only',
      'Reapply every 2 hours and after swimming',
      'Avoid contact with eyes',
    ],
    storage: 'Store below 30°C. Do not use after expiry date.',
    pairings: ['Apply as the last step of skincare, before makeup'],
    doNotPair: [],
  },
  {
    id: 'household-cleaner-01',
    barcodes: ['5000000000015'],
    nameTokens: ['cleaner', 'all-purpose', 'spray', 'clean', 'surface'],
    visualLabels: ['cleaning spray bottle', 'household cleaner', 'spray bottle'],
    category: 'household',
    name: 'All-Purpose Surface Cleaner',
    brand: 'CleanBright',
    origin: 'United States',
    ingredients:
      'Water, sodium laureth sulfate, citric acid, sodium carbonate, fragrance, colorant.',
    contents: '750 ml',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'Keep out of reach of children',
      'Avoid contact with eyes — rinse immediately if contact occurs',
      'Do not mix with bleach or other cleaning products',
      'Not for use on marble or natural stone',
    ],
    storage: 'Store upright in a cool, dry place.',
    pairings: ['Kitchen surfaces', 'Bathroom tiles', 'Glass'],
    doNotPair: ['Bleach — produces toxic fumes when mixed'],
  },
  {
    id: 'household-detergent-01',
    barcodes: ['4015000000018'],
    nameTokens: ['detergent', 'laundry', 'pods', 'wash', 'clothes'],
    visualLabels: ['detergent box', 'laundry pods', 'laundry product'],
    category: 'household',
    name: 'Fresh Breeze Laundry Pods',
    brand: 'WashWell',
    origin: 'Netherlands',
    ingredients:
      'PEG/PPG copolymer, propylene glycol, sodium laureth sulfate, subtilisin (enzyme), fragrance, optical brighteners.',
    contents: '30 pods (600 g)',
    nutritionFacts: [],
    alcoholPercent: null,
    warnings: [
      'Keep out of reach of children — choking and ingestion hazard',
      'Do not puncture or open pods',
      'Harmful if swallowed — call poison control immediately',
      'Avoid contact with eyes and skin',
    ],
    storage: 'Store in a cool, dry place. Keep container tightly closed.',
    pairings: ['1 pod per standard load', 'Works in cold and warm water'],
    doNotPair: ['Fabric softener pods in the same compartment'],
  },
]
