import React, { useEffect, useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Copy,
  Eye,
  RefreshCw,
  Search,
  Share2,
  Shirt,
  Shuffle,
  Sparkles,
} from 'lucide-react';
import {
  ColorItem,
  ColorSortOption,
  Combination,
  CvdMode,
  HydratedCombination,
  ToneFilter,
} from '../types/color';
import { classifyColorTone, getIdealTextColor } from '../utils/colorUtils';
import { matchesColorTokens, matchesCombinationTokens, sortMasterColors } from '../utils/searchUtils';
import {
  analyzeOutfitHarmony,
  GARMENT_SLOT_ORDER,
  GARMENT_STYLE_CONFIG,
  GarmentOutfitIds,
  GarmentSlotKey,
  GarmentStyle,
  generateMenswearCss,
  mapComboToGarmentOutfit,
  MENSWEAR_PRESETS,
  SavedMenswearOutfit,
} from '../utils/menswearUtils';
import { MenswearIllustration } from './MenswearIllustration';
import { WadaColorWheel } from './WadaColorWheel';

interface MenswearStudioProps {
  allColors: ColorItem[];
  allCombinations: HydratedCombination[];
  style: GarmentStyle;
  onChangeStyle: (style: GarmentStyle) => void;
  outfitIds: GarmentOutfitIds;
  onChangeOutfit: (next: GarmentOutfitIds) => void;
  onSelectCombo?: (combo: Combination) => void;
  onSelectColorDetail?: (color: ColorItem) => void;
  onCopyText: (text: string, label: string) => void;
  onShareOutfit: () => void;
}

type ChooserTab = 'wheel' | 'swatches' | 'plates';

const SAVED_OUTFITS_KEY = 'sanzo-wada-menswear-outfits-v1';

const CVD_OPTIONS: { id: CvdMode; label: string }[] = [
  { id: 'normal', label: 'Normal Vision' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
  { id: 'achromatopsia', label: 'Achromatopsia' },
];

export const MenswearStudio: React.FC<MenswearStudioProps> = ({
  allColors,
  allCombinations,
  style,
  onChangeStyle,
  outfitIds,
  onChangeOutfit,
  onSelectCombo,
  onSelectColorDetail,
  onCopyText,
  onShareOutfit,
}) => {
  const [activeSlot, setActiveSlot] = useState<GarmentSlotKey>('outerwear');
  const [chooserTab, setChooserTab] = useState<ChooserTab>('wheel');
  const [cvdMode, setCvdMode] = useState<CvdMode>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all');
  const [swatchSort, setSwatchSort] = useState<ColorSortOption>('hue');
  const [lookName, setLookName] = useState('');
  const [savedOutfits, setSavedOutfits] = useState<SavedMenswearOutfit[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_OUTFITS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Ignore storage failures
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(SAVED_OUTFITS_KEY, JSON.stringify(savedOutfits));
    } catch {
      // Ignore storage failures
    }
  }, [savedOutfits]);

  const colorById = useMemo(
    () => new Map<number, ColorItem>(allColors.map((c) => [c.id, c])),
    [allColors]
  );

  const fallbackColor = allColors[0];
  const resolvedOutfit = useMemo(
    () => ({
      outerwear: colorById.get(outfitIds.outerwear) ?? fallbackColor,
      top: colorById.get(outfitIds.top) ?? fallbackColor,
      bottom: colorById.get(outfitIds.bottom) ?? fallbackColor,
      accent: colorById.get(outfitIds.accent) ?? fallbackColor,
      footwear: colorById.get(outfitIds.footwear) ?? fallbackColor,
    }),
    [outfitIds, colorById, fallbackColor]
  );

  const styleMeta = GARMENT_STYLE_CONFIG[style];
  const harmony = useMemo(
    () => analyzeOutfitHarmony(resolvedOutfit, allCombinations),
    [resolvedOutfit, allCombinations]
  );

  const filteredSwatches = useMemo(() => {
    const filtered = allColors.filter((c) => {
      if (toneFilter !== 'all' && classifyColorTone(c.rgb) !== toneFilter) return false;
      if (searchQuery.trim() && !matchesColorTokens(c, searchQuery)) return false;
      return true;
    });
    return sortMasterColors(filtered, swatchSort);
  }, [allColors, toneFilter, searchQuery, swatchSort]);

  const filteredCombos = useMemo(() => {
    if (!searchQuery.trim()) return allCombinations.slice(0, 60);
    return allCombinations.filter((c) => matchesCombinationTokens(c, searchQuery)).slice(0, 60);
  }, [allCombinations, searchQuery]);

  const handleAssignColor = (color: ColorItem) => {
    onChangeOutfit({
      ...outfitIds,
      [activeSlot]: color.id,
    });
  };

  const handleRotateGarments = () => {
    onChangeOutfit({
      outerwear: outfitIds.bottom,
      top: outfitIds.accent,
      bottom: outfitIds.outerwear,
      accent: outfitIds.top,
      footwear: outfitIds.footwear,
    });
  };

  const handleRandomWadaLook = () => {
    const pick = allCombinations[Math.floor(Math.random() * allCombinations.length)];
    if (pick) {
      onChangeOutfit(mapComboToGarmentOutfit(pick));
    }
  };

  const handleSaveOutfit = () => {
    const name =
      lookName.trim() || `${styleMeta.label} (${resolvedOutfit.outerwear.name.split(' ')[0]})`;
    const entry: SavedMenswearOutfit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      style,
      outfit: { ...outfitIds },
    };
    setSavedOutfits((prev) => [entry, ...prev].slice(0, 10));
    setLookName('');
  };

  return (
    <section aria-label="Menswear Garment Color Studio" className="space-y-5">
      {/* Top Studio Header & Presets Bar */}
      <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-800/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Shirt size={18} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-editorial font-bold text-stone-900 dark:text-stone-100">
                Menswear Garment Color Chooser
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Select any male garment piece, then choose pigments across the 360° Color Wheel or map any 1933–1935 Wada combination.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs text-stone-500">
              <Eye size={13} />
              <select
                aria-label="Simulate color vision on menswear"
                value={cvdMode}
                onChange={(e) => setCvdMode(e.target.value as CvdMode)}
                className="px-2 py-1 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 cursor-pointer"
              >
                {CVD_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={handleRotateGarments}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              <RefreshCw size={13} />
              <span>Rotate Roles</span>
            </button>

            <button
              type="button"
              onClick={handleRandomWadaLook}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              <Shuffle size={13} />
              <span>Dress from Random Plate</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onCopyText(
                  generateMenswearCss(style, resolvedOutfit),
                  'Copied menswear garment CSS variables'
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              <Copy size={13} />
              <span>Copy CSS</span>
            </button>

            <button
              type="button"
              onClick={onShareOutfit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800 dark:bg-amber-700 cursor-pointer"
            >
              <Share2 size={13} />
              <span>Share Outfit</span>
            </button>
          </div>
        </div>

        {/* Silhouette Switcher + Curated Lookbook Presets */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-stone-200/80 dark:border-stone-800">
          <div
            role="group"
            aria-label="Menswear silhouette style"
            className="inline-flex rounded-lg p-0.5 bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 self-start text-xs"
          >
            {(['suit', 'casual', 'wafuku'] as const).map((s) => (
              <button
                type="button"
                key={s}
                aria-pressed={style === s}
                onClick={() => onChangeStyle(s)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                  style === s
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
              >
                {GARMENT_STYLE_CONFIG[s].label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-stone-500 font-medium mr-1">Presets:</span>
            {MENSWEAR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => {
                  onChangeStyle(preset.style);
                  onChangeOutfit({ ...preset.outfit });
                }}
                title={preset.note}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <span className="flex h-2.5 w-4 rounded-sm overflow-hidden border border-black/15">
                  <span style={{ backgroundColor: colorById.get(preset.outfit.outerwear)?.hex }} className="flex-1" />
                  <span style={{ backgroundColor: colorById.get(preset.outfit.top)?.hex }} className="flex-1" />
                  <span style={{ backgroundColor: colorById.get(preset.outfit.accent)?.hex }} className="flex-1" />
                </span>
                <span>{preset.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Two-Column Dressing Stage + All-Colors Wheel/Picker */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT: Interactive Garment Mannequin + Garment Slot List + Harmony Readout */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-900/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-editorial font-bold text-stone-800 dark:text-stone-200">
                {styleMeta.label} Lookbook
              </span>
              <span className="font-code text-[11px] text-stone-500">
                Click any piece to customize
              </span>
            </div>

            <MenswearIllustration
              style={style}
              outfit={resolvedOutfit}
              cvdMode={cvdMode}
              activeSlot={activeSlot}
              onSelectSlot={setActiveSlot}
            />

            {/* 5 Clickable Garment Slots */}
            <div className="mt-4 space-y-2">
              {GARMENT_SLOT_ORDER.map((slot) => {
                const slotColor = resolvedOutfit[slot];
                const slotMeta = styleMeta.slots[slot];
                const isActive = activeSlot === slot;
                return (
                  <div
                    key={slot}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-colors ${
                      isActive
                        ? 'border-amber-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30 ring-1 ring-amber-600/30'
                        : 'border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-950/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveSlot(slot)}
                      aria-pressed={isActive}
                      className="flex items-center gap-2.5 text-left flex-1 min-w-0 cursor-pointer"
                    >
                      <span
                        style={{ backgroundColor: slotColor.hex }}
                        className="w-8 h-8 rounded-lg border border-black/20 shrink-0 shadow-xs"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                            {slotMeta.label}
                          </span>
                          {isActive && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-800 text-amber-50 text-[10px] font-code">
                              Editing
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-editorial text-stone-600 dark:text-stone-400 truncate">
                          #{slotColor.id} {slotColor.name}
                          {slotColor.ja ? ` (${slotColor.ja})` : ''} •{' '}
                          <span className="font-code uppercase">{slotColor.hex}</span>
                        </div>
                      </div>
                    </button>

                    {onSelectColorDetail && (
                      <button
                        type="button"
                        onClick={() => onSelectColorDetail(slotColor)}
                        aria-label={`Inspect swatch ${slotColor.name}`}
                        title={`Inspect #${slotColor.id} ${slotColor.name}`}
                        className="px-2 py-1 text-[11px] font-code rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 shrink-0 cursor-pointer"
                      >
                        Specs
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Save Custom Look */}
            <div className="mt-4 pt-3 border-t border-stone-300/60 dark:border-stone-800 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={lookName}
                  onChange={(e) => setLookName(e.target.value)}
                  placeholder="Name outfit look..."
                  aria-label="Saved menswear outfit name"
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                />
                <button
                  type="button"
                  onClick={handleSaveOutfit}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 cursor-pointer"
                >
                  <BookmarkPlus size={13} />
                  <span>Save Look</span>
                </button>
              </div>

              {savedOutfits.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="text-[11px] text-stone-500">Saved:</span>
                  {savedOutfits.map((look) => (
                    <div
                      key={look.id}
                      className="inline-flex items-center rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          onChangeStyle(look.style);
                          onChangeOutfit(look.outfit);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <span className="flex h-2.5 w-4 rounded-xs overflow-hidden border border-black/15">
                          <span style={{ backgroundColor: colorById.get(look.outfit.outerwear)?.hex }} className="flex-1" />
                          <span style={{ backgroundColor: colorById.get(look.outfit.top)?.hex }} className="flex-1" />
                          <span style={{ backgroundColor: colorById.get(look.outfit.bottom)?.hex }} className="flex-1" />
                        </span>
                        <span className="font-medium truncate max-w-[100px]">{look.name}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete saved outfit ${look.name}`}
                        onClick={() =>
                          setSavedOutfits((prev) => prev.filter((item) => item.id !== look.id))
                        }
                        className="px-1.5 py-0.5 text-stone-400 hover:text-rose-500 border-l border-stone-200 dark:border-stone-800 cursor-pointer"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sartorial Harmony & Archival Wada Plate Match */}
          <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 space-y-3 shadow-sm text-xs">
            <h3 className="font-editorial font-bold text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-700 dark:text-amber-400" />
              <span>Outfit Harmony &amp; Wada Plate Match</span>
            </h3>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] text-stone-500">Outerwear / Top Contrast</div>
                <div className="font-code font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                  {harmony.jacketShirtContrast.toFixed(1)}:1{' '}
                  <span className="text-[10px] font-normal text-stone-500">
                    ({harmony.jacketShirtContrast >= 4.5 ? 'Strong Collar Crispness' : 'Soft Tonal'})
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] text-stone-500">Jacket / Bottom Separation</div>
                <div className="font-code font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                  ΔE {harmony.jacketTrousersDeltaE.toFixed(1)}
                </div>
                <div className="text-[10px] text-stone-500 truncate">{harmony.trousersNote}</div>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[11px] text-stone-500 font-medium">
                Closest 1933–1935 Sanzo Wada Combinations:
              </div>
              {harmony.matchedCombos.map(({ combo, overlapCount, avgDeltaE }) => (
                <div
                  key={`${combo.volume}-${combo.id}`}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-950/40"
                >
                  <button
                    type="button"
                    onClick={() => onSelectCombo?.(combo)}
                    className="flex items-center gap-2 text-left min-w-0 flex-1 cursor-pointer hover:opacity-80"
                  >
                    <span className="flex h-4 w-10 rounded overflow-hidden border border-black/15 shrink-0">
                      {combo.colors.map((c) => (
                        <span key={c.id} style={{ backgroundColor: c.hex }} className="flex-1" />
                      ))}
                    </span>
                    <span className="font-editorial font-semibold text-stone-900 dark:text-stone-100 truncate">
                      {combo.volume === 2 ? `Vol. 2 Card № ${combo.id}` : `Vol. 1 № ${combo.id}`}
                    </span>
                    <span className="text-[10px] font-code text-stone-500 shrink-0">
                      {overlapCount > 0 ? `${overlapCount} exact` : `avg ΔE ${avgDeltaE.toFixed(1)}`}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeOutfit(mapComboToGarmentOutfit(combo))}
                    className="px-2 py-0.5 text-[11px] font-medium rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer shrink-0"
                  >
                    Apply
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: All-171 Color Wheel + Swatch Grid + Wada Plate Picker */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 space-y-3 shadow-sm">
            {/* Picker Tab & Search Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div
                role="tablist"
                aria-label="Menswear color picker mode"
                className="flex rounded-lg p-0.5 bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 text-xs self-start"
              >
                {(
                  [
                    ['wheel', 'Color Wheel (171)'],
                    ['swatches', 'All Swatches (171)'],
                    ['plates', 'Wada Combinations (420)'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    type="button"
                    role="tab"
                    key={key}
                    aria-selected={chooserTab === key}
                    onClick={() => setChooserTab(key)}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      chooserTab === key
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="relative flex-1 sm:max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    chooserTab === 'plates'
                      ? 'Search 420 plates (e.g. spring blue)...'
                      : 'Filter colors by name, kanji, or hex...'
                  }
                  aria-label="Filter menswear colors or combinations"
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
                />
              </div>
            </div>

            {chooserTab !== 'plates' && (
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                <div className="flex items-center gap-1 flex-wrap">
                  {(['all', 'warm', 'cool', 'earthy', 'pastel', 'deep', 'neutral'] as const).map(
                    (tone) => (
                      <button
                        type="button"
                        key={tone}
                        onClick={() => setToneFilter(tone)}
                        aria-pressed={toneFilter === tone}
                        className={`px-2 py-0.5 rounded capitalize font-medium cursor-pointer ${
                          toneFilter === tone
                            ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900'
                            : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                      >
                        {tone}
                      </button>
                    )
                  )}
                </div>

                {chooserTab === 'swatches' && (
                  <select
                    aria-label="Sort menswear swatch picker"
                    value={swatchSort}
                    onChange={(e) => setSwatchSort(e.target.value as ColorSortOption)}
                    className="px-2 py-1 text-xs rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 cursor-pointer"
                  >
                    <option value="hue">Hue Spectrum</option>
                    <option value="lightness">Lightness</option>
                    <option value="id-asc"># Swatch ID</option>
                    <option value="popularity">Most Used</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {chooserTab === 'wheel' && (
            <WadaColorWheel
              colors={filteredSwatches}
              onSelectColor={handleAssignColor}
              selectedIds={[outfitIds[activeSlot]]}
              activeSlotLabel={`${styleMeta.slots[activeSlot].label} (#${resolvedOutfit[activeSlot].id} ${resolvedOutfit[activeSlot].name})`}
            />
          )}

          {chooserTab === 'swatches' && (
            <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 max-h-[600px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 shadow-sm">
              {filteredSwatches.map((c) => {
                const isSelected = outfitIds[activeSlot] === c.id;
                const txt = getIdealTextColor(c.hex);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => handleAssignColor(c)}
                    style={{ backgroundColor: c.hex, color: txt }}
                    aria-pressed={isSelected}
                    className={`h-20 rounded-xl p-2.5 flex flex-col justify-between text-left border transition-transform cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-stone-900 scale-[0.98]'
                        : 'border-black/15 hover:scale-[1.02]'
                    }`}
                  >
                    <span className="text-[10px] font-code opacity-80">#{c.id}</span>
                    <div>
                      <div className="text-xs font-editorial font-bold truncate">{c.name}</div>
                      <div className="text-[10px] font-code opacity-80 uppercase">{c.hex}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {chooserTab === 'plates' && (
            <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 max-h-[600px] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
              {filteredCombos.map((combo) => (
                <button
                  type="button"
                  key={`${combo.volume}-${combo.id}`}
                  onClick={() => onChangeOutfit(mapComboToGarmentOutfit(combo))}
                  className="p-3 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-700/60 bg-stone-50/70 dark:bg-stone-950/40 text-left space-y-2 cursor-pointer transition-colors"
                >
                  <div className="flex h-10 rounded-lg overflow-hidden border border-black/15">
                    {combo.colors.map((c) => (
                      <div key={c.id} style={{ backgroundColor: c.hex }} className="flex-1" />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-editorial font-bold text-stone-900 dark:text-stone-100">
                      {combo.volume === 2 ? `Vol. 2 Card № ${combo.id}` : `Vol. 1 № ${combo.id}`}
                    </span>
                    <span className="font-code text-[11px] text-amber-800 dark:text-amber-400">
                      Dress Outfit →
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
