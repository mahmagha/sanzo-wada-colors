import React, { useMemo, useState } from 'react';
import { ColorItem } from '../types/color';
import { getIdealTextColor } from '../utils/colorUtils';
import { layoutSpectrumPoints, SpectrumNode } from '../utils/spectrumLayout';

export { layoutSpectrumPoints };
export type { SpectrumNode };

interface SpectrumMapProps {
  colors: ColorItem[];
  onSelectColor: (color: ColorItem) => void;
}

export const SpectrumMap: React.FC<SpectrumMapProps> = ({ colors, onSelectColor }) => {
  const [hovered, setHovered] = useState<ColorItem | null>(null);
  const [showIds, setShowIds] = useState(false);

  const points = useMemo(() => layoutSpectrumPoints(colors), [colors]);

  return (
    <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/75 dark:bg-stone-900/75 p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <h3 className="font-editorial font-bold text-sm text-stone-900 dark:text-stone-100">
            2D Hue × Lightness Spectrum ({colors.length} Swatches)
          </h3>
          <p className="text-stone-500 dark:text-stone-400">
            Horizontal axis maps Hue (0° Red → Yellow → Green → Blue → Violet + Neutrals); vertical axis maps Lightness; dot size reflects palette frequency.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={showIds}
              onChange={(e) => setShowIds(e.target.checked)}
              className="rounded border-stone-300 dark:border-stone-700"
            />
            <span>Show #IDs</span>
          </label>

          <div className="min-h-[1.75rem] flex items-center gap-2 font-code text-xs">
            {hovered ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700">
                <span
                  style={{ backgroundColor: hovered.hex }}
                  className="w-3.5 h-3.5 rounded-full border border-black/20"
                />
                <span className="font-editorial font-bold text-stone-900 dark:text-stone-100">
                  #{hovered.id} {hovered.name}
                </span>
                {hovered.ja && <span className="font-editorial text-stone-500">({hovered.ja})</span>}
                <span className="text-stone-500">{hovered.hex.toUpperCase()}</span>
              </div>
            ) : (
              <span className="text-stone-400">Hover or tap any pigment node</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Chart Area */}
      <div className="relative w-full h-[360px] sm:h-[440px] rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/60 overflow-hidden">
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            <linearGradient id="hueSpectrumBar" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="17%" stopColor="#eab308" />
              <stop offset="33%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="67%" stopColor="#3b82f6" />
              <stop offset="83%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          {[25, 50, 75].map((y) => (
            <line
              key={y}
              x1="0"
              x2="100"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.08"
              strokeWidth="0.3"
            />
          ))}
          <line
            x1="86.5"
            x2="86.5"
            y1="4"
            y2="96"
            stroke="currentColor"
            strokeOpacity="0.15"
            strokeDasharray="1 1"
            strokeWidth="0.35"
          />
          <rect x="5" y="96.5" width="79" height="2" rx="1" fill="url(#hueSpectrumBar)" opacity="0.65" />
          <rect x="88" y="96.5" width="8" height="2" rx="1" fill="#888888" opacity="0.45" />
        </svg>

        <span className="absolute top-2 left-3 text-[10px] font-code text-stone-400 pointer-events-none">
          Light
        </span>
        <span className="absolute bottom-5 left-3 text-[10px] font-code text-stone-400 pointer-events-none">
          Deep
        </span>
        <span className="absolute bottom-5 right-3 text-[10px] font-code text-stone-400 pointer-events-none">
          Neutrals
        </span>

        {points.map(({ color, xPct, yPct, sizePx }) => (
          <button
            type="button"
            key={color.id}
            onClick={() => onSelectColor(color)}
            onMouseEnter={() => setHovered(color)}
            onFocus={() => setHovered(color)}
            aria-label={`#${color.id} ${color.name} (${color.hex})`}
            title={`#${color.id} ${color.name}${color.ja ? ` (${color.ja})` : ''} — ${color.hex}`}
            style={{
              left: `${xPct}%`,
              bottom: `${yPct}%`,
              width: showIds ? `${Math.max(24, sizePx + 6)}px` : `${sizePx}px`,
              height: showIds ? `${Math.max(20, sizePx + 2)}px` : `${sizePx}px`,
              backgroundColor: color.hex,
              color: getIdealTextColor(color.hex),
              transform: 'translate(-50%, 50%)',
            }}
            className="absolute rounded-full border border-black/25 dark:border-white/30 shadow-xs hover:scale-150 hover:z-20 focus:scale-150 focus:z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 transition-transform cursor-pointer flex items-center justify-center text-[8px] font-code font-bold"
          >
            {showIds ? color.id : null}
          </button>
        ))}
      </div>
    </div>
  );
};
