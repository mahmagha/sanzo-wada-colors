import { ColorItem, HydratedCombination, RawCombination, SeasonFilter } from '../types/color';
import { getMaxPaletteContrast } from './colorUtils';

export const SEASON_MONTHS: Record<Exclude<SeasonFilter, 'all'>, number[]> = {
  spring: [3, 4, 5],
  summer: [6, 7, 8],
  autumn: [9, 10, 11],
  winter: [12, 1, 2],
};

export const MONTH_OPTIONS = [
  { month: 1, name: 'January', ja: '睦月', reading: 'Mutsuki', season: 'winter' as const },
  { month: 2, name: 'February', ja: '如月', reading: 'Kisaragi', season: 'winter' as const },
  { month: 3, name: 'March', ja: '弥生', reading: 'Yayoi', season: 'spring' as const },
  { month: 4, name: 'April', ja: '卯月', reading: 'Uzuki', season: 'spring' as const },
  { month: 5, name: 'May', ja: '皐月', reading: 'Satsuki', season: 'spring' as const },
  { month: 6, name: 'June', ja: '水無月', reading: 'Minazuki', season: 'summer' as const },
  { month: 7, name: 'July', ja: '文月', reading: 'Fumizuki', season: 'summer' as const },
  { month: 8, name: 'August', ja: '葉月', reading: 'Hazuki', season: 'summer' as const },
  { month: 9, name: 'September', ja: '長月', reading: 'Nagatsuki', season: 'autumn' as const },
  { month: 10, name: 'October', ja: '神無月', reading: 'Kannazuki', season: 'autumn' as const },
  { month: 11, name: 'November', ja: '霜月', reading: 'Shimotsuki', season: 'autumn' as const },
  { month: 12, name: 'December', ja: '師走', reading: 'Shiwasu', season: 'winter' as const },
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
