import React, { useMemo, useState } from 'react';
import { Pipette, X, ArrowRight } from 'lucide-react';
import { ColorItem } from '../types/color';
import { findClosestColors, normalizeHex, getIdealTextColor } from '../utils/colorUtils';

interface ColorMatcherPanelProps {
  allColors: ColorItem[];
  onSelectColor: (color: ColorItem) => void;
  onClose: () => void;
}

export const ColorMatcherPanel: React.FC<ColorMatcherPanelProps> = ({
  allColors,
  onSelectColor,
  onClose,
}) => {
  const [hexInput, setHexInput] = useState('#c54432');

  const validHex = useMemo(() => normalizeHex(hexInput), [hexInput]);
  const pickerHex = validHex || '#c54432';

  const matches = useMemo(() => {
    if (!validHex) return [];
    return findClosestColors(validHex, allColors, 6);
  }, [validHex, allColors]);

  return (
    <section
      aria-label="Closest Sanzo Wada Color Matcher"
      className="mb-6 rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 sm:p-5 shadow-md animate-in fade-in"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-800/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center">
            <Pipette size={16} />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
              Closest Wada Swatch Matcher (CIEDE2000)
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Pick or enter any HEX color to find perceptually nearest archival swatches and their palettes.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950">
            <input
              type="color"
              aria-label="Pick target color"
              value={pickerHex}
              onChange={(e) => setHexInput(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
            />
            <input
              type="text"
              aria-label="Target HEX color code"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              placeholder="#c54432"
              maxLength={7}
              className="w-24 text-xs font-code uppercase bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 rounded px-1"
            />
          </label>
          <button
            type="button"
            aria-label="Close color matcher"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!validHex ? (
        <p className="pt-4 text-xs text-rose-600 dark:text-rose-400 font-code">
          Enter a valid 3- or 6-digit HEX value (e.g. #284b63 or #f90).
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
          {matches.map(({ color, deltaE }) => {
            const totalPalettes =
              (color.combinations?.length || 0) + (color.vol2Cards?.length || 0);
            const qualityLabel =
              deltaE < 2 ? 'Near Exact' : deltaE < 6 ? 'Close Match' : 'Similar Tone';
            const matchText = getIdealTextColor(color.hex);

            return (
              <button
                type="button"
                key={color.id}
                onClick={() => onSelectColor(color)}
                className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-800/50 dark:hover:border-amber-500/50 bg-stone-50/60 dark:bg-stone-950/40 text-left transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Split comparison swatch: target vs Wada match */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 shrink-0 flex">
                    <div style={{ backgroundColor: pickerHex }} className="w-1/3 h-full" title={`Target ${pickerHex}`} />
                    <div
                      style={{ backgroundColor: color.hex, color: matchText }}
                      className="w-2/3 h-full flex items-end justify-end p-1 text-[9px] font-code"
                    >
                      #{color.id}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-editorial font-bold text-stone-900 dark:text-stone-100 truncate">
                      {color.name}
                      {color.ja && (
                        <span className="font-normal text-stone-500 ml-1">({color.ja})</span>
                      )}
                    </div>
                    <div className="text-[11px] font-code text-stone-500 dark:text-stone-400">
                      {color.hex.toUpperCase()} • {totalPalettes} palettes
                    </div>
                    <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-code">
                      <span className="px-1.5 py-0.2 rounded bg-amber-800/10 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 font-semibold">
                        ΔE {deltaE.toFixed(1)}
                      </span>
                      <span className="text-stone-500">{qualityLabel}</span>
                    </div>
                  </div>
                </div>
                <ArrowRight
                  size={14}
                  className="text-stone-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 shrink-0 transition-colors"
                />
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
};
