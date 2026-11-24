import React from 'react';
import { X, Copy, ExternalLink, Layers, Sparkles } from 'lucide-react';
import { ColorItem, Combination } from '../types/color';
import { getIdealTextColor } from '../utils/colorUtils';

interface ColorDetailModalProps {
  color: ColorItem | null;
  onClose: () => void;
  allCombinations: Combination[];
  onSelectCombination: (combo: Combination) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ColorDetailModal: React.FC<ColorDetailModalProps> = ({
  color,
  onClose,
  allCombinations,
  onSelectCombination,
  onCopyText,
}) => {
  if (!color) return null;

  const textColor = getIdealTextColor(color.hex);
  const matchedCombinations = allCombinations.filter(
    (c) =>
      (c.volume === 1 && color.combinations?.includes(c.id)) ||
      (c.volume === 2 && color.vol2Cards?.includes(c.id))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swatch Header Banner */}
        <div
          style={{ backgroundColor: color.hex, color: textColor }}
          className="p-8 sm:p-10 relative flex flex-col justify-between min-h-[190px] shrink-0"
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-xs font-code uppercase tracking-widest opacity-85">
                Color #{color.id.toString().padStart(3, '0')} • Swatch {color.swatch}
              </span>
              {color.volume === 2 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-code font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                  <Sparkles size={9} /> Vol. 2 New Color
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              style={{ color: textColor }}
              className="p-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs transition-opacity"
            >
              <X size={18} />
            </button>
          </div>

          <div>
            {color.ja && (
              <div className="text-sm font-editorial font-bold opacity-90 mb-1">
                {color.ja}
                {color.reading && <span className="font-sans font-normal text-xs ml-1.5 opacity-80">({color.reading})</span>}
              </div>
            )}
            <h2 className="text-2xl sm:text-4xl font-editorial font-bold tracking-tight">
              {color.name}
            </h2>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-sm font-code uppercase tracking-wider font-semibold">
                {color.hex}
              </span>
              <button
                onClick={() => onCopyText(color.hex, `Copied ${color.name} (${color.hex})`)}
                style={{ color: textColor }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 backdrop-blur-xs text-xs font-medium transition-colors"
              >
                <Copy size={12} />
                <span>Copy Hex</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Color Values Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 font-medium">RGB</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1">
                {color.rgb.join(', ')}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 font-medium">CMYK (Print)</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1">
                {color.cmyk.join(', ')}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 font-medium">CIE-LAB</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1">
                {color.lab.map((v) => v.toFixed(1)).join(', ')}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 font-medium">Palettes</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1 text-amber-900 dark:text-amber-400">
                {matchedCombinations.length} Palettes
              </div>
            </div>
          </div>

          {/* Combinations containing this color */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Layers size={16} className="text-amber-800 dark:text-amber-400" />
              <h3 className="text-sm font-bold font-editorial text-stone-900 dark:text-stone-100">
                Appears in {matchedCombinations.length} Harmony Combinations:
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {matchedCombinations.map((combo) => (
                <div
                  key={`${combo.volume}-${combo.id}`}
                  onClick={() => {
                    onClose();
                    onSelectCombination(combo);
                  }}
                  className="group p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-800/40 dark:hover:border-amber-500/40 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {/* Swatch Bar */}
                    <div className="w-14 h-9 rounded overflow-hidden flex border border-stone-300 dark:border-stone-700 shrink-0">
                      {combo.colors.map((c) => (
                        <div
                          key={c.id}
                          style={{ backgroundColor: c.hex }}
                          className="flex-1 h-full"
                        />
                      ))}
                    </div>
                    <div>
                      <div className="text-xs font-editorial font-bold flex items-center gap-1.5">
                        <span>
                          {combo.volume === 2 ? `Vol. 2 Card № ${combo.id}` : `№ ${combo.id.toString().padStart(3, '0')}`}
                        </span>
                        {combo.volume === 2 && combo.monthName && (
                          <span className="text-[10px] font-sans font-medium text-amber-800 dark:text-amber-400">
                            ({combo.monthName})
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 truncate max-w-[170px]">
                        {combo.colors.map((c) => c.name).join(' • ')}
                      </div>
                    </div>
                  </div>

                  <span className="text-stone-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                    <ExternalLink size={14} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
