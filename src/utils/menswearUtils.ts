import { ColorItem, Combination, HydratedCombination } from '../types/color';
import {
  createCustomCombination,
  escapeXml,
  getContrastRatio,
  getDeltaE2000,
  getIdealTextColor,
  getLuminance,
  hexToRgb,
  rgbToHsl,
} from './colorUtils';

export type GarmentStyle =
  | 'suit'
  | 'smart-casual'
  | 'overcoat'
  | 'streetwear'
  | 'resort'
  | 'wafuku';

export type GarmentSlotKey = 'outerwear' | 'top' | 'bottom' | 'accent' | 'footwear';
export type GarmentOutfitIds = Record<GarmentSlotKey, number>;

export type OuterwearCut = 'none' | 'blazer' | 'overcoat' | 'bomber' | 'chore' | 'haori';
export type TopCut = 'dress-shirt' | 'crewneck' | 'turtleneck' | 'hoodie' | 'camp-shirt' | 'kimono';
export type BottomCut = 'trousers' | 'chinos' | 'denim' | 'shorts' | 'hakama';
export type AccentCut = 'tie' | 'scarf' | 'belt-socks' | 'cap-trim' | 'obi';
export type FootwearCut = 'oxfords' | 'sneakers' | 'loafers' | 'boots' | 'zori';

export type FabricMaterial =
  | 'worsted-wool'
  | 'tweed-herringbone'
  | 'corduroy'
  | 'cotton-oxford'
  | 'heavy-twill'
  | 'selvedge-denim'
  | 'rib-knit'
  | 'fleece-jersey'
  | 'slub-linen'
  | 'nylon-satin'
  | 'silk-crepe'
  | 'full-grain-leather'
  | 'brushed-suede'
  | 'canvas-rubber';

export interface GarmentPieces {
  outerwear: OuterwearCut;
  top: TopCut;
  bottom: BottomCut;
  accent: AccentCut;
  footwear: FootwearCut;
}

export type GarmentMaterials = Record<GarmentSlotKey, FabricMaterial>;

export type SkinToneId = 'porcelain' | 'warm-ivory' | 'olive' | 'medium-tan' | 'deep-espresso';
export type LightingPreset = 'daylight' | 'warm-indoor' | 'evening-gallery';
export type FabricPattern = 'solid' | 'pinstripe' | 'windowpane' | 'breton' | 'gingham';

export type GarmentPatterns = Record<GarmentSlotKey, FabricPattern>;
export type GarmentPatternColorIds = Record<GarmentSlotKey, number>;

export interface SavedMenswearOutfit {
  id: string;
  name: string;
  style: GarmentStyle;
  pieces?: GarmentPieces;
  materials?: GarmentMaterials;
  patterns?: GarmentPatterns;
  patternColors?: GarmentPatternColorIds;
  skinTone?: SkinToneId;
  lighting?: LightingPreset;
  outfit: GarmentOutfitIds;
}

export const GARMENT_SLOT_ORDER: GarmentSlotKey[] = [
  'outerwear',
  'top',
  'bottom',
  'accent',
  'footwear',
];

export const DEFAULT_MENSWEAR_OUTFIT: GarmentOutfitIds = {
  outerwear: 130, // Dark Tyrian Blue
  top: 154, // White
  bottom: 158, // Slate Color
  accent: 29, // Carmine Red
  footwear: 87, // Vandyke Brown
};

export const OUTERWEAR_CUTS: { id: OuterwearCut; label: string }[] = [
  { id: 'none', label: 'No Outerwear (Top Only)' },
  { id: 'blazer', label: 'Tailored Blazer' },
  { id: 'overcoat', label: 'Wool Overcoat' },
  { id: 'bomber', label: 'Bomber Jacket' },
  { id: 'chore', label: 'Chore / Overshirt Coat' },
  { id: 'haori', label: 'Haori Mantle (羽織)' },
];

export const TOP_CUTS: { id: TopCut; label: string }[] = [
  { id: 'dress-shirt', label: 'Collared Oxford / Dress Shirt' },
  { id: 'crewneck', label: 'Crewneck Tee / Knit' },
  { id: 'turtleneck', label: 'Fine Knit Turtleneck' },
  { id: 'hoodie', label: 'Pullover Hoodie' },
  { id: 'camp-shirt', label: 'Short-Sleeve Camp / Polo' },
  { id: 'kimono', label: 'Kimono Robe (着物)' },
];

export const BOTTOM_CUTS: { id: BottomCut; label: string }[] = [
  { id: 'trousers', label: 'Tailored Trousers' },
  { id: 'chinos', label: 'Tapered Chinos' },
  { id: 'denim', label: 'Relaxed Denim Jeans' },
  { id: 'shorts', label: 'Tailored Shorts' },
  { id: 'hakama', label: 'Hakama Pleats (袴)' },
];

export const ACCENT_CUTS: { id: AccentCut; label: string }[] = [
  { id: 'tie', label: 'Necktie & Pocket Square' },
  { id: 'scarf', label: 'Neck Scarf' },
  { id: 'belt-socks', label: 'Belt & Socks Trim' },
  { id: 'cap-trim', label: 'Cap & Hardware Trim' },
  { id: 'obi', label: 'Kaku-Obi & Cord (角帯)' },
];

export const FOOTWEAR_CUTS: { id: FootwearCut; label: string }[] = [
  { id: 'oxfords', label: 'Leather Oxfords' },
  { id: 'sneakers', label: 'Low-Top Sneakers' },
  { id: 'loafers', label: 'Suede Loafers' },
  { id: 'boots', label: 'Chelsea / Lace Boots' },
  { id: 'zori', label: 'Tabi & Zōri (足袋・草履)' },
];

export const STYLE_PRESET_PIECES: Record<GarmentStyle, GarmentPieces> = {
  suit: {
    outerwear: 'blazer',
    top: 'dress-shirt',
    bottom: 'trousers',
    accent: 'tie',
    footwear: 'oxfords',
  },
  'smart-casual': {
    outerwear: 'none',
    top: 'dress-shirt',
    bottom: 'chinos',
    accent: 'belt-socks',
    footwear: 'loafers',
  },
  overcoat: {
    outerwear: 'overcoat',
    top: 'turtleneck',
    bottom: 'trousers',
    accent: 'scarf',
    footwear: 'boots',
  },
  streetwear: {
    outerwear: 'bomber',
    top: 'hoodie',
    bottom: 'denim',
    accent: 'cap-trim',
    footwear: 'sneakers',
  },
  resort: {
    outerwear: 'none',
    top: 'camp-shirt',
    bottom: 'shorts',
    accent: 'belt-socks',
    footwear: 'loafers',
  },
  wafuku: {
    outerwear: 'haori',
    top: 'kimono',
    bottom: 'hakama',
    accent: 'obi',
    footwear: 'zori',
  },
};

const CUT_LABEL_LOOKUP: Record<string, string> = Object.fromEntries([
  ...OUTERWEAR_CUTS.map((x) => [`outerwear:${x.id}`, x.label]),
  ...TOP_CUTS.map((x) => [`top:${x.id}`, x.label]),
  ...BOTTOM_CUTS.map((x) => [`bottom:${x.id}`, x.label]),
  ...ACCENT_CUTS.map((x) => [`accent:${x.id}`, x.label]),
  ...FOOTWEAR_CUTS.map((x) => [`footwear:${x.id}`, x.label]),
]);

export function getSlotDisplayLabel(slot: GarmentSlotKey, pieces: GarmentPieces): string {
  return CUT_LABEL_LOOKUP[`${slot}:${pieces[slot]}`] || slot;
}

export const FABRIC_MATERIAL_META: Record<
  FabricMaterial,
  { label: string; drapeNote: string }
> = {
  'worsted-wool': {
    label: 'Worsted Wool',
    drapeNote: 'High-twist diagonal weave • Crisp architectural drape',
  },
  'tweed-herringbone': {
    label: 'Herringbone Tweed',
    drapeNote: 'Chevron carded wool • Dry heritage grain & lofty weight',
  },
  corduroy: {
    label: 'Ribbed Corduroy',
    drapeNote: 'Plush vertical velvet wales • Matte tactile warmth',
  },
  'cotton-oxford': {
    label: 'Oxford Cotton',
    drapeNote: 'Open-basket weave • Crisp breathable collar structure',
  },
  'heavy-twill': {
    label: 'Heavy Chinos Twill',
    drapeNote: 'Tight diagonal cavalry twill • Matte utility structure',
  },
  'selvedge-denim': {
    label: 'Selvedge Denim',
    drapeNote: '3×1 right-hand indigo weave • Contrasting weft grain',
  },
  'rib-knit': {
    label: 'Merino Rib Knit',
    drapeNote: 'Vertical elastic rib columns • Soft contoured fall',
  },
  'fleece-jersey': {
    label: 'Brushed Fleece',
    drapeNote: 'Lofty heather loop-back cotton • Relaxed casual bulk',
  },
  'slub-linen': {
    label: 'Textured Slub Linen',
    drapeNote: 'Uneven bast flax yarns • Breezy open daylight weave',
  },
  'nylon-satin': {
    label: 'Matte Nylon Satin',
    drapeNote: 'Tight technical plain-satin • Subtle sheen & wind resistance',
  },
  'silk-crepe': {
    label: 'Woven Silk / Crêpe',
    drapeNote: 'Undulating chirimen silk micro-slub • Fluid luster',
  },
  'full-grain-leather': {
    label: 'Full-Grain Leather',
    drapeNote: 'Natural pore pebble grain • Burnished structured gleam',
  },
  'brushed-suede': {
    label: 'Napped Suede',
    drapeNote: 'Fine velvet reverse hide • Soft light-absorbing matte',
  },
  'canvas-rubber': {
    label: 'Heavy Canvas',
    drapeNote: 'Balanced duck weave • Crisp sneaker duck silhouette',
  },
};

export const MATERIALS_BY_SLOT: Record<GarmentSlotKey, FabricMaterial[]> = {
  outerwear: [
    'worsted-wool',
    'tweed-herringbone',
    'corduroy',
    'heavy-twill',
    'selvedge-denim',
    'nylon-satin',
    'slub-linen',
    'silk-crepe',
    'full-grain-leather',
  ],
  top: [
    'cotton-oxford',
    'rib-knit',
    'fleece-jersey',
    'slub-linen',
    'heavy-twill',
    'corduroy',
    'silk-crepe',
  ],
  bottom: [
    'worsted-wool',
    'heavy-twill',
    'selvedge-denim',
    'corduroy',
    'slub-linen',
    'tweed-herringbone',
    'silk-crepe',
  ],
  accent: [
    'silk-crepe',
    'rib-knit',
    'tweed-herringbone',
    'heavy-twill',
    'full-grain-leather',
    'brushed-suede',
    'slub-linen',
  ],
  footwear: [
    'full-grain-leather',
    'brushed-suede',
    'canvas-rubber',
    'silk-crepe',
  ],
};

export function getDefaultMaterialForCut(
  slot: GarmentSlotKey,
  cut: string
): FabricMaterial {
  switch (`${slot}:${cut}`) {
    case 'outerwear:blazer':
    case 'bottom:trousers':
      return 'worsted-wool';
    case 'outerwear:overcoat':
      return 'tweed-herringbone';
    case 'outerwear:bomber':
      return 'nylon-satin';
    case 'outerwear:chore':
    case 'bottom:chinos':
    case 'accent:cap-trim':
      return 'heavy-twill';
    case 'outerwear:haori':
    case 'top:kimono':
    case 'bottom:hakama':
    case 'accent:tie':
    case 'accent:obi':
      return 'silk-crepe';
    case 'top:dress-shirt':
      return 'cotton-oxford';
    case 'top:crewneck':
    case 'top:turtleneck':
    case 'accent:scarf':
      return 'rib-knit';
    case 'top:hoodie':
      return 'fleece-jersey';
    case 'top:camp-shirt':
    case 'bottom:shorts':
      return 'slub-linen';
    case 'bottom:denim':
      return 'selvedge-denim';
    case 'footwear:loafers':
      return 'brushed-suede';
    case 'footwear:sneakers':
      return 'canvas-rubber';
    case 'footwear:zori':
      return 'silk-crepe';
    case 'accent:belt-socks':
    case 'footwear:oxfords':
    case 'footwear:boots':
    default:
      return 'full-grain-leather';
  }
}

export function getDefaultMaterialsForPieces(pieces: GarmentPieces): GarmentMaterials {
  return {
    outerwear: getDefaultMaterialForCut('outerwear', pieces.outerwear),
    top: getDefaultMaterialForCut('top', pieces.top),
    bottom: getDefaultMaterialForCut('bottom', pieces.bottom),
    accent: getDefaultMaterialForCut('accent', pieces.accent),
    footwear: getDefaultMaterialForCut('footwear', pieces.footwear),
  };
}

export const SKIN_TONE_PRESETS: Record<
  SkinToneId,
  { label: string; base: string; shade: string; hair: string }
> = {
  porcelain: { label: 'Porcelain', base: '#F2DFD3', shade: '#DEC3B4', hair: '#4A3B32' },
  'warm-ivory': { label: 'Warm Ivory', base: '#E7D1C2', shade: '#D7BDA9', hair: '#3B322C' },
  olive: { label: 'Warm Olive', base: '#D4B699', shade: '#BF9B7D', hair: '#2A231E' },
  'medium-tan': { label: 'Medium Tan', base: '#B58969', shade: '#9A6E50', hair: '#201A17' },
  'deep-espresso': { label: 'Deep Espresso', base: '#6F4934', shade: '#583725', hair: '#151211' },
};

export const LIGHTING_PRESET_META: Record<
  LightingPreset,
  {
    label: string;
    stageBgHex: string;
    stageTextHex: string;
    ambientFilter?: string;
    isDarkStage: boolean;
  }
> = {
  daylight: {
    label: 'Daylight Washi',
    stageBgHex: '#FAF7F2',
    stageTextHex: '#1C1A17',
    isDarkStage: false,
  },
  'warm-indoor': {
    label: 'Warm Tungsten',
    stageBgHex: '#F3E7D4',
    stageTextHex: '#2A2018',
    ambientFilter: 'sepia(0.14) saturate(1.08) brightness(0.98)',
    isDarkStage: false,
  },
  'evening-gallery': {
    label: 'Evening Gallery',
    stageBgHex: '#202026',
    stageTextHex: '#F4F2EE',
    ambientFilter: 'contrast(1.06) brightness(0.88)',
    isDarkStage: true,
  },
};

export const FABRIC_PATTERN_META: Record<FabricPattern, { label: string }> = {
  solid: { label: 'Solid Weave' },
  pinstripe: { label: 'Chalk Pinstripe' },
  windowpane: { label: 'Windowpane Check' },
  breton: { label: 'Breton Stripe' },
  gingham: { label: 'Gingham Check' },
};

export const PATTERNS_BY_SLOT: Record<GarmentSlotKey, FabricPattern[]> = {
  outerwear: ['solid', 'pinstripe', 'windowpane'],
  top: ['solid', 'breton', 'gingham', 'pinstripe'],
  bottom: ['solid', 'pinstripe', 'windowpane'],
  accent: ['solid'],
  footwear: ['solid'],
};

export const DEFAULT_GARMENT_PATTERNS: GarmentPatterns = {
  outerwear: 'solid',
  top: 'solid',
  bottom: 'solid',
  accent: 'solid',
  footwear: 'solid',
};

export const DEFAULT_PATTERN_COLORS: GarmentPatternColorIds = {
  outerwear: 154, // White chalk line
  top: 130, // Dark Tyrian Blue thread
  bottom: 154, // White chalk line
  accent: 154,
  footwear: 154,
};

export const GARMENT_STYLE_META: Record<
  GarmentStyle,
  { label: string; shortLabel: string; subtitle: string }
> = {
  suit: {
    label: 'Tailored Suit',
    shortLabel: 'Suit & Tie',
    subtitle: 'Notch-lapel blazer, dress shirt, tie & pleated trousers',
  },
  'smart-casual': {
    label: 'Shirt & Chinos',
    shortLabel: 'Shirt & Chinos',
    subtitle: 'Crisp Oxford button-down, tapered chinos & loafers (no jacket)',
  },
  overcoat: {
    label: 'Overcoat & Knit',
    shortLabel: 'Overcoat',
    subtitle: 'Long wool topcoat layered over turtleneck, scarf & boots',
  },
  streetwear: {
    label: 'Streetwear Look',
    shortLabel: 'Streetwear',
    subtitle: 'Bomber jacket, pullover hoodie, relaxed denim, cap & sneakers',
  },
  resort: {
    label: 'Summer & Shorts',
    shortLabel: 'Summer Resort',
    subtitle: 'Short-sleeve camp collar shirt, tailored shorts, belt & loafers',
  },
  wafuku: {
    label: 'Haori & Kimono',
    shortLabel: 'Haori / Wafuku',
    subtitle: 'Traditional Japanese haori, kimono, pleated hakama, obi & zōri',
  },
};

export interface MenswearPreset {
  id: string;
  name: string;
  occasion: string;
  note: string;
  style: GarmentStyle;
  outfit: GarmentOutfitIds;
}

export const MENSWEAR_PRESETS: MenswearPreset[] = [
  {
    id: 'showa-navy',
    name: 'Tyrian Suit',
    occasion: 'Formal Tailoring',
    note: 'Crisp navy blazer tailored over white shirting, slate trousers & carmine silk',
    style: 'suit',
    outfit: { ...DEFAULT_MENSWEAR_OUTFIT },
  },
  {
    id: 'salvia-oxford',
    name: 'Salvia & Chinos',
    occasion: 'Smart Casual',
    note: 'Powder-blue Oxford shirt tucked cleanly into charcoal-olive chinos & espresso loafers',
    style: 'smart-casual',
    outfit: {
      outerwear: 110, // Hidden under outerwear:'none', stays ready if coat added
      top: 114, // Salvia Blue
      bottom: 82, // Deep Grayish Olive
      accent: 87, // Vandyke Brown belt/socks
      footwear: 86, // Mars Brown loafers
    },
  },
  {
    id: 'autumn-topcoat',
    name: 'Slate Olive Coat',
    occasion: 'Autumn Layering',
    note: 'Long deep olive topcoat layered with ivory turtleneck, tobacco trousers & sienna scarf',
    style: 'overcoat',
    outfit: {
      outerwear: 110, // Deep Slate Olive
      top: 42, // Ivory Buff
      bottom: 158, // Slate Color
      accent: 14, // Raw Sienna
      footwear: 87, // Vandyke Brown
    },
  },
  {
    id: 'urban-bomber',
    name: 'Indigo Streetwear',
    occasion: 'Streetwear',
    note: 'Deep indigo bomber over warm mineral hoodie, raw slate denim & terracotta cap trim',
    style: 'streetwear',
    outfit: {
      outerwear: 132, // Deep Indigo
      top: 156, // Mineral Gray
      bottom: 127, // Deep Lyons Blue
      accent: 8, // Grenadine Pink / 洗朱
      footwear: 154, // White sneakers
    },
  },
  {
    id: 'summer-linen',
    name: 'Ivory Resort',
    occasion: 'Warm Resort',
    note: 'Breezy slate camp shirt, cream linen shorts, raw sienna woven belt & loafers',
    style: 'resort',
    outfit: {
      outerwear: 158,
      top: 171, // Pale King's Blue - B
      bottom: 125, // Dark Medici Blue
      accent: 14, // Raw Sienna
      footwear: 86, // Mars Brown
    },
  },
  {
    id: 'kyoto-haori',
    name: 'Kyoto Haori',
    occasion: 'Traditional Wafuku',
    note: 'Traditional Wafuku harmony: slate haori, violet-blue kimono, indigo hakama & obi',
    style: 'wafuku',
    outfit: {
      outerwear: 158, // Slate Color
      top: 128, // Violet Blue
      bottom: 132, // Deep Indigo
      accent: 8, // Grenadine Pink / 洗朱
      footwear: 154, // White Tabi
    },
  },
];

export function serializeOutfitIds(outfit: GarmentOutfitIds): number[] {
  return GARMENT_SLOT_ORDER.map((slot) => outfit[slot]);
}

export function outfitArrayToRecord(
  ids: number[],
  fallback: GarmentOutfitIds = DEFAULT_MENSWEAR_OUTFIT
): GarmentOutfitIds {
  return {
    outerwear: ids[0] ?? fallback.outerwear,
    top: ids[1] ?? fallback.top,
    bottom: ids[2] ?? fallback.bottom,
    accent: ids[3] ?? fallback.accent,
    footwear: ids[4] ?? fallback.footwear,
  };
}

/**
 * Intelligently map any Sanzo Wada palette (2 to 7 colors) onto the 5 male garment slots,
 * optionally preserving locked garment slots.
 */
export function mapComboToGarmentOutfit(
  combo: Combination,
  locked: Partial<Record<GarmentSlotKey, number>> = {}
): GarmentOutfitIds {
  const palette = combo.colors;
  if (palette.length === 0) return { ...DEFAULT_MENSWEAR_OUTFIT, ...locked };

  const scored = palette.map((c) => {
    const [, s, l] = rgbToHsl(c.rgb);
    const lum = getLuminance(...hexToRgb(c.hex));
    return { c, s, l, lum };
  });

  const byDark = [...scored].sort((a, b) => a.lum - b.lum);
  const byLight = [...scored].sort((a, b) => b.lum - a.lum);
  const byChroma = [...scored].sort((a, b) => b.s - a.s);

  const usedLocked = new Set<number>(
    Object.values(locked).filter((id): id is number => typeof id === 'number')
  );

  const pickBest = (
    list: typeof scored,
    avoidIds: Set<number>,
    fallbackList = list
  ): number => {
    return (
      list.find((x) => !avoidIds.has(x.c.id))?.c.id ??
      fallbackList[0].c.id
    );
  };

  const avoidForTop = new Set(usedLocked);
  const top = locked.top ?? pickBest(byLight, avoidForTop, byLight);

  const avoidForBottom = new Set([...usedLocked, top]);
  const bottom = locked.bottom ?? pickBest(byDark, avoidForBottom, byDark);

  const avoidForOuterwear = new Set([...usedLocked, top, bottom]);
  const outerwear =
    locked.outerwear ??
    pickBest(byDark, avoidForOuterwear, byDark.filter((x) => x.c.id !== top).length > 0 ? byDark.filter((x) => x.c.id !== top) : byDark);

  const avoidForAccent = new Set([...usedLocked, top, outerwear]);
  const accent =
    locked.accent ??
    pickBest(byChroma, avoidForAccent, byChroma.filter((x) => x.c.id !== top).length > 0 ? byChroma.filter((x) => x.c.id !== top) : byChroma);

  const avoidForFootwear = new Set([top, outerwear]);
  const footwear =
    locked.footwear ?? pickBest(byDark, avoidForFootwear, byDark);

  return {
    outerwear,
    top,
    bottom,
    accent,
    footwear,
  };
}

export type OutfitStrategy = 'archival' | 'monochrome' | 'analogous' | 'accent-pop';

export const OUTFIT_STRATEGY_META: Record<
  OutfitStrategy,
  { id: OutfitStrategy; label: string; note: string }
> = {
  archival: {
    id: 'archival',
    label: 'Archival Plate',
    note: 'Complete unlocked garments around a matching 1933–1935 Wada combination',
  },
  monochrome: {
    id: 'monochrome',
    label: 'Monochrome Ladder',
    note: 'Lightness gradation along your locked or anchor garment hue',
  },
  analogous: {
    id: 'analogous',
    label: 'Analogous Blend',
    note: 'Smooth neighboring hue transition paired with structured footwear',
  },
  'accent-pop': {
    id: 'accent-pop',
    label: '60 / 30 / 10 Pop',
    note: 'Calm neutral tailoring base (90%) with one vivid Wada accent (10%)',
  },
};

export const OUTFIT_STRATEGY_LIST: { id: OutfitStrategy; label: string; note: string }[] = [
  OUTFIT_STRATEGY_META.archival,
  OUTFIT_STRATEGY_META.monochrome,
  OUTFIT_STRATEGY_META.analogous,
  OUTFIT_STRATEGY_META['accent-pop'],
];

function hueDistanceDeg(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Generate a refined 5-slot menswear colorway using a named styling strategy
 * while strictly preserving every locked garment slot.
 */
export function generateStrategyOutfit(params: {
  strategy: OutfitStrategy;
  anchorSlot: GarmentSlotKey;
  currentOutfit: GarmentOutfitIds;
  lockedSlots?: Partial<Record<GarmentSlotKey, boolean>>;
  allColors: ColorItem[];
  allCombinations: HydratedCombination[];
  variantSeed?: number;
}): { outfit: GarmentOutfitIds; matchedCombo?: HydratedCombination } {
  const {
    strategy,
    anchorSlot,
    currentOutfit,
    lockedSlots = {},
    allColors,
    allCombinations,
    variantSeed = 0,
  } = params;

  const colorById = new Map<number, ColorItem>(allColors.map((c) => [c.id, c]));
  const lockedOverrides: Partial<Record<GarmentSlotKey, number>> = {};
  for (const slot of GARMENT_SLOT_ORDER) {
    if (lockedSlots[slot]) {
      lockedOverrides[slot] = currentOutfit[slot];
    }
  }

  const anchorColor =
    colorById.get(currentOutfit[anchorSlot]) ?? allColors[0];
  const [anchorHue, anchorSat] = rgbToHsl(anchorColor.rgb);

  if (strategy === 'archival' && allCombinations.length > 0) {
    const lockedIds = Array.from(new Set(Object.values(lockedOverrides)));
    const targetIds = lockedIds.length > 0 ? lockedIds : [anchorColor.id];
    const matching = allCombinations
      .map((combo) => {
        const comboSet = new Set(combo.colors.map((c) => c.id));
        const exactCount = targetIds.filter((id) => comboSet.has(id)).length;
        const avgDist =
          targetIds.reduce((sum, id) => {
            const c = colorById.get(id);
            if (!c) return sum;
            const minD = combo.colors.reduce(
              (best, cc) => Math.min(best, getDeltaE2000(c.lab, cc.lab)),
              Infinity
            );
            return sum + minD;
          }, 0) / Math.max(1, targetIds.length);
        return { combo, exactCount, avgDist };
      })
      .sort((a, b) => b.exactCount - a.exactCount || a.avgDist - b.avgDist);

    const exactMatches = matching.filter((m) => m.exactCount > 0);
    const pool = exactMatches.length >= 2 ? exactMatches.slice(0, 12) : matching.slice(0, 8);
    const picked = pool[Math.abs(variantSeed) % pool.length]?.combo ?? allCombinations[0];
    return {
      outfit: mapComboToGarmentOutfit(picked, lockedOverrides),
      matchedCombo: picked,
    };
  }

  const withMetrics = allColors.map((c) => {
    const [h, s, l] = rgbToHsl(c.rgb);
    const lum = getLuminance(...hexToRgb(c.hex));
    return { c, h, s, l, lum };
  });

  if (strategy === 'monochrome') {
    const baseHue = anchorSat >= 0.08 ? anchorHue : 210;
    const byHueFit = [...withMetrics].sort((a, b) => {
      const da = a.s < 0.09 ? 16 : hueDistanceDeg(a.h, baseHue);
      const db = b.s < 0.09 ? 16 : hueDistanceDeg(b.h, baseHue);
      return da - db || a.c.id - b.c.id;
    });
    const topLight =
      byHueFit.filter((x) => x.lum > 0.45).sort((a, b) => b.lum - a.lum)[0]?.c.id ??
      154;
    const midOuter =
      byHueFit.find((x) => x.lum >= 0.05 && x.lum <= 0.35 && x.s >= 0.12)?.c.id ??
      byHueFit[Math.min(2, byHueFit.length - 1)].c.id;
    const deepBottom =
      byHueFit.filter((x) => x.lum <= 0.22 && x.c.id !== midOuter)[0]?.c.id ??
      byHueFit[byHueFit.length - 1].c.id;
    const richAccent =
      byHueFit.find(
        (x) => x.c.id !== topLight && x.c.id !== midOuter && x.s >= 0.25
      )?.c.id ?? anchorColor.id;
    const darkShoe =
      withMetrics.filter((x) => x.lum < 0.12 && x.s < 0.35).sort((a, b) => a.lum - b.lum)[0]?.c.id ??
      87;

    return {
      outfit: {
        outerwear: lockedOverrides.outerwear ?? midOuter,
        top: lockedOverrides.top ?? topLight,
        bottom: lockedOverrides.bottom ?? deepBottom,
        accent: lockedOverrides.accent ?? richAccent,
        footwear: lockedOverrides.footwear ?? darkShoe,
      },
    };
  }

  if (strategy === 'analogous') {
    const targetShift = variantSeed % 2 === 0 ? 36 : 324;
    const secondHue = (anchorHue + targetShift) % 360;
    const shirt =
      withMetrics
        .filter((x) => x.lum >= 0.65 && (x.s < 0.28 || hueDistanceDeg(x.h, anchorHue) <= 55))
        .sort((a, b) => b.lum - a.lum)[0]?.c.id ?? 154;
    const neighbor =
      withMetrics
        .filter((x) => x.s >= 0.14 && x.lum >= 0.06 && x.lum <= 0.45 && x.c.id !== anchorColor.id)
        .sort((a, b) => hueDistanceDeg(a.h, secondHue) - hueDistanceDeg(b.h, secondHue))[0]?.c.id ??
      158;
    const crispAccent =
      withMetrics
        .filter((x) => x.s >= 0.4 && hueDistanceDeg(x.h, (anchorHue + 52) % 360) <= 65)
        .sort((a, b) => b.s - a.s)[0]?.c.id ?? 14;
    const groundedShoe =
      withMetrics.filter((x) => x.lum <= 0.16 && x.h >= 15 && x.h <= 60)[0]?.c.id ?? 87;

    return {
      outfit: {
        outerwear: lockedOverrides.outerwear ?? neighbor,
        top: lockedOverrides.top ?? shirt,
        bottom:
          lockedOverrides.bottom ??
          (anchorSlot === 'bottom' ? anchorColor.id : (neighbor !== 158 ? 158 : anchorColor.id)),
        accent: lockedOverrides.accent ?? crispAccent,
        footwear: lockedOverrides.footwear ?? groundedShoe,
      },
    };
  }

  // 'accent-pop': Quiet neutral architectural base + one bold high-chroma pop in accent
  const lightNeutral =
    withMetrics.filter((x) => x.s < 0.14 && x.lum > 0.72).sort((a, b) => b.lum - a.lum)[0]?.c.id ??
    154;
  const slateNeutral =
    withMetrics.find((x) => x.s < 0.18 && x.lum >= 0.05 && x.lum <= 0.22)?.c.id ?? 158;
  const darkAnchor =
    withMetrics.find((x) => x.s < 0.35 && x.lum <= 0.09 && x.c.id !== slateNeutral)?.c.id ?? 130;
  const vividPops = withMetrics
    .filter((x) => x.s >= 0.55 && x.lum >= 0.07 && x.lum <= 0.65)
    .sort((a, b) => b.s - a.s);
  const popColor =
    vividPops[Math.abs(variantSeed) % Math.max(1, vividPops.length)]?.c.id ?? 29;

  return {
    outfit: {
      outerwear: lockedOverrides.outerwear ?? darkAnchor,
      top: lockedOverrides.top ?? lightNeutral,
      bottom: lockedOverrides.bottom ?? slateNeutral,
      accent: lockedOverrides.accent ?? popColor,
      footwear: lockedOverrides.footwear ?? 87,
    },
  };
}

export interface OutfitHarmonyReport {
  primaryLabel: string;
  primaryContrast: number;
  separationLabel: string;
  separationDeltaE: number;
  separationNote: string;
  matchedCombos: { combo: HydratedCombination; overlapCount: number; avgDeltaE: number }[];
}

/**
 * Evaluate primary garment contrast, upper/lower tonal separation, and closest 1933-1935 Wada plates.
 */
export function analyzeOutfitHarmony(
  outfit: Record<GarmentSlotKey, ColorItem>,
  allCombinations: HydratedCombination[],
  pieces: GarmentPieces = STYLE_PRESET_PIECES.suit
): OutfitHarmonyReport {
  const hasOuterwear = pieces.outerwear !== 'none';
  const upperAnchor = hasOuterwear ? outfit.outerwear : outfit.top;
  const primaryContrast = hasOuterwear
    ? getContrastRatio(outfit.outerwear.hex, outfit.top.hex)
    : getContrastRatio(outfit.top.hex, outfit.bottom.hex);

  const separationDeltaE = getDeltaE2000(upperAnchor.lab, outfit.bottom.lab);

  let separationNote = 'Crisp upper–lower separation';
  if (separationDeltaE < 2.2) {
    separationNote = hasOuterwear
      ? 'Coordinated matched suit tonal pairing'
      : 'Monochrome top & bottom pairing';
  } else if (separationDeltaE < 9) {
    separationNote = 'Close tonal zone — widen lightness contrast or unify fully';
  }

  const activeColors = hasOuterwear
    ? [outfit.outerwear, outfit.top, outfit.bottom, outfit.accent]
    : [outfit.top, outfit.bottom, outfit.accent, outfit.footwear];

  const uniqueOutfitColors = Array.from(
    new Map(activeColors.map((c) => [c.id, c])).values()
  );
  const outfitIds = new Set(uniqueOutfitColors.map((c) => c.id));

  const ranked = allCombinations
    .map((combo) => {
      let overlapCount = 0;
      for (const c of combo.colors) {
        if (outfitIds.has(c.id)) overlapCount++;
      }
      const totalMinDelta = uniqueOutfitColors.reduce((sum, oc) => {
        const minD = combo.colors.reduce(
          (best, cc) => Math.min(best, getDeltaE2000(oc.lab, cc.lab)),
          Infinity
        );
        return sum + minD;
      }, 0);
      const avgDeltaE = totalMinDelta / Math.max(1, uniqueOutfitColors.length);
      return { combo, overlapCount, avgDeltaE };
    })
    .sort((a, b) => {
      if (b.overlapCount !== a.overlapCount) return b.overlapCount - a.overlapCount;
      return a.avgDeltaE - b.avgDeltaE;
    })
    .slice(0, 3);

  return {
    primaryLabel: hasOuterwear ? 'Outerwear / Top Contrast' : 'Shirt / Bottom Contrast',
    primaryContrast,
    separationLabel: hasOuterwear ? 'Outerwear / Bottom Separation' : 'Top / Bottom Separation',
    separationDeltaE,
    separationNote,
    matchedCombos: ranked,
  };
}

export function generateMenswearCss(
  style: GarmentStyle,
  outfit: Record<GarmentSlotKey, ColorItem>,
  pieces: GarmentPieces = STYLE_PRESET_PIECES[style],
  materials: GarmentMaterials = getDefaultMaterialsForPieces(pieces),
  patterns: GarmentPatterns = DEFAULT_GARMENT_PATTERNS
): string {
  const activeSlots =
    pieces.outerwear === 'none'
      ? GARMENT_SLOT_ORDER.filter((s) => s !== 'outerwear')
      : GARMENT_SLOT_ORDER;
  const lines = activeSlots.map((slot) => {
    const c = outfit[slot];
    const matLabel = FABRIC_MATERIAL_META[materials[slot]].label;
    const patLabel =
      patterns[slot] !== 'solid' ? ` • ${FABRIC_PATTERN_META[patterns[slot]].label}` : '';
    return `  --garment-${slot}: ${c.hex}; /* ${getSlotDisplayLabel(slot, pieces)} (${matLabel}${patLabel}): ${c.name}${c.ja ? ` (${c.ja})` : ''} (#${c.id}) */`;
  });
  return `/* Sanzo Wada Menswear Palette — ${GARMENT_STYLE_META[style].label} */\n:root {\n${lines.join('\n')}\n}`;
}

export function buildMenswearLookbookSvg(params: {
  croquisSvgMarkup: string;
  style: GarmentStyle;
  pieces: GarmentPieces;
  materials: GarmentMaterials;
  patterns: GarmentPatterns;
  outfit: Record<GarmentSlotKey, ColorItem>;
  skinTone: SkinToneId;
  lighting: LightingPreset;
}): string {
  const {
    croquisSvgMarkup,
    style,
    pieces,
    materials,
    patterns,
    outfit,
    skinTone,
    lighting,
  } = params;
  const width = 880;
  const height = 720;
  const stageMeta = LIGHTING_PRESET_META[lighting];
  const skinMeta = SKIN_TONE_PRESETS[skinTone];
  const styleMeta = GARMENT_STYLE_META[style];

  // Clean inner SVG markup from live croquis element so nested <svg> renders cleanly
  const cleanCroquis = croquisSvgMarkup
    .replace(/^<svg[^>]*>/, '')
    .replace(/<\/svg>\s*$/, '');

  const activeSlots =
    pieces.outerwear === 'none'
      ? GARMENT_SLOT_ORDER.filter((s) => s !== 'outerwear')
      : GARMENT_SLOT_ORDER;

  const slotRowsSvg = activeSlots
    .map((slot, idx) => {
      const c = outfit[slot];
      const txt = getIdealTextColor(c.hex);
      const y = 175 + idx * 92;
      const cutName = escapeXml(getSlotDisplayLabel(slot, pieces));
      const matName = escapeXml(FABRIC_MATERIAL_META[materials[slot]].label);
      const patName =
        patterns[slot] !== 'solid'
          ? ` • ${escapeXml(FABRIC_PATTERN_META[patterns[slot]].label)}`
          : '';
      const colorTitle = escapeXml(`#${c.id} ${c.name}${c.ja ? ` (${c.ja})` : ''}`);
      return `
      <g transform="translate(420, ${y})">
        <rect width="412" height="76" rx="10" fill="${escapeXml(c.hex)}" stroke="#2B2B2B" stroke-opacity="0.18" />
        <text x="16" y="25" fill="${txt}" opacity="0.82" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="11">${cutName} • ${matName}${patName}</text>
        <text x="16" y="50" fill="${txt}" font-family="'Noto Serif JP', Georgia, serif" font-size="17" font-weight="700">${colorTitle}</text>
        <text x="396" y="50" fill="${txt}" opacity="0.85" text-anchor="end" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="12">${escapeXml(c.hex.toUpperCase())}</text>
      </g>`;
    })
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FAF7F2" />
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#2B2B2B" stroke-opacity="0.22" stroke-width="1.5" />

  <text x="48" y="64" font-family="'Cinzel', Georgia, serif" font-size="22" font-weight="bold" fill="#1C1A17" letter-spacing="1.5">SANZO WADA — MENSWEAR LOOKBOOK</text>
  <text x="48" y="92" font-family="'Noto Serif JP', Georgia, serif" font-size="13" fill="#6B665E">${escapeXml(styleMeta.label)} • ${escapeXml(skinMeta.label)} Complexion • ${escapeXml(stageMeta.label)}</text>

  <g transform="translate(790, 44)">
    <rect width="44" height="44" fill="none" stroke="#B93826" stroke-width="2" rx="5" />
    <text x="22" y="29" font-family="'Noto Serif JP', Georgia, serif" font-size="16" font-weight="900" fill="#B93826" text-anchor="middle">三造</text>
  </g>

  <rect x="48" y="120" width="340" height="530" rx="16" fill="${escapeXml(stageMeta.stageBgHex)}" stroke="#2B2B2B" stroke-opacity="0.16" />
  <svg x="58" y="138" width="320" height="490" viewBox="0 0 360 490">
    ${cleanCroquis}
  </svg>

  <text x="420" y="148" font-family="'Cinzel', Georgia, serif" font-size="14" font-weight="bold" fill="#B93826" letter-spacing="1">GARMENT PIGMENTS &amp; TEXTILES</text>
  ${slotRowsSvg}

  <line x1="48" y1="672" x2="832" y2="672" stroke="#D6CFC2" stroke-width="1" />
  <text x="48" y="690" font-family="'Noto Serif JP', Georgia, serif" font-size="11" fill="#888177">Haishoku Sōkan Archival Wardrobe Composition • sanzo-wada-colors</text>
</svg>`.trim();
}

export function downloadMenswearLookbookSvg(
  params: Parameters<typeof buildMenswearLookbookSvg>[0]
): void {
  const markup = buildMenswearLookbookSvg(params);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sanzo-wada-menswear-${params.style}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadMenswearLookbookPng(
  params: Parameters<typeof buildMenswearLookbookSvg>[0]
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('700 22px "Cinzel"'),
        document.fonts.load('400 12px "JetBrains Mono"'),
        document.fonts.ready,
      ]);
    } catch {
      // Ignore font load errors
    }
  }
  const markup = buildMenswearLookbookSvg(params);
  const blob = new Blob([markup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = 880 * scale;
    canvas.height = 720 * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, 880, 720);
    const pngBlob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG export failed'))), 'image/png')
    );
    const pngUrl = URL.createObjectURL(pngBlob);
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = `sanzo-wada-menswear-${params.style}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(pngUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function menswearOutfitToCombination(
  outfit: Record<GarmentSlotKey, ColorItem>,
  pieces: GarmentPieces
): HydratedCombination {
  const activeSlots =
    pieces.outerwear === 'none'
      ? GARMENT_SLOT_ORDER.filter((s) => s !== 'outerwear')
      : GARMENT_SLOT_ORDER;
  const uniqueColors = Array.from(
    new Map(activeSlots.map((s) => [outfit[s].id, outfit[s]])).values()
  );
  return createCustomCombination(uniqueColors);
}
