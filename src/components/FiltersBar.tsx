import React from 'react';
import { PaletteSizeFilter, ToneFilter, SortOption } from '../types/color';

interface FiltersBarProps {
  activeSize: PaletteSizeFilter;
  onSizeChange: (size: PaletteSizeFilter) => void;
  activeTone: ToneFilter;
  onToneChange: (tone: ToneFilter) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalFiltered: number;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  activeSize,
  onSizeChange,
  activeTone,
  onToneChange,
  sortBy,
  onSortChange,
  totalFiltered,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-stone-300/30 dark:border-stone-800 mb-6">
      {/* Palette Size Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-stone-500 font-medium mr-1">Palettes:</span>
        {(['all', 2, 3, 4] as const).map((size) => {
          const labels: Record<string, string> = {
            all: 'All (348)',
            2: '2-Color (160)',
            3: '3-Color (114)',
            4: '4-Color (74)',
          };
          const isActive = activeSize === size;
          return (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                isActive
                  ? 'bg-amber-900 text-amber-50 dark:bg-amber-700 shadow-xs'
                  : 'bg-stone-200/60 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-300/60 dark:hover:bg-stone-700'
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
                className={`px-2 py-0.5 text-xs capitalize rounded transition-colors ${
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
            <option value="number-asc">№ Number (Ascending)</option>
            <option value="number-desc">№ Number (Descending)</option>
            <option value="contrast-desc">Highest Contrast</option>
            <option value="popularity">Most Common Colors</option>
          </select>
        </div>

        {/* Filter Count Badge */}
        <span className="text-xs font-code text-stone-500 dark:text-stone-400">
          Showing {totalFiltered}
        </span>
      </div>
    </div>
  );
};
