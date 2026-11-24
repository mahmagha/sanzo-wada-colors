import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import rawCombinations from './data/wadaCombinations.json';
import rawColors from './data/wadaColors.json';
import {
  ColorItem,
  Combination,
  ThemeMode,
  ViewMode,
  VolumeFilter,
  PaletteSizeFilter,
  ToneFilter,
  SeasonFilter,
  SortOption,
} from './types/color';
import { classifyColorTone, getMaxPaletteContrast } from './utils/colorUtils';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { CombinationCard } from './components/CombinationCard';
import { ColorSwatchCard } from './components/ColorSwatchCard';
import { ModalStudio } from './components/ModalStudio';
import { ColorDetailModal } from './components/ColorDetailModal';
import { Toast } from './components/Toast';

const allCombinations: Combination[] = rawCombinations as Combination[];
const allColors: ColorItem[] = rawColors as ColorItem[];

function getComboKey(id: number, volume: number): string {
  return `v${volume}-${id}`;
}

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('sanzo-wada-theme');
    return (saved as ThemeMode) || 'washi';
  });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('combinations');

  // Favorites state (stored as "v1-42" or "v2-10")
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sanzo-wada-favorites-v2');
      if (saved) return JSON.parse(saved);
      // Legacy fallback
      const old = localStorage.getItem('sanzo-wada-favorites');
      if (old) {
        const oldNums: number[] = JSON.parse(old);
        return oldNums.map((n) => `v1-${n}`);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Filters state
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<PaletteSizeFilter>('all');
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all');
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('number-asc');

  // Modals state
  const [selectedCombo, setSelectedCombo] = useState<Combination | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme
  useEffect(() => {
    localStorage.setItem('sanzo-wada-theme', theme);
    document.documentElement.className = `theme-${theme} ${theme === 'dark' ? 'dark' : ''}`;
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('sanzo-wada-favorites-v2', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: number, volume: number) => {
    const key = getComboKey(id, volume);
    setFavorites((prev) => {
      const exists = prev.includes(key);
      const next = exists ? prev.filter((item) => item !== key) : [...prev, key];
      const volLabel = volume === 2 ? `Vol. 2 Card № ${id}` : `Vol. 1 № ${id}`;
      setToastMessage(exists ? `Removed ${volLabel} from favorites` : `Saved ${volLabel} to favorites`);
      return next;
    });
  };

  const isComboFavorite = (id: number, volume: number) => {
    return favorites.includes(getComboKey(id, volume));
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(label);
  };

  const handleRandomPalette = () => {
    const pool = filteredCombinations.length > 0 ? filteredCombinations : allCombinations;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomCombo = pool[randomIndex];
    setSelectedCombo(randomCombo);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: randomCombo.colors.map((c) => c.hex),
    });

    const volLabel = randomCombo.volume === 2 ? `Vol. 2 Card № ${randomCombo.id}` : `Vol. 1 № ${randomCombo.id}`;
    setToastMessage(`Selected random combination ${volLabel}!`);
  };

  // Filtered & Sorted Combinations
  const filteredCombinations = useMemo(() => {
    let result = [...allCombinations];

    // Volume filter
    if (volumeFilter !== 'all') {
      result = result.filter((c) => c.volume === volumeFilter);
    }

    // Favorites only filter
    if (onlyFavorites) {
      result = result.filter((c) => isComboFavorite(c.id, c.volume));
    }

    // Season filter (Vol 2 seasonal cards)
    if (seasonFilter !== 'all') {
      const seasonMonths: Record<SeasonFilter, number[]> = {
        all: [],
        spring: [3, 4, 5],
        summer: [6, 7, 8],
        autumn: [9, 10, 11],
        winter: [12, 1, 2],
      };
      const allowed = seasonMonths[seasonFilter];
      result = result.filter((c) => c.volume === 2 && c.month && allowed.includes(c.month));
    }

    // Size filter
    if (sizeFilter !== 'all') {
      if (sizeFilter === 5) {
        result = result.filter((c) => c.size >= 5);
      } else {
        result = result.filter((c) => c.size === sizeFilter);
      }
    }

    // Tone filter
    if (toneFilter !== 'all') {
      result = result.filter((c) =>
        c.colors.some((color) => classifyColorTone(color.rgb) === toneFilter)
      );
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = q.replace(/^#/, '');

      result = result.filter((c) => {
        // Match combination number
        if (c.id.toString() === numMatch || `#${c.id}` === q) return true;
        // Match Vol 2 month details
        if (c.monthName?.toLowerCase().includes(q)) return true;
        if (c.monthJa?.includes(q)) return true;
        if (c.monthMeaning?.toLowerCase().includes(q)) return true;
        // Match color name, japanese, or hex
        return c.colors.some(
          (color) =>
            color.name.toLowerCase().includes(q) ||
            color.ja?.includes(q) ||
            color.hex.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (sortBy === 'number-asc') {
      result.sort((a, b) => (a.volume === b.volume ? a.id - b.id : a.volume - b.volume));
    } else if (sortBy === 'number-desc') {
      result.sort((a, b) => (a.volume === b.volume ? b.id - a.id : b.volume - a.volume));
    } else if (sortBy === 'contrast-desc') {
      result.sort((a, b) => getMaxPaletteContrast(b) - getMaxPaletteContrast(a));
    } else if (sortBy === 'popularity') {
      const getPopularity = (c: Combination) =>
        c.colors.reduce((sum, item) => sum + (item.combinations?.length || 0) + (item.vol2Cards?.length || 0), 0);
      result.sort((a, b) => getPopularity(b) - getPopularity(a));
    }

    return result;
  }, [allCombinations, volumeFilter, onlyFavorites, favorites, seasonFilter, sizeFilter, toneFilter, searchQuery, sortBy]);

  // Filtered Master Colors
  const filteredColors = useMemo(() => {
    let result = [...allColors];

    if (volumeFilter !== 'all') {
      result = result.filter((c) => c.volume === volumeFilter);
    }

    if (toneFilter !== 'all') {
      result = result.filter((c) => classifyColorTone(c.rgb) === toneFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ja?.includes(q) ||
          c.reading?.toLowerCase().includes(q) ||
          c.hex.toLowerCase().includes(q) ||
          c.id.toString() === q
      );
    }

    return result;
  }, [allColors, volumeFilter, toneFilter, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Header Bar */}
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onThemeChange={setTheme}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onRandomPalette={handleRandomPalette}
        favoritesCount={favorites.length}
        onlyFavorites={onlyFavorites}
        onToggleOnlyFavorites={() => setOnlyFavorites(!onlyFavorites)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Filter Controls (for combinations view) */}
        {viewMode === 'combinations' && (
          <FiltersBar
            volume={volumeFilter}
            onVolumeChange={setVolumeFilter}
            activeSize={sizeFilter}
            onSizeChange={setSizeFilter}
            activeTone={toneFilter}
            onToneChange={setToneFilter}
            activeSeason={seasonFilter}
            onSeasonChange={setSeasonFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalFiltered={filteredCombinations.length}
          />
        )}

        {/* Master Colors View Header (when in colors view) */}
        {viewMode === 'colors' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
                171 Master Color Swatches
              </h2>
              <span className="text-xs text-stone-500 font-code">
                (Showing {filteredColors.length})
              </span>
            </div>

            {/* Quick Volume Switcher in Colors view */}
            <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
              <button
                onClick={() => setVolumeFilter('all')}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  volumeFilter === 'all'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                All (171)
              </button>
              <button
                onClick={() => setVolumeFilter(1)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  volumeFilter === 1
                    ? 'bg-amber-900 text-amber-50 dark:bg-amber-700 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Vol. 1 (159)
              </button>
              <button
                onClick={() => setVolumeFilter(2)}
                className={`px-2.5 py-1 rounded font-medium transition-all ${
                  volumeFilter === 2
                    ? 'bg-emerald-800 text-emerald-50 dark:bg-emerald-700 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                Vol. 2 New (12)
              </button>
            </div>
          </div>
        )}

        {/* COMBINATIONS GRID */}
        {viewMode === 'combinations' && (
          <>
            {filteredCombinations.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCombinations.map((combo) => (
                  <CombinationCard
                    key={`${combo.volume}-${combo.id}`}
                    combination={combo}
                    isFavorite={isComboFavorite(combo.id, combo.volume)}
                    onToggleFavorite={toggleFavorite}
                    onSelect={setSelectedCombo}
                    onCopyText={handleCopyText}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-base font-editorial text-stone-500 mb-2">
                  No combinations match your current filters.
                </p>
                <button
                  onClick={() => {
                    setVolumeFilter('all');
                    setSizeFilter('all');
                    setToneFilter('all');
                    setSeasonFilter('all');
                    setSearchQuery('');
                    setOnlyFavorites(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </>
        )}

        {/* MASTER COLORS GRID */}
        {viewMode === 'colors' && (
          <>
            {filteredColors.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {filteredColors.map((color) => (
                  <ColorSwatchCard
                    key={color.id}
                    color={color}
                    onSelectColor={setSelectedColor}
                    onCopyText={handleCopyText}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-base font-editorial text-stone-500 mb-2">
                  No swatches match your search.
                </p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900"
                >
                  Clear Search
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-stone-300/40 dark:border-stone-800 py-8 text-center text-xs text-stone-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <div className="w-5 h-5 rounded border border-red-700 dark:border-red-600 flex items-center justify-center font-editorial font-bold text-red-700 dark:text-red-500 text-[10px]">
            三造
          </div>
          <p className="font-editorial font-semibold text-stone-700 dark:text-stone-300">
            A Dictionary of Color Combinations (配色総鑑) • Volumes 1 & 2
          </p>
        </div>
        <p>
          Originally curated by Sanzo Wada (1883–1967) • Japan Standard Color Association (1933–1935)
        </p>
        <p className="font-code text-[11px] text-stone-400">
          Built with React & Tailwind CSS • 420 Combinations • 171 Master Colors
        </p>
      </footer>

      {/* Modals & Toast */}
      <ModalStudio
        combination={selectedCombo}
        onClose={() => setSelectedCombo(null)}
        isFavorite={selectedCombo ? isComboFavorite(selectedCombo.id, selectedCombo.volume) : false}
        onToggleFavorite={toggleFavorite}
        onCopyText={handleCopyText}
      />

      <ColorDetailModal
        color={selectedColor}
        onClose={() => setSelectedColor(null)}
        allCombinations={allCombinations}
        onSelectCombination={setSelectedCombo}
        onCopyText={handleCopyText}
      />

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};
