import {
  ColorSortOption,
  PaletteSizeFilter,
  SeasonFilter,
  SortOption,
  ToneFilter,
  ViewMode,
  VolumeFilter,
} from '../types/color';

export interface UrlAppState {
  viewMode: ViewMode;
  volumeFilter: VolumeFilter;
  seasonFilter: SeasonFilter;
  monthFilter: number | 'all';
  sizeFilter: PaletteSizeFilter;
  toneFilter: ToneFilter;
  sortBy: SortOption;
  colorSort: ColorSortOption;
  swatchId: number | null;
  searchQuery: string;
  onlyFavorites: boolean;
  compareKeys: string[];
  comboKey: string | null;
  colorId: number | null;
}

const VALID_SEASONS = new Set<SeasonFilter>(['all', 'spring', 'summer', 'autumn', 'winter']);
const VALID_TONES = new Set<ToneFilter>([
  'all',
  'warm',
  'cool',
  'earthy',
  'pastel',
  'deep',
  'neutral',
]);
const VALID_SORTS = new Set<SortOption>([
  'number-asc',
  'number-desc',
  'contrast-desc',
  'popularity',
]);
const VALID_COLOR_SORTS = new Set<ColorSortOption>([
  'id-asc',
  'hue',
  'lightness',
  'popularity',
  'name',
]);
const COMBO_KEY_RE = /^v[12]-\d+$/;

export function parseUrlState(search: string): UrlAppState {
  const params = new URLSearchParams(search);

  const viewParam = params.get('view');
  const viewMode: ViewMode = viewParam === 'colors' ? 'colors' : 'combinations';

  const volParam = params.get('vol');
  const volumeFilter: VolumeFilter = volParam === '1' ? 1 : volParam === '2' ? 2 : 'all';

  const seasonParam = params.get('season') as SeasonFilter | null;
  const seasonFilter: SeasonFilter =
    seasonParam && VALID_SEASONS.has(seasonParam) ? seasonParam : 'all';

  const monthRaw = params.get('month');
  const monthParsed = monthRaw ? Number(monthRaw) : NaN;
  const monthFilter: number | 'all' =
    Number.isInteger(monthParsed) && monthParsed >= 1 && monthParsed <= 12
      ? monthParsed
      : 'all';

  const sizeRaw = params.get('size');
  const sizeParsed = sizeRaw ? Number(sizeRaw) : NaN;
  const sizeFilter: PaletteSizeFilter =
    sizeParsed === 2 || sizeParsed === 3 || sizeParsed === 4 || sizeParsed === 5
      ? sizeParsed
      : 'all';

  const toneParam = params.get('tone') as ToneFilter | null;
  const toneFilter: ToneFilter = toneParam && VALID_TONES.has(toneParam) ? toneParam : 'all';

  const sortParam = params.get('sort') as SortOption | null;
  const sortBy: SortOption = sortParam && VALID_SORTS.has(sortParam) ? sortParam : 'number-asc';

  const colorSortParam = params.get('csort') as ColorSortOption | null;
  const colorSort: ColorSortOption =
    colorSortParam && VALID_COLOR_SORTS.has(colorSortParam) ? colorSortParam : 'id-asc';

  const swatchRaw = params.get('swatch');
  const swatchParsed = swatchRaw ? Number(swatchRaw) : NaN;
  const swatchId = Number.isInteger(swatchParsed) && swatchParsed > 0 ? swatchParsed : null;

  const searchQuery = params.get('q') || '';
  const onlyFavorites = params.get('fav') === '1';

  const compareRaw = params.get('compare') || '';
  const compareKeys = Array.from(
    new Set(
      compareRaw
        .split(',')
        .map((s) => s.trim())
        .filter((s) => COMBO_KEY_RE.test(s))
    )
  ).slice(0, 3);

  const comboParam = params.get('combo');
  const comboKey = comboParam && COMBO_KEY_RE.test(comboParam) ? comboParam : null;

  const colorRaw = params.get('color');
  const colorParsed = colorRaw ? Number(colorRaw) : NaN;
  const colorId = Number.isInteger(colorParsed) && colorParsed > 0 ? colorParsed : null;

  return {
    viewMode,
    volumeFilter,
    seasonFilter,
    monthFilter,
    sizeFilter,
    toneFilter,
    sortBy,
    colorSort,
    swatchId,
    searchQuery,
    onlyFavorites,
    compareKeys,
    comboKey,
    colorId,
  };
}

export function serializeUrlState(state: UrlAppState): string {
  const params = new URLSearchParams();

  if (state.viewMode !== 'combinations') params.set('view', state.viewMode);
  if (state.volumeFilter !== 'all') params.set('vol', String(state.volumeFilter));
  if (state.seasonFilter !== 'all') params.set('season', state.seasonFilter);
  if (state.monthFilter !== 'all') params.set('month', String(state.monthFilter));
  if (state.sizeFilter !== 'all') params.set('size', String(state.sizeFilter));
  if (state.toneFilter !== 'all') params.set('tone', state.toneFilter);
  if (state.sortBy !== 'number-asc') params.set('sort', state.sortBy);
  if (state.colorSort !== 'id-asc') params.set('csort', state.colorSort);
  if (state.swatchId !== null) params.set('swatch', String(state.swatchId));
  if (state.searchQuery.trim()) params.set('q', state.searchQuery.trim());
  if (state.onlyFavorites) params.set('fav', '1');
  if (state.compareKeys.length > 0) params.set('compare', state.compareKeys.slice(0, 3).join(','));
  if (state.comboKey) params.set('combo', state.comboKey);
  if (state.colorId !== null) params.set('color', String(state.colorId));

  const query = params.toString();
  return query ? `?${query}` : '';
}
