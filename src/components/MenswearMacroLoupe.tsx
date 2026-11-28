import React, { useId } from 'react';
import { ColorItem, CvdMode } from '../types/color';
import { getLuminance, hexToRgb, simulateColorVision } from '../utils/colorUtils';
import {
  FABRIC_MATERIAL_META,
  FABRIC_PATTERN_META,
  FabricMaterial,
  FabricPattern,
  GarmentSlotKey,
} from '../utils/menswearUtils';
import { renderTexturePattern, renderThreadPattern } from './MenswearIllustration';

interface MenswearMacroLoupeProps {
  slot: GarmentSlotKey;
  slotLabel: string;
  baseColor: ColorItem;
  material: FabricMaterial;
  pattern: FabricPattern;
  threadColor: ColorItem;
  cvdMode: CvdMode;
  editingThread: boolean;
  onToggleEditThread?: () => void;
}

export const MenswearMacroLoupe: React.FC<MenswearMacroLoupeProps> = ({
  slotLabel,
  baseColor,
  material,
  pattern,
  threadColor,
  cvdMode,
  editingThread,
  onToggleEditThread,
}) => {
  const uid = useId().replace(/:/g, '');
  const baseHex = simulateColorVision(baseColor.hex, cvdMode);
  const customThreadHex = simulateColorVision(threadColor.hex, cvdMode);
  const baseLum = getLuminance(...hexToRgb(baseHex));
  const threadHex = customThreadHex || (baseLum < 0.25 ? '#F5F2EA' : '#262932');
  const matMeta = FABRIC_MATERIAL_META[material];
  const patMeta = FABRIC_PATTERN_META[pattern];

  return (
    <div
      data-testid="menswear-macro-loupe"
      className="mt-3 p-2.5 rounded-xl border border-stone-300/70 dark:border-stone-800 bg-white/85 dark:bg-stone-950/50 flex items-center gap-3 text-xs"
    >
      <div className="shrink-0 w-[84px] h-[54px] rounded-lg overflow-hidden border border-stone-300/80 dark:border-stone-700 shadow-inner bg-stone-100">
        <svg
          viewBox="0 0 84 54"
          className="w-full h-full block"
          role="img"
          aria-label={`Macro cloth preview: ${matMeta.label} (${patMeta.label}) in ${baseColor.name}`}
        >
          <defs>
            <g transform="scale(1.8)">
              {renderTexturePattern(`${uid}-loupe-tex`, material, baseHex)}
              {renderThreadPattern(`${uid}-loupe-pat`, pattern, threadHex)}
            </g>
            <radialGradient id={`${uid}-loupe-sheen`} cx="32%" cy="28%" r="75%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="65%" stopColor="#000000" stopOpacity="0.0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
            </radialGradient>
          </defs>
          <rect x="0" y="0" width="84" height="54" fill={baseHex} />
          {pattern !== 'solid' && (
            <rect
              x="0"
              y="0"
              width="84"
              height="54"
              fill={`url(#${uid}-loupe-pat)`}
            />
          )}
          <rect x="0" y="0" width="84" height="54" fill={`url(#${uid}-loupe-tex)`} />
          <rect x="0" y="0" width="84" height="54" fill={`url(#${uid}-loupe-sheen)`} />
        </svg>
      </div>

      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="font-editorial font-bold text-stone-900 dark:text-stone-100 truncate">
            {slotLabel} • {matMeta.label}
          </span>
          {pattern !== 'solid' && onToggleEditThread && (
            <button
              type="button"
              onClick={onToggleEditThread}
              className={`px-1.5 py-0.5 text-[10px] font-code rounded border transition-colors cursor-pointer shrink-0 ${
                editingThread
                  ? 'bg-amber-800 text-amber-50 border-amber-800 dark:bg-amber-700'
                  : 'border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
            >
              {editingThread ? 'Thread Active' : `Thread #${threadColor.id}`}
            </button>
          )}
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
          {matMeta.drapeNote}
        </p>
        <div className="text-[10px] font-code text-stone-400 dark:text-stone-500 flex items-center gap-2 flex-wrap">
          <span>
            Cloth #{baseColor.id} {baseHex.toUpperCase()}
          </span>
          {pattern !== 'solid' && (
            <span>
              • {patMeta.label} ({threadHex.toUpperCase()})
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
