import React from 'react';
import { Sparkles, Heart, Search, X, Sun, Moon, ScrollText } from 'lucide-react';
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
}) => {
  return (
    <header className="border-b transition-colors duration-200 sticky top-0 z-30 backdrop-blur-md bg-opacity-90 border-stone-300/40 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Top Branding Line */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Hanko Seal Motif */}
            <div className="w-10 h-10 rounded border-2 border-red-700 dark:border-red-600 flex items-center justify-center font-editorial font-bold text-red-700 dark:text-red-500 text-lg shadow-sm shrink-0 bg-red-50/50 dark:bg-red-950/20">
              三造
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-editorial font-bold tracking-tight text-stone-900 dark:text-stone-100">
                  和田三造 <span className="font-sans font-light text-stone-500 dark:text-stone-400 text-base sm:text-lg">Sanzo Wada</span>
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-code rounded bg-amber-800/10 dark:bg-amber-400/10 text-amber-900 dark:text-amber-300 border border-amber-800/20 dark:border-amber-400/20">
                  1933
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 tracking-wide">
                A Dictionary of Color Combinations • 配色総鑑 (Haishoku Sōkan)
              </p>
            </div>
          </div>

          {/* Quick Actions (Random, Favorites, Theme) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Serendipity / Random Palette Button */}
            <button
              onClick={onRandomPalette}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 bg-red-800 hover:bg-red-900 text-red-50 shadow-sm hover:shadow active:scale-95"
              title="Roll a random combination"
            >
              <Sparkles size={15} />
              <span>Surprise Me</span>
            </button>

            {/* Favorites Filter */}
            <button
              onClick={onToggleOnlyFavorites}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg border transition-all duration-200 active:scale-95 ${
                onlyFavorites
                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400'
                  : 'border-stone-300 dark:border-stone-700 hover:bg-stone-200/50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300'
              }`}
              title="View starred favorites"
            >
              <Heart size={15} className={onlyFavorites || favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''} />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 text-[11px] rounded-full bg-rose-500 text-white font-code">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Theme Switcher */}
            <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg p-0.5 bg-stone-200/40 dark:bg-stone-800/60">
              <button
                onClick={() => onThemeChange('washi')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  theme === 'washi'
                    ? 'bg-amber-100 text-amber-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Washi Paper Theme"
              >
                <ScrollText size={15} />
              </button>
              <button
                onClick={() => onThemeChange('studio')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  theme === 'studio'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="White Studio Theme"
              >
                <Sun size={15} />
              </button>
              <button
                onClick={() => onThemeChange('dark')}
                className={`p-1.5 rounded text-xs transition-colors ${
                  theme === 'dark'
                    ? 'bg-stone-900 text-stone-100 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title="Dark Gallery Theme"
              >
                <Moon size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Lower Row: View Switcher & Search Bar */}
        <div className="mt-4 pt-3 border-t border-stone-200/70 dark:border-stone-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* View Mode Tabs */}
          <div className="flex rounded-lg p-1 bg-stone-200/50 dark:bg-stone-800/60 border border-stone-300/40 dark:border-stone-700/60 self-start sm:self-auto">
            <button
              onClick={() => onViewModeChange('combinations')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                viewMode === 'combinations'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Combinations <span className="text-[11px] opacity-75 font-code">(348)</span>
            </button>
            <button
              onClick={() => onViewModeChange('colors')}
              className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                viewMode === 'colors'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              Master Colors <span className="text-[11px] opacity-75 font-code">(159)</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 sm:max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder={
                viewMode === 'combinations'
                  ? 'Search by name, hex, or #number (e.g. "Coral", "#180")'
                  : 'Search 159 master colors by name or hex...'
              }
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900/70 text-stone-900 dark:text-stone-100 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-amber-800 dark:focus:ring-amber-400 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
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
