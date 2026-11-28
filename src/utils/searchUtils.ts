import { ColorItem, ColorSortOption, Combination } from '../types/color';
import { classifyColorTone, rgbToHsl } from './colorUtils';
import { analyzeColorPsychology, analyzePalettePsychology, MOOD_META } from './colorPsychology';
import { SEASON_MONTHS } from './paletteData';

function getSeasonForMonth(month?: number): string {
  if (!month) return '';
  for (const [season, months] of Object.entries(SEASON_MONTHS)) {
    if (months.includes(month)) return season;
  }
  return '';
}

function matchesMoodKeywords(mood: keyof typeof MOOD_META, token: string): boolean {
  const meta = MOOD_META[mood];
  return (
    mood.includes(token) ||
    meta.label.toLowerCase().includes(token) ||
    meta.keywords.some((kw) => kw === token)
  );
}

/**
 * Multi-term search for combinations: every whitespace-separated token must match
 * across plate ID, volume-prefixed key, seasonal metadata, mood psychology, or any color's attributes/tone.
 */
export function matchesCombinationTokens(combo: Combination, rawQuery: string): boolean {
  const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;

  const seasonName = combo.volume === 2 ? getSeasonForMonth(combo.month) : '';
  const comboKey = `v${combo.volume}-${combo.id}`;
  const comboMood = combo.mood ?? analyzePalettePsychology(combo).primaryMood;

  return tokens.every((token) => {
    const numToken = token.replace(/^#/, '');
    if (
      combo.id.toString() === numToken ||
      comboKey === numToken
    ) {
      return true;
    }
    if (combo.monthName?.toLowerCase().includes(token)) return true;
    if (combo.monthJa?.includes(token)) return true;
    if (combo.monthMeaning?.toLowerCase().includes(token)) return true;
    if (seasonName && seasonName.includes(token)) return true;
    if (matchesMoodKeywords(comboMood, token)) return true;

    return combo.colors.some(
      (color) =>
        color.name.toLowerCase().includes(token) ||
        Boolean(color.ja?.includes(token)) ||
        Boolean(color.reading?.toLowerCase().includes(token)) ||
        color.hex.toLowerCase().includes(token) ||
        classifyColorTone(color.rgb) === token
    );
  });
}

/**
 * Multi-term search for master swatches.
 */
export function matchesColorTokens(color: ColorItem, rawQuery: string): boolean {
  const tokens = rawQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  const colorMood = analyzeColorPsychology(color).primaryMood;

  return tokens.every((token) => {
    const numToken = token.replace(/^#/, '');
    return (
      color.name.toLowerCase().includes(token) ||
      Boolean(color.ja?.includes(token)) ||
      Boolean(color.reading?.toLowerCase().includes(token)) ||
      color.hex.toLowerCase().includes(token) ||
      color.id.toString() === numToken ||
      classifyColorTone(color.rgb) === token ||
      matchesMoodKeywords(colorMood, token)
    );
  });
}

/**
 * Sort master color swatches cleanly by ID, Hue spectrum, Lightness, Popularity, or Name.
 */
export function sortMasterColors(
  colors: ColorItem[],
  sortBy: ColorSortOption
): ColorItem[] {
  const list = [...colors];

  if (sortBy === 'id-asc') {
    return list.sort((a, b) => a.id - b.id);
  }

  if (sortBy === 'name') {
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (sortBy === 'popularity') {
    const count = (c: ColorItem) =>
      (c.combinations?.length || 0) + (c.vol2Cards?.length || 0);
    return list.sort((a, b) => count(b) - count(a) || a.id - b.id);
  }

  if (sortBy === 'lightness') {
    return list.sort((a, b) => {
      const la = rgbToHsl(a.rgb)[2];
      const lb = rgbToHsl(b.rgb)[2];
      return lb - la || a.id - b.id;
    });
  }

  // 'hue': group chromatic colors around the color wheel, placing neutrals at the end ordered light -> dark
  return list.sort((a, b) => {
    const [ha, sa, la] = rgbToHsl(a.rgb);
    const [hb, sb, lb] = rgbToHsl(b.rgb);
    const aNeutral = sa < 0.09;
    const bNeutral = sb < 0.09;
    if (aNeutral !== bNeutral) return aNeutral ? 1 : -1;
    if (aNeutral && bNeutral) return lb - la || a.id - b.id;
    return ha - hb || lb - la || a.id - b.id;
  });
}
