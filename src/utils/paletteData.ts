import { ColorItem, HydratedCombination, RawCombination, SeasonFilter } from '../types/color';
import { getMaxPaletteContrast } from './colorUtils';

export const SEASON_MONTHS: Record<Exclude<SeasonFilter, 'all'>, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

export const MONTH_OPTIONS = [
  { month: 1, name: 'January', ja: '睦月', reading: 'Mutsuki', season: 'winter' as const, motif: 'New Year pine, plum blossoms & crisp winter white' },
  { month: 2, name: 'February', ja: '如月', reading: 'Kisaragi', season: 'winter' as const, motif: 'Layered robes against late-winter frost' },
  { month: 3, name: 'March', ja: '弥生', reading: 'Yayoi', season: 'spring' as const, motif: 'First green shoots, peach petals & melting snow' },
  { month: 4, name: 'April', ja: '卯月', reading: 'Uzuki', season: 'spring' as const, motif: 'Deutzia blossoms, cherry haze & fresh leaves' },
  { month: 5, name: 'May', ja: '皐月', reading: 'Satsuki', season: 'spring' as const, motif: 'Young rice seedlings, iris & sunlit greens' },
  { month: 6, name: 'June', ja: '水無月', reading: 'Minazuki', season: 'summer' as const, motif: 'Early summer rain, hydrangea & cool waters' },
  { month: 7, name: 'July', ja: '文月', reading: 'Fumizuki', season: 'summer' as const, motif: 'Evening festivals, bamboo & deep indigo' },
  { month: 8, name: 'August', ja: '葉月', reading: 'Hazuki', season: 'summer' as const, motif: 'Lush midsummer foliage & late-summer warmth' },
  { month: 9, name: 'September', ja: '長月', reading: 'Nagatsuki', season: 'autumn' as const, motif: 'Long autumn nights, bush clover & harvest gold' },
  { month: 10, name: 'October', ja: '神無月', reading: 'Kannazuki', season: 'autumn' as const, motif: 'Turning maples, russet earth & deep persimmon' },
  { month: 11, name: 'November', ja: '霜月', reading: 'Shimotsuki', season: 'autumn' as const, motif: 'First morning frost, muted slate & cedar' },
  { month: 12, name: 'December', ja: '師走', reading: 'Shiwasu', season: 'winter' as const, motif: 'Year-end stillness, evergreen & charcoal ink' },
];

export const ARCHIVAL_NOTES = [
  {
    title: 'Haishoku Sōkan Vol. 1 (配色総鑑, 1933)',
    body: 'Compiled by painter and costume designer Sanzo Wada (1883–1967) with the Japan Standard Color Association, presenting 348 two-, three-, and four-color harmonies designed to liberate Japanese textile and graphic design from rigid mathematical color wheels.',
  },
  {
    title: 'Haishoku Sōkan B-hen Vol. 2 (1934–1935)',
    body: 'The seasonal companion volume expands the palette to 171 master pigments across 72 combinations—6 plates for each of the 12 traditional Japanese months (睦月 Mutsuki through 師走 Shiwasu)—paired in 3- to 7-color compositions.',
  },
  {
    title: 'Ridgway & Bilingual Nomenclature',
    body: 'English swatch names derive from Robert Ridgway’s 1912 Color Standards and Color Nomenclature alongside Wada’s Japanese color vocabulary (e.g. Toki-iro 鴾色, Ai-iro 藍色). Verified Japanese names are enriched incrementally without inventing unverified historical titles.',
  },
];

/**
 * Hydrate normalized combinations from master color records and precompute sort metrics once.
 */
export function hydrateCombinations(
  rawCombinations: RawCombination[],
  masterColors: ColorItem[]
): HydratedCombination[] {
  const colorById = new Map<number, ColorItem>(masterColors.map((c) => [c.id, c]));

  return rawCombinations.map((raw) => {
    const colors = raw.colorIds
      .map((id) => colorById.get(id))
      .filter((c): c is ColorItem => Boolean(c));

    const maxContrast = getMaxPaletteContrast({ colors });
    const popularity = colors.reduce(
      (sum, item) => sum + (item.combinations?.length || 0) + (item.vol2Cards?.length || 0),
      0
    );

    return {
      id: raw.id,
      volume: raw.volume,
      size: raw.size,
      month: raw.month,
      monthName: raw.monthName,
      monthJa: raw.monthJa,
      monthMeaning: raw.monthMeaning,
      cardInMonth: raw.cardInMonth,
      colors,
      maxContrast,
      popularity,
    };
  });
}
