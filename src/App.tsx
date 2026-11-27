import React, { Suspense, lazy, useState, useMemo, useEffect, useCallback } from 'react';
import { Columns2, X } from 'lucide-react';
import rawCombinations from './data/wadaCombinations.json';
import rawColors from './data/wadaColors.json';
import {
  ColorItem,
  ColorSortOption,
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
import { matchesColorTokens, matchesCombinationTokens, sortMasterColors } from './utils/searchUtils';
import { parseUrlState, serializeUrlState } from './utils/urlState';
import { Header } from './components/Header';
import { FiltersBar } from './components/FiltersBar';
import { CombinationCard } from './components/CombinationCard';
import { ColorSwatchCard } from './components/ColorSwatchCard';
import { Toast } from './components/Toast';

const ModalStudio = lazy(() =>
  import('./components/ModalStudio').then((m) => ({ default: m.ModalStudio }))
);
const ColorDetailModal = lazy(() =>
  import('./components/ColorDetailModal').then((m) => ({ default: m.ColorDetailModal }))
);
const ColorMatcherPanel = lazy(() =>
  import('./components/ColorMatcherPanel').then((m) => ({ default: m.ColorMatcherPanel }))
);
const CompareModal = lazy(() =>
  import('./components/CompareModal').then((m) => ({ default: m.CompareModal }))
);

const PAGE_SIZE = 48;
const MAX_COMPARE = 3;

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

  // Theme state (respects saved preference, falls back to OS dark preference or Washi)
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('sanzo-wada-theme');
      if (saved === 'washi' || saved === 'studio' || saved === 'dark') return saved;
      if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch {
      // Ignore storage / matchMedia errors
    }
    return 'washi';
  });

  // View & panels state
  const [viewMode, setViewMode] = useState<ViewMode>(initialUrl.viewMode);
  const [matcherOpen, setMatcherOpen] = useState(false);

  // Favorites state
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

  // Compare state (up to 3 combination keys)
  const [compareKeys, setCompareKeys] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Filters state
  const [volumeFilter, setVolumeFilter] = useState<VolumeFilter>(initialUrl.volumeFilter);
  const [onlyFavorites, setOnlyFavorites] = useState(initialUrl.onlyFavorites);
  const [searchQuery, setSearchQuery] = useState(initialUrl.searchQuery);
  const [sizeFilter, setSizeFilter] = useState<PaletteSizeFilter>(initialUrl.sizeFilter);
  const [toneFilter, setToneFilter] = useState<ToneFilter>(initialUrl.toneFilter);
  const [seasonFilter, setSeasonFilter] = useState<SeasonFilter>(initialUrl.seasonFilter);
  const [monthFilter, setMonthFilter] = useState<number | 'all'>(initialUrl.monthFilter);
  const [sortBy, setSortBy] = useState<SortOption>(initialUrl.sortBy);
  const [colorSort, setColorSort] = useState<ColorSortOption>(initialUrl.colorSort);
  const [hasKanjiOnly, setHasKanjiOnly] = useState(false);
  const [swatchIdFilter, setSwatchIdFilter] = useState<number | null>(initialUrl.swatchId);
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
  const compareSet = useMemo(() => new Set(compareKeys), [compareKeys]);

  const activeSwatch = useMemo(
    () => (swatchIdFilter !== null ? colorById.get(swatchIdFilter) ?? null : null),
    [swatchIdFilter]
  );

  const comparedCombinations = useMemo(
    () =>
      compareKeys
        .map((key) => comboByKey.get(key))
        .filter((c): c is HydratedCombination => Boolean(c)),
    [compareKeys]
  );

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem('sanzo-wada-theme', theme);
    } catch {
      // Ignore storage errors
    }
    document.documentElement.className = `theme-${theme} ${theme === 'dark' ? 'dark' : ''}`;
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        theme === 'dark' ? '#121214' : theme === 'studio' ? '#FAFAFA' : '#F7F4EC'
      );
    }
  }, [theme]);

  // Sync favorites
  useEffect(() => {
    try {
      localStorage.setItem('sanzo-wada-favorites-v2', JSON.stringify(favorites));
    } catch {
      // Ignore storage errors
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
      colorSort,
      swatchId: swatchIdFilter,
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
    colorSort,
    swatchIdFilter,
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
      setColorSort(parsed.colorSort);
      setSwatchIdFilter(parsed.swatchId);
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
  }, [
    volumeFilter,
    onlyFavorites,
    seasonFilter,
    monthFilter,
    sizeFilter,
    toneFilter,
    swatchIdFilter,
    searchQuery,
    sortBy,
  ]);

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

  const toggleCompare = useCallback((combo: Combination) => {
    const key = getComboKey(combo.id, combo.volume);
    setCompareKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }
      if (prev.length >= MAX_COMPARE) {
        setToastMessage(`Compare tray holds up to ${MAX_COMPARE} palettes — remove one first`);
        return prev;
      }
      return [...prev, key];
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
    if (volumeFilter === 1 && season !== 'all') {
      setVolumeFilter(2);
    }
    setSeasonFilter(season);
    if (season !== 'all' && monthFilter !== 'all' && !SEASON_MONTHS[season].includes(monthFilter)) {
      setMonthFilter('all');
    }
  };

  const handleMonthChange = (month: number | 'all') => {
    if (volumeFilter === 1 && month !== 'all') {
      setVolumeFilter(2);
    }
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
    setSwatchIdFilter(null);
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
    swatchIdFilter !== null ||
    Boolean(searchQuery.trim()) ||
    onlyFavorites;

  // Base filtered & sorted combinations (decoupled from favorites toggles)
  const baseFilteredCombinations = useMemo(() => {
    let result = [...allCombinations];

    if (volumeFilter !== 'all') {
      result = result.filter((c) => c.volume === volumeFilter);
    }

    if (swatchIdFilter !== null) {
      result = result.filter((c) => c.colors.some((color) => color.id === swatchIdFilter));
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
      result = result.filter((c) => matchesCombinationTokens(c, searchQuery));
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
  }, [
    volumeFilter,
    swatchIdFilter,
    seasonFilter,
    monthFilter,
    sizeFilter,
    toneFilter,
    searchQuery,
    sortBy,
  ]);

  const filteredCombinations = useMemo(() => {
    if (!onlyFavorites) return baseFilteredCombinations;
    return baseFilteredCombinations.filter((c) => favoriteSet.has(getComboKey(c.id, c.volume)));
  }, [baseFilteredCombinations, onlyFavorites, favoriteSet]);

  const visibleCombinations = useMemo(
    () => filteredCombinations.slice(0, visibleCount),
    [filteredCombinations, visibleCount]
  );

  // Filtered & Sorted Master Colors
  const filteredColors = useMemo(() => {
    let result = allColors;

    if (volumeFilter !== 'all') {
      result = result.filter((c) => c.volume === volumeFilter);
    }

    if (hasKanjiOnly) {
      result = result.filter((c) => Boolean(c.ja));
    }

    if (toneFilter !== 'all') {
      result = result.filter((c) => classifyColorTone(c.rgb) === toneFilter);
    }

    if (searchQuery.trim()) {
      result = result.filter((c) => matchesColorTokens(c, searchQuery));
    }

    return sortMasterColors(result, colorSort);
  }, [volumeFilter, hasKanjiOnly, toneFilter, searchQuery, colorSort]);

  const handleRandomPalette = async () => {
    const pool = filteredCombinations.length > 0 ? filteredCombinations : allCombinations;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomCombo = pool[randomIndex];
    setReturnCombo(null);
    setSelectedColor(null);
    setSelectedCombo(randomCombo);

    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: randomCombo.colors.map((c) => c.hex),
      });
    } catch {
      // Ignore confetti load errors offline
    }

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
      colorSort: 'id-asc',
      swatchId: null,
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
      colorSort: 'id-asc',
      swatchId: null,
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
        {/* Lazy-loaded Closest Wada Color Matcher */}
        {matcherOpen && (
          <Suspense fallback={null}>
            <ColorMatcherPanel
              allColors={allColors}
              onSelectColor={(color) => {
                setReturnCombo(null);
                setSelectedColor(color);
              }}
              onClose={() => setMatcherOpen(false)}
            />
          </Suspense>
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
            activeSwatch={activeSwatch}
            onClearSwatch={() => setSwatchIdFilter(null)}
          />
        )}

        {/* Master Colors View Header (when in colors view) */}
        {viewMode === 'colors' && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
                171 Master Color Swatches
              </h2>
              <span className="text-xs text-stone-500 font-code tabular-nums min-w-[6.5rem]">
                (Showing {filteredColors.length})
              </span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Tone Quick Filter */}
              <div className="flex items-center gap-1 flex-wrap">
                {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map(
                  (tone) => (
                    <button
                      type="button"
                      key={tone}
                      onClick={() => setToneFilter(tone)}
                      aria-pressed={toneFilter === tone}
                      className={`px-1.5 py-0.5 text-xs font-medium capitalize rounded transition-colors cursor-pointer ${
                        toneFilter === tone
                          ? 'text-amber-950 dark:text-amber-200 underline underline-offset-4 decoration-2 decoration-amber-700 dark:decoration-amber-400'
                          : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                      }`}
                    >
                      {tone}
                    </button>
                  )
                )}
              </div>

              {/* Kanji documented toggle */}
              <button
                type="button"
                onClick={() => setHasKanjiOnly((prev) => !prev)}
                aria-pressed={hasKanjiOnly}
                className={`px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
                  hasKanjiOnly
                    ? 'bg-amber-900 text-amber-50 border-amber-900 dark:bg-amber-700 dark:border-amber-700'
                    : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800'
                }`}
                title="Filter to swatches with documented Japanese kanji (36)"
              >
                Kanji (36)
              </button>

              {/* Master Colors Sort */}
              <select
                aria-label="Sort master colors"
                value={colorSort}
                onChange={(e) => setColorSort(e.target.value as ColorSortOption)}
                className="w-36 px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 cursor-pointer"
              >
                <option value="id-asc"># Swatch ID</option>
                <option value="hue">Hue Spectrum</option>
                <option value="lightness">Lightness</option>
                <option value="popularity">Most Used</option>
                <option value="name">Name (A–Z)</option>
              </select>

              {/* Quick Volume Switcher */}
              <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setVolumeFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
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
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    volumeFilter === 2
                      ? 'bg-emerald-800 text-emerald-50 dark:bg-emerald-700 shadow-xs'
                      : 'text-stone-600 dark:text-stone-400'
                  }`}
                >
                  Vol. 2 (12)
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
                      isCompared={compareSet.has(getComboKey(combo.id, combo.volume))}
                      onToggleFavorite={toggleFavorite}
                      onToggleCompare={toggleCompare}
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
                    <p className="text-xs font-code tabular-nums text-stone-500 dark:text-stone-400">
                      Showing {visibleCombinations.length} of {filteredCombinations.length} combinations
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
                      >
                        Load{' '}
                        {Math.min(PAGE_SIZE, filteredCombinations.length - visibleCombinations.length)}{' '}
                        More
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
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 cursor-pointer"
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
                    setHasKanjiOnly(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating Compare Palettes Tray */}
      {comparedCombinations.length > 0 && !compareOpen && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-full bg-stone-900/95 text-stone-100 shadow-2xl border border-stone-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
          <div className="flex items-center gap-1.5">
            {comparedCombinations.map((combo) => (
              <div
                key={`${combo.volume}-${combo.id}`}
                className="flex h-5 w-10 rounded overflow-hidden border border-white/20"
                title={`Vol.${combo.volume} № ${combo.id}`}
              >
                {combo.colors.map((c) => (
                  <div key={c.id} style={{ backgroundColor: c.hex }} className="flex-1 h-full" />
                ))}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <Columns2 size={13} />
            <span className="tabular-nums">Compare ({comparedCombinations.length}/3)</span>
          </button>
          <button
            type="button"
            aria-label="Clear comparison tray"
            onClick={() => setCompareKeys([])}
            className="p-1 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* Lazy-Loaded Modals */}
      <Suspense fallback={null}>
        {selectedCombo && (
          <ModalStudio
            combination={selectedCombo}
            onClose={() => setSelectedCombo(null)}
            isFavorite={favoriteSet.has(getComboKey(selectedCombo.id, selectedCombo.volume))}
            isCompared={compareSet.has(getComboKey(selectedCombo.id, selectedCombo.volume))}
            onToggleFavorite={toggleFavorite}
            onToggleCompare={toggleCompare}
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
            onFilterBySwatch={(color) => {
              setReturnCombo(null);
              setViewMode('combinations');
              setVolumeFilter('all');
              setSeasonFilter('all');
              setMonthFilter('all');
              setSwatchIdFilter(color.id);
            }}
          />
        )}

        {compareOpen && (
          <CompareModal
            combinations={comparedCombinations}
            onClose={() => setCompareOpen(false)}
            onRemove={(id, volume) =>
              setCompareKeys((prev) => prev.filter((k) => k !== getComboKey(id, volume)))
            }
            onClearAll={() => setCompareKeys([])}
            onSelectCombo={(combo) => {
              setReturnCombo(null);
              setSelectedCombo(combo);
            }}
            onCopyText={handleCopyText}
          />
        )}
      </Suspense>

      <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
    </div>
  );
};
