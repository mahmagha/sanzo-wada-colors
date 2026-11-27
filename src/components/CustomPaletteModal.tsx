import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Sparkles, Shuffle, Trash2, Check, Search, BookmarkPlus, Columns2 } from 'lucide-react';
import { ColorItem, Combination, HydratedCombination, ToneFilter } from '../types/color';
import {
  classifyColorTone,
  createCustomCombination,
  getCompareKey,
  getIdealTextColor,
} from '../utils/colorUtils';
import { matchesColorTokens } from '../utils/searchUtils';
import { useModalDialog } from '../utils/useModalDialog';

interface SavedCustomMix {
  id: string;
  name: string;
  colorIds: number[];
}

interface CustomPaletteModalProps {
  isOpen: boolean;
  allColors: ColorItem[];
  selectedIds: number[];
  onChangeIds: (ids: number[]) => void;
  onClose: () => void;
  onLaunchStudio: (combo: Combination) => void;
  onPinCompare?: (combo: HydratedCombination) => void;
  compareSet?: Set<string>;
}

const MAX_CUSTOM_COLORS = 6;
const SAVED_MIXES_KEY = 'sanzo-wada-saved-mixes-v1';

export const CustomPaletteModal: React.FC<CustomPaletteModalProps> = ({
  isOpen,
  allColors,
  selectedIds,
  onChangeIds,
  onClose,
  onLaunchStudio,
  onPinCompare,
  compareSet,
}) => {
  const [query, setQuery] = useState('');
  const [tone, setTone] = useState<ToneFilter>('all');
  const [mixName, setMixName] = useState('');
  const [savedMixes, setSavedMixes] = useState<SavedCustomMix[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_MIXES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage errors
    }
    return [];
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_MIXES_KEY, JSON.stringify(savedMixes));
    } catch {
      // Ignore storage errors
    }
  }, [savedMixes]);

  useModalDialog({
    isOpen,
    dialogRef,
    onClose,
  });

  const colorById = useMemo(
    () => new Map<number, ColorItem>(allColors.map((c) => [c.id, c])),
    [allColors]
  );

  const selectedColors = useMemo(
    () => selectedIds.map((id) => colorById.get(id)).filter((c): c is ColorItem => Boolean(c)),
    [selectedIds, colorById]
  );

  const filteredSwatches = useMemo(() => {
    return allColors.filter((c) => {
      if (tone !== 'all' && classifyColorTone(c.rgb) !== tone) return false;
      if (query.trim() && !matchesColorTokens(c, query)) return false;
      return true;
    });
  }, [allColors, tone, query]);

  if (!isOpen) return null;

  const toggleColor = (id: number) => {
    if (selectedIds.includes(id)) {
      onChangeIds(selectedIds.filter((item) => item !== id));
    } else if (selectedIds.length < MAX_CUSTOM_COLORS) {
      onChangeIds([...selectedIds, id]);
    }
  };

  const handleRandomMix = () => {
    const pool = [...allColors];
    const picked: number[] = [];
    while (picked.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool[idx].id);
      pool.splice(idx, 1);
    }
    onChangeIds(picked);
  };

  const handleSaveMix = () => {
    if (selectedColors.length < 2) return;
    const label = mixName.trim() || `Mix ${savedMixes.length + 1} (${selectedColors.length} colors)`;
    const next: SavedCustomMix = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: label,
      colorIds: selectedColors.map((c) => c.id),
    };
    setSavedMixes((prev) => [next, ...prev].slice(0, 12));
    setMixName('');
  };

  const handleOpenInStudio = () => {
    if (selectedColors.length < 2) return;
    onClose();
    onLaunchStudio({
      id: 0,
      volume: 1,
      size: selectedColors.length,
      colors: selectedColors,
    });
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-palette-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 shrink-0">
          <div>
            <h2 id="custom-palette-title" className="text-base sm:text-lg font-editorial font-bold">
              Custom Wada Palette Composer ({selectedColors.length} / {MAX_CUSTOM_COLORS})
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Select 2 to 6 master pigments, save named mixes, or inspect directly in Studio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close custom palette composer"
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Selected Strip & Save Bar */}
        <div className="p-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-950/30 space-y-3 shrink-0">
          {selectedColors.length > 0 ? (
            <div className="flex h-16 rounded-xl overflow-hidden border border-stone-300 dark:border-stone-700">
              {selectedColors.map((c) => {
                const txt = getIdealTextColor(c.hex);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleColor(c.id)}
                    style={{ backgroundColor: c.hex, color: txt }}
                    title={`Click to remove ${c.name}`}
                    className="flex-1 p-2 flex flex-col justify-between text-left hover:opacity-90 transition-opacity cursor-pointer min-w-0"
                  >
                    <span className="text-[10px] font-code opacity-80">#{c.id} ×</span>
                    <span className="text-xs font-editorial font-bold truncate">{c.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="h-16 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 flex items-center justify-center text-xs text-stone-500">
              Pick at least 2 swatches below (or roll a random 3-color mix).
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleRandomMix}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <Shuffle size={13} />
                <span>Random 3-Color Mix</span>
              </button>
              <button
                type="button"
                onClick={() => onChangeIds([])}
                disabled={selectedIds.length === 0}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Clear</span>
              </button>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={mixName}
                  onChange={(e) => setMixName(e.target.value)}
                  placeholder="Name mix..."
                  aria-label="Custom palette name"
                  className="w-28 sm:w-36 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                />
                <button
                  type="button"
                  onClick={handleSaveMix}
                  disabled={selectedColors.length < 2}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-40 cursor-pointer"
                >
                  <BookmarkPlus size={13} />
                  <span>Save</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onPinCompare && (
                <button
                  type="button"
                  onClick={() => {
                    if (selectedColors.length >= 2) {
                      onPinCompare(createCustomCombination(selectedColors));
                    }
                  }}
                  disabled={selectedColors.length < 2}
                  aria-pressed={
                    selectedColors.length >= 2
                      ? compareSet?.has(getCompareKey({ id: 0, volume: 1, colors: selectedColors })) ?? false
                      : false
                  }
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${
                    selectedColors.length >= 2 &&
                    compareSet?.has(getCompareKey({ id: 0, volume: 1, colors: selectedColors }))
                      ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-700/40 text-amber-900 dark:text-amber-300'
                      : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <Columns2 size={13} />
                  <span>
                    {selectedColors.length >= 2 &&
                    compareSet?.has(getCompareKey({ id: 0, volume: 1, colors: selectedColors }))
                      ? 'Pinned to Compare'
                      : 'Pin to Compare'}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenInStudio}
                disabled={selectedColors.length < 2}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Open in Studio</span>
              </button>
            </div>
          </div>

          {/* Saved Custom Mixes Row */}
          {savedMixes.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-1">
              <span className="text-[11px] text-stone-500 font-medium">Saved:</span>
              {savedMixes.map((mix) => (
                <div
                  key={mix.id}
                  className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden text-xs"
                >
                  <button
                    type="button"
                    onClick={() => onChangeIds(mix.colorIds)}
                    className="flex items-center gap-1.5 px-2.5 py-1 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <span className="flex h-3 w-6 rounded overflow-hidden border border-black/15">
                      {mix.colorIds.map((id) => (
                        <span
                          key={id}
                          style={{ backgroundColor: colorById.get(id)?.hex || '#999' }}
                          className="flex-1 h-full"
                        />
                      ))}
                    </span>
                    <span className="font-medium truncate max-w-[110px]">{mix.name}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete saved mix ${mix.name}`}
                    onClick={() =>
                      setSavedMixes((prev) => prev.filter((item) => item.id !== mix.id))
                    }
                    className="px-1.5 py-1 text-stone-400 hover:text-rose-500 border-l border-stone-200 dark:border-stone-800 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Picker Filter Bar */}
        <div className="px-4 py-3 border-b border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter 171 pigments..."
              aria-label="Filter pigments for custom palette"
              className="w-full pl-8 pr-3 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            />
          </div>

          <div className="flex items-center gap-1 flex-wrap text-xs">
            {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setTone(t)}
                className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                  tone === t
                    ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                    : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Swatch Grid */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {filteredSwatches.map((c) => {
            const isSelected = selectedIds.includes(c.id);
            const txt = getIdealTextColor(c.hex);
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => toggleColor(c.id)}
                disabled={!isSelected && selectedIds.length >= MAX_CUSTOM_COLORS}
                style={{ backgroundColor: c.hex, color: txt }}
                className={`relative h-20 rounded-xl p-2.5 flex flex-col justify-between text-left border transition-transform cursor-pointer disabled:opacity-45 ${
                  isSelected
                    ? 'ring-2 ring-amber-600 ring-offset-2 dark:ring-offset-stone-900 scale-[0.98]'
                    : 'border-black/15 hover:scale-[1.02]'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-[10px] font-code opacity-80">#{c.id}</span>
                  {isSelected && <Check size={14} strokeWidth={3} />}
                </div>
                <div className="w-full">
                  <div className="text-xs font-editorial font-bold truncate">{c.name}</div>
                  <div className="text-[10px] font-code opacity-80 uppercase">{c.hex}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
