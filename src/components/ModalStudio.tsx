import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  X,
  Heart,
  Download,
  Copy,
  Layout,
  FileCode,
  Palette,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Share2,
  Image as ImageIcon,
  Columns2,
} from 'lucide-react';
import { ColorItem, Combination, CvdMode } from '../types/color';
import {
  getContrastRatio,
  getIdealTextColor,
  getAccessibleBadgeColors,
  formatOklch,
  simulateColorVision,
  downloadSvgCard,
  downloadPngCard,
  downloadGplPalette,
  downloadAsePalette,
  generateCssVariables,
  generateRoleCssVariables,
  generateTailwindV4Theme,
  generateTailwindConfig,
  generateDesignTokensJson,
  generateSvgPaletteSnippet,
  generateGplPalette,
  generateJsonExport,
} from '../utils/colorUtils';
import { useModalDialog } from '../utils/useModalDialog';

interface ModalStudioProps {
  combination: Combination | null;
  onClose: () => void;
  isFavorite: boolean;
  isCompared?: boolean;
  onToggleFavorite: (id: number, volume: number) => void;
  onToggleCompare?: (combo: Combination) => void;
  onCopyText: (text: string, label: string) => void;
  onSelectColor?: (color: ColorItem) => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  onShareLink?: (combo: Combination) => void;
}

type StudioTab = 'art-print' | 'ui-mockup' | 'contrast-matrix' | 'export';
type ExportFormat =
  | 'css'
  | 'tailwind-v4'
  | 'tailwind-v3'
  | 'design-tokens'
  | 'svg-palette'
  | 'gpl'
  | 'json';

const CVD_OPTIONS: { id: CvdMode; label: string }[] = [
  { id: 'normal', label: 'Normal Vision' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
  { id: 'achromatopsia', label: 'Achromatopsia' },
];

function getWeightedHeights(count: number): number[] {
  if (count <= 1) return [320];
  if (count === 2) return [210, 110];
  if (count === 3) return [165, 95, 65];
  const restHeight = Math.max(44, Math.floor(150 / (count - 2)));
  return [150, 90, ...Array(count - 2).fill(restHeight)];
}

export const ModalStudio: React.FC<ModalStudioProps> = ({
  combination,
  onClose,
  isFavorite,
  isCompared = false,
  onToggleFavorite,
  onToggleCompare,
  onCopyText,
  onSelectColor,
  onPrev,
  onNext,
  hasPrev = false,
  hasNext = false,
  onShareLink,
}) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('art-print');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css');
  const [cssUseOklch, setCssUseOklch] = useState(false);
  const [cvdMode, setCvdMode] = useState<CvdMode>('normal');
  const [weightedBars, setWeightedBars] = useState(false);

  const initialCount = combination?.colors.length ?? 0;
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [surfaceIndex, setSurfaceIndex] = useState<number>(
    Math.min(1, Math.max(0, initialCount - 1))
  );
  const [accentIndex, setAccentIndex] = useState<number>(
    initialCount > 2 ? 2 : Math.min(1, Math.max(0, initialCount - 1))
  );
  // -1 means Auto WCAG high-contrast text; >= 0 picks a palette color as custom Ink/Text
  const [textIndex, setTextIndex] = useState<number>(-1);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!combination) return;
    const len = combination.colors.length;
    setBgIndex(0);
    setSurfaceIndex(Math.min(1, Math.max(0, len - 1)));
    setAccentIndex(len > 2 ? 2 : Math.min(1, Math.max(0, len - 1)));
    setTextIndex(-1);
  }, [combination?.volume, combination?.id, combination?.colors.length]);

  const handleStudioKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    },
    [hasPrev, hasNext, onPrev, onNext]
  );

  useModalDialog({
    isOpen: Boolean(combination),
    dialogRef,
    onClose,
    onKeyDown: handleStudioKeyDown,
  });

  if (!combination) return null;

  const colors = combination.colors;
  const safeBgIndex = Math.min(bgIndex, Math.max(0, colors.length - 1));
  const safeSurfaceIndex = Math.min(surfaceIndex, Math.max(0, colors.length - 1));
  const safeAccentIndex = Math.min(accentIndex, Math.max(0, colors.length - 1));

  const bgColor = colors[safeBgIndex] || colors[0];
  const surfaceColor = colors[safeSurfaceIndex] || colors[1] || colors[0];
  const accentColor = colors[safeAccentIndex] || colors[colors.length - 1];
  const customTextColor =
    textIndex >= 0 && textIndex < colors.length ? colors[textIndex] : null;

  const simHex = (hex: string) => simulateColorVision(hex, cvdMode);

  const bgDisplayHex = simHex(bgColor.hex);
  const surfaceDisplayHex = simHex(surfaceColor.hex);
  const accentDisplayHex = simHex(accentColor.hex);

  const bgTextColor = customTextColor
    ? simHex(customTextColor.hex)
    : getIdealTextColor(bgDisplayHex);
  const surfaceTextColor = customTextColor
    ? simHex(customTextColor.hex)
    : getIdealTextColor(surfaceDisplayHex);
  const accentTextColor = getIdealTextColor(accentDisplayHex);
  const badgeStyle = getAccessibleBadgeColors(accentDisplayHex, bgDisplayHex);

  const textBgContrast = getContrastRatio(bgDisplayHex, bgTextColor);
  const textSurfaceContrast = getContrastRatio(surfaceDisplayHex, surfaceTextColor);
  const accentBgContrast = getContrastRatio(bgDisplayHex, accentDisplayHex);

  const handleShuffleRoles = () => {
    const indices = Array.from({ length: colors.length }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    setBgIndex(shuffled[0]);
    setSurfaceIndex(shuffled[1 % colors.length]);
    setAccentIndex(shuffled[2 % colors.length]);
  };

  const handleDownloadPng = async () => {
    try {
      await downloadPngCard(combination);
      onCopyText('', `Downloaded 2× PNG poster for Vol.${combination.volume} № ${combination.id}`);
    } catch {
      downloadSvgCard(combination);
    }
  };

  const getExportSnippet = () => {
    if (exportFormat === 'css') return generateCssVariables(combination, cssUseOklch);
    if (exportFormat === 'tailwind-v4') return generateTailwindV4Theme(combination);
    if (exportFormat === 'tailwind-v3') return generateTailwindConfig(combination);
    if (exportFormat === 'design-tokens') return generateDesignTokensJson(combination);
    if (exportFormat === 'svg-palette') return generateSvgPaletteSnippet(combination);
    if (exportFormat === 'gpl') return generateGplPalette(combination);
    return generateJsonExport(combination);
  };

  const isVol2 = combination.volume === 2;
  const weightedHeights = getWeightedHeights(colors.length);

  const renderWcagBadge = (ratio: number) => {
    if (ratio >= 7) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
          {ratio.toFixed(1)}:1 AAA
        </span>
      );
    }
    if (ratio >= 4.5) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400">
          {ratio.toFixed(1)}:1 AA
        </span>
      );
    }
    if (ratio >= 3) {
      return (
        <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
          {ratio.toFixed(1)}:1 Large
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-400">
        {ratio.toFixed(1)}:1 Low
      </span>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-modal-title"
        tabIndex={-1}
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Modal Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              aria-hidden="true"
              className="w-8 h-8 rounded border border-red-700 dark:border-red-600 flex items-center justify-center font-editorial font-bold text-red-700 dark:text-red-500 text-sm bg-red-50/50 dark:bg-red-950/20 shrink-0"
            >
              三造
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="studio-modal-title" className="text-base sm:text-lg font-editorial font-bold">
                  {isVol2
                    ? `Volume 2 • Card № ${combination.id.toString().padStart(2, '0')}`
                    : `Volume 1 • Combination № ${combination.id.toString().padStart(3, '0')}`}
                </h2>
                <span
                  className={`px-2 py-0.5 text-xs font-code rounded ${
                    isVol2
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
                      : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  {isVol2
                    ? `${combination.monthName} (${combination.monthJa}) • ${combination.size} Colors`
                    : `${combination.size}-Color Harmony`}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-editorial mt-0.5 truncate">
                {isVol2 && combination.monthMeaning && (
                  <span className="text-amber-800 dark:text-amber-400 font-medium mr-2">
                    {combination.monthMeaning} —
                  </span>
                )}
                {colors.map((c) => (c.ja ? `${c.name} (${c.ja})` : c.name)).join(' • ')}
              </p>
            </div>
          </div>

          {/* Quick Header Actions (including mobile Prev/Next stepping) */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {(onPrev || onNext) && (
              <div className="flex items-center border border-stone-300 dark:border-stone-700 rounded-lg overflow-hidden mr-0.5">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={!hasPrev}
                  aria-label="Previous combination (Left Arrow)"
                  title="Previous combination (←)"
                  className="p-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!hasNext}
                  aria-label="Next combination (Right Arrow)"
                  title="Next combination (→)"
                  className="p-1.5 border-l border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 disabled:opacity-35 disabled:pointer-events-none transition-colors cursor-pointer"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}

            {onToggleCompare && (
              <button
                type="button"
                onClick={() => onToggleCompare(combination)}
                aria-label={isCompared ? 'Remove from comparison' : 'Pin to compare palettes'}
                aria-pressed={isCompared}
                title={isCompared ? 'Remove from comparison' : 'Pin to compare'}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  isCompared
                    ? 'text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/50'
                    : 'text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Columns2 size={16} />
              </button>
            )}

            {onShareLink && (
              <button
                type="button"
                onClick={() => onShareLink(combination)}
                aria-label="Copy shareable link to this combination"
                title="Copy shareable link"
                className="p-2 rounded-lg text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <Share2 size={16} />
              </button>
            )}

            <button
              type="button"
              onClick={() => downloadSvgCard(combination)}
              aria-label="Export print-ready SVG card"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              title="Download print-ready SVG Card"
            >
              <Download size={14} />
              <span className="hidden md:inline">SVG</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleFavorite(combination.id, combination.volume)}
              aria-label={
                isFavorite ? 'Remove combination from favorites' : 'Save combination to favorites'
              }
              aria-pressed={isFavorite}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
            >
              <Heart size={16} className={isFavorite ? 'fill-rose-500' : ''} />
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close studio modal"
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Studio Subnav Tabs + CVD Vision Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 px-4 sm:px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 shrink-0">
          <div
            role="tablist"
            aria-label="Studio tools"
            className="flex items-center gap-1 overflow-x-auto"
          >
            {(
              [
                ['art-print', 'Showa Art Print', Palette],
                ['ui-mockup', 'Interactive UI Mockup', Layout],
                ['contrast-matrix', 'Color Science & Contrast', Eye],
                ['export', 'Code & Swatch Export', FileCode],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                type="button"
                role="tab"
                key={key}
                aria-selected={activeTab === key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === key
                    ? 'border-amber-800 text-amber-900 dark:border-amber-500 dark:text-amber-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Color Vision Deficiency Simulator */}
          <div className="flex items-center gap-1.5 pb-2 md:pb-0 text-xs shrink-0">
            <span className="text-stone-500 font-medium">Vision:</span>
            <select
              aria-label="Simulate color vision deficiency"
              value={cvdMode}
              onChange={(e) => setCvdMode(e.target.value as CvdMode)}
              className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 cursor-pointer"
            >
              {CVD_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CVD Active Banner */}
        {cvdMode !== 'normal' && activeTab !== 'export' && (
          <div className="px-6 py-2 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2 shrink-0">
            <span>
              Simulating <strong className="capitalize">{cvdMode}</strong> color vision across
              swatches, mockup, and contrast checks.
            </span>
            <button
              type="button"
              onClick={() => setCvdMode('normal')}
              className="underline font-medium cursor-pointer"
            >
              Reset to Normal
            </button>
          </div>
        )}

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: SHOWA ART PRINT */}
          {activeTab === 'art-print' && (
            <div className="flex flex-col items-center">
              {/* Proportions Toggle */}
              <div className="w-full max-w-xl flex items-center justify-end gap-1.5 mb-3 text-xs">
                <span className="text-stone-500 font-medium">Proportions:</span>
                <button
                  type="button"
                  onClick={() => setWeightedBars(false)}
                  aria-pressed={!weightedBars}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    !weightedBars
                      ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  Equal Stripes
                </button>
                <button
                  type="button"
                  onClick={() => setWeightedBars(true)}
                  aria-pressed={weightedBars}
                  className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    weightedBars
                      ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                      : 'bg-stone-200/70 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                  }`}
                >
                  60 / 30 / 10 Balance
                </button>
              </div>

              {/* Art Poster Card Container */}
              <div className="w-full max-w-xl p-7 sm:p-10 rounded-xl border border-stone-300/80 bg-[#FAF7F2] text-[#1C1A17] shadow-xl relative overflow-hidden">
                <div className="absolute inset-4 border border-stone-400/30 pointer-events-none" />

                <div className="flex justify-between items-start gap-4 mb-6 relative z-10">
                  <div>
                    <h3 className="font-editorial text-xl sm:text-2xl font-bold tracking-widest text-[#1C1A17] uppercase">
                      A Dictionary of Color Combinations
                    </h3>
                    <p className="font-editorial text-sm text-stone-600 mt-1">
                      和田三造 (Sanzo Wada, 1933) — 配色総鑑 {isVol2 ? 'B篇 (Seasonal)' : ''}
                    </p>
                    <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                      <span className="font-editorial text-xl font-bold text-red-800">
                        {isVol2
                          ? `Vol. 2 Card № ${combination.id}`
                          : `№ ${combination.id.toString().padStart(3, '0')}`}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-stone-500 font-code">
                        {isVol2
                          ? `${combination.monthName} (${combination.monthJa})`
                          : `${combination.size}-Color Harmony`}
                      </span>
                    </div>
                  </div>

                  <div
                    aria-hidden="true"
                    className="w-12 h-12 rounded border-2 border-red-800 flex items-center justify-center font-editorial font-black text-red-800 text-lg shadow-xs shrink-0"
                  >
                    三造
                  </div>
                </div>

                <div className="flex items-stretch gap-4 my-5 relative z-10">
                  <div className="grid grid-cols-1 gap-2.5 flex-1">
                    {colors.map((c, idx) => {
                      const shownHex = simHex(c.hex);
                      const txtColor = getIdealTextColor(shownHex);
                      const barHeight = weightedBars ? weightedHeights[idx] : undefined;
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => onSelectColor?.(c)}
                          style={{
                            backgroundColor: shownHex,
                            minHeight: barHeight ? `${barHeight}px` : undefined,
                          }}
                          title={
                            onSelectColor ? `Inspect ${c.name} swatch & combinations` : undefined
                          }
                          className={`group/bar ${
                            weightedBars ? '' : 'min-h-[4rem] sm:min-h-[4.5rem]'
                          } w-full text-left rounded-lg p-3 sm:p-4 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700`}
                        >
                          <div style={{ color: txtColor }}>
                            <div className="text-sm sm:text-base font-editorial font-bold">
                              {c.name}{' '}
                              {c.ja && (
                                <span className="opacity-90 font-normal text-xs sm:text-sm">
                                  ({c.ja})
                                </span>
                              )}
                            </div>
                            <div className="text-xs font-code opacity-85 uppercase">
                              {c.hex}
                              {cvdMode !== 'normal' && (
                                <span className="ml-2 opacity-75">→ {shownHex}</span>
                              )}
                              {onSelectColor && (
                                <span className="ml-2 opacity-0 group-hover/bar:opacity-90 transition-opacity font-sans text-[11px] underline">
                                  Inspect swatch →
                                </span>
                              )}
                            </div>
                          </div>

                          <div
                            style={{ color: txtColor }}
                            className="text-right text-[11px] font-code opacity-75 hidden sm:block"
                          >
                            <div>CMYK({c.cmyk.join(', ')})</div>
                            <div>RGB({c.rgb.join(', ')})</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div
                    aria-hidden="true"
                    className="writing-vertical hidden sm:flex items-center justify-center font-editorial font-bold text-lg tracking-[0.35em] text-stone-500 select-none border-l border-stone-300/70 pl-3"
                  >
                    {isVol2 ? '配色総鑑 B篇' : '配色総鑑'}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-stone-300 text-center relative z-10">
                  <p className="text-[11px] font-editorial text-stone-500 tracking-wider">
                    Published by the Japan Standard Color Association • Showa Era Masterwork
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => downloadSvgCard(combination)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900 hover:bg-amber-800 text-amber-50 font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <Download size={15} />
                  <span>Download SVG Card</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-medium text-xs sm:text-sm shadow-sm transition-colors cursor-pointer"
                >
                  <ImageIcon size={15} />
                  <span>Download PNG</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const hexes = colors.map((c) => c.hex).join(', ');
                    onCopyText(hexes, `Copied hex codes: ${hexes}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
                >
                  <Copy size={15} />
                  <span>Copy All Hex Codes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE UI MOCKUP */}
          {activeTab === 'ui-mockup' && (
            <div className="space-y-5">
              {/* Role Assignment + Live Contrast Bar */}
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Color Roles:
                    </span>
                    <button
                      type="button"
                      onClick={handleShuffleRoles}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <RefreshCw size={12} />
                      <span>Shuffle Roles</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onCopyText(
                          generateRoleCssVariables(combination, {
                            bg: bgColor,
                            surface: surfaceColor,
                            accent: accentColor,
                            textHex: customTextColor
                              ? customTextColor.hex
                              : getIdealTextColor(bgColor.hex),
                          }),
                          'Copied semantic UI role CSS tokens'
                        )
                      }
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      <Copy size={12} />
                      <span>Copy Role CSS</span>
                    </button>
                  </div>

                  {/* Live Contrast Readout */}
                  <div className="flex items-center gap-3 flex-wrap text-[11px] font-code">
                    <span className="flex items-center gap-1 text-stone-500">
                      Text/BG: {renderWcagBadge(textBgContrast)}
                    </span>
                    <span className="flex items-center gap-1 text-stone-500">
                      Text/Surface: {renderWcagBadge(textSurfaceContrast)}
                    </span>
                    <span className="flex items-center gap-1 text-stone-500">
                      Accent/BG: {renderWcagBadge(accentBgContrast)}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-2 border-t border-stone-200/70 dark:border-stone-800">
                  <label className="flex flex-col gap-1">
                    <span className="text-stone-500 font-medium">Background</span>
                    <select
                      value={safeBgIndex}
                      onChange={(e) => setBgIndex(Number(e.target.value))}
                      className="px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                    >
                      {colors.map((c, i) => (
                        <option key={c.id} value={i}>
                          {i + 1}. {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-stone-500 font-medium">Surface</span>
                    <select
                      value={safeSurfaceIndex}
                      onChange={(e) => setSurfaceIndex(Number(e.target.value))}
                      className="px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                    >
                      {colors.map((c, i) => (
                        <option key={c.id} value={i}>
                          {i + 1}. {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-stone-500 font-medium">Accent</span>
                    <select
                      value={safeAccentIndex}
                      onChange={(e) => setAccentIndex(Number(e.target.value))}
                      className="px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                    >
                      {colors.map((c, i) => (
                        <option key={c.id} value={i}>
                          {i + 1}. {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1">
                    <span className="text-stone-500 font-medium">Text / Ink</span>
                    <select
                      value={textIndex}
                      onChange={(e) => setTextIndex(Number(e.target.value))}
                      className="px-2 py-1.5 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                    >
                      <option value={-1}>Auto (WCAG Contrast)</option>
                      {colors.map((c, i) => (
                        <option key={c.id} value={i}>
                          {i + 1}. {c.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              {/* The Rendered Live UI Preview Container */}
              <div
                style={{ backgroundColor: bgDisplayHex, color: bgTextColor }}
                className="rounded-2xl p-6 sm:p-8 shadow-xl border border-black/10 transition-colors duration-300"
              >
                <div className="flex items-center justify-between pb-6 border-b border-current/15">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: accentDisplayHex, color: accentTextColor }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    >
                      和
                    </div>
                    <span className="font-editorial font-bold text-lg tracking-tight">
                      Atelier Wada
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-xs font-medium opacity-85">
                    <span>Collections</span>
                    <span>Color Theory</span>
                    <span>Archive</span>
                  </div>

                  <button
                    type="button"
                    style={{ backgroundColor: accentDisplayHex, color: accentTextColor }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  >
                    Explore Gallery
                  </button>
                </div>

                <div className="py-8 max-w-2xl">
                  <div
                    style={badgeStyle}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-4"
                  >
                    <Sparkles size={12} />
                    <span>
                      {isVol2
                        ? `Vol. 2 • ${combination.monthName} (${combination.monthJa})`
                        : `Harmony Plate № ${combination.id}`}
                    </span>
                  </div>

                  <h4 className="text-2xl sm:text-4xl font-editorial font-bold tracking-tight leading-tight">
                    Timeless color balance rooted in nature and modernism.
                  </h4>

                  <p className="mt-3 text-xs sm:text-sm opacity-80 leading-relaxed font-sans">
                    Sanzo Wada’s color compositions break away from rigid mathematical formulas,
                    capturing the delicate tensions of 1930s Showa aesthetics.
                  </p>

                  <div className="mt-6 flex items-center gap-3 flex-wrap">
                    <button
                      type="button"
                      style={{ backgroundColor: accentDisplayHex, color: accentTextColor }}
                      className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:opacity-95 transition-opacity"
                    >
                      Apply Color System
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: surfaceDisplayHex,
                        color: surfaceTextColor,
                      }}
                      className="px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-current/20 hover:opacity-95 transition-opacity"
                    >
                      View Palette Specs
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4">
                  {colors.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: surfaceDisplayHex,
                        color: surfaceTextColor,
                      }}
                      className="p-3.5 rounded-xl shadow-sm border border-current/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          style={{ backgroundColor: simHex(c.hex) }}
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        />
                        <span className="text-[11px] font-code opacity-75 uppercase">
                          Tone {i + 1}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-editorial font-bold truncate">
                        {c.ja ? c.ja : c.name}
                      </div>
                      <div className="text-[10px] font-code opacity-85 mt-0.5">
                        {c.hex.toUpperCase()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR SCIENCE & CONTRAST */}
          {activeTab === 'contrast-matrix' && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">
                  Color Space Specifications
                </h4>
                <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
                  <table className="w-full text-left text-xs font-code">
                    <thead className="bg-stone-100 dark:bg-stone-800/80 text-stone-600 dark:text-stone-400">
                      <tr>
                        <th className="p-3">Swatch</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Japanese</th>
                        <th className="p-3">HEX</th>
                        <th className="p-3">OKLCH</th>
                        <th className="p-3">RGB</th>
                        <th className="p-3">CMYK (Print)</th>
                        <th className="p-3">CIE-LAB</th>
                        <th className="p-3">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-200 dark:divide-stone-800">
                      {colors.map((c) => (
                        <tr key={c.id} className="hover:bg-stone-50 dark:hover:bg-stone-800/40">
                          <td className="p-3">
                            <div
                              style={{ backgroundColor: simHex(c.hex) }}
                              className="w-7 h-7 rounded border border-stone-300 dark:border-stone-700 shadow-xs"
                            />
                          </td>
                          <td className="p-3 font-editorial font-bold text-sm">
                            {onSelectColor ? (
                              <button
                                type="button"
                                onClick={() => onSelectColor(c)}
                                className="text-left hover:underline text-amber-900 dark:text-amber-300 cursor-pointer"
                              >
                                {c.name}
                              </button>
                            ) : (
                              c.name
                            )}
                          </td>
                          <td className="p-3 font-editorial text-sm text-stone-600 dark:text-stone-400">
                            {c.ja || '—'}
                          </td>
                          <td className="p-3 font-code font-semibold uppercase">{c.hex}</td>
                          <td className="p-3 font-code whitespace-nowrap">{formatOklch(c.rgb)}</td>
                          <td className="p-3 font-code whitespace-nowrap">{c.rgb.join(', ')}</td>
                          <td className="p-3 font-code whitespace-nowrap">{c.cmyk.join(', ')}</td>
                          <td className="p-3 font-code whitespace-nowrap">
                            {c.lab.map((v) => v.toFixed(1)).join(', ')}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => onCopyText(c.hex, `Copied ${c.name} (${c.hex})`)}
                              aria-label={`Copy hex ${c.hex}`}
                              className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer"
                              title="Copy hex"
                            >
                              <Copy size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">
                  Pairwise WCAG 2.1 Contrast & Accessibility Matrix
                  {cvdMode !== 'normal' && (
                    <span className="ml-2 text-xs font-normal text-amber-700 dark:text-amber-400">
                      (Under {cvdMode})
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {colors.map((c1, i) =>
                    colors.slice(i + 1).map((c2) => {
                      const hex1 = simHex(c1.hex);
                      const hex2 = simHex(c2.hex);
                      const ratio = getContrastRatio(hex1, hex2);

                      return (
                        <div
                          key={`${c1.id}-${c2.id}`}
                          className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/40"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              style={{ backgroundColor: hex1 }}
                              className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-xs shrink-0"
                            >
                              <span style={{ color: hex2 }}>Aa</span>
                            </div>
                            <div
                              style={{ backgroundColor: hex2 }}
                              className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-xs shrink-0"
                            >
                              <span style={{ color: hex1 }}>Aa</span>
                            </div>
                            <div className="text-xs min-w-0">
                              <div className="font-editorial font-bold truncate">
                                {c1.name} & {c2.name}
                              </div>
                              <div className="font-code text-[11px] text-stone-500">
                                {hex1} vs {hex2}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">{renderWcagBadge(ratio)}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODE & SWATCH EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(
                    [
                      ['css', 'CSS Variables'],
                      ['tailwind-v4', 'Tailwind v4'],
                      ['tailwind-v3', 'Tailwind v3'],
                      ['design-tokens', 'W3C / Figma Tokens'],
                      ['svg-palette', 'SVG Palette'],
                      ['gpl', 'GIMP (.gpl)'],
                      ['json', 'JSON'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setExportFormat(key)}
                      className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                        exportFormat === key
                          ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                      }`}
                    >
                      {label}
                    </button>
                  ))}

                  {exportFormat === 'css' && (
                    <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-300 ml-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={cssUseOklch}
                        onChange={(e) => setCssUseOklch(e.target.checked)}
                        className="rounded border-stone-300 dark:border-stone-700"
                      />
                      <span>OKLCH</span>
                    </label>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => {
                      downloadGplPalette(combination);
                      onCopyText('', 'Downloaded .gpl palette file');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>.gpl</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      downloadAsePalette(combination);
                      onCopyText('', 'Downloaded Adobe Swatch (.ase) file');
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <Download size={13} />
                    <span>.ase (Adobe)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCopyText(getExportSnippet(), `Copied ${exportFormat.toUpperCase()} snippet`);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>Copy Snippet</span>
                  </button>
                </div>
              </div>

              <pre className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-950 text-stone-200 text-xs font-code overflow-x-auto leading-relaxed">
                {getExportSnippet()}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
