import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookmarkPlus,
  Columns2,
  Copy,
  Download,
  Eye,
  Flame,
  ImageDown,
  Moon,
  RefreshCw,
  Search,
  Share2,
  Shirt,
  Shuffle,
  Sparkles,
  Sun,
} from 'lucide-react';
import {
  ColorItem,
  ColorSortOption,
  Combination,
  CvdMode,
  HydratedCombination,
  ToneFilter,
} from '../types/color';
import {
  classifyColorTone,
  downloadAsePalette,
  downloadGplPalette,
  generateDesignTokensJson,
  getCompareKey,
  getIdealTextColor,
} from '../utils/colorUtils';
import { matchesColorTokens, matchesCombinationTokens, sortMasterColors } from '../utils/searchUtils';
import {
  ACCENT_CUTS,
  analyzeOutfitHarmony,
  BOTTOM_CUTS,
  DEFAULT_GARMENT_PATTERNS,
  DEFAULT_PATTERN_COLORS,
  downloadMenswearLookbookPng,
  downloadMenswearLookbookSvg,
  FABRIC_MATERIAL_META,
  FABRIC_PATTERN_META,
  FabricMaterial,
  FabricPattern,
  FOOTWEAR_CUTS,
  GARMENT_SLOT_ORDER,
  GARMENT_STYLE_META,
  GarmentMaterials,
  GarmentOutfitIds,
  GarmentPatternColorIds,
  GarmentPatterns,
  GarmentPieces,
  GarmentSlotKey,
  GarmentStyle,
  generateMenswearCss,
  getDefaultMaterialForCut,
  getDefaultMaterialsForPieces,
  getSlotDisplayLabel,
  LIGHTING_PRESET_META,
  LightingPreset,
  mapComboToGarmentOutfit,
  MATERIALS_BY_SLOT,
  MENSWEAR_PRESETS,
  menswearOutfitToCombination,
  OUTERWEAR_CUTS,
  PATTERNS_BY_SLOT,
  SavedMenswearOutfit,
  SKIN_TONE_PRESETS,
  SkinToneId,
  STYLE_PRESET_PIECES,
  TOP_CUTS,
} from '../utils/menswearUtils';
import { MenswearIllustration } from './MenswearIllustration';

interface MenswearStudioProps {
  allColors: ColorItem[];
  allCombinations: HydratedCombination[];
  style: GarmentStyle;
  onChangeStyle: (style: GarmentStyle) => void;
  outfitIds: GarmentOutfitIds;
  onChangeOutfit: (next: GarmentOutfitIds) => void;
  pieces?: GarmentPieces;
  onChangePieces?: (next: GarmentPieces) => void;
  materials?: GarmentMaterials;
  onChangeMaterials?: (next: GarmentMaterials) => void;
  patterns?: GarmentPatterns;
  onChangePatterns?: (next: GarmentPatterns) => void;
  patternColors?: GarmentPatternColorIds;
  onChangePatternColors?: (next: GarmentPatternColorIds) => void;
  skinTone?: SkinToneId;
  onChangeSkinTone?: (next: SkinToneId) => void;
  lighting?: LightingPreset;
  onChangeLighting?: (next: LightingPreset) => void;
  onPinCompare?: (combo: HydratedCombination) => void;
  compareSet?: Set<string>;
  onSelectCombo?: (combo: Combination) => void;
  onSelectColorDetail?: (color: ColorItem) => void;
  onCopyText: (text: string, label: string) => void;
  onShareOutfit: () => void;
}

type ChooserTab = 'swatches' | 'plates';

const SAVED_OUTFITS_KEY = 'sanzo-wada-menswear-outfits-v1';

const CVD_OPTIONS: { id: CvdMode; label: string }[] = [
  { id: 'normal', label: 'Normal Vision' },
  { id: 'protanopia', label: 'Protanopia' },
  { id: 'deuteranopia', label: 'Deuteranopia' },
  { id: 'tritanopia', label: 'Tritanopia' },
  { id: 'achromatopsia', label: 'Achromatopsia' },
];

const CUT_OPTIONS_BY_SLOT: Record<GarmentSlotKey, { id: string; label: string }[]> = {
  outerwear: OUTERWEAR_CUTS,
  top: TOP_CUTS,
  bottom: BOTTOM_CUTS,
  accent: ACCENT_CUTS,
  footwear: FOOTWEAR_CUTS,
};

export const MenswearStudio: React.FC<MenswearStudioProps> = ({
  allColors,
  allCombinations,
  style,
  onChangeStyle,
  outfitIds,
  onChangeOutfit,
  pieces: controlledPieces,
  onChangePieces,
  materials: controlledMaterials,
  onChangeMaterials,
  patterns: controlledPatterns,
  onChangePatterns,
  patternColors: controlledPatternColors,
  onChangePatternColors,
  skinTone: controlledSkinTone,
  onChangeSkinTone,
  lighting: controlledLighting,
  onChangeLighting,
  onPinCompare,
  compareSet,
  onSelectCombo,
  onSelectColorDetail,
  onCopyText,
  onShareOutfit,
}) => {
  const [localPieces, setLocalPieces] = useState<GarmentPieces>(() => ({
    ...STYLE_PRESET_PIECES[style],
  }));
  const [localMaterials, setLocalMaterials] = useState<GarmentMaterials>(() =>
    getDefaultMaterialsForPieces(STYLE_PRESET_PIECES[style])
  );
  const [localPatterns, setLocalPatterns] = useState<GarmentPatterns>({
    ...DEFAULT_GARMENT_PATTERNS,
  });
  const [localPatternColors, setLocalPatternColors] = useState<GarmentPatternColorIds>({
    ...DEFAULT_PATTERN_COLORS,
  });
  const [localSkinTone, setLocalSkinTone] = useState<SkinToneId>('warm-ivory');
  const [localLighting, setLocalLighting] = useState<LightingPreset>('daylight');

  const pieces = controlledPieces ?? localPieces;
  const materials = controlledMaterials ?? localMaterials;
  const patterns = controlledPatterns ?? localPatterns;
  const patternColors = controlledPatternColors ?? localPatternColors;
  const skinTone = controlledSkinTone ?? localSkinTone;
  const lighting = controlledLighting ?? localLighting;

  const setPieces = (next: GarmentPieces) => {
    setLocalPieces(next);
    onChangePieces?.(next);
  };
  const setMaterials = (next: GarmentMaterials) => {
    setLocalMaterials(next);
    onChangeMaterials?.(next);
  };
  const setPatterns = (next: GarmentPatterns) => {
    setLocalPatterns(next);
    onChangePatterns?.(next);
  };
  const setPatternColors = (next: GarmentPatternColorIds) => {
    setLocalPatternColors(next);
    onChangePatternColors?.(next);
  };
  const setSkinTone = (next: SkinToneId) => {
    setLocalSkinTone(next);
    onChangeSkinTone?.(next);
  };
  const setLighting = (next: LightingPreset) => {
    setLocalLighting(next);
    onChangeLighting?.(next);
  };

  const [activeSlot, setActiveSlot] = useState<GarmentSlotKey>(() =>
    pieces.outerwear === 'none' ? 'top' : 'outerwear'
  );
  const [editingTarget, setEditingTarget] = useState<'base' | 'pattern'>('base');
  const [chooserTab, setChooserTab] = useState<ChooserTab>('swatches');
  const [cvdMode, setCvdMode] = useState<CvdMode>('normal');
  const [searchQuery, setSearchQuery] = useState('');
  const [toneFilter, setToneFilter] = useState<ToneFilter>('all');
  const [swatchSort, setSwatchSort] = useState<ColorSortOption>('hue');
  const [lookName, setLookName] = useState('');
  const [isExportingPng, setIsExportingPng] = useState(false);
  const croquisSvgRef = useRef<SVGSVGElement | null>(null);
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

  useEffect(() => {
    if (pieces.outerwear === 'none' && activeSlot === 'outerwear') {
      setActiveSlot('top');
      setEditingTarget('base');
    }
  }, [pieces.outerwear, activeSlot]);

  useEffect(() => {
    if (editingTarget === 'pattern' && patterns[activeSlot] === 'solid') {
      setEditingTarget('base');
    }
  }, [editingTarget, patterns, activeSlot]);

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

  const resolvedPatternColors = useMemo(
    () => ({
      outerwear: colorById.get(patternColors.outerwear) ?? fallbackColor,
      top: colorById.get(patternColors.top) ?? fallbackColor,
      bottom: colorById.get(patternColors.bottom) ?? fallbackColor,
      accent: colorById.get(patternColors.accent) ?? fallbackColor,
      footwear: colorById.get(patternColors.footwear) ?? fallbackColor,
    }),
    [patternColors, colorById, fallbackColor]
  );

  const styleMeta = GARMENT_STYLE_META[style];
  const lightingMeta = LIGHTING_PRESET_META[lighting];
  const outfitCombo = useMemo(
    () => menswearOutfitToCombination(resolvedOutfit, pieces),
    [resolvedOutfit, pieces]
  );
  const isOutfitCompared = compareSet?.has(getCompareKey(outfitCombo)) ?? false;
  const harmony = useMemo(
    () => analyzeOutfitHarmony(resolvedOutfit, allCombinations, pieces),
    [resolvedOutfit, allCombinations, pieces]
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

  const handleSelectStyle = (nextStyle: GarmentStyle, presetOutfit?: GarmentOutfitIds) => {
    const nextPieces = { ...STYLE_PRESET_PIECES[nextStyle] };
    onChangeStyle(nextStyle);
    setPieces(nextPieces);
    setMaterials(getDefaultMaterialsForPieces(nextPieces));
    setPatterns({ ...DEFAULT_GARMENT_PATTERNS });
    setEditingTarget('base');
    if (nextPieces.outerwear === 'none' && activeSlot === 'outerwear') {
      setActiveSlot('top');
    }
    if (presetOutfit) {
      onChangeOutfit(presetOutfit);
    }
  };

  const handleSelectSlotBase = (slot: GarmentSlotKey) => {
    setActiveSlot(slot);
    setEditingTarget('base');
  };

  const handleAssignColor = (color: ColorItem) => {
    if (editingTarget === 'pattern' && patterns[activeSlot] !== 'solid') {
      setPatternColors({
        ...patternColors,
        [activeSlot]: color.id,
      });
      return;
    }
    onChangeOutfit({
      ...outfitIds,
      [activeSlot]: color.id,
    });
  };

  const handleCutChange = (slot: GarmentSlotKey, nextCut: string) => {
    const nextPieces = {
      ...pieces,
      [slot]: nextCut,
    } as GarmentPieces;
    setPieces(nextPieces);
    setMaterials({
      ...materials,
      [slot]: getDefaultMaterialForCut(slot, nextCut),
    });
    setEditingTarget('base');
    if (slot === 'outerwear' && nextCut !== 'none') {
      setActiveSlot('outerwear');
    } else if (slot === 'outerwear' && nextCut === 'none' && activeSlot === 'outerwear') {
      setActiveSlot('top');
    } else {
      setActiveSlot(slot);
    }
  };

  const handleMaterialChange = (slot: GarmentSlotKey, nextMaterial: FabricMaterial) => {
    setMaterials({
      ...materials,
      [slot]: nextMaterial,
    });
    setActiveSlot(slot);
  };

  const handlePatternChange = (slot: GarmentSlotKey, nextPattern: FabricPattern) => {
    setPatterns({
      ...patterns,
      [slot]: nextPattern,
    });
    setActiveSlot(slot);
    if (nextPattern === 'solid') {
      setEditingTarget('base');
    }
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

  const handleExportSvgLookbook = () => {
    if (!croquisSvgRef.current) return;
    downloadMenswearLookbookSvg({
      croquisSvgMarkup: croquisSvgRef.current.outerHTML,
      style,
      pieces,
      materials,
      patterns,
      outfit: resolvedOutfit,
      skinTone,
      lighting,
    });
  };

  const handleExportPngLookbook = async () => {
    if (!croquisSvgRef.current || isExportingPng) return;
    setIsExportingPng(true);
    try {
      await downloadMenswearLookbookPng({
        croquisSvgMarkup: croquisSvgRef.current.outerHTML,
        style,
        pieces,
        materials,
        patterns,
        outfit: resolvedOutfit,
        skinTone,
        lighting,
      });
    } finally {
      setIsExportingPng(false);
    }
  };

  const handleSaveOutfit = () => {
    const anchorColor = pieces.outerwear === 'none' ? resolvedOutfit.top : resolvedOutfit.outerwear;
    const name = lookName.trim() || `${styleMeta.shortLabel} (${anchorColor.name.split(' ')[0]})`;
    const entry: SavedMenswearOutfit = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      style,
      pieces: { ...pieces },
      materials: { ...materials },
      patterns: { ...patterns },
      patternColors: { ...patternColors },
      skinTone,
      lighting,
      outfit: { ...outfitIds },
    };
    setSavedOutfits((prev) => [entry, ...prev].slice(0, 10));
    setLookName('');
  };

  return (
    <section aria-label="Menswear Garment Color Studio" className="space-y-5">
      {/* Top Studio Header & Styles/Presets Bar */}
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
                Mix and match male wardrobe cuts—suits, shirts &amp; chinos, overcoats, hoodies &amp; streetwear, shorts, or Japanese haori—across all 171 archival Wada swatches.
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
                  generateMenswearCss(style, resolvedOutfit, pieces, materials, patterns),
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
              onClick={handleExportSvgLookbook}
              aria-label="Export menswear SVG lookbook"
              title="Download printable vector Lookbook Card (.svg)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer"
            >
              <Download size={13} />
              <span>SVG Lookbook</span>
            </button>

            <button
              type="button"
              onClick={handleExportPngLookbook}
              disabled={isExportingPng}
              aria-label="Export menswear PNG lookbook"
              title="Download High-DPI 2x Lookbook Card (.png)"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 cursor-pointer disabled:opacity-50"
            >
              <ImageDown size={13} />
              <span>{isExportingPng ? 'Rendering...' : '2× PNG'}</span>
            </button>

            {onPinCompare && (
              <button
                type="button"
                onClick={() => onPinCompare(outfitCombo)}
                aria-label="Pin menswear palette to compare"
                aria-pressed={isOutfitCompared}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                  isOutfitCompared
                    ? 'bg-amber-100 dark:bg-amber-950/50 border-amber-700/40 text-amber-900 dark:text-amber-300'
                    : 'border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200'
                }`}
              >
                <Columns2 size={13} />
                <span>{isOutfitCompared ? 'Pinned' : 'Compare'}</span>
              </button>
            )}

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

        {/* Silhouette Switcher (6 Male Wardrobe Categories) + Quick Color Presets */}
        <div className="space-y-2.5 pt-3 border-t border-stone-200/80 dark:border-stone-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Menswear silhouette style"
              className="inline-flex flex-wrap rounded-lg p-0.5 bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 text-xs"
            >
              {(['suit', 'smart-casual', 'overcoat', 'streetwear', 'resort', 'wafuku'] as const).map(
                (s) => (
                  <button
                    type="button"
                    key={s}
                    aria-pressed={style === s}
                    onClick={() => handleSelectStyle(s)}
                    className={`px-2.5 py-1.5 rounded-md font-medium transition-colors cursor-pointer ${
                      style === s
                        ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                    }`}
                  >
                    {GARMENT_STYLE_META[s].label}
                  </button>
                )
              )}
            </div>

            <span className="text-[11px] text-stone-500 dark:text-stone-400">
              {styleMeta.subtitle}
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-stone-500 font-medium mr-1">Lookbook Presets:</span>
            {MENSWEAR_PRESETS.map((preset) => (
              <button
                type="button"
                key={preset.id}
                onClick={() => handleSelectStyle(preset.style, { ...preset.outfit })}
                title={preset.note}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <span className="flex h-2.5 w-4 rounded-sm overflow-hidden border border-black/15">
                  <span style={{ backgroundColor: colorById.get(preset.outfit.top)?.hex }} className="flex-1" />
                  <span style={{ backgroundColor: colorById.get(preset.outfit.bottom)?.hex }} className="flex-1" />
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
        {/* LEFT: Interactive Garment Croquis + Modular Piece & Color Controls + Harmony */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-[#FAF7F2] dark:bg-stone-900/90 p-5 shadow-sm">
            <div className="flex items-center justify-between text-xs mb-2.5 gap-2 flex-wrap">
              <span className="font-editorial font-bold text-stone-800 dark:text-stone-200">
                {styleMeta.label} Lookbook
              </span>
              <div className="flex items-center gap-3 flex-wrap">
                {/* 5 Skin Complexion Presets */}
                <div className="flex items-center gap-1" role="group" aria-label="Model skin complexion">
                  {(Object.keys(SKIN_TONE_PRESETS) as SkinToneId[]).map((id) => {
                    const skinMeta = SKIN_TONE_PRESETS[id];
                    const selected = skinTone === id;
                    return (
                      <button
                        type="button"
                        key={id}
                        onClick={() => setSkinTone(id)}
                        title={`Complexion: ${skinMeta.label}`}
                        aria-label={`Skin tone ${skinMeta.label}`}
                        aria-pressed={selected}
                        style={{ backgroundColor: skinMeta.base }}
                        className={`w-4 h-4 rounded-full border transition-transform cursor-pointer ${
                          selected
                            ? 'ring-2 ring-amber-700 ring-offset-1 dark:ring-amber-400 scale-110 border-black/30'
                            : 'border-black/25 opacity-80 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* 3 Studio Stage Lighting Presets */}
                <div
                  role="group"
                  aria-label="Stage ambient lighting"
                  className="inline-flex rounded-lg p-0.5 bg-stone-200/70 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/50 text-[10px]"
                >
                  {(['daylight', 'warm-indoor', 'evening-gallery'] as const).map((presetKey) => {
                    const active = lighting === presetKey;
                    const Icon =
                      presetKey === 'daylight'
                        ? Sun
                        : presetKey === 'warm-indoor'
                        ? Flame
                        : Moon;
                    const shortLabel =
                      presetKey === 'daylight'
                        ? 'Day'
                        : presetKey === 'warm-indoor'
                        ? 'Warm'
                        : 'Night';
                    return (
                      <button
                        type="button"
                        key={presetKey}
                        onClick={() => setLighting(presetKey)}
                        title={LIGHTING_PRESET_META[presetKey].label}
                        aria-label={`Lighting ${LIGHTING_PRESET_META[presetKey].label}`}
                        aria-pressed={active}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-medium cursor-pointer transition-colors ${
                          active
                            ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        <Icon size={10} />
                        <span>{shortLabel}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div
              style={{ backgroundColor: lightingMeta.stageBgHex }}
              className="rounded-xl p-3 border border-stone-300/60 dark:border-stone-700/60 transition-colors duration-200"
            >
              <MenswearIllustration
                svgRef={croquisSvgRef}
                style={style}
                pieces={pieces}
                materials={materials}
                patterns={patterns}
                patternColors={resolvedPatternColors}
                skinTone={skinTone}
                lighting={lighting}
                outfit={resolvedOutfit}
                cvdMode={cvdMode}
                activeSlot={activeSlot}
                onSelectSlot={handleSelectSlotBase}
              />
            </div>

            {/* 5 Modular Garment Slot Cards (Color + Mix-and-Match Cut Selector) */}
            <div className="mt-4 space-y-2">
              {GARMENT_SLOT_ORDER.map((slot) => {
                const slotColor = resolvedOutfit[slot];
                const slotTitle = getSlotDisplayLabel(slot, pieces);
                const isActive = activeSlot === slot;
                const isDisabledCoat = slot === 'outerwear' && pieces.outerwear === 'none';

                return (
                  <div
                    key={slot}
                    className={`p-2 rounded-xl border transition-colors space-y-1.5 ${
                      isDisabledCoat
                        ? 'border-dashed border-stone-300 dark:border-stone-700 bg-stone-100/50 dark:bg-stone-950/20 opacity-85'
                        : isActive
                        ? 'border-amber-700 bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/30 ring-1 ring-amber-600/30'
                        : 'border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-950/40'
                    }`}
                  >
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!isDisabledCoat) handleSelectSlotBase(slot);
                        }}
                        disabled={isDisabledCoat}
                        aria-pressed={isActive && editingTarget === 'base'}
                        className="flex items-center gap-2.5 text-left w-full min-w-0 cursor-pointer disabled:cursor-default"
                      >
                        <span
                          style={{
                            backgroundColor: isDisabledCoat ? 'transparent' : slotColor.hex,
                          }}
                          className={`w-7 h-7 rounded-lg shrink-0 ${
                            isDisabledCoat
                              ? 'border border-dashed border-stone-400'
                              : 'border border-black/20 shadow-xs'
                          }`}
                        />
                        <div className="min-w-0 flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                              {slotTitle}
                            </span>
                            {isActive && !isDisabledCoat && (
                              <span className="px-1.5 py-0.2 rounded bg-amber-800 text-amber-50 text-[10px] font-code shrink-0">
                                Editing
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] font-editorial text-stone-600 dark:text-stone-400 truncate">
                            {isDisabledCoat ? (
                              'Layer off — choose a coat below to wear over top'
                            ) : (
                              <>
                                #{slotColor.id} {slotColor.name}
                                {slotColor.ja ? ` (${slotColor.ja})` : ''} •{' '}
                                <span className="font-code uppercase">{slotColor.hex}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        <select
                          aria-label={`Garment type for ${slot}`}
                          value={pieces[slot]}
                          onChange={(e) => handleCutChange(slot, e.target.value)}
                          className="px-1.5 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 max-w-[125px] cursor-pointer"
                        >
                          {CUT_OPTIONS_BY_SLOT[slot].map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        {!isDisabledCoat && (
                          <select
                            aria-label={`Material texture for ${slot}`}
                            value={materials[slot]}
                            onChange={(e) =>
                              handleMaterialChange(slot, e.target.value as FabricMaterial)
                            }
                            className="px-1.5 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 max-w-[122px] cursor-pointer"
                          >
                            {MATERIALS_BY_SLOT[slot].map((matId) => (
                              <option key={matId} value={matId}>
                                {FABRIC_MATERIAL_META[matId].label}
                              </option>
                            ))}
                          </select>
                        )}

                        {!isDisabledCoat && PATTERNS_BY_SLOT[slot].length > 1 && (
                          <div className="inline-flex items-center gap-1">
                            <select
                              aria-label={`Pattern weave for ${slot}`}
                              value={patterns[slot]}
                              onChange={(e) =>
                                handlePatternChange(slot, e.target.value as FabricPattern)
                              }
                              className="px-1.5 py-1 text-[11px] rounded border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 max-w-[118px] cursor-pointer"
                            >
                              {PATTERNS_BY_SLOT[slot].map((patId) => (
                                <option key={patId} value={patId}>
                                  {FABRIC_PATTERN_META[patId].label}
                                </option>
                              ))}
                            </select>

                            {patterns[slot] !== 'solid' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveSlot(slot);
                                  setEditingTarget((prev) =>
                                    isActive && prev === 'pattern' ? 'base' : 'pattern'
                                  );
                                }}
                                aria-label={`Edit pattern thread color for ${slot}`}
                                aria-pressed={isActive && editingTarget === 'pattern'}
                                title={`Thread color: #${resolvedPatternColors[slot].id} ${resolvedPatternColors[slot].name}`}
                                style={{ backgroundColor: resolvedPatternColors[slot].hex }}
                                className={`w-6 h-6 rounded border shrink-0 cursor-pointer ${
                                  isActive && editingTarget === 'pattern'
                                    ? 'ring-2 ring-amber-600 border-black/30'
                                    : 'border-black/25 opacity-90 hover:opacity-100'
                                }`}
                              />
                            )}
                          </div>
                        )}

                        {onSelectColorDetail && !isDisabledCoat && (
                          <button
                            type="button"
                            onClick={() => onSelectColorDetail(slotColor)}
                            aria-label={`Inspect swatch ${slotColor.name}`}
                            title={`Inspect #${slotColor.id} ${slotColor.name}`}
                            className="px-2 py-1 text-[11px] font-code rounded border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                          >
                            Specs
                          </button>
                        )}
                      </div>
                    </div>
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
                  className="flex-1 min-w-0 px-2.5 py-1.5 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
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
                          setPieces(look.pieces ?? { ...STYLE_PRESET_PIECES[look.style] });
                          setMaterials(
                            look.materials ??
                              getDefaultMaterialsForPieces(
                                look.pieces ?? STYLE_PRESET_PIECES[look.style]
                              )
                          );
                          setPatterns(look.patterns ?? { ...DEFAULT_GARMENT_PATTERNS });
                          if (look.patternColors) setPatternColors(look.patternColors);
                          if (look.skinTone) setSkinTone(look.skinTone);
                          if (look.lighting) setLighting(look.lighting);
                          setEditingTarget('base');
                          onChangeOutfit(look.outfit);
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-0.5 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <span className="flex h-2.5 w-4 rounded-xs overflow-hidden border border-black/15">
                          <span style={{ backgroundColor: colorById.get(look.outfit.top)?.hex }} className="flex-1" />
                          <span style={{ backgroundColor: colorById.get(look.outfit.bottom)?.hex }} className="flex-1" />
                          <span style={{ backgroundColor: colorById.get(look.outfit.accent)?.hex }} className="flex-1" />
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
                <div className="text-[11px] text-stone-500">{harmony.primaryLabel}</div>
                <div className="font-code font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                  {harmony.primaryContrast.toFixed(1)}:1{' '}
                  <span className="text-[10px] font-normal text-stone-500">
                    ({harmony.primaryContrast >= 4.5 ? 'Strong Crispness' : 'Soft Tonal'})
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-950/60 border border-stone-200 dark:border-stone-800">
                <div className="text-[11px] text-stone-500">{harmony.separationLabel}</div>
                <div className="font-code font-bold text-sm text-stone-900 dark:text-stone-100 mt-0.5">
                  ΔE {harmony.separationDeltaE.toFixed(1)}
                </div>
                <div className="text-[10px] text-stone-500 truncate">{harmony.separationNote}</div>
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

            {/* Cross-Workflow Exports (.ase / .gpl / Design Tokens / Open Studio) */}
            <div className="pt-2.5 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    onCopyText(
                      generateDesignTokensJson(outfitCombo),
                      'Copied W3C Design Tokens JSON for menswear outfit'
                    )
                  }
                  className="px-2 py-1 text-[11px] font-code rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Tokens JSON
                </button>
                <button
                  type="button"
                  onClick={() => downloadGplPalette(outfitCombo)}
                  className="px-2 py-1 text-[11px] font-code rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  .gpl
                </button>
                <button
                  type="button"
                  onClick={() => downloadAsePalette(outfitCombo)}
                  className="px-2 py-1 text-[11px] font-code rounded border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                >
                  .ase
                </button>
              </div>
              {onSelectCombo && (
                <button
                  type="button"
                  onClick={() => onSelectCombo(outfitCombo)}
                  className="px-2.5 py-1 text-[11px] font-medium rounded bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 cursor-pointer"
                >
                  Open Palette in Studio →
                </button>
              )}
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
                    ['swatches', 'All Wada Swatches (171)'],
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

          {chooserTab === 'swatches' && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs px-1 text-stone-600 dark:text-stone-300 gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    {editingTarget === 'pattern' && patterns[activeSlot] !== 'solid' ? (
                      <>
                        Editing{' '}
                        <strong className="text-amber-800 dark:text-amber-400">
                          {getSlotDisplayLabel(activeSlot, pieces)} Thread ({FABRIC_PATTERN_META[patterns[activeSlot]].label})
                        </strong>{' '}
                        (#{resolvedPatternColors[activeSlot].id} {resolvedPatternColors[activeSlot].name})
                      </>
                    ) : (
                      <>
                        Editing{' '}
                        <strong className="text-amber-800 dark:text-amber-400">
                          {getSlotDisplayLabel(activeSlot, pieces)}
                        </strong>{' '}
                        (#{resolvedOutfit[activeSlot].id} {resolvedOutfit[activeSlot].name})
                      </>
                    )}
                  </span>
                  {patterns[activeSlot] !== 'solid' && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingTarget((prev) => (prev === 'base' ? 'pattern' : 'base'))
                      }
                      className="px-2 py-0.5 text-[10px] font-medium rounded border border-amber-700/40 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 cursor-pointer"
                    >
                      {editingTarget === 'base' ? 'Edit Stripe Thread' : 'Edit Base Cloth'}
                    </button>
                  )}
                </div>
                <span className="font-code text-[11px] text-stone-400">
                  {filteredSwatches.length} swatches
                </span>
              </div>
              <div className="rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 p-4 max-h-[600px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 shadow-sm">
              {filteredSwatches.map((c) => {
                const isSelected =
                  editingTarget === 'pattern' && patterns[activeSlot] !== 'solid'
                    ? patternColors[activeSlot] === c.id
                    : outfitIds[activeSlot] === c.id;
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
