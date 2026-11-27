import React from 'react';
import {
  Sparkles,
  Heart,
  Search,
  X,
  Sun,
  Moon,
  ScrollText,
  Pipette,
  Wand2,
  CircleHelp,
  Shirt,
  CircleDot,
} from 'lucide-react';
import { ThemeMode, ViewMode } from '../types/color';

interface HeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onRandomPalette: () => void;
  favoritesCount: number;
  onlyFavorites: boolean;
  onToggleOnlyFavorites: () => void;
  matcherOpen: boolean;
  onToggleMatcher: () => void;
  customCount: number;
  onOpenCustomComposer: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  viewMode,
  onViewModeChange,
  theme,
  onThemeChange,
  searchQuery,
  onSearchChange,
  onRandomPalette,
  favoritesCount,
  onlyFavorites,
  onToggleOnlyFavorites,
  matcherOpen,
  onToggleMatcher,
  customCount,
  onOpenCustomComposer,
  onOpenGuide,
}) => {
  return (
    <header className="sticky-header-surface border-b transition-colors duration-200 sm:sticky sm:top-0 z-30 backdrop-blur-md border-stone-300/40 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pb-4">
        {/* Top Branding Line (scrolls naturally on mobile to preserve screen height) */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              aria-hidden="true"
              className="w-10 h-10 rounded border-2 border-red-700 dark:border-red-600 flex items-center justify-center font-editorial font-bold text-red-700 dark:text-red-500 text-lg shadow-sm shrink-0 bg-red-50/50 dark:bg-red-950/20"
            >
              三造
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  和田三造{' '}
                  <span className="font-sans font-light text-stone-500 dark:text-stone-400 text-base sm:text-lg">
                    Sanzo Wada
                  </span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-code rounded bg-amber-800/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/20">
                  Vol. 1 & Vol. 2
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 tracking-wide">
                A Dictionary of Color Combinations • 配色総鑑 (348 Harmonies + 72 Seasonal)
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap lg:flex-nowrap shrink-0 max-w-full">
            <button
              type="button"
              onClick={onToggleMatcher}
              aria-pressed={matcherOpen}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                matcherOpen
                  ? 'bg-amber-800 text-amber-50 border-amber-800 dark:bg-amber-700 dark:border-amber-700 shadow-xs'
                  : 'border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              title="Match HEX color or extract palette from image"
            >
              <Pipette size={14} />
              <span>Color Match</span>
            </button>

            <button
              type="button"
              onClick={onOpenCustomComposer}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 transition-colors duration-150 whitespace-nowrap cursor-pointer"
              title="Compose a custom palette from Wada's 171 pigments"
            >
              <Wand2 size={14} />
              <span>Mix</span>
              <span className="min-w-[1.2rem] px-1 text-[11px] rounded-full bg-stone-300/60 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-code tabular-nums text-center">
                {customCount}
              </span>
            </button>

            <button
              type="button"
              onClick={onRandomPalette}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors duration-150 bg-red-800 hover:bg-red-900 text-red-50 shadow-sm hover:shadow whitespace-nowrap cursor-pointer"
              title="Roll a random combination"
            >
              <Sparkles size={15} />
              <span>Surprise Me</span>
            </button>

            <button
              type="button"
              onClick={onToggleOnlyFavorites}
              aria-pressed={onlyFavorites}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-colors duration-150 whitespace-nowrap cursor-pointer ${
                onlyFavorites
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                  : 'border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              title="View starred favorites"
            >
              <Heart
                size={15}
                className={onlyFavorites || favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}
              />
              <span className="hidden sm:inline">Favorites</span>
              <span
                className={`ml-0.5 min-w-[1.35rem] px-1.5 py-0.2 text-[11px] rounded-full font-code tabular-nums text-center ${
                  favoritesCount > 0
                    ? 'bg-rose-500 text-white'
                    : 'bg-stone-300/60 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}
              >
                {favoritesCount}
              </span>
            </button>

            {/* Theme Switcher */}
            <div
              role="group"
              aria-label="Gallery theme"
              className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg p-0.5 bg-stone-200/40 dark:bg-stone-800/60"
            >
              <button
                type="button"
                onClick={() => onThemeChange('washi')}
                aria-label="Washi Paper Theme"
                aria-pressed={theme === 'washi'}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'washi'
                    ? 'bg-amber-100 text-amber-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Washi Paper Theme"
              >
                <ScrollText size={15} />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('studio')}
                aria-label="White Studio Theme"
                aria-pressed={theme === 'studio'}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'studio'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="White Studio Theme"
              >
                <Sun size={15} />
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('dark')}
                aria-label="Dark Gallery Theme"
                aria-pressed={theme === 'dark'}
                className={`p-1.5 rounded text-xs transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-stone-900 text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Dark Gallery Theme"
              >
                <Moon size={15} />
              </button>
            </div>

            {/* Archive Guide & Shortcuts (?) */}
            <button
              type="button"
              onClick={onOpenGuide}
              aria-label="Archive guide, keyboard shortcuts, and favorites backup"
              title="Guide, shortcuts (?) & favorites backup"
              className="p-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <CircleHelp size={15} />
            </button>
          </div>
        </div>

        {/* Lower Row: View Switcher & Search Bar (sticky on mobile, seamless on sm+) */}
        <div className="sticky top-0 sm:static z-30 sticky-header-surface sm:bg-transparent mt-3 sm:mt-4 py-3 sm:pb-0 border-t border-stone-200/70 dark:border-stone-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div
            role="tablist"
            aria-label="Browse view"
            className="flex flex-wrap rounded-lg p-1 bg-stone-200/50 dark:bg-stone-800/60 border border-stone-300/40 dark:border-stone-700/60 self-start sm:self-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'combinations'}
              onClick={() => onViewModeChange('combinations')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'combinations'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Combinations <span className="text-[11px] opacity-75 font-code">(420)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'colors'}
              onClick={() => onViewModeChange('colors')}
              className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'colors'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Master Colors <span className="text-[11px] opacity-75 font-code">(171)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'wheel'}
              onClick={() => onViewModeChange('wheel')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'wheel'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <CircleDot size={14} />
              <span>Color Wheel</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'menswear'}
              onClick={() => onViewModeChange('menswear')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                viewMode === 'menswear'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              <Shirt size={14} />
              <span>Menswear</span>
            </button>
          </div>

          {/* Search Box (press / to focus) */}
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="global-search-input"
              type="text"
              aria-label={
                viewMode === 'combinations'
                  ? 'Search combinations by multiple terms, name, romaji, hex, month, or plate number'
                  : 'Search master colors by name, Japanese, romaji, or hex'
              }
              placeholder={
                viewMode === 'combinations'
                  ? 'Search (e.g. "pink blue", "Spring", "#180") — press /'
                  : 'Search 171 colors by name, Japanese, romaji, or hex...'
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
