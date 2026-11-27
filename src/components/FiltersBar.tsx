import React from 'react';
import { Calendar, Filter, RotateCcw, X } from 'lucide-react';
import {
  ColorItem,
  VolumeFilter,
  PaletteSizeFilter,
  ToneFilter,
  SeasonFilter,
  SortOption,
} from '../types/color';
import { MONTH_OPTIONS, SEASON_MONTHS } from '../utils/paletteData';

interface FiltersBarProps {
  volume: VolumeFilter;
  onVolumeChange: (vol: VolumeFilter) => void;
  activeSize: PaletteSizeFilter;
  onSizeChange: (size: PaletteSizeFilter) => void;
  activeTone: ToneFilter;
  onToneChange: (tone: ToneFilter) => void;
  activeSeason: SeasonFilter;
  onSeasonChange: (season: SeasonFilter) => void;
  activeMonth: number | 'all';
  onMonthChange: (month: number | 'all') => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFiltered: number;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  activeSwatch: ColorItem | null;
  onClearSwatch: () => void;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  volume,
  onVolumeChange,
  activeSize,
  onSizeChange,
  activeTone,
  onToneChange,
  activeSeason,
  onSeasonChange,
  activeMonth,
  onMonthChange,
  sortBy,
  onSortChange,
  totalFiltered,
  hasActiveFilters,
  onResetFilters,
  activeSwatch,
  onClearSwatch,
}) => {
  const visibleMonths =
    activeSeason === 'all'
      ? MONTH_OPTIONS
      : MONTH_OPTIONS.filter((m) => SEASON_MONTHS[activeSeason].includes(m.month));

  const isVol1Only = volume === 1;

  return (
    <div className="space-y-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
      {/* Top Row: Volume Selector & Seasonal / Month Filters (always rendered to prevent layout jumps) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Volume Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 self-start shrink-0">
          <button
            type="button"
            onClick={() => onVolumeChange('all')}
            aria-pressed={volume === 'all'}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
              volume === 'all'
                ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            All Volumes <span className="font-code text-[11px] opacity-75">(420)</span>
          </button>
          <button
            type="button"
            onClick={() => onVolumeChange(1)}
            aria-pressed={volume === 1}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
              volume === 1
                ? 'bg-amber-900 text-amber-50 dark:bg-amber-700 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Vol. 1: Harmony <span className="font-code text-[11px] opacity-75">(348)</span>
          </button>
          <button
            type="button"
            onClick={() => onVolumeChange(2)}
            aria-pressed={volume === 2}
            className={`px-3 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
              volume === 2
                ? 'bg-emerald-800 text-emerald-50 dark:bg-emerald-700 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Vol. 2: Seasonal <span className="font-code text-[11px] opacity-75">(72)</span>
          </button>
        </div>

        {/* Season & 12-Month Calendar Filter (kept mounted with fixed dropdown width) */}
        <div
          className={`flex items-center gap-1.5 flex-wrap transition-opacity ${
            isVol1Only ? 'opacity-50' : 'opacity-100'
          }`}
        >
          <span className="text-xs text-stone-500 font-medium mr-0.5 whitespace-nowrap">
            Seasons (Vol. 2):
          </span>
          {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((season) => {
            const seasonLabels: Record<SeasonFilter, string> = {
              all: 'All',
              spring: '🌸 Spring',
              summer: '🌿 Summer',
              autumn: '🍁 Autumn',
              winter: '❄️ Winter',
            };
            const isActive = activeSeason === season && !isVol1Only;
            return (
              <button
                type="button"
                key={season}
                onClick={() => onSeasonChange(season)}
                aria-pressed={isActive}
                title={
                  isVol1Only
                    ? 'Switches to Vol. 2 Seasonal filter'
                    : `Filter by ${season}`
                }
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                    : 'bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700/60'
                }`}
              >
                {seasonLabels[season]}
              </button>
            );
          })}

          <div className="flex items-center gap-1 ml-0.5">
            <Calendar size={13} className="text-stone-500 shrink-0" aria-hidden="true" />
            <select
              aria-label="Filter by Japanese calendar month"
              value={isVol1Only ? 'all' : activeMonth}
              onChange={(e) => {
                const val = e.target.value;
                onMonthChange(val === 'all' ? 'all' : Number(val));
              }}
              className="w-44 px-2 py-1 text-xs rounded-md border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 cursor-pointer truncate"
            >
              <option value="all">
                {activeSeason === 'all' ? 'All 12 Months' : `All ${activeSeason} months`}
              </option>
              {visibleMonths.map((m) => (
                <option key={m.month} value={m.month}>
                  {m.month.toString().padStart(2, '0')} • {m.name} ({m.ja} {m.reading})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Second Row: Palette Size Pills & Tone & Sort & Fixed-Slot Reset */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pt-1">
        {/* Palette Size Buttons */}
        <div className="flex items-center gap-1 flex-wrap shrink-0">
          <span className="text-xs text-stone-500 font-medium mr-1">Colors:</span>
          {(['all', 2, 3, 4, 5] as const).map((size) => {
            const labels: Record<string, string> = {
              all: 'All Sizes',
              2: '2-Color',
              3: '3-Color',
              4: '4-Color',
              5: '5+ Colors',
            };
            const isActive = activeSize === size;
            return (
              <button
                type="button"
                key={size}
                onClick={() => onSizeChange(size)}
                aria-pressed={isActive}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-900 text-amber-50 dark:bg-amber-700 shadow-xs'
                    : 'bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700/60'
                }`}
              >
                {labels[size.toString()]}
              </button>
            );
          })}
        </div>

        {/* Tone, Sort, Count & Permanently-Slotted Reset */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tone Filter (invariant font-medium so buttons never shift width on click) */}
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-stone-500 font-medium mr-1">Tone:</span>
            {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map(
              (tone) => {
                const isActive = activeTone === tone;
                return (
                  <button
                    type="button"
                    key={tone}
                    onClick={() => onToneChange(tone)}
                    aria-pressed={isActive}
                    className={`px-1.5 py-0.5 text-xs font-medium capitalize rounded transition-colors cursor-pointer ${
                      isActive
                        ? 'text-amber-950 dark:text-amber-200 underline underline-offset-4 decoration-2 decoration-amber-700 dark:decoration-amber-400'
                        : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {tone}
                  </button>
                );
              }
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-stone-500 font-medium">Sort:</span>
            <select
              aria-label="Sort combinations"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="w-36 px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 cursor-pointer"
            >
              <option value="number-asc">№ Number (Asc)</option>
              <option value="number-desc">№ Number (Desc)</option>
              <option value="contrast-desc">Highest Contrast</option>
              <option value="popularity">Most Common</option>
            </select>
          </div>

          {/* Fixed-width Count Badge & Always-Rendered Reset Button */}
          <div className="flex items-center gap-2 ml-auto xl:ml-0">
            <span className="text-xs font-code tabular-nums text-stone-500 dark:text-stone-400 min-w-[5.75rem] text-right">
              Showing {totalFiltered}
            </span>
            <button
              type="button"
              onClick={onResetFilters}
              disabled={!hasActiveFilters}
              className={`flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border transition-colors ${
                hasActiveFilters
                  ? 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-200/60 dark:hover:bg-stone-800 cursor-pointer'
                  : 'border-stone-300/50 dark:border-stone-800 text-stone-400 dark:text-stone-600 opacity-45 cursor-not-allowed'
              }`}
              title={hasActiveFilters ? 'Reset all active filters' : 'No active filters'}
            >
              <RotateCcw size={11} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dedicated Active Swatch Filter Bar */}
      {activeSwatch && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg border border-amber-800/30 dark:border-amber-500/30 bg-amber-800/5 dark:bg-amber-500/10 text-xs">
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-amber-800 dark:text-amber-400 shrink-0" />
            <span
              style={{ backgroundColor: activeSwatch.hex }}
              className="w-4 h-4 rounded border border-black/20 shrink-0"
            />
            <span className="text-stone-700 dark:text-stone-200">
              Filtering combinations containing{' '}
              <strong className="font-editorial">
                #{activeSwatch.id} {activeSwatch.name}
              </strong>{' '}
              {activeSwatch.ja && <span>({activeSwatch.ja})</span>}{' '}
              <span className="font-code text-[11px] opacity-75">{activeSwatch.hex}</span>
            </span>
          </div>
          <button
            type="button"
            onClick={onClearSwatch}
            aria-label="Clear swatch filter"
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-white/80 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={12} />
            <span>Clear</span>
          </button>
        </div>
      )}
    </div>
  );
};
