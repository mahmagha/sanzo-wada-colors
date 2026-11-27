import React, { useRef } from 'react';
import { X, Copy, Sliders, Trash2, Columns2 } from 'lucide-react';
import { HydratedCombination } from '../types/color';
import {
  classifyColorTone,
  generateCssVariables,
  getCompareKey,
  getIdealTextColor,
} from '../utils/colorUtils';
import { useModalDialog } from '../utils/useModalDialog';

interface CompareModalProps {
  combinations: HydratedCombination[];
  onClose: () => void;
  onRemove: (combo: HydratedCombination) => void;
  onClearAll: () => void;
  onSelectCombo: (combo: HydratedCombination) => void;
  onCopyText: (text: string, label: string) => void;
}

export const CompareModal: React.FC<CompareModalProps> = ({
  combinations,
  onClose,
  onRemove,
  onClearAll,
  onSelectCombo,
  onCopyText,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalDialog({
    isOpen: combinations.length > 0,
    dialogRef,
    onClose,
  });

  if (combinations.length === 0) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="compare-modal-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <Columns2 size={18} className="text-amber-800 dark:text-amber-400" />
            <div>
              <h2 id="compare-modal-title" className="text-base sm:text-lg font-editorial font-bold">
                Palette Comparison ({combinations.length} / 3)
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Side-by-side comparison of contrast, color balance, and swatches.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClearAll();
                onClose();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear All</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close comparison dialog"
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div
            className={`grid gap-5 ${
              combinations.length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : combinations.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : 'grid-cols-1 md:grid-cols-3'
            }`}
          >
            {combinations.map((combo) => {
              const comboKey = getCompareKey(combo);
              const title =
                combo.id === 0
                  ? `Custom Mix • ${combo.size} Colors`
                  : combo.volume === 2
                  ? `Vol. 2 Card № ${combo.id.toString().padStart(2, '0')}`
                  : `Vol. 1 № ${combo.id.toString().padStart(3, '0')}`;
              const tones = Array.from(new Set(combo.colors.map((c) => classifyColorTone(c.rgb))));

              return (
                <div
                  key={comboKey}
                  className="flex flex-col rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-950/40 overflow-hidden"
                >
                  <div className="p-3.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-editorial font-bold text-sm">{title}</div>
                      <div className="text-[11px] font-code text-stone-500">
                        {combo.size} Colors • Max {combo.maxContrast.toFixed(1)}:1
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemove(combo)}
                      aria-label={`Remove ${title} from comparison`}
                      className="p-1.5 rounded text-stone-400 hover:text-rose-500 hover:bg-stone-200/50 dark:hover:bg-stone-800 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Swatch Stack */}
                  <div className="p-3 space-y-1.5 flex-1">
                    {combo.colors.map((c) => {
                      const txt = getIdealTextColor(c.hex);
                      return (
                        <div
                          key={c.id}
                          style={{ backgroundColor: c.hex, color: txt }}
                          className="p-2.5 rounded-lg flex items-center justify-between gap-2 shadow-xs"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-editorial font-bold truncate">
                              {c.name} {c.ja && <span className="font-normal">({c.ja})</span>}
                            </div>
                            <div className="text-[10px] font-code opacity-85 uppercase">
                              {c.hex}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onCopyText(c.hex, `Copied ${c.name} (${c.hex})`)}
                            aria-label={`Copy ${c.hex}`}
                            className="p-1 rounded bg-black/15 hover:bg-black/30 cursor-pointer shrink-0"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Metadata & Actions */}
                  <div className="p-3 border-t border-stone-200 dark:border-stone-800 space-y-2.5 bg-white/60 dark:bg-stone-900/60">
                    <div className="flex items-center gap-1 flex-wrap">
                      {tones.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 text-[10px] font-code capitalize rounded bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onSelectCombo(combo)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800 transition-colors cursor-pointer"
                      >
                        <Sliders size={13} />
                        <span>Inspect Studio</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onCopyText(
                            generateCssVariables(combo),
                            `Copied CSS variables for ${title}`
                          )
                        }
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <Copy size={12} />
                        <span>CSS</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
