import { ColorItem, Combination, HydratedCombination } from '../types/color';
import {
  getContrastRatio,
  getDeltaE2000,
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

export interface GarmentPieces {
  outerwear: OuterwearCut;
  top: TopCut;
  bottom: BottomCut;
  accent: AccentCut;
  footwear: FootwearCut;
}

export interface SavedMenswearOutfit {
  id: string;
  name: string;
  style: GarmentStyle;
  pieces?: GarmentPieces;
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
  note: string;
  style: GarmentStyle;
  outfit: GarmentOutfitIds;
}

export const MENSWEAR_PRESETS: MenswearPreset[] = [
  {
    id: 'showa-navy',
    name: 'Tyrian Suit',
    note: 'Crisp navy blazer tailored over white shirting, slate trousers & carmine silk',
    style: 'suit',
    outfit: { ...DEFAULT_MENSWEAR_OUTFIT },
  },
  {
    id: 'salvia-oxford',
    name: 'Salvia & Chinos',
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
 * Intelligently map any Sanzo Wada palette (2 to 7 colors) onto the 5 male garment slots.
 */
export function mapComboToGarmentOutfit(combo: Combination): GarmentOutfitIds {
  const palette = combo.colors;
  if (palette.length === 0) return { ...DEFAULT_MENSWEAR_OUTFIT };

  const scored = palette.map((c) => {
    const [, s, l] = rgbToHsl(c.rgb);
    const lum = getLuminance(...hexToRgb(c.hex));
    return { c, s, l, lum };
  });

  const byDark = [...scored].sort((a, b) => a.lum - b.lum);
  const byLight = [...scored].sort((a, b) => b.lum - a.lum);
  const byChroma = [...scored].sort((a, b) => b.s - a.s);

  const top = byLight[0].c.id;
  const bottom = byDark[0].c.id;

  const outerwearCandidate =
    byDark.find((x) => x.c.id !== top && x.c.id !== bottom)?.c.id ??
    (palette.length >= 2 ? byDark.find((x) => x.c.id !== top)?.c.id : undefined) ??
    byDark[0].c.id;

  const accent =
    byChroma.find((x) => x.c.id !== top && x.c.id !== outerwearCandidate)?.c.id ??
    byChroma.find((x) => x.c.id !== top)?.c.id ??
    byChroma[0].c.id;

  const footwear =
    byDark.find((x) => x.c.id !== outerwearCandidate && x.c.id !== top)?.c.id ??
    byDark[0].c.id;

  return {
    outerwear: outerwearCandidate,
    top,
    bottom,
    accent,
    footwear,
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
  pieces: GarmentPieces = STYLE_PRESET_PIECES[style]
): string {
  const activeSlots =
    pieces.outerwear === 'none'
      ? GARMENT_SLOT_ORDER.filter((s) => s !== 'outerwear')
      : GARMENT_SLOT_ORDER;
  const lines = activeSlots.map((slot) => {
    const c = outfit[slot];
    return `  --garment-${slot}: ${c.hex}; /* ${getSlotDisplayLabel(slot, pieces)}: ${c.name}${c.ja ? ` (${c.ja})` : ''} (#${c.id}) */`;
  });
  return `/* Sanzo Wada Menswear Palette — ${GARMENT_STYLE_META[style].label} */\n:root {\n${lines.join('\n')}\n}`;
}
