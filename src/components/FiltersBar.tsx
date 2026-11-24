import React from 'react';
import { VolumeFilter, PaletteSizeFilter, ToneFilter, SeasonFilter, SortOption } from '../types/color';

interface FiltersBarProps {
  volume: VolumeFilter;
  onVolumeChange: (vol: VolumeFilter) => void;
  activeSize: PaletteSizeFilter;
  onSizeChange: (size: PaletteSizeFilter) => void;
  activeTone: ToneFilter;
  onToneChange: (tone: ToneFilter) => void;
  activeSeason: SeasonFilter;
  onSeasonChange: (season: SeasonFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFiltered: number;
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
  sortBy,
  onSortChange,
  totalFiltered,
}) => {
  return (
    <div className="space-y-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
      {/* Top Row: Volume Selector & Palette Size */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
        {/* Volume Selector Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60">
          <button
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

        {/* Season Filter (Shown when Volume 2 or All is active) */}
        {(volume === 2 || volume === 'all') && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-stone-500 font-medium mr-1">Seasons (Vol. 2):</span>
            {(['all', 'spring', 'summer', 'autumn', 'winter'] as const).map((season) => {
              const seasonLabels: Record<string, string> = {
                all: 'All',
                spring: '🌸 Spring (春)',
                summer: '🌿 Summer (夏)',
                autumn: '🍁 Autumn (秋)',
                winter: '❄️ Winter (冬)',
              };
              const isActive = activeSeason === season;
              return (
                <button
                  key={season}
                  onClick={() => onSeasonChange(season)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                    isActive
                      ? 'bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                      : 'bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/60'
                  }`}
                >
                  {seasonLabels[season]}
                </button>
              );
            })}
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
                key={size}
                onClick={() => onSizeChange(size)}
                className={`px-2 py-0.5 text-xs rounded font-medium transition-all ${
                  isActive
                    ? 'bg-amber-900 text-amber-50 dark:bg-amber-700 shadow-xs'
                    : 'bg-stone-200/50 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-300/60'
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
          <div className="flex items-center gap-1">
            <span className="text-xs text-stone-500 font-medium mr-1">Tone:</span>
            {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep'] as const).map((tone) => {
              const isActive = activeTone === tone;
              return (
                <button
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
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1 text-xs ml-auto sm:ml-0">
            <span className="text-stone-500 font-medium">Sort:</span>
            <select
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

          {/* Count Badge */}
          <span className="text-xs font-code text-stone-500 dark:text-stone-400">
            Showing {totalFiltered}
          </span>
        </div>
      </div>
    </div>
  );
};
