export interface ColorItem {
  id: number;
  name: string;
  ja?: string | null;
  reading?: string | null;
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  lab: [number, number, number];
  swatch: number | string;
  volume: 1 | 2;
  combinations: number[];
  vol2Cards?: number[];
}

export interface RawCombination {
  id: number;
  volume: 1 | 2;
  size: number;
  month?: number;
  monthName?: string;
  monthJa?: string;
  monthMeaning?: string;
  cardInMonth?: number;
  colorIds: number[];
}

export interface Combination {
  id: number;
  volume: 1 | 2;
  size: number;
  month?: number;
  monthName?: string;
  monthJa?: string;
  monthMeaning?: string;
  cardInMonth?: number;
  colors: ColorItem[];
  maxContrast?: number;
  popularity?: number;
}

export interface HydratedCombination extends Combination {
  maxContrast: number;
  popularity: number;
}

export type ThemeMode = 'washi' | 'studio' | 'dark';
export type ViewMode = 'combinations' | 'colors' | 'menswear';
export type ColorsLayout = 'grid' | 'map' | 'wheel';
export type VolumeFilter = 'all' | 1 | 2;
export type PaletteSizeFilter = 'all' | 2 | 3 | 4 | 5;
export type ToneFilter = 'all' | 'warm' | 'cool' | 'earthy' | 'pastel' | 'deep' | 'neutral';
export type SeasonFilter = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';
export type SortOption = 'number-asc' | 'number-desc' | 'contrast-desc' | 'popularity';
export type ColorSortOption = 'id-asc' | 'hue' | 'lightness' | 'popularity' | 'name';
export type CvdMode = 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';

export interface FilterState {
  volume: VolumeFilter;
  searchQuery: string;
  size: PaletteSizeFilter;
  tone: ToneFilter;
  season: SeasonFilter;
  month: number | 'all';
  sortBy: SortOption;
  colorSort: ColorSortOption;
  swatchId: number | null;
  onlyFavorites: boolean;
}
