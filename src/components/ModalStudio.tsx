import React, { useState } from 'react';
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
} from 'lucide-react';
import { Combination } from '../types/color';
import {
  getContrastRatio,
  getIdealTextColor,
  downloadSvgCard,
  generateCssVariables,
  generateTailwindConfig,
  generateJsonExport,
} from '../utils/colorUtils';

interface ModalStudioProps {
  combination: Combination | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: number, volume: number) => void;
  onCopyText: (text: string, label: string) => void;
}

type StudioTab = 'art-print' | 'ui-mockup' | 'contrast-matrix' | 'export';

export const ModalStudio: React.FC<ModalStudioProps> = ({
  combination,
  onClose,
  isFavorite,
  onToggleFavorite,
  onCopyText,
}) => {
  if (!combination) return null;

  const [activeTab, setActiveTab] = useState<StudioTab>('art-print');
  const [exportFormat, setExportFormat] = useState<'css' | 'tailwind' | 'json'>('css');

  // UI Mockup custom color role mapping (indexes of colors in combination)
  const colors = combination.colors;
  const [bgIndex, setBgIndex] = useState<number>(0);
  const [surfaceIndex, setSurfaceIndex] = useState<number>(Math.min(1, colors.length - 1));
  const [accentIndex, setAccentIndex] = useState<number>(colors.length > 2 ? 2 : 0);

  const bgColor = colors[bgIndex] || colors[0];
  const surfaceColor = colors[surfaceIndex] || colors[1] || colors[0];
  const accentColor = colors[accentIndex] || colors[colors.length - 1];

  const bgTextColor = getIdealTextColor(bgColor.hex);
  const surfaceTextColor = getIdealTextColor(surfaceColor.hex);
  const accentTextColor = getIdealTextColor(accentColor.hex);

  const handleShuffleRoles = () => {
    const indices = Array.from({ length: colors.length }, (_, i) => i);
    const shuffled = [...indices].sort(() => Math.random() - 0.5);
    setBgIndex(shuffled[0]);
    setSurfaceIndex(shuffled[1 % colors.length]);
    setAccentIndex(shuffled[2 % colors.length]);
  };

  const isVol2 = combination.volume === 2;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Studio Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/90 shrink-0">
          <div className="flex items-center gap-3">
            {/* Hanko Stamp */}
            <div className="w-8 h-8 rounded border border-red-700 dark:border-red-600 flex items-center justify-center font-editorial font-bold text-red-700 dark:text-red-500 text-sm bg-red-50/50 dark:bg-red-950/20">
              三造
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-editorial font-bold">
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
              <p className="text-xs text-stone-500 font-editorial mt-0.5">
                {isVol2 && combination.monthMeaning && (
                  <span className="text-amber-800 dark:text-amber-400 font-medium mr-2">
                    {combination.monthMeaning} —
                  </span>
                )}
                {colors.map((c) => (c.ja ? `${c.name} (${c.ja})` : c.name)).join(' • ')}
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2">
            {/* Download SVG Poster */}
            <button
              onClick={() => downloadSvgCard(combination)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              title="Download print-ready SVG Card"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export SVG</span>
            </button>

            {/* Favorite toggle */}
            <button
              onClick={() => onToggleFavorite(combination.id, combination.volume)}
              className={`p-2 rounded-lg transition-colors ${
                isFavorite
                  ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
                  : 'text-stone-400 hover:text-rose-500 hover:bg-stone-100 dark:hover:bg-stone-800'
              }`}
              title={isFavorite ? 'Remove favorite' : 'Add to favorites'}
            >
              <Heart size={16} className={isFavorite ? 'fill-rose-500' : ''} />
            </button>

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Studio Subnav Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('art-print')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'art-print'
                ? 'border-amber-800 text-amber-900 dark:border-amber-500 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Palette size={15} />
            <span>Showa Art Print</span>
          </button>
          <button
            onClick={() => setActiveTab('ui-mockup')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'ui-mockup'
                ? 'border-amber-800 text-amber-900 dark:border-amber-500 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Layout size={15} />
            <span>Interactive UI Mockup</span>
          </button>
          <button
            onClick={() => setActiveTab('contrast-matrix')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'contrast-matrix'
                ? 'border-amber-800 text-amber-900 dark:border-amber-500 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <Eye size={15} />
            <span>Color Science & Contrast</span>
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-1.5 py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-all ${
              activeTab === 'export'
                ? 'border-amber-800 text-amber-900 dark:border-amber-500 dark:text-amber-400 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            <FileCode size={15} />
            <span>Code Export</span>
          </button>
        </div>

        {/* Tab Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: SHOWA ART PRINT */}
          {activeTab === 'art-print' && (
            <div className="flex flex-col items-center">
              {/* Art Poster Card Container */}
              <div className="w-full max-w-xl p-8 sm:p-12 rounded-xl border border-stone-300/80 bg-[#FAF7F2] text-[#1C1A17] shadow-xl relative overflow-hidden">
                {/* Border inner accent line */}
                <div className="absolute inset-4 border border-stone-400/30 pointer-events-none" />

                {/* Poster Header */}
                <div className="flex justify-between items-start mb-6 relative z-10">
                  <div>
                    <h3 className="font-editorial text-2xl font-bold tracking-widest text-[#1C1A17] uppercase">
                      A Dictionary of Color Combinations
                    </h3>
                    <p className="font-editorial text-sm text-stone-600 mt-1">
                      和田三造 (Sanzo Wada, 1933) — 配色総鑑 {isVol2 ? 'B篇 (Seasonal)' : ''}
                    </p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="font-editorial text-xl font-bold text-red-800">
                        {isVol2 ? `Vol. 2 Card № ${combination.id}` : `№ ${combination.id.toString().padStart(3, '0')}`}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-stone-500 font-code">
                        {isVol2
                          ? `${combination.monthName} (${combination.monthJa})`
                          : `${combination.size}-Color Harmony`}
                      </span>
                    </div>
                  </div>

                  {/* Red Hanko Stamp */}
                  <div className="w-12 h-12 rounded border-2 border-red-800 flex items-center justify-center font-editorial font-black text-red-800 text-lg shadow-xs shrink-0">
                    三造
                  </div>
                </div>

                {/* Harmonic Color Blocks Visualization */}
                <div className="grid grid-cols-1 gap-2.5 my-5 relative z-10">
                  {colors.map((c) => {
                    const txtColor = getIdealTextColor(c.hex);
                    return (
                      <div
                        key={c.id}
                        style={{ backgroundColor: c.hex }}
                        className="min-h-[4rem] sm:min-h-[4.75rem] rounded-lg p-3 sm:p-4 flex items-center justify-between shadow-sm transition-transform hover:scale-[1.01]"
                      >
                        <div style={{ color: txtColor }}>
                          <div className="text-sm sm:text-base font-editorial font-bold">
                            {c.name} {c.ja && <span className="opacity-90 font-normal text-xs sm:text-sm">({c.ja})</span>}
                          </div>
                          <div className="text-xs font-code opacity-85 uppercase">
                            {c.hex}
                          </div>
                        </div>

                        <div
                          style={{ color: txtColor }}
                          className="text-right text-[11px] font-code opacity-75 hidden sm:block"
                        >
                          <div>CMYK({c.cmyk.join(', ')})</div>
                          <div>RGB({c.rgb.join(', ')})</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Poster Footer */}
                <div className="mt-6 pt-4 border-t border-stone-300 text-center relative z-10">
                  <p className="text-[11px] font-editorial text-stone-500 tracking-wider">
                    Published by the Japan Standard Color Association • Showa Era Masterwork
                  </p>
                </div>
              </div>

              {/* Action row below poster */}
              <div className="mt-6 flex items-center gap-3">
                <button
                  onClick={() => downloadSvgCard(combination)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-900 hover:bg-amber-800 text-amber-50 font-medium text-xs sm:text-sm shadow-sm transition-colors"
                >
                  <Download size={15} />
                  <span>Download SVG Card</span>
                </button>
                <button
                  onClick={() => {
                    const hexes = colors.map((c) => c.hex).join(', ');
                    onCopyText(hexes, `Copied hex codes: ${hexes}`);
                  }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-xs sm:text-sm font-medium transition-colors"
                >
                  <Copy size={15} />
                  <span>Copy All Hex Codes</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE UI MOCKUP */}
          {activeTab === 'ui-mockup' && (
            <div className="space-y-6">
              {/* Role Assignment Bar */}
              <div className="p-4 rounded-xl border border-stone-300 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Custom Color Roles:
                  </span>
                  <button
                    onClick={handleShuffleRoles}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 transition-colors"
                  >
                    <RefreshCw size={12} />
                    <span>Shuffle Roles</span>
                  </button>
                </div>

                <div className="flex items-center gap-4 flex-wrap text-xs">
                  {/* Background Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500">Background:</span>
                    <select
                      value={bgIndex}
                      onChange={(e) => setBgIndex(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    >
                      {colors.map((c, i) => (
                        <option key={i} value={i}>
                          Color {i + 1} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Surface Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500">Surface:</span>
                    <select
                      value={surfaceIndex}
                      onChange={(e) => setSurfaceIndex(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    >
                      {colors.map((c, i) => (
                        <option key={i} value={i}>
                          Color {i + 1} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Accent Picker */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-500">Accent:</span>
                    <select
                      value={accentIndex}
                      onChange={(e) => setAccentIndex(Number(e.target.value))}
                      className="px-2 py-1 rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900"
                    >
                      {colors.map((c, i) => (
                        <option key={i} value={i}>
                          Color {i + 1} ({c.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* The Rendered Live UI Preview Container */}
              <div
                style={{ backgroundColor: bgColor.hex, color: bgTextColor }}
                className="rounded-2xl p-6 sm:p-8 shadow-xl border border-black/10 transition-colors duration-300"
              >
                {/* Mockup Header Navigation */}
                <div className="flex items-center justify-between pb-6 border-b border-current/15">
                  <div className="flex items-center gap-2">
                    <div
                      style={{ backgroundColor: accentColor.hex, color: accentTextColor }}
                      className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    >
                      和
                    </div>
                    <span className="font-editorial font-bold text-lg tracking-tight">
                      Atelier Wada
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-6 text-xs font-medium opacity-85">
                    <span className="hover:opacity-100 cursor-pointer">Collections</span>
                    <span className="hover:opacity-100 cursor-pointer">Color Theory</span>
                    <span className="hover:opacity-100 cursor-pointer">Archive</span>
                  </div>

                  <button
                    style={{ backgroundColor: accentColor.hex, color: accentTextColor }}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm hover:opacity-90 active:scale-95 transition-all"
                  >
                    Explore Gallery
                  </button>
                </div>

                {/* Mockup Hero Content */}
                <div className="py-8 max-w-2xl">
                  <div
                    style={{
                      backgroundColor: `${accentColor.hex}22`,
                      color: accentColor.hex,
                      borderColor: `${accentColor.hex}44`,
                    }}
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

                  <div className="mt-6 flex items-center gap-3">
                    <button
                      style={{ backgroundColor: accentColor.hex, color: accentTextColor }}
                      className="px-5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold shadow-md hover:opacity-95 transition-all"
                    >
                      Apply Color System
                    </button>
                    <button
                      style={{
                        backgroundColor: surfaceColor.hex,
                        color: surfaceTextColor,
                      }}
                      className="px-4 py-2.5 rounded-lg text-xs sm:text-sm font-medium border border-current/20 hover:opacity-95 transition-all"
                    >
                      View Palette Specs
                    </button>
                  </div>
                </div>

                {/* Mockup Stat Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4">
                  {colors.map((c, i) => (
                    <div
                      key={c.id}
                      style={{
                        backgroundColor: surfaceColor.hex,
                        color: surfaceTextColor,
                      }}
                      className="p-3.5 rounded-xl shadow-sm border border-current/10"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          style={{ backgroundColor: c.hex }}
                          className="w-4 h-4 rounded-full border border-black/20 shrink-0"
                        />
                        <span className="text-[11px] font-code opacity-75 uppercase">
                          Tone {i + 1}
                        </span>
                      </div>
                      <div className="text-xs sm:text-sm font-editorial font-bold truncate">
                        {c.ja ? c.ja : c.name}
                      </div>
                      <div className="text-[10px] font-code opacity-85 mt-0.5">{c.hex.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: COLOR SCIENCE & CONTRAST */}
          {activeTab === 'contrast-matrix' && (
            <div className="space-y-6">
              {/* Swatch Details Table */}
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
                              style={{ backgroundColor: c.hex }}
                              className="w-7 h-7 rounded border border-stone-300 dark:border-stone-700 shadow-xs"
                            />
                          </td>
                          <td className="p-3 font-editorial font-bold text-sm">{c.name}</td>
                          <td className="p-3 font-editorial text-sm text-stone-600 dark:text-stone-400">
                            {c.ja || '—'}
                          </td>
                          <td className="p-3 font-code font-semibold uppercase">{c.hex}</td>
                          <td className="p-3 font-code">{c.rgb.join(', ')}</td>
                          <td className="p-3 font-code">{c.cmyk.join(', ')}</td>
                          <td className="p-3 font-code">
                            {c.lab.map((v) => v.toFixed(1)).join(', ')}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() => onCopyText(c.hex, `Copied ${c.name} (${c.hex})`)}
                              className="p-1 rounded hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
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

              {/* Pairwise Contrast Matrix */}
              <div>
                <h4 className="text-sm font-semibold text-stone-800 dark:text-stone-200 mb-3">
                  Pairwise WCAG 2.1 Contrast & Accessibility Matrix
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {colors.map((c1, i) =>
                    colors.slice(i + 1).map((c2) => {
                      const ratio = getContrastRatio(c1.hex, c2.hex);
                      const isAAA = ratio >= 7;
                      const isAA = ratio >= 4.5;
                      const isLargeAA = ratio >= 3;

                      return (
                        <div
                          key={`${c1.id}-${c2.id}`}
                          className="p-3.5 rounded-xl border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 bg-stone-50/50 dark:bg-stone-900/40"
                        >
                          <div className="flex items-center gap-2.5">
                            <div
                              style={{ backgroundColor: c1.hex }}
                              className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-xs shrink-0"
                            >
                              <span style={{ color: c2.hex }}>Aa</span>
                            </div>
                            <div
                              style={{ backgroundColor: c2.hex }}
                              className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 flex items-center justify-center font-bold text-xs shrink-0"
                            >
                              <span style={{ color: c1.hex }}>Aa</span>
                            </div>
                            <div className="text-xs">
                              <div className="font-editorial font-bold">
                                {c1.name} & {c2.name}
                              </div>
                              <div className="font-code text-[11px] text-stone-500">
                                {c1.hex} vs {c2.hex}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-sm font-code font-bold">
                              {ratio.toFixed(2)}:1
                            </div>
                            <div className="flex gap-1 mt-0.5 justify-end">
                              {isAAA ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                  AAA
                                </span>
                              ) : isAA ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-500/15 text-blue-600 dark:text-blue-400">
                                  AA
                                </span>
                              ) : isLargeAA ? (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                                  Large Text
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400">
                                  Low
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CODE EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setExportFormat('css')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      exportFormat === 'css'
                        ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    CSS Variables
                  </button>
                  <button
                    onClick={() => setExportFormat('tailwind')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      exportFormat === 'tailwind'
                        ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    Tailwind CSS
                  </button>
                  <button
                    onClick={() => setExportFormat('json')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      exportFormat === 'json'
                        ? 'bg-amber-900 text-amber-50 dark:bg-amber-700'
                        : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300'
                    }`}
                  >
                    JSON
                  </button>
                </div>

                <button
                  onClick={() => {
                    const text =
                      exportFormat === 'css'
                        ? generateCssVariables(combination)
                        : exportFormat === 'tailwind'
                        ? generateTailwindConfig(combination)
                        : generateJsonExport(combination);
                    onCopyText(text, `Copied ${exportFormat.toUpperCase()} snippet`);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 transition-opacity"
                >
                  <Copy size={13} />
                  <span>Copy Snippet</span>
                </button>
              </div>

              {/* Code Display Area */}
              <pre className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-950 text-stone-200 text-xs font-code overflow-x-auto leading-relaxed">
                {exportFormat === 'css' && generateCssVariables(combination)}
                {exportFormat === 'tailwind' && generateTailwindConfig(combination)}
                {exportFormat === 'json' && generateJsonExport(combination)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
