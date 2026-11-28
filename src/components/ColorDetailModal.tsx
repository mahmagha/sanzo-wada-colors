import React, { useRef } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowLeft,
  Share2,
  Filter,
  Plus,
  Brain,
} from 'lucide-react';
import { ColorItem, Combination } from '../types/color';
import { formatOklch, getIdealTextColor } from '../utils/colorUtils';
import { analyzeColorPsychology, MOOD_META } from '../utils/colorPsychology';
import { useModalDialog } from '../utils/useModalDialog';

interface ColorDetailModalProps {
  color: ColorItem | null;
  onClose: () => void;
  allCombinations: Combination[];
  onSelectCombination: (combo: Combination) => void;
  onCopyText: (text: string, label: string) => void;
  onBackToCombo?: () => void;
  backLabel?: string;
  onShareLink?: (color: ColorItem) => void;
  onFilterBySwatch?: (color: ColorItem) => void;
  onAddToCustom?: (color: ColorItem) => void;
}

export const ColorDetailModal: React.FC<ColorDetailModalProps> = ({
  color,
  onClose,
  allCombinations,
  onSelectCombination,
  onCopyText,
  onBackToCombo,
  backLabel,
  onShareLink,
  onFilterBySwatch,
  onAddToCustom,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalDialog({
    isOpen: Boolean(color),
    dialogRef,
    onClose,
  });

  if (!color) return null;

  const textColor = getIdealTextColor(color.hex);
  const colorPsych = analyzeColorPsychology(color);
  const moodMeta = MOOD_META[colorPsych.primaryMood];
  const matchedCombinations = allCombinations.filter(
    (c) =>
      (c.volume === 1 && color.combinations?.includes(c.id)) ||
      (c.volume === 2 && color.vol2Cards?.includes(c.id))
  );

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="color-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Swatch Header Banner */}
        <div
          style={{ backgroundColor: color.hex, color: textColor }}
          className="p-6 sm:p-10 relative flex flex-col justify-between min-h-[190px] shrink-0"
        >
          <div className="flex justify-between items-start gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {onBackToCombo && (
                <button
                  type="button"
                  onClick={onBackToCombo}
                  style={{ color: textColor }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs text-xs font-medium transition-colors cursor-pointer"
                >
                  <ArrowLeft size={13} />
                  <span>{backLabel || 'Back to Palette'}</span>
                </button>
              )}
              <span className="text-xs font-code uppercase tracking-widest opacity-85">
                Color #{color.id.toString().padStart(3, '0')} • Swatch {color.swatch}
              </span>
              {color.volume === 2 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-code font-bold bg-amber-400 text-amber-950 flex items-center gap-1">
                  <Sparkles size={9} /> Vol. 2 New Color
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              {onShareLink && (
                <button
                  type="button"
                  onClick={() => onShareLink(color)}
                  style={{ color: textColor }}
                  aria-label="Copy shareable link to this swatch"
                  title="Copy shareable link"
                  className="p-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs transition-opacity cursor-pointer"
                >
                  <Share2 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                style={{ color: textColor }}
                aria-label="Close color details"
                className="p-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs transition-opacity cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="mt-4">
            {color.ja && (
              <div className="text-sm font-editorial font-bold opacity-90 mb-1">
                {color.ja}
                {color.reading && (
                  <span className="font-sans font-normal text-xs ml-1.5 opacity-80">
                    ({color.reading})
                  </span>
                )}
              </div>
            )}
            <h2
              id="color-modal-title"
              className="text-2xl sm:text-4xl font-editorial font-bold tracking-tight"
            >
              {color.name}
            </h2>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm font-code uppercase tracking-wider font-semibold">
                {color.hex}
              </span>
              <button
                type="button"
                onClick={() => onCopyText(color.hex, `Copied ${color.name} (${color.hex})`)}
                style={{ color: textColor }}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 backdrop-blur-xs text-xs font-medium transition-colors cursor-pointer"
              >
                <Copy size={12} />
                <span>Copy Hex</span>
              </button>
              {onFilterBySwatch && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onFilterBySwatch(color);
                  }}
                  style={{ color: textColor }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 backdrop-blur-xs text-xs font-medium transition-colors cursor-pointer"
                >
                  <Filter size={12} />
                  <span>Show in Grid ({matchedCombinations.length})</span>
                </button>
              )}
              {onAddToCustom && (
                <button
                  type="button"
                  onClick={() => onAddToCustom(color)}
                  style={{ color: textColor }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-black/20 hover:bg-black/30 backdrop-blur-xs text-xs font-medium transition-colors cursor-pointer"
                >
                  <Plus size={12} />
                  <span>Add to Mix</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Color Values Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40 sm:col-span-2">
              <span className="text-[11px] text-stone-500 font-medium">OKLCH</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1">
                {formatOklch(color.rgb)}
              </div>
            </div>
            <div className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/40">
              <span className="text-[11px] text-stone-500 font-medium">Palettes</span>
              <div className="text-xs sm:text-sm font-code font-bold mt-1 text-amber-900 dark:text-amber-400">
                {matchedCombinations.length} Palettes
              </div>
            </div>
          </div>

          {/* Mood & Color Psychology Insight */}
          <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-950/40 space-y-2.5 text-xs">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-editorial font-bold text-stone-900 dark:text-stone-100">
                <Brain size={14} className="text-amber-800 dark:text-amber-400" />
                <span>Mood &amp; Color Psychology</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap font-code text-[10px]">
                <span className={`px-2 py-0.5 rounded-full font-semibold ${moodMeta.badgeClass}`}>
                  {moodMeta.shortLabel}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {colorPsych.temperature}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-stone-200/70 dark:bg-stone-800 text-stone-700 dark:text-stone-300">
                  {colorPsych.arousal}
                </span>
              </div>
            </div>
            <div className="font-editorial font-semibold text-sm text-stone-900 dark:text-stone-100">
              {colorPsych.headline}
            </div>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              {colorPsych.effectNote}
            </p>
            <p className="text-stone-500 dark:text-stone-400 leading-relaxed">
              <strong className="text-stone-700 dark:text-stone-200">Context:</strong>{' '}
              {colorPsych.culturalNuance}
            </p>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed pt-1 border-t border-stone-200/70 dark:border-stone-800">
              <strong className="text-stone-700 dark:text-stone-200">Pairing &amp; Usage:</strong>{' '}
              {colorPsych.pairingGuidance}
            </p>
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
                <button
                  type="button"
                  key={`${combo.volume}-${combo.id}`}
                  onClick={() => onSelectCombination(combo)}
                  className="group p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-800/40 dark:hover:border-amber-500/40 bg-stone-50/50 dark:bg-stone-900/40 hover:bg-white dark:hover:bg-stone-800 transition-all cursor-pointer flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-14 h-9 rounded overflow-hidden flex border border-stone-300 dark:border-stone-700 shrink-0">
                      {combo.colors.map((c) => (
                        <div
                          key={c.id}
                          style={{ backgroundColor: c.hex }}
                          className="flex-1 h-full"
                        />
                      ))}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-editorial font-bold flex items-center gap-1.5">
                        <span>
                          {combo.volume === 2
                            ? `Vol. 2 Card № ${combo.id}`
                            : `№ ${combo.id.toString().padStart(3, '0')}`}
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

                  <span className="text-stone-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors shrink-0">
                    <ExternalLink size={14} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
