import React from 'react';
import { Calendar, RotateCcw } from 'lucide-react';
import {
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
}) => {
  const visibleMonths =
    activeSeason === 'all'
      ? MONTH_OPTIONS
      : MONTH_OPTIONS.filter((m) => SEASON_MONTHS[activeSeason].includes(m.month));

  return (
    <div className="space-y-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
      {/* Top Row: Volume Selector & Seasonal / Month Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Volume Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60">
          <button
            type="button"
            onClick={() => onVolumeChange('all')}
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
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
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
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
            className={`px-3 py-1 text-xs rounded-md font-semibold transition-all ${
              volume === 2
                ? 'bg-emerald-800 text-emerald-50 dark:bg-emerald-700 shadow-xs'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Vol. 2: Seasonal <span className="font-code text-[11px] opacity-75">(72)</span>
          </button>
        </div>

        {/* Season & 12-Month Calendar Filter (Shown when Volume 2 or All is active) */}
        {(volume === 2 || volume === 'all') && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-500 font-medium mr-1">Seasons (Vol. 2):</span>
            {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((season) => {
              const seasonLabels: Record<SeasonFilter, string> = {
                all: 'All',
                spring: '🌸 Spring (春)',
                summer: '🌿 Summer (夏)',
                autumn: '🍁 Autumn (秋)',
                winter: '❄️ Winter (冬)',
              };
              const isActive = activeSeason === season;
              return (
                <button
                  type="button"
                  key={season}
                  onClick={() => onSeasonChange(season)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    isActive
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700/60'
                  }`}
                >
                  {seasonLabels[season]}
                </button>
              );
            })}

            {/* 12-Month Calendar Dropdown */}
            <div className="flex items-center gap-1 ml-1">
              <Calendar size={13} className="text-stone-500" aria-hidden="true" />
              <select
                aria-label="Filter by Japanese calendar month"
                value={activeMonth}
                onChange={(e) => {
                  const val = e.target.value;
                  onMonthChange(val === 'all' ? 'all' : Number(val));
                }}
                className="px-2 py-1 text-xs rounded-md border border-stone-300 dark:border-stone-700 bg-white/80 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
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
        )}
      </div>

      {/* Second Row: Palette Size Pills & Tone & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap pt-1">
        {/* Palette Size Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
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
                className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
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

        {/* Tone & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Tone Filter */}
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
                    className={`px-1.5 py-0.5 text-xs capitalize rounded transition-colors ${
                      isActive
                        ? 'font-semibold text-amber-950 dark:text-amber-200 underline underline-offset-4 decoration-amber-600'
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
          <div className="flex items-center gap-1 text-xs ml-auto sm:ml-0">
            <span className="text-stone-500 font-medium">Sort:</span>
            <select
              aria-label="Sort combinations"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white/70 dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none cursor-pointer"
            >
              <option value="number-asc">№ Number (Asc)</option>
              <option value="number-desc">№ Number (Desc)</option>
              <option value="contrast-desc">Highest Contrast</option>
              <option value="popularity">Most Common</option>
            </select>
          </div>

          {/* Count Badge & Quick Reset */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-code text-stone-500 dark:text-stone-400">
              Showing {totalFiltered}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-stone-800 transition-colors"
                title="Reset all active filters"
              >
                <RotateCcw size={11} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
