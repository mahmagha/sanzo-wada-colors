import React, { useState, useMemo, useEffect } from 'react';
import confetti from 'canvas-confetti';
import rawCombinations from './data/wadaCombinations.json';
import rawColors from './data/wadaColors.json';
import {
  ColorItem,
  Combination,
  ThemeMode,
  ViewMode,
  PaletteSizeFilter,
  ToneFilter,
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

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('sanzo-wada-theme');
    return (saved as ThemeMode) || 'washi';
  });

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('combinations');

  // Favorites state
  const [favorites, setFavorites] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('sanzo-wada-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Filters state
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sizeFilter, setSizeFilter] = useState<PaletteSizeFilter>('all');
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('number-asc');

  // Modals state
  const [selectedCombo, setSelectedCombo] = useState<Combination | null>(null);
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync theme to root element
  useEffect(() => {
    localStorage.setItem('sanzo-wada-theme', theme);
    document.documentElement.className = `theme-${theme} ${theme === 'dark' ? 'dark' : ''}`;
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    localStorage.setItem('sanzo-wada-favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (id: number) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter((item) => item !== id) : [...prev, id];
      setToastMessage(exists ? `Removed № ${id} from favorites` : `Saved № ${id} to favorites`);
      return next;
    });
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setToastMessage(label);
  };

  const handleRandomPalette = () => {
    const randomIndex = Math.floor(Math.random() * allCombinations.length);
    const randomCombo = allCombinations[randomIndex];
    setSelectedCombo(randomCombo);

    // Delightful celebratory confetti
    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: randomCombo.colors.map((c) => c.hex),
    });

    setToastMessage(`Selected random combination № ${randomCombo.id}!`);
  };

  // Filtered & Sorted Combinations
  const filteredCombinations = useMemo(() => {
    let result = [...allCombinations];

    // Favorites only filter
    if (onlyFavorites) {
      result = result.filter((c) => favorites.includes(c.id));
    }

    // Size filter
    if (sizeFilter !== 'all') {
      result = result.filter((c) => c.size === sizeFilter);
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
        // Match color name or hex
        return c.colors.some(
          (color) =>
            color.name.toLowerCase().includes(q) ||
            color.hex.toLowerCase().includes(q)
        );
      });
    }

    // Sorting
    if (sortBy === 'number-asc') {
      result.sort((a, b) => a.id - b.id);
    } else if (sortBy === 'number-desc') {
      result.sort((a, b) => b.id - a.id);
    } else if (sortBy === 'contrast-desc') {
      result.sort((a, b) => getMaxPaletteContrast(b) - getMaxPaletteContrast(a));
    } else if (sortBy === 'popularity') {
      // Sum of combinations each color appears in
      const getPopularity = (c: Combination) =>
        c.colors.reduce((sum, item) => sum + item.combinations.length, 0);
      result.sort((a, b) => getPopularity(b) - getPopularity(a));
    }

    return result;
  }, [allCombinations, onlyFavorites, favorites, sizeFilter, toneFilter, searchQuery, sortBy]);

  // Filtered Master Colors
  const filteredColors = useMemo(() => {
    let result = [...allColors];

    if (toneFilter !== 'all') {
      result = result.filter((c) => classifyColorTone(c.rgb) === toneFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.hex.toLowerCase().includes(q) ||
          c.swatch.toString() === q
      );
    }

    return result;
  }, [allColors, toneFilter, searchQuery]);

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
            activeSize={sizeFilter}
            onSizeChange={setSizeFilter}
            activeTone={toneFilter}
            onToneChange={setToneFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalFiltered={filteredCombinations.length}
          />
        )}

        {/* Master Colors View Header (when in colors view) */}
        {viewMode === 'colors' && (
          <div className="flex items-center justify-between py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
                159 Master Color Swatches
              </h2>
              <span className="text-xs text-stone-500 font-code">
                (Showing {filteredColors.length})
              </span>
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
                    key={combo.id}
                    combination={combo}
                    isFavorite={favorites.includes(combo.id)}
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
                    setSizeFilter('all');
                    setToneFilter('all');
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
            A Dictionary of Color Combinations (配色総鑑)
          </p>
        </div>
        <p>
          Originally curated by Sanzo Wada (1883–1967) • Japan Standard Color Association (1933)
        </p>
        <p className="font-code text-[11px] text-stone-400">
          Built with React & Tailwind CSS • 100% static & ready for GitHub Pages
        </p>
      </footer>

      {/* Modals & Toast */}
      <ModalStudio
        combination={selectedCombo}
        onClose={() => setSelectedCombo(null)}
        isFavorite={selectedCombo ? favorites.includes(selectedCombo.id) : false}
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
