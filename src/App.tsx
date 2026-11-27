import React, { useState, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import rawCombinations from './data/wadaCombinations.json';
import rawColors from './data/wadaColors.json';
import {
  ColorItem,
  Combination,
  HydratedCombination,
  RawCombination,
  ThemeMode,
  ViewMode,
  VolumeFilter,
  PaletteSizeFilter,
  ToneFilter,
  SeasonFilter,
  SortOption,
} from './types/color';
import { classifyColorTone } from './utils/colorUtils';
import { hydrateCombinations, SEASON_MONTHS } from './utils/paletteData';
import { parseUrlState, serializeUrlState } from './utils/urlState';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { CombinationCard } from './components/CombinationCard';
import { ColorSwatchCard } from './components/ColorSwatchCard';
import { ColorMatcherPanel } from './components/ColorMatcherPanel';
import { ModalStudio } from './components/ModalStudio';
import { ColorDetailModal } from './components/ColorDetailModal';
import { Toast } from './components/Toast';

const PAGE_SIZE = 48;

const allColors: ColorItem[] = rawColors as ColorItem[];
const allCombinations: HydratedCombination[] = hydrateCombinations(
  rawCombinations as RawCombination[],
  allColors
);

const colorById = new Map<number, ColorItem>(allColors.map((c) => [c.id, c]));
const comboByKey = new Map<string, HydratedCombination>(
  allCombinations.map((c) => [getComboKey(c.id, c.volume), c])
);

function getComboKey(id: number, volume: number): string {
  return `v${volume}-${id}`;
}

function getInitialUrlState() {
  if (typeof window === 'undefined') return parseUrlState('');
  return parseUrlState(window.location.search);
}

export const App: React.FC = () => {
  const initialUrl = useMemo(getInitialUrlState, []);

  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('sanzo-wada-theme');
      if (saved === 'washi' || saved === 'studio' || saved === 'dark') return saved;
    } catch {
      // Ignore storage access errors
    }
    return 'washi';
  });

  // View & UI panels state
  const [viewMode, setViewMode] = useState<ViewMode>(initialUrl.viewMode);
  const [matcherOpen, setMatcherOpen] = useState(false);

  // Favorites state (stored as "v1-42" or "v2-10")
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('sanzo-wada-favorites-v2');
      if (saved) return JSON.parse(saved);
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
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>(initialUrl.volumeFilter);
  const [onlyFavorites, setOnlyFavorites] = useState(initialUrl.onlyFavorites);
  const [searchQuery, setSearchQuery] = useState(initialUrl.searchQuery);
  const [sizeFilter, setSizeFilter] = useState<PaletteSizeFilter>(initialUrl.sizeFilter);
  const [toneFilter, setToneFilter] = useState<ToneFilter>(initialUrl.toneFilter);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>(initialUrl.seasonFilter);
  const [monthFilter, setMonthFilter] = useState<number | 'all'>(initialUrl.monthFilter);
  const [sortBy, setSortBy] = useState<SortOption>(initialUrl.sortBy);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Modals & navigation history state
  const [selectedCombo, setSelectedCombo] = useState<Combination | null>(() =>
    initialUrl.comboKey ? comboByKey.get(initialUrl.comboKey) ?? null : null
  );
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(() =>
    initialUrl.colorId !== null ? colorById.get(initialUrl.colorId) ?? null : null
  );
  const [returnCombo, setReturnCombo] = useState<Combination | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const favoriteSet = useMemo(() => new Set(favorites), [favorites]);

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem('sanzo-wada-theme', theme);
    } catch {
      // Ignore storage access errors
    }
    document.documentElement.className = `theme-${theme} ${theme === 'dark' ? 'dark' : ''}`;
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    try {
      localStorage.setItem('sanzo-wada-favorites-v2', JSON.stringify(favorites));
    } catch {
      // Ignore storage access errors
    }
  }, [favorites]);

  // Sync URL query params for shareable deep-links
  useEffect(() => {
    const query = serializeUrlState({
      viewMode,
      volumeFilter,
      seasonFilter,
      monthFilter,
      sizeFilter,
      toneFilter,
      sortBy,
      searchQuery,
      onlyFavorites,
      comboKey: selectedCombo ? getComboKey(selectedCombo.id, selectedCombo.volume) : null,
      colorId: selectedColor ? selectedColor.id : null,
    });
    const targetUrl = `${window.location.pathname}${query}${window.location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== targetUrl) {
      window.history.replaceState(null, '', targetUrl);
    }
  }, [
    viewMode,
    volumeFilter,
    seasonFilter,
    monthFilter,
    sizeFilter,
    toneFilter,
    sortBy,
    searchQuery,
    onlyFavorites,
    selectedCombo,
    selectedColor,
  ]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseUrlState(window.location.search);
      setViewMode(parsed.viewMode);
      setVolumeFilter(parsed.volumeFilter);
      setSeasonFilter(parsed.seasonFilter);
      setMonthFilter(parsed.monthFilter);
      setSizeFilter(parsed.sizeFilter);
      setToneFilter(parsed.toneFilter);
      setSortBy(parsed.sortBy);
      setSearchQuery(parsed.searchQuery);
      setOnlyFavorites(parsed.onlyFavorites);
      setSelectedCombo(parsed.comboKey ? comboByKey.get(parsed.comboKey) ?? null : null);
      setSelectedColor(parsed.colorId !== null ? colorById.get(parsed.colorId) ?? null : null);
      setReturnCombo(null);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Reset progressive pagination when filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [volumeFilter, onlyFavorites, seasonFilter, monthFilter, sizeFilter, toneFilter, searchQuery, sortBy]);

  const toggleFavorite = useCallback((id: number, volume: number) => {
    const key = getComboKey(id, volume);
    setFavorites((prev) => {
      const exists = prev.includes(key);
      const next = exists ? prev.filter((item) => item !== key) : [...prev, key];
      const volLabel = volume === 2 ? `Vol. 2 Card № ${id}` : `Vol. 1 № ${id}`;
      setToastMessage(
        exists ? `Removed ${volLabel} from favorites` : `Saved ${volLabel} to favorites`
      );
      return next;
    });
  }, []);

  const handleCopyText = useCallback(async (text: string, label: string) => {
    if (!text) {
      setToastMessage(label);
      return;
    }
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(text);
      setToastMessage(label);
    } catch {
      setToastMessage('Copy unavailable in this browser context — please copy manually');
    }
  }, []);

  const handleSeasonChange = (season: SeasonFilter) => {
    setSeasonFilter(season);
    if (season !== 'all' && monthFilter !== 'all' && !SEASON_MONTHS[season].includes(monthFilter)) {
      setMonthFilter('all');
    }
  };

  const handleMonthChange = (month: number | 'all') => {
    setMonthFilter(month);
    if (month !== 'all' && seasonFilter !== 'all' && !SEASON_MONTHS[seasonFilter].includes(month)) {
      setSeasonFilter('all');
    }
  };

  const resetFilters = () => {
    setVolumeFilter('all');
    setSizeFilter('all');
    setToneFilter('all');
    setSeasonFilter('all');
    setMonthFilter('all');
    setSearchQuery('');
    setOnlyFavorites(false);
    setSortBy('number-asc');
  };

  const hasActiveFilters =
    volumeFilter !== 'all' ||
    sizeFilter !== 'all' ||
    toneFilter !== 'all' ||
    seasonFilter !== 'all' ||
    monthFilter !== 'all' ||
    Boolean(searchQuery.trim()) ||
    onlyFavorites;

  // Base filtered & sorted combinations (decoupled from favorites toggles)
  const baseFilteredCombinations = useMemo(() => {
    let result = [...allCombinations];

    if (volumeFilter !== 'all') {
      result = result.filter((c) => c.volume === volumeFilter);
    }

    if (seasonFilter !== 'all') {
      const allowed = SEASON_MONTHS[seasonFilter];
      result = result.filter(
        (c) => c.volume === 2 && c.month !== undefined && allowed.includes(c.month)
      );
    }

    if (monthFilter !== 'all') {
      result = result.filter((c) => c.volume === 2 && c.month === monthFilter);
    }

    if (sizeFilter !== 'all') {
      if (sizeFilter === 5) {
        result = result.filter((c) => c.size >= 5);
      } else {
        result = result.filter((c) => c.size === sizeFilter);
      }
    }

    if (toneFilter !== 'all') {
      result = result.filter((c) =>
        c.colors.some((color) => classifyColorTone(color.rgb) === toneFilter)
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const numMatch = q.replace(/^#/, '');

      result = result.filter((c) => {
        if (c.id.toString() === numMatch || `#${c.id}` === q || getComboKey(c.id, c.volume) === numMatch) {
          return true;
        }
        if (c.monthName?.toLowerCase().includes(q)) return true;
        if (c.monthJa?.includes(q)) return true;
        if (c.monthMeaning?.toLowerCase().includes(q)) return true;
        return c.colors.some(
          (color) =>
            color.name.toLowerCase().includes(q) ||
            color.ja?.includes(q) ||
            color.reading?.toLowerCase().includes(q) ||
            color.hex.toLowerCase().includes(q)
        );
      });
    }

    if (sortBy === 'number-asc') {
      result.sort((a, b) => (a.volume === b.volume ? a.id - b.id : a.volume - b.volume));
    } else if (sortBy === 'number-desc') {
      result.sort((a, b) => (a.volume === b.volume ? b.id - a.id : b.volume - a.volume));
    } else if (sortBy === 'contrast-desc') {
      result.sort((a, b) => b.maxContrast - a.maxContrast);
    } else if (sortBy === 'popularity') {
      result.sort((a, b) => b.popularity - a.popularity);
    }

    return result;
  }, [volumeFilter, seasonFilter, monthFilter, sizeFilter, toneFilter, searchQuery, sortBy]);

  const filteredCombinations = useMemo(() => {
    if (!onlyFavorites) return baseFilteredCombinations;
    return baseFilteredCombinations.filter((c) => favoriteSet.has(getComboKey(c.id, c.volume)));
  }, [baseFilteredCombinations, onlyFavorites, favoriteSet]);

  const visibleCombinations = useMemo(
    () => filteredCombinations.slice(0, visibleCount),
    [filteredCombinations, visibleCount]
  );

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
      const numMatch = q.replace(/^#/, '');
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.ja?.includes(q) ||
          c.reading?.toLowerCase().includes(q) ||
          c.hex.toLowerCase().includes(q) ||
          c.id.toString() === numMatch
      );
    }

    return result;
  }, [volumeFilter, toneFilter, searchQuery]);

  const handleRandomPalette = () => {
    const pool = filteredCombinations.length > 0 ? filteredCombinations : allCombinations;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomCombo = pool[randomIndex];
    setReturnCombo(null);
    setSelectedColor(null);
    setSelectedCombo(randomCombo);

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 },
      colors: randomCombo.colors.map((c) => c.hex),
    });

    const volLabel =
      randomCombo.volume === 2 ? `Vol. 2 Card № ${randomCombo.id}` : `Vol. 1 № ${randomCombo.id}`;
    setToastMessage(`Selected random combination ${volLabel}!`);
  };

  // Studio Prev/Next stepping through active list
  const comboListForStepping =
    selectedCombo &&
    filteredCombinations.some(
      (c) => c.id === selectedCombo.id && c.volume === selectedCombo.volume
    )
      ? filteredCombinations
      : allCombinations;

  const currentStepIndex = selectedCombo
    ? comboListForStepping.findIndex(
        (c) => c.id === selectedCombo.id && c.volume === selectedCombo.volume
      )
    : -1;

  const handlePrevCombo = () => {
    if (currentStepIndex > 0) {
      setSelectedCombo(comboListForStepping[currentStepIndex - 1]);
    }
  };

  const handleNextCombo = () => {
    if (currentStepIndex >= 0 && currentStepIndex < comboListForStepping.length - 1) {
      setSelectedCombo(comboListForStepping[currentStepIndex + 1]);
    }
  };

  const handleShareCombo = (combo: Combination) => {
    const query = serializeUrlState({
      viewMode: 'combinations',
      volumeFilter: 'all',
      seasonFilter: 'all',
      monthFilter: 'all',
      sizeFilter: 'all',
      toneFilter: 'all',
      sortBy: 'number-asc',
      searchQuery: '',
      onlyFavorites: false,
      comboKey: getComboKey(combo.id, combo.volume),
      colorId: null,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}${query}`;
    handleCopyText(shareUrl, `Copied share link for Vol.${combo.volume} № ${combo.id}`);
  };

  const handleShareColor = (color: ColorItem) => {
    const query = serializeUrlState({
      viewMode: 'colors',
      volumeFilter: 'all',
      seasonFilter: 'all',
      monthFilter: 'all',
      sizeFilter: 'all',
      toneFilter: 'all',
      sortBy: 'number-asc',
      searchQuery: '',
      onlyFavorites: false,
      comboKey: null,
      colorId: color.id,
    });
    const shareUrl = `${window.location.origin}${window.location.pathname}${query}`;
    handleCopyText(shareUrl, `Copied share link for ${color.name} (#${color.id})`);
  };

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
        onToggleOnlyFavorites={() => setOnlyFavorites((prev) => !prev)}
        matcherOpen={matcherOpen}
        onToggleMatcher={() => setMatcherOpen((prev) => !prev)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Closest Wada Color Matcher */}
        {matcherOpen && (
          <ColorMatcherPanel
            allColors={allColors}
            onSelectColor={(color) => {
              setReturnCombo(null);
              setSelectedColor(color);
            }}
            onClose={() => setMatcherOpen(false)}
          />
        )}

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
            onSeasonChange={handleSeasonChange}
            activeMonth={monthFilter}
            onMonthChange={handleMonthChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            totalFiltered={filteredCombinations.length}
            hasActiveFilters={hasActiveFilters}
            onResetFilters={resetFilters}
          />
        )}

        {/* Master Colors View Header (when in colors view) */}
        {viewMode === 'colors' && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
                171 Master Color Swatches
              </h2>
              <span className="text-xs text-stone-500 font-code">
                (Showing {filteredColors.length})
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tone Quick Filter in Colors view */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map(
                  (tone) => (
                    <button
                      type="button"
                      key={tone}
                      onClick={() => setToneFilter(tone)}
                      className={`px-1.5 py-0.5 text-xs capitalize rounded transition-colors ${
                        toneFilter === tone
                          ? 'font-semibold text-amber-950 dark:text-amber-200 underline underline-offset-4 decoration-amber-600'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {tone}
                    </button>
                  )
                )}
              </div>

              {/* Quick Volume Switcher in Colors view */}
              <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
          </div>
        )}

        {/* COMBINATIONS GRID */}
        {viewMode === 'combinations' && (
          <>
            {filteredCombinations.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleCombinations.map((combo) => (
                    <CombinationCard
                      key={`${combo.volume}-${combo.id}`}
                      combination={combo}
                      isFavorite={favoriteSet.has(getComboKey(combo.id, combo.volume))}
                      onToggleFavorite={toggleFavorite}
                      onSelect={(c) => {
                        setReturnCombo(null);
                        setSelectedCombo(c);
                      }}
                      onCopyText={handleCopyText}
                    />
                  ))}
                </div>

                {visibleCombinations.length < filteredCombinations.length && (
                  <div className="mt-8 flex flex-col items-center gap-2">
                    <p className="text-xs font-code text-stone-500 dark:text-stone-400">
                      Showing {visibleCombinations.length} of {filteredCombinations.length} combinations
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Load {Math.min(PAGE_SIZE, filteredCombinations.length - visibleCombinations.length)} More
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleCount(filteredCombinations.length)}
                        className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                      >
                        Show All ({filteredCombinations.length})
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-20 text-center">
                <p className="text-base font-editorial text-stone-500 mb-3">
                  No combinations match your current filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
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
                    onSelectColor={(c) => {
                      setReturnCombo(null);
                      setSelectedColor(c);
                    }}
                    onCopyText={handleCopyText}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center">
                <p className="text-base font-editorial text-stone-500 mb-3">
                  No swatches match your search or filter.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setVolumeFilter('all');
                    setToneFilter('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900"
                >
                  Clear Filters
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
      {selectedCombo && (
        <ModalStudio
          combination={selectedCombo}
          onClose={() => setSelectedCombo(null)}
          isFavorite={favoriteSet.has(getComboKey(selectedCombo.id, selectedCombo.volume))}
          onToggleFavorite={toggleFavorite}
          onCopyText={handleCopyText}
          onSelectColor={(color) => {
            setReturnCombo(selectedCombo);
            setSelectedCombo(null);
            setSelectedColor(color);
          }}
          onPrev={handlePrevCombo}
          onNext={handleNextCombo}
          hasPrev={currentStepIndex > 0}
          hasNext={currentStepIndex >= 0 && currentStepIndex < comboListForStepping.length - 1}
          onShareLink={handleShareCombo}
        />
      )}

      {selectedColor && (
        <ColorDetailModal
          color={selectedColor}
          onClose={() => {
            setSelectedColor(null);
            setReturnCombo(null);
          }}
          allCombinations={allCombinations}
          onSelectCombination={(combo) => {
            setReturnCombo(null);
            setSelectedCombo(combo);
          }}
          onCopyText={handleCopyText}
          onBackToCombo={
            returnCombo
              ? () => {
                  const back = returnCombo;
                  setSelectedColor(null);
                  setReturnCombo(null);
                  setSelectedCombo(back);
                }
              : undefined
          }
          onShareLink={handleShareColor}
        />
      )}

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};
