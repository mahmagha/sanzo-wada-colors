import React, { useMemo, useRef, useState } from 'react';
import { ColorItem } from '../types/color';
import { formatOklch, getIdealTextColor } from '../utils/colorUtils';
import {
  findNearestWheelNode,
  layoutColorWheelPoints,
  sortNodesByWheelAngle,
  WheelNode,
} from '../utils/spectrumLayout';

interface WadaColorWheelProps {
  colors: ColorItem[];
  onSelectColor: (color: ColorItem) => void;
  selectedIds?: number[];
  chordPolygonIds?: number[];
  harmonyHighlightIds?: number[];
  activeSlotLabel?: string;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

const HUE_MARKERS: { deg: number; label: string }[] = [
  { deg: 0, label: '0° Red' },
  { deg: 60, label: '60° Yellow' },
  { deg: 120, label: '120° Green' },
  { deg: 180, label: '180° Cyan' },
  { deg: 240, label: '240° Blue' },
  { deg: 300, label: '300° Violet' },
];

export const WadaColorWheel: React.FC<WadaColorWheelProps> = ({
  colors,
  onSelectColor,
  selectedIds = [],
  chordPolygonIds = [],
  harmonyHighlightIds = [],
  activeSlotLabel,
  title,
  subtitle,
  compact = false,
}) => {
  const [hovered, setHovered] = useState<ColorItem | null>(null);
  const [showIds, setShowIds] = useState(false);
  const wheelBoxRef = useRef<HTMLDivElement>(null);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const chordSet = useMemo(() => new Set(chordPolygonIds), [chordPolygonIds]);
  const harmonySet = useMemo(() => new Set(harmonyHighlightIds), [harmonyHighlightIds]);
  const nodes = useMemo(() => layoutColorWheelPoints(colors), [colors]);
  const nodeById = useMemo(() => {
    const map = new Map<number, WheelNode>();
    for (const n of nodes) map.set(n.color.id, n);
    return map;
  }, [nodes]);

  const chordNodes = useMemo(
    () =>
      sortNodesByWheelAngle(
        chordPolygonIds
          .map((id) => nodeById.get(id))
          .filter((n): n is WheelNode => Boolean(n))
      ),
    [chordPolygonIds, nodeById]
  );

  const anchorNode = selectedIds.length > 0 ? nodeById.get(selectedIds[0]) ?? null : null;
  const harmonyNodes = useMemo(
    () =>
      harmonyHighlightIds
        .map((id) => nodeById.get(id))
        .filter((n): n is WheelNode => Boolean(n)),
    [harmonyHighlightIds, nodeById]
  );

  const getCoordsFromPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wheelBoxRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return null;
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    return { xPct, yPct };
  };

  const handleSurfaceMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only auto-track wheel background if pointer isn't already focused on a specific button
    if ((e.target as HTMLElement).closest('button')) return;
    const coords = getCoordsFromPointer(e);
    if (!coords) return;
    const distFromCenter = Math.hypot(coords.xPct - 50, coords.yPct - 50);
    if (distFromCenter > 47.5) return;
    const nearest = findNearestWheelNode(nodes, coords.xPct, coords.yPct);
    if (nearest) setHovered(nearest.color);
  };

  const handleSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    const coords = getCoordsFromPointer(e);
    if (!coords) return;
    const distFromCenter = Math.hypot(coords.xPct - 50, coords.yPct - 50);
    if (distFromCenter > 47.5) return;
    const nearest = findNearestWheelNode(nodes, coords.xPct, coords.yPct);
    if (nearest) onSelectColor(nearest.color);
  };

  return (
    <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 sm:p-5 space-y-3 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div>
          <h3 className="font-editorial font-bold text-sm text-stone-900 dark:text-stone-100">
            {title || `360° Wada Color Wheel (${colors.length} Pigments)`}
          </h3>
          <p className="text-stone-500 dark:text-stone-400">
            {activeSlotLabel ? (
              <>
                Picking for <strong className="text-amber-800 dark:text-amber-400">{activeSlotLabel}</strong> • Outer ring spans 360° Hue &amp; Depth; center core holds Neutrals.
              </>
            ) : (
              subtitle ||
              'Outer spectrum spans 360° Hue × Tone Depth; central core holds Neutral & Ink shades. Click any pigment or region to choose.'
            )}
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

          <div className="min-h-[1.85rem] flex items-center font-code text-xs">
            {hovered ? (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 border border-stone-300/60 dark:border-stone-700 max-w-[280px] sm:max-w-[360px]">
                <span
                  style={{ backgroundColor: hovered.hex }}
                  className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0"
                />
                <span className="font-editorial font-bold text-stone-900 dark:text-stone-100 truncate">
                  #{hovered.id} {hovered.name}
                </span>
                {hovered.ja && <span className="font-editorial text-stone-500 shrink-0">({hovered.ja})</span>}
                <span className="text-stone-500 uppercase shrink-0">{hovered.hex}</span>
                {!compact && (
                  <span className="hidden md:inline text-[10px] text-stone-400 shrink-0">
                    {formatOklch(hovered.rgb)}
                  </span>
                )}
              </div>
            ) : (
              <span className="text-stone-400">Hover or click anywhere on the wheel</span>
            )}
          </div>
        </div>
      </div>

      {/* Polar Conic Wheel Stage */}
      <div className="flex justify-center py-3 px-2">
        <div
          ref={wheelBoxRef}
          onMouseMove={handleSurfaceMouseMove}
          onClick={handleSurfaceClick}
          role="region"
          aria-label={`Interactive 360 degree Wada Color Wheel with ${nodes.length} swatches`}
          className={`relative aspect-square w-full ${
            compact ? 'max-w-[390px]' : 'max-w-[520px]'
          } select-none`}
        >
          {/* Ambient 360-degree conic gradient wheel disc */}
          <div
            aria-hidden="true"
            style={{
              background:
                'radial-gradient(circle at center, rgba(248,246,240,0.92) 0%, rgba(248,246,240,0.85) 29%, rgba(255,255,255,0.22) 52%, rgba(0,0,0,0.16) 100%), conic-gradient(from 0deg, hsl(0,78%,58%), hsl(45,86%,58%), hsl(90,68%,50%), hsl(135,66%,44%), hsl(180,72%,44%), hsl(225,80%,52%), hsl(270,74%,56%), hsl(315,74%,54%), hsl(360,78%,58%))',
            }}
            className="absolute inset-[4.5%] rounded-full border border-stone-400/50 dark:border-stone-600/70 shadow-inner pointer-events-none"
          />

          {/* SVG polar reference rings & cardinal degree ticks */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {/* Outer & mid chromatic guide rings */}
            <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeOpacity="0.18" strokeWidth="0.3" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" strokeOpacity="0.14" strokeDasharray="1 1.2" strokeWidth="0.3" />
            {/* Inner neutral core boundary */}
            <circle
              cx="50"
              cy="50"
              r="15.2"
              fill="rgba(255,255,255,0.45)"
              stroke="currentColor"
              strokeOpacity="0.32"
              strokeDasharray="1.2 1"
              strokeWidth="0.35"
            />
            <text
              x="50"
              y="36.6"
              textAnchor="middle"
              fontSize="2.2"
              fill="currentColor"
              opacity="0.55"
              fontFamily="var(--font-mono)"
            >
              NEUTRALS
            </text>

            {/* Radial axis hairlines */}
            {HUE_MARKERS.map(({ deg }) => {
              const rad = ((deg - 90) * Math.PI) / 180;
              const x1 = 50 + Math.cos(rad) * 15.2;
              const y1 = 50 + Math.sin(rad) * 15.2;
              const x2 = 50 + Math.cos(rad) * 46;
              const y2 = 50 + Math.sin(rad) * 46;
              return (
                <line
                  key={deg}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="currentColor"
                  strokeOpacity="0.16"
                  strokeWidth="0.25"
                />
              );
            })}

            {/* Geometric Archival Combination Chord Polygon */}
            {chordNodes.length === 2 && (
              <line
                data-testid="wheel-chord-shape"
                x1={chordNodes[0].xPct}
                y1={chordNodes[0].yPct}
                x2={chordNodes[1].xPct}
                y2={chordNodes[1].yPct}
                stroke="#B45309"
                strokeOpacity="0.82"
                strokeWidth="0.7"
                strokeDasharray="1.5 1.1"
              />
            )}
            {chordNodes.length >= 3 && (
              <polygon
                data-testid="wheel-chord-shape"
                points={chordNodes.map((n) => `${n.xPct},${n.yPct}`).join(' ')}
                fill="rgba(217,119,6,0.11)"
                stroke="#B45309"
                strokeOpacity="0.82"
                strokeWidth="0.65"
                strokeLinejoin="round"
              />
            )}

            {/* Geometric Harmony Finder Spokes */}
            {anchorNode &&
              harmonyNodes.map((target) => (
                <line
                  key={`harmony-spoke-${target.color.id}`}
                  data-testid="wheel-harmony-spoke"
                  x1={anchorNode.xPct}
                  y1={anchorNode.yPct}
                  x2={target.xPct}
                  y2={target.yPct}
                  stroke="#0F766E"
                  strokeOpacity="0.68"
                  strokeWidth="0.55"
                  strokeDasharray="1.3 1"
                />
              ))}
          </svg>

          {/* Outer Hue Degree Labels */}
          {HUE_MARKERS.map(({ deg, label }) => {
            const rad = ((deg - 90) * Math.PI) / 180;
            const labelR = 49.0;
            const left = 50 + Math.cos(rad) * labelR;
            const top = 50 + Math.sin(rad) * labelR;
            return (
              <span
                key={deg}
                aria-hidden="true"
                style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                className="hidden sm:block absolute text-[9px] font-code text-stone-600 dark:text-stone-400 pointer-events-none whitespace-nowrap"
              >
                {label}
              </span>
            );
          })}

          {/* Swatch Pigment Dots */}
          {nodes.map(({ color, xPct, yPct, sizePx }) => {
            const isSelected = selectedSet.has(color.id);
            const isChordMember = chordSet.has(color.id) && !isSelected;
            const isHarmonyMatch = harmonySet.has(color.id) && !isSelected;
            const dotSize = compact ? Math.max(11, sizePx - 2) : sizePx;
            return (
              <button
                type="button"
                key={color.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectColor(color);
                }}
                onMouseEnter={() => setHovered(color)}
                onFocus={() => setHovered(color)}
                aria-pressed={selectedIds.length > 0 ? isSelected : undefined}
                aria-label={`#${color.id} ${color.name} (${color.hex})`}
                title={`#${color.id} ${color.name}${color.ja ? ` (${color.ja})` : ''} — ${color.hex}`}
                style={{
                  left: `${xPct}%`,
                  top: `${yPct}%`,
                  width: showIds ? `${Math.max(22, dotSize + 6)}px` : `${dotSize}px`,
                  height: showIds ? `${Math.max(18, dotSize + 2)}px` : `${dotSize}px`,
                  backgroundColor: color.hex,
                  color: getIdealTextColor(color.hex),
                  transform: 'translate(-50%, -50%)',
                }}
                className={`absolute rounded-full transition-transform cursor-pointer flex items-center justify-center text-[8px] font-code font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 hover:scale-150 hover:z-30 focus:scale-150 focus:z-30 ${
                  isSelected
                    ? 'ring-2 ring-amber-500 ring-offset-2 ring-offset-white dark:ring-offset-stone-900 scale-125 z-20 border border-black/40'
                    : isHarmonyMatch
                    ? 'ring-2 ring-teal-600 ring-offset-1 ring-offset-white dark:ring-offset-stone-900 scale-120 z-10 border border-black/35'
                    : isChordMember
                    ? 'ring-2 ring-amber-600/80 ring-offset-1 ring-offset-white dark:ring-offset-stone-900 scale-115 z-10 border border-black/35'
                    : 'border border-black/30 dark:border-white/35 shadow-xs'
                }`}
              >
                {showIds ? color.id : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
