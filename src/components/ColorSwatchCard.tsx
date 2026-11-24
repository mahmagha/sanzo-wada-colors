import React from 'react';
import { Copy, Layers } from 'lucide-react';
import { ColorItem } from '../types/color';
import { getIdealTextColor } from '../utils/colorUtils';

interface ColorSwatchCardProps {
  color: ColorItem;
  onSelectColor: (color: ColorItem) => void;
  onCopyText: (text: string, label: string) => void;
}

export const ColorSwatchCard: React.FC<ColorSwatchCardProps> = ({
  color,
  onSelectColor,
  onCopyText,
}) => {
  const textColor = getIdealTextColor(color.hex);

  const handleCopyHex = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyText(color.hex, `Copied ${color.name} (${color.hex})`);
  };

  return (
    <div
      onClick={() => onSelectColor(color)}
      className="group relative flex flex-col rounded-xl overflow-hidden border border-stone-300/60 dark:border-stone-800 bg-white/70 dark:bg-stone-900/60 shadow-xs hover:shadow-lg hover:border-amber-800/40 dark:hover:border-amber-500/40 transition-all duration-300 cursor-pointer"
    >
      {/* Big Swatch Preview */}
      <div
        style={{ backgroundColor: color.hex }}
        className="h-36 w-full relative p-3 flex flex-col justify-between transition-transform duration-300"
      >
        <div className="flex justify-between items-start">
          <span
            style={{ color: textColor }}
            className="text-[11px] font-code opacity-80 uppercase tracking-widest"
          >
            Swatch #{color.swatch}
          </span>
          <button
            onClick={handleCopyHex}
            style={{ color: textColor }}
            className="p-1.5 rounded-full bg-black/20 hover:bg-black/35 backdrop-blur-xs transition-opacity opacity-0 group-hover:opacity-100"
            title={`Copy ${color.hex}`}
          >
            <Copy size={13} />
          </button>
        </div>

        <div style={{ color: textColor }}>
          <div className="text-base font-editorial font-bold leading-tight">
            {color.name}
          </div>
          <div className="text-xs font-code opacity-90 uppercase">
            {color.hex}
          </div>
        </div>
      </div>

      {/* Swatch Color Specs Footer */}
      <div className="p-3 text-xs space-y-1.5 border-t border-stone-200/50 dark:border-stone-800">
        <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 font-code text-[11px]">
          <span>RGB</span>
          <span>{color.rgb.join(', ')}</span>
        </div>
        <div className="flex items-center justify-between text-stone-600 dark:text-stone-400 font-code text-[11px]">
          <span>CMYK</span>
          <span>{color.cmyk.join(', ')}</span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
          <span className="flex items-center gap-1 text-amber-900 dark:text-amber-400 font-medium text-[11px]">
            <Layers size={12} />
            <span>Used in {color.combinations.length} palettes</span>
          </span>
          <span className="text-[10px] text-stone-400 underline group-hover:text-stone-700 dark:group-hover:text-stone-200">
            View Palettes →
          </span>
        </div>
      </div>
    </div>
  );
};
