import React from 'react';
import { Heart, Copy, Sliders } from 'lucide-react';
import { Combination, ColorItem } from '../types/color';
import { getIdealTextColor } from '../utils/colorUtils';

interface CombinationCardProps {
  combination: Combination;
  isFavorite: boolean;
  onToggleFavorite: (id: number, volume: number) => void;
  onSelect: (combo: Combination) => void;
  onCopyText: (text: string, label: string) => void;
}

export const CombinationCard: React.FC<CombinationCardProps> = ({
  combination,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onCopyText,
}) => {
  const { id, volume, size, colors, monthName, monthJa } = combination;

  const handleCopyAllHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    const hexList = colors.map((c) => c.hex).join(', ');
    onCopyText(hexList, `Copied Vol.${volume} № ${id} hex codes: ${hexList}`);
  };

  const handleCopySingleHex = (e: React.MouseEvent, color: ColorItem) => {
    e.stopPropagation();
    onCopyText(color.hex, `Copied ${color.name} (${color.hex})`);
  };

  return (
    <div
      onClick={() => onSelect(combination)}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-stone-300/60 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 shadow-xs hover:shadow-xl hover:border-amber-800/40 dark:hover:border-amber-500/40 transition-all duration-300 cursor-pointer"
    >
      {/* Top Swatch Strip */}
      <div className="h-44 sm:h-48 w-full flex">
        {colors.map((color) => {
          const textColor = getIdealTextColor(color.hex);
          return (
            <div
              key={color.id}
              style={{ backgroundColor: color.hex }}
              className="relative flex-1 h-full transition-all duration-300 group/swatch flex flex-col justify-end p-2 sm:p-2.5 overflow-hidden"
              title={`${color.name}${color.ja ? ` (${color.ja})` : ''} — ${color.hex}`}
            >
              {/* Hover Copy Quick Action */}
              <button
                onClick={(e) => handleCopySingleHex(e, color)}
                style={{ color: textColor }}
                className="opacity-0 group-hover/swatch:opacity-100 absolute top-2 right-2 p-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs transition-opacity"
                title={`Copy ${color.hex}`}
              >
                <Copy size={11} />
              </button>

              {/* Color Name & Hex at bottom of swatch */}
              <div
                style={{ color: textColor }}
                className="opacity-90 group-hover:opacity-100 transition-opacity"
              >
                <div className="text-[10px] sm:text-[11px] font-editorial font-bold leading-tight truncate">
                  {color.ja ? color.ja : color.name}
                </div>
                <div className="text-[9px] sm:text-[10px] font-code opacity-80 uppercase tracking-wider truncate">
                  {color.hex}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Card Info Footer */}
      <div className="p-3.5 flex items-center justify-between gap-2 border-t border-stone-200/50 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-editorial font-bold text-stone-900 dark:text-stone-100 text-sm tracking-wide">
              {volume === 2 ? `Vol.2 № ${id.toString().padStart(2, '0')}` : `№ ${id.toString().padStart(3, '0')}`}
            </span>

            {/* Volume Badge */}
            <span
              className={`px-1.5 py-0.2 text-[9px] font-code font-bold rounded uppercase ${
                volume === 2
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-800'
                  : 'bg-stone-200/80 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
              }`}
            >
              {volume === 2 ? 'Seasonal' : `${size}-Color`}
            </span>

            {/* Seasonal Month Pill if Vol 2 */}
            {volume === 2 && monthName && (
              <span className="px-1.5 py-0.2 text-[9px] font-editorial rounded bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300">
                {monthName} • {monthJa}
              </span>
            )}
          </div>

          <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[170px] sm:max-w-[210px] mt-0.5 font-editorial">
            {colors.map((c) => c.name).join(' • ')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Copy All Hex Button */}
          <button
            onClick={handleCopyAllHex}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 transition-colors"
            title="Copy all hex values"
          >
            <Copy size={15} />
          </button>

          {/* Favorite Toggle Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(id, volume);
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isFavorite
                ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                : 'text-stone-400 hover:text-rose-500 hover:bg-stone-200/50 dark:hover:bg-stone-800'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={15} className={isFavorite ? 'fill-rose-500' : ''} />
          </button>

          {/* Open Studio Inspector */}
          <button
            onClick={() => onSelect(combination)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-800 hover:text-white dark:hover:bg-amber-600 transition-all text-stone-700 dark:text-stone-200"
            title="Open studio inspector"
          >
            <Sliders size={13} />
            <span className="hidden sm:inline">Inspect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
