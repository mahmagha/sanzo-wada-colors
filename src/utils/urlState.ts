import {
  ColorSortOption,
  ColorsLayout,
  MoodFilter,
  PaletteSizeFilter,
  SeasonFilter,
  SortOption,
  ToneFilter,
  ViewMode,
  VolumeFilter,
} from '../types/color';
import {
  DEFAULT_MENSWEAR_OUTFIT,
  DEFAULT_PATTERN_COLORS,
  GARMENT_SLOT_ORDER,
  GarmentMaterials,
  GarmentPatternColorIds,
  GarmentPatterns,
  GarmentPieces,
  GarmentStyle,
  LightingPreset,
  OUTERWEAR_CUTS,
  TOP_CUTS,
  BOTTOM_CUTS,
  ACCENT_CUTS,
  FOOTWEAR_CUTS,
  FABRIC_MATERIAL_META,
  FABRIC_PATTERN_META,
  LIGHTING_PRESET_META,
  SKIN_TONE_PRESETS,
  SkinToneId,
  serializeOutfitIds,
  STYLE_PRESET_PIECES,
  getDefaultMaterialsForPieces,
} from './menswearUtils';

export interface UrlAppState {
  viewMode: ViewMode;
  colorsLayout: ColorsLayout;
  hasKanjiOnly: boolean;
  volumeFilter: VolumeFilter;
  seasonFilter: SeasonFilter;
  monthFilter: number | 'all';
  sizeFilter: PaletteSizeFilter;
  toneFilter: ToneFilter;
  moodFilter: MoodFilter;
  sortBy: SortOption;
  colorSort: ColorSortOption;
  swatchId: number | null;
  searchQuery: string;
  onlyFavorites: boolean;
  compareKeys: string[];
  comboKey: string | null;
  mixIds: number[];
  colorId: number | null;
  menswearStyle: GarmentStyle;
  menswearIds: number[];
  menswearSkin: SkinToneId;
  menswearLighting: LightingPreset;
  menswearPieces: GarmentPieces | null;
  menswearMaterials: GarmentMaterials | null;
  menswearPatterns: GarmentPatterns | null;
  menswearPatternColors: GarmentPatternColorIds | null;
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
const VALID_MOODS = new Set<MoodFilter>([
  'all',
  'serene',
  'grounded',
  'luminous',
  'energetic',
  'contemplative',
  'dramatic',
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
function isValidCompareKey(key: string): boolean {
  if (COMBO_KEY_RE.test(key)) return true;
  if (!key.startsWith('mix-')) return false;
  const ids = key.slice(4).split('-').map((s) => Number(s));
  return ids.length >= 2 && ids.length <= 6 && ids.every((n) => Number.isInteger(n) && n >= 1 && n <= 171);
}
const VALID_MENSWEAR_STYLES = new Set<GarmentStyle>([
  'suit',
  'smart-casual',
  'overcoat',
  'streetwear',
  'resort',
  'wafuku',
]);
const DEFAULT_OUTFIT_PARAM = serializeOutfitIds(DEFAULT_MENSWEAR_OUTFIT).join(',');

const OUTERWEAR_SET = new Set<string>(OUTERWEAR_CUTS.map((x) => x.id));
const TOP_SET = new Set<string>(TOP_CUTS.map((x) => x.id));
const BOTTOM_SET = new Set<string>(BOTTOM_CUTS.map((x) => x.id));
const ACCENT_SET = new Set<string>(ACCENT_CUTS.map((x) => x.id));
const FOOTWEAR_SET = new Set<string>(FOOTWEAR_CUTS.map((x) => x.id));

export const DEFAULT_URL_STATE: UrlAppState = {
  viewMode: 'combinations',
  colorsLayout: 'grid',
  hasKanjiOnly: false,
  volumeFilter: 'all',
  seasonFilter: 'all',
  monthFilter: 'all',
  sizeFilter: 'all',
  toneFilter: 'all',
  moodFilter: 'all',
  sortBy: 'number-asc',
  colorSort: 'id-asc',
  swatchId: null,
  searchQuery: '',
  onlyFavorites: false,
  compareKeys: [],
  comboKey: null,
  mixIds: [],
  colorId: null,
  menswearStyle: 'suit',
  menswearIds: [],
  menswearSkin: 'warm-ivory',
  menswearLighting: 'daylight',
  menswearPieces: null,
  menswearMaterials: null,
  menswearPatterns: null,
  menswearPatternColors: null,
};

export function parseUrlState(search: string): UrlAppState {
  const params = new URLSearchParams(search);

  const viewParam = params.get('view');
  const layoutParam = params.get('layout');
  const viewMode: ViewMode =
    viewParam === 'wheel' || (viewParam === 'colors' && layoutParam === 'wheel')
      ? 'wheel'
      : viewParam === 'colors'
      ? 'colors'
      : viewParam === 'menswear'
      ? 'menswear'
      : 'combinations';

  const colorsLayout: ColorsLayout = layoutParam === 'map' ? 'map' : 'grid';

  const hasKanjiOnly = params.get('kanji') === '1';

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

  const moodParam = params.get('mood') as MoodFilter | null;
  const moodFilter: MoodFilter = moodParam && VALID_MOODS.has(moodParam) ? moodParam : 'all';

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
        .filter((s) => isValidCompareKey(s))
    )
  ).slice(0, 3);

  const comboParam = params.get('combo');
  const comboKey = comboParam && COMBO_KEY_RE.test(comboParam) ? comboParam : null;

  const mixRaw = params.get('mix') || '';
  const parsedMix = Array.from(
    new Set(
      mixRaw
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isInteger(n) && n >= 1 && n <= 171)
    )
  ).slice(0, 6);
  const mixIds = parsedMix.length >= 2 ? parsedMix : [];

  const colorRaw = params.get('color');
  const colorParsed = colorRaw ? Number(colorRaw) : NaN;
  const colorId = Number.isInteger(colorParsed) && colorParsed > 0 ? colorParsed : null;

  const mstyleRaw = params.get('mstyle');
  const menswearStyle: GarmentStyle =
    mstyleRaw === 'casual'
      ? 'smart-casual'
      : mstyleRaw && VALID_MENSWEAR_STYLES.has(mstyleRaw as GarmentStyle)
      ? (mstyleRaw as GarmentStyle)
      : 'suit';

  const outfitRaw = params.get('outfit') || '';
  const parsedOutfit = outfitRaw
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 171)
    .slice(0, 5);
  const menswearIds = parsedOutfit.length === 5 ? parsedOutfit : [];

  const skinRaw = params.get('mskin') as SkinToneId | null;
  const menswearSkin: SkinToneId =
    skinRaw && skinRaw in SKIN_TONE_PRESETS ? skinRaw : 'warm-ivory';

  const lightRaw = params.get('mlight') as LightingPreset | null;
  const menswearLighting: LightingPreset =
    lightRaw && lightRaw in LIGHTING_PRESET_META ? lightRaw : 'daylight';

  const piecesParts = (params.get('mpieces') || '').split(',').map((s) => s.trim());
  const menswearPieces: GarmentPieces | null =
    piecesParts.length === 5 &&
    OUTERWEAR_SET.has(piecesParts[0]) &&
    TOP_SET.has(piecesParts[1]) &&
    BOTTOM_SET.has(piecesParts[2]) &&
    ACCENT_SET.has(piecesParts[3]) &&
    FOOTWEAR_SET.has(piecesParts[4])
      ? {
          outerwear: piecesParts[0] as GarmentPieces['outerwear'],
          top: piecesParts[1] as GarmentPieces['top'],
          bottom: piecesParts[2] as GarmentPieces['bottom'],
          accent: piecesParts[3] as GarmentPieces['accent'],
          footwear: piecesParts[4] as GarmentPieces['footwear'],
        }
      : null;

  const matsParts = (params.get('mmats') || '').split(',').map((s) => s.trim());
  const menswearMaterials: GarmentMaterials | null =
    matsParts.length === 5 && matsParts.every((m) => m in FABRIC_MATERIAL_META)
      ? {
          outerwear: matsParts[0] as GarmentMaterials['outerwear'],
          top: matsParts[1] as GarmentMaterials['top'],
          bottom: matsParts[2] as GarmentMaterials['bottom'],
          accent: matsParts[3] as GarmentMaterials['accent'],
          footwear: matsParts[4] as GarmentMaterials['footwear'],
        }
      : null;

  const patsParts = (params.get('mpats') || '').split(',').map((s) => s.trim());
  const menswearPatterns: GarmentPatterns | null =
    patsParts.length === 5 && patsParts.every((p) => p in FABRIC_PATTERN_META)
      ? {
          outerwear: patsParts[0] as GarmentPatterns['outerwear'],
          top: patsParts[1] as GarmentPatterns['top'],
          bottom: patsParts[2] as GarmentPatterns['bottom'],
          accent: patsParts[3] as GarmentPatterns['accent'],
          footwear: patsParts[4] as GarmentPatterns['footwear'],
        }
      : null;

  const pcolParts = (params.get('mpcols') || '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isInteger(n) && n >= 1 && n <= 171);
  const menswearPatternColors: GarmentPatternColorIds | null =
    pcolParts.length === 5
      ? {
          outerwear: pcolParts[0],
          top: pcolParts[1],
          bottom: pcolParts[2],
          accent: pcolParts[3],
          footwear: pcolParts[4],
        }
      : null;

  return {
    viewMode,
    colorsLayout,
    hasKanjiOnly,
    volumeFilter,
    seasonFilter,
    monthFilter,
    sizeFilter,
    toneFilter,
    moodFilter,
    sortBy,
    colorSort,
    swatchId,
    searchQuery,
    onlyFavorites,
    compareKeys,
    comboKey,
    mixIds,
    colorId,
    menswearStyle,
    menswearIds,
    menswearSkin,
    menswearLighting,
    menswearPieces,
    menswearMaterials,
    menswearPatterns,
    menswearPatternColors,
  };
}

export function serializeUrlState(state: UrlAppState): string {
  const params = new URLSearchParams();

  if (state.viewMode !== 'combinations') params.set('view', state.viewMode);
  if (state.colorsLayout !== 'grid') params.set('layout', state.colorsLayout);
  if (state.hasKanjiOnly) params.set('kanji', '1');
  if (state.volumeFilter !== 'all') params.set('vol', String(state.volumeFilter));
  if (state.seasonFilter !== 'all') params.set('season', state.seasonFilter);
  if (state.monthFilter !== 'all') params.set('month', String(state.monthFilter));
  if (state.sizeFilter !== 'all') params.set('size', String(state.sizeFilter));
  if (state.toneFilter !== 'all') params.set('tone', state.toneFilter);
  if (state.moodFilter !== 'all') params.set('mood', state.moodFilter);
  if (state.sortBy !== 'number-asc') params.set('sort', state.sortBy);
  if (state.colorSort !== 'id-asc') params.set('csort', state.colorSort);
  if (state.swatchId !== null) params.set('swatch', String(state.swatchId));
  if (state.searchQuery.trim()) params.set('q', state.searchQuery.trim());
  if (state.onlyFavorites) params.set('fav', '1');
  if (state.compareKeys.length > 0) params.set('compare', state.compareKeys.slice(0, 3).join(','));
  if (state.comboKey) params.set('combo', state.comboKey);
  if (state.mixIds.length >= 2) params.set('mix', state.mixIds.slice(0, 6).join(','));
  if (state.colorId !== null) params.set('color', String(state.colorId));
  if (state.menswearStyle !== 'suit') params.set('mstyle', state.menswearStyle);
  if (state.menswearIds.length === 5 && state.menswearIds.join(',') !== DEFAULT_OUTFIT_PARAM) {
    params.set('outfit', state.menswearIds.join(','));
  }
  if (state.menswearSkin !== 'warm-ivory') params.set('mskin', state.menswearSkin);
  if (state.menswearLighting !== 'daylight') params.set('mlight', state.menswearLighting);
  if (state.menswearPieces) {
    const defPieces = STYLE_PRESET_PIECES[state.menswearStyle];
    const pStr = GARMENT_SLOT_ORDER.map((s) => state.menswearPieces![s]).join(',');
    const dStr = GARMENT_SLOT_ORDER.map((s) => defPieces[s]).join(',');
    if (pStr !== dStr) params.set('mpieces', pStr);
  }
  if (state.menswearMaterials) {
    const basePieces = state.menswearPieces || STYLE_PRESET_PIECES[state.menswearStyle];
    const defMats = getDefaultMaterialsForPieces(basePieces);
    const mStr = GARMENT_SLOT_ORDER.map((s) => state.menswearMaterials![s]).join(',');
    const dStr = GARMENT_SLOT_ORDER.map((s) => defMats[s]).join(',');
    if (mStr !== dStr) params.set('mmats', mStr);
  }
  if (state.menswearPatterns) {
    const hasCustomPat = GARMENT_SLOT_ORDER.some((s) => state.menswearPatterns![s] !== 'solid');
    if (hasCustomPat) {
      params.set(
        'mpats',
        GARMENT_SLOT_ORDER.map((s) => state.menswearPatterns![s]).join(',')
      );
      if (state.menswearPatternColors) {
        const pcStr = GARMENT_SLOT_ORDER.map((s) => state.menswearPatternColors![s]).join(',');
        const dcStr = GARMENT_SLOT_ORDER.map((s) => DEFAULT_PATTERN_COLORS[s]).join(',');
        if (pcStr !== dcStr) params.set('mpcols', pcStr);
      }
    }
  }

  const query = params.toString();
  return query ? `?${query}` : '';
}
