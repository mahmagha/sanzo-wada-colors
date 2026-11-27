import React, { useMemo, useState } from 'react';
import { ArrowRight, CircleDot, Plus, Sparkles } from 'lucide-react';
import {
  ColorItem,
  Combination,
  HydratedCombination,
  ToneFilter,
  VolumeFilter,
} from '../types/color';
import { formatOklch, getIdealTextColor } from '../utils/colorUtils';
import { WadaColorWheel } from './WadaColorWheel';

interface ColorWheelPageProps {
  allColors: ColorItem[];
  filteredColors: ColorItem[];
  allCombinations: HydratedCombination[];
  volumeFilter: VolumeFilter;
  onVolumeChange: (vol: VolumeFilter) => void;
  toneFilter: ToneFilter;
  onToneChange: (tone: ToneFilter) => void;
  hasKanjiOnly: boolean;
  onToggleKanji: () => void;
  kanjiTotalCount: number;
  onResetFilters: () => void;
  onSelectColorModal: (color: ColorItem) => void;
  onSelectCombo: (combo: Combination) => void;
  onAddToCustom: (color: ColorItem) => void;
}

export const ColorWheelPage: React.FC<ColorWheelPageProps> = ({
  allColors,
  filteredColors,
  allCombinations,
  volumeFilter,
  onVolumeChange,
  toneFilter,
  onToneChange,
  hasKanjiOnly,
  onToggleKanji,
  kanjiTotalCount,
  onResetFilters,
  onSelectColorModal,
  onSelectCombo,
  onAddToCustom,
}) => {
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(
    () => filteredColors[0] ?? allColors[0] ?? null
  );

  const activeColor = useMemo(() => {
    if (selectedColor && filteredColors.some((c) => c.id === selectedColor.id)) {
      return selectedColor;
    }
    return filteredColors[0] ?? selectedColor ?? allColors[0];
  }, [selectedColor, filteredColors, allColors]);

  const matchingCombos = useMemo(() => {
    if (!activeColor) return [];
    return allCombinations
      .filter((c) => c.colors.some((sw) => sw.id === activeColor.id))
      .slice(0, 6);
  }, [activeColor, allCombinations]);

  const hasActiveFilters = volumeFilter !== 'all' || toneFilter !== 'all' || hasKanjiOnly;

  return (
    <section aria-label="Sanzo Wada 360° Color Wheel Page" className="space-y-5">
      {/* Header & Wheel Filters */}
      <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 sm:p-5 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-800/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
            <CircleDot size={18} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-editorial font-bold text-stone-900 dark:text-stone-100">
              360° Color Wheel Chooser ({filteredColors.length} / 171 Pigments)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Explore all available historical pigments arranged radially by Hue &amp; Depth, with Neutral shades spiraling inside the center ring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1 flex-wrap">
            {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map(
              (tone) => (
                <button
                  type="button"
                  key={tone}
                  onClick={() => onToneChange(tone)}
                  aria-pressed={toneFilter === tone}
                  className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                    toneFilter === tone
                      ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  }`}
                >
                  {tone}
                </button>
              )
            )}
          </div>

          <button
            type="button"
            onClick={onToggleKanji}
            aria-pressed={hasKanjiOnly}
            className={`px-2 py-1 text-xs font-medium rounded border transition-colors cursor-pointer ${
              hasKanjiOnly
                ? 'bg-amber-900 text-amber-50 border-amber-900 dark:bg-amber-700 dark:border-amber-700'
                : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-200/50 dark:hover:bg-stone-800'
            }`}
          >
            Kanji ({kanjiTotalCount})
          </button>

          <div className="flex items-center gap-1 bg-stone-200/60 dark:bg-stone-800 p-0.5 rounded-lg">
            {(
              [
                ['all', 'All (171)'],
                [1, 'Vol. 1'],
                [2, 'Vol. 2'],
              ] as const
            ).map(([vol, label]) => (
              <button
                type="button"
                key={String(vol)}
                onClick={() => onVolumeChange(vol)}
                className={`px-2 py-1 rounded font-medium cursor-pointer ${
                  volumeFilter === vol
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="px-2.5 py-1 rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Dedicated Color Wheel Layout */}
      {filteredColors.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-7">
            <WadaColorWheel
              colors={filteredColors}
              onSelectColor={setSelectedColor}
              selectedIds={activeColor ? [activeColor.id] : []}
            />
          </div>

          {/* Focused Pigment Details & Curated Palettes */}
          {activeColor && (
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 overflow-hidden shadow-sm">
                <div
                  style={{
                    backgroundColor: activeColor.hex,
                    color: getIdealTextColor(activeColor.hex),
                  }}
                  className="p-5 sm:p-6 flex flex-col justify-between min-h-[150px]"
                >
                  <div className="flex items-center justify-between text-xs font-code opacity-85">
                    <span>SWATCH #{activeColor.id} • VOL. {activeColor.volume}</span>
                    <span className="uppercase">{activeColor.hex}</span>
                  </div>

                  <div>
                    {activeColor.ja && (
                      <div className="text-sm font-editorial opacity-90">
                        {activeColor.ja}
                        {activeColor.reading && (
                          <span className="font-sans text-xs ml-1.5 opacity-80">
                            ({activeColor.reading})
                          </span>
                        )}
                      </div>
                    )}
                    <h3 className="text-2xl font-editorial font-bold tracking-tight mt-0.5">
                      {activeColor.name}
                    </h3>
                  </div>
                </div>

                <div className="p-4 sm:p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-2 font-code">
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block">OKLCH</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {formatOklch(activeColor.rgb)}
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                      <span className="text-[10px] text-stone-400 block">RGB / CMYK</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200">
                        {activeColor.rgb.join(', ')} • K{activeColor.cmyk[3]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onSelectColorModal(activeColor)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 font-medium hover:opacity-90 cursor-pointer"
                    >
                      <span>Open Pigment Sheet</span>
                      <ArrowRight size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAddToCustom(activeColor)}
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 font-medium cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Add to Mix</span>
                    </button>
                  </div>

                  {/* Harmonies Featuring This Swatch */}
                  <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
                    <div className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300 font-medium">
                      <Sparkles size={13} className="text-amber-700 dark:text-amber-400" />
                      <span>Appears in {matchingCombos.length}+ Harmonies:</span>
                    </div>

                    {matchingCombos.length > 0 ? (
                      <div className="space-y-1.5">
                        {matchingCombos.map((combo) => (
                          <button
                            type="button"
                            key={`${combo.volume}-${combo.id}`}
                            onClick={() => onSelectCombo(combo)}
                            className="w-full flex items-center justify-between gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 hover:border-amber-700/60 bg-stone-50/70 dark:bg-stone-950/40 text-left cursor-pointer transition-colors"
                          >
                            <span className="flex h-4 w-14 rounded overflow-hidden border border-black/15 shrink-0">
                              {combo.colors.map((c) => (
                                <span
                                  key={c.id}
                                  style={{ backgroundColor: c.hex }}
                                  className="flex-1"
                                />
                              ))}
                            </span>
                            <span className="font-editorial font-bold text-stone-900 dark:text-stone-100 truncate flex-1">
                              {combo.volume === 2
                                ? `Vol. 2 Card № ${combo.id}`
                                : `Vol. 1 № ${combo.id}`}
                            </span>
                            <span className="text-[11px] font-code text-amber-800 dark:text-amber-400">
                              Studio →
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-stone-400">No documented combinations under active filter.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="py-16 text-center rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/60 dark:bg-stone-900/60">
          <p className="text-base font-editorial text-stone-500 mb-3">
            No pigments match your current search or filter.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </section>
  );
};
