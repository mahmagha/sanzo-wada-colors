export interface ColorItem {
  id: number;
  name: string;
  hex: string;
  rgb: [number, number, number];
  cmyk: [number, number, number, number];
  lab: [number, number, number];
  swatch: number;
  combinations: number[];
}

export interface Combination {
  id: number;
  size: number;
  colors: ColorItem[];
}

export type ThemeMode = 'washi' | 'studio' | 'dark';
export type ViewMode = 'combinations' | 'colors';
export type PaletteSizeFilter = 'all' | 2 | 3 | 4;
export type ToneFilter = 'all' | 'warm' | 'cool' | 'earthy' | 'pastel' | 'deep';
export type SortOption = 'number-asc' | 'number-desc' | 'contrast-desc' | 'popularity';

export interface FilterState {
  searchQuery: string;
  size: PaletteSizeFilter;
  tone: ToneFilter;
  sortBy: SortOption;
  onlyFavorites: boolean;
}
