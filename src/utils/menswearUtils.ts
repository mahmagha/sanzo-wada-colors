import { ColorItem, Combination, HydratedCombination } from '../types/color';
import {
  getContrastRatio,
  getDeltaE2000,
  getLuminance,
  hexToRgb,
  rgbToHsl,
} from './colorUtils';

export type GarmentStyle = 'suit' | 'casual' | 'wafuku';
export type GarmentSlotKey = 'outerwear' | 'top' | 'bottom' | 'accent' | 'footwear';
export type GarmentOutfitIds = Record<GarmentSlotKey, number>;

export interface SavedMenswearOutfit {
  id: string;
  name: string;
  style: GarmentStyle;
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

export interface GarmentSlotMeta {
  key: GarmentSlotKey;
  label: string;
  hint: string;
}

export const GARMENT_STYLE_CONFIG: Record<
  GarmentStyle,
  {
    label: string;
    subtitle: string;
    slots: Record<GarmentSlotKey, GarmentSlotMeta>;
  }
> = {
  suit: {
    label: 'Tailored Suit',
    subtitle: 'Blazer, dress shirt, trousers, tie & oxfords',
    slots: {
      outerwear: { key: 'outerwear', label: 'Jacket / Blazer', hint: 'Primary structure (~45%)' },
      top: { key: 'top', label: 'Dress Shirt', hint: 'Collar frame & contrast' },
      bottom: { key: 'bottom', label: 'Trousers', hint: 'Foundation anchor (~35%)' },
      accent: { key: 'accent', label: 'Tie & Pocket Sq.', hint: 'Focal accent (~5–10%)' },
      footwear: { key: 'footwear', label: 'Belt & Oxfords', hint: 'Grounding trim (~10%)' },
    },
  },
  casual: {
    label: 'Casual Coat & Knit',
    subtitle: 'Overshirt coat, crewneck knit, chinos, scarf & boots',
    slots: {
      outerwear: { key: 'outerwear', label: 'Chore Coat / Jacket', hint: 'Outer layer (~40%)' },
      top: { key: 'top', label: 'Knit / Crewneck', hint: 'Mid-layer texture' },
      bottom: { key: 'bottom', label: 'Chinos / Denim', hint: 'Lower anchor (~35%)' },
      accent: { key: 'accent', label: 'Scarf / Watch Trim', hint: 'Collar highlight (~10%)' },
      footwear: { key: 'footwear', label: 'Belt & Boots', hint: 'Leather / sole finish' },
    },
  },
  wafuku: {
    label: 'Haori & Kimono',
    subtitle: 'Traditional Japanese menswear: haori, kimono, hakama, obi & zōri',
    slots: {
      outerwear: { key: 'outerwear', label: 'Haori Coat (羽織)', hint: 'Outer mantle layer' },
      top: { key: 'top', label: 'Kimono Robe (着物)', hint: 'Collar & sleeve core' },
      bottom: { key: 'bottom', label: 'Hakama (袴)', hint: 'Pleated lower silhouette' },
      accent: { key: 'accent', label: 'Obi & Cord (角帯・羽織紐)', hint: 'Waist & chest cord accent' },
      footwear: { key: 'footwear', label: 'Tabi & Zōri (足袋・草履)', hint: 'Traditional footwear' },
    },
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
    name: 'Tyrian Navy & Cream',
    note: 'Crisp navy tailoring anchored by slate grey, white shirting, and carmine silk',
    style: 'suit',
    outfit: { ...DEFAULT_MENSWEAR_OUTFIT },
  },
  {
    id: 'autumn-moss',
    name: 'Autumn Slate Olive',
    note: 'Earthy forest olive chore coat over warm ivory knit and raw sienna trim',
    style: 'casual',
    outfit: {
      outerwear: 110, // Deep Slate Olive
      top: 42, // Ivory Buff
      bottom: 82, // Deep Grayish Olive
      accent: 14, // Raw Sienna
      footwear: 87, // Vandyke Brown
    },
  },
  {
    id: 'kyoto-haori',
    name: 'Kyoto Indigo Haori',
    note: 'Traditional Wafuku harmony: slate coat, violet-blue kimono, indigo hakama, vermilion cord',
    style: 'wafuku',
    outfit: {
      outerwear: 158, // Slate Color
      top: 128, // Violet Blue
      bottom: 132, // Deep Indigo
      accent: 8, // Grenadine Pink / 洗朱
      footwear: 154, // White Tabi
    },
  },
  {
    id: 'mineral-flannel',
    name: 'Mineral Flannel & Indigo',
    note: 'Soft grey tailoring paired with pale ice-blue shirt and Antwerp blue silk accent',
    style: 'suit',
    outfit: {
      outerwear: 156, // Mineral Gray
      top: 171, // Pale King's Blue - B
      bottom: 132, // Deep Indigo
      accent: 123, // Antwerp Blue
      footwear: 159, // Black
    },
  },
  {
    id: 'tobacco-tweed',
    name: 'Tobacco Suede & Salvia',
    note: 'Heritage brown coat over muted powder-blue knit and charcoal wool trousers',
    style: 'casual',
    outfit: {
      outerwear: 86, // Mars Brown/Tobacco
      top: 114, // Salvia Blue
      bottom: 162, // Dull Purplish Black
      accent: 59, // Olive Ocher
      footwear: 85, // Madder Brown
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

  // Sort dark -> light
  const byDark = [...scored].sort((a, b) => a.lum - b.lum);
  const byLight = [...scored].sort((a, b) => b.lum - a.lum);
  const byChroma = [...scored].sort((a, b) => b.s - a.s);

  const top = byLight[0].c.id;
  const bottom = byDark[0].c.id;

  // Pick a structured mid-dark coat color distinct from shirt if possible
  const outerwearCandidate =
    byDark.find((x) => x.c.id !== top && x.c.id !== bottom)?.c.id ??
    (palette.length >= 2 ? byDark.find((x) => x.c.id !== top)?.c.id : undefined) ??
    byDark[0].c.id;

  // Pick highest chroma swatch distinct from large garments for tie/scarf/obi accent
  const accent =
    byChroma.find((x) => x.c.id !== top && x.c.id !== outerwearCandidate)?.c.id ??
    byChroma.find((x) => x.c.id !== top)?.c.id ??
    byChroma[0].c.id;

  // Ground footwear with the darkest leather/charcoal swatch available
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
  jacketShirtContrast: number;
  jacketTrousersDeltaE: number;
  trousersNote: string;
  matchedCombos: { combo: HydratedCombination; overlapCount: number; avgDeltaE: number }[];
}

/**
 * Evaluate contrast, jacket/trouser tonal separation, and closest Sanzo Wada archival plates.
 */
export function analyzeOutfitHarmony(
  outfit: Record<GarmentSlotKey, ColorItem>,
  allCombinations: HydratedCombination[]
): OutfitHarmonyReport {
  const jacketShirtContrast = getContrastRatio(outfit.outerwear.hex, outfit.top.hex);
  const jacketTrousersDeltaE = getDeltaE2000(outfit.outerwear.lab, outfit.bottom.lab);

  let trousersNote = 'Crisp jacket–trouser separation';
  if (jacketTrousersDeltaE < 2.2) {
    trousersNote = 'Coordinated matched suit tonal pairing';
  } else if (jacketTrousersDeltaE < 9) {
    trousersNote = 'Close tonal match — widen contrast or lean full suit match';
  }

  const uniqueOutfitColors = Array.from(
    new Map(
      [outfit.outerwear, outfit.top, outfit.bottom, outfit.accent].map((c) => [c.id, c])
    ).values()
  );
  const outfitIds = new Set(uniqueOutfitColors.map((c) => c.id));

  const ranked = allCombinations
    .map((combo) => {
      let overlapCount = 0;
      for (const c of combo.colors) {
        if (outfitIds.has(c.id)) overlapCount++;
      }
      // Compute mean perceptual proximity from outfit swatches to nearest color in combo
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
    jacketShirtContrast,
    jacketTrousersDeltaE,
    trousersNote,
    matchedCombos: ranked,
  };
}

export function generateMenswearCss(
  style: GarmentStyle,
  outfit: Record<GarmentSlotKey, ColorItem>
): string {
  const meta = GARMENT_STYLE_CONFIG[style];
  const lines = GARMENT_SLOT_ORDER.map((slot) => {
    const c = outfit[slot];
    return `  --garment-${slot}: ${c.hex}; /* ${meta.slots[slot].label}: ${c.name}${c.ja ? ` (${c.ja})` : ''} (#${c.id}) */`;
  });
  return `/* Sanzo Wada Menswear Palette — ${meta.label} */\n:root {\n${lines.join('\n')}\n}`;
}
