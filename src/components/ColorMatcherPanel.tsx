import React, { useMemo, useRef, useState } from 'react';
import { Pipette, X, ArrowRight, FileImage, Upload, Sparkles } from 'lucide-react';
import { ColorItem, Combination } from '../types/color';
import { findClosestColors, normalizeHex, getIdealTextColor } from '../utils/colorUtils';
import { ExtractedColor, extractColorsFromImageFile } from '../utils/imageQuantize';

interface ColorMatcherPanelProps {
  allColors: ColorItem[];
  onSelectColor: (color: ColorItem) => void;
  onOpenExtractedStudio?: (combo: Combination) => void;
  onClose: () => void;
}

type MatcherMode = 'hex' | 'image';

export const ColorMatcherPanel: React.FC<ColorMatcherPanelProps> = ({
  allColors,
  onSelectColor,
  onOpenExtractedStudio,
  onClose,
}) => {
  const [mode, setMode] = useState<MatcherMode>('hex');
  const [hexInput, setHexInput] = useState('#c54432');

  const [imageName, setImageName] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedColor[]>([]);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validHex = useMemo(() => normalizeHex(hexInput), [hexInput]);
  const pickerHex = validHex || '#c54432';

  const hexMatches = useMemo(() => {
    if (!validHex) return [];
    return findClosestColors(validHex, allColors, 6);
  }, [validHex, allColors]);

  const imageMatches = useMemo(() => {
    return extracted.map((item) => ({
      extracted: item,
      match: findClosestColors(item.hex, allColors, 1)[0],
    }));
  }, [extracted, allColors]);

  const distinctMatchedWadaColors = useMemo(() => {
    const seen = new Set<number>();
    const list: ColorItem[] = [];
    for (const row of imageMatches) {
      if (row.match && !seen.has(row.match.color.id)) {
        seen.add(row.match.color.id);
        list.push(row.match.color);
      }
    }
    return list;
  }, [imageMatches]);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setExtracting(true);
    setExtractError(null);
    setImageName(file.name);
    try {
      const palette = await extractColorsFromImageFile(file, 5);
      if (palette.length === 0) {
        setExtractError('No opaque colors found in that image.');
        setExtracted([]);
      } else {
        setExtracted(palette);
      }
    } catch {
      setExtractError('Could not read this image. Please try a PNG, JPG, or WebP file.');
      setExtracted([]);
    } finally {
      setExtracting(false);
    }
  };

  const handleOpenMatchedPalette = () => {
    if (!onOpenExtractedStudio || distinctMatchedWadaColors.length < 2) return;
    onOpenExtractedStudio({
      id: 0,
      volume: 1,
      size: distinctMatchedWadaColors.length,
      colors: distinctMatchedWadaColors,
    });
  };

  return (
    <section
      aria-label="Closest Sanzo Wada Color Matcher & Image Extractor"
      className="mb-6 rounded-2xl border border-stone-300/70 dark:border-stone-800 bg-white/85 dark:bg-stone-900/85 p-4 sm:p-5 shadow-md animate-in fade-in"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-8 h-8 rounded-lg bg-amber-800/10 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
            {mode === 'hex' ? <Pipette size={16} /> : <FileImage size={16} />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-editorial font-bold text-stone-900 dark:text-stone-100">
              {mode === 'hex'
                ? 'Closest Wada Swatch Matcher (CIEDE2000)'
                : 'Image-to-Sanzo-Wada Palette Extractor'}
            </h2>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {mode === 'hex'
                ? 'Pick or enter any HEX color to rank nearest archival swatches.'
                : 'Extract dominant colors locally in your browser and map them to Wada’s palette.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Mode Tabs */}
          <div className="flex rounded-lg p-0.5 bg-stone-200/60 dark:bg-stone-800 border border-stone-300/40 dark:border-stone-700/60 text-xs">
            <button
              type="button"
              onClick={() => setMode('hex')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'hex'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              HEX Match
            </button>
            <button
              type="button"
              onClick={() => setMode('image')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                mode === 'image'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs'
                  : 'text-stone-600 dark:text-stone-400'
              }`}
            >
              From Image
            </button>
          </div>

          {mode === 'hex' && (
            <label className="flex items-center gap-2 px-2.5 py-1 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-950">
              <input
                type="color"
                aria-label="Pick target color"
                value={pickerHex}
                onChange={(e) => setHexInput(e.target.value)}
                className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent p-0"
              />
              <input
                type="text"
                aria-label="Target HEX color code"
                value={hexInput}
                onChange={(e) => setHexInput(e.target.value)}
                placeholder="#c54432"
                maxLength={7}
                className="w-24 text-xs font-code uppercase bg-transparent text-stone-900 dark:text-stone-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 dark:focus-visible:ring-amber-400 rounded px-1"
              />
            </label>
          )}

          <button
            type="button"
            aria-label="Close color matcher"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* HEX MATCH RESULTS */}
      {mode === 'hex' && (
        <>
          {!validHex ? (
            <p className="pt-4 text-xs text-rose-600 dark:text-rose-400 font-code">
              Enter a valid 3- or 6-digit HEX value (e.g. #284b63 or #f90).
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4">
              {hexMatches.map(({ color, deltaE }) => {
                const totalPalettes =
                  (color.combinations?.length || 0) + (color.vol2Cards?.length || 0);
                const qualityLabel =
                  deltaE < 2 ? 'Near Exact' : deltaE < 6 ? 'Close Match' : 'Similar Tone';
                const matchText = getIdealTextColor(color.hex);

                return (
                  <button
                    type="button"
                    key={color.id}
                    onClick={() => onSelectColor(color)}
                    className="group flex items-center justify-between gap-3 p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-800/50 dark:hover:border-amber-500/50 bg-stone-50/60 dark:bg-stone-950/40 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-300 dark:border-stone-700 shrink-0 flex">
                        <div
                          style={{ backgroundColor: pickerHex }}
                          className="w-1/3 h-full"
                          title={`Target ${pickerHex}`}
                        />
                        <div
                          style={{ backgroundColor: color.hex, color: matchText }}
                          className="w-2/3 h-full flex items-end justify-end p-1 text-[9px] font-code"
                        >
                          #{color.id}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-editorial font-bold text-stone-900 dark:text-stone-100 truncate">
                          {color.name}
                          {color.ja && (
                            <span className="font-normal text-stone-500 ml-1">({color.ja})</span>
                          )}
                        </div>
                        <div className="text-[11px] font-code text-stone-500 dark:text-stone-400">
                          {color.hex.toUpperCase()} • {totalPalettes} palettes
                        </div>
                        <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-code">
                          <span className="px-1.5 py-0.2 rounded bg-amber-800/10 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 font-semibold">
                            ΔE {deltaE.toFixed(1)}
                          </span>
                          <span className="text-stone-500">{qualityLabel}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-stone-400 group-hover:text-amber-800 dark:group-hover:text-amber-400 shrink-0 transition-colors"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* IMAGE PALETTE EXTRACTOR */}
      {mode === 'image' && (
        <div className="pt-4 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/70 dark:bg-stone-950/40"
          >
            <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-300">
              <Upload size={18} className="text-amber-800 dark:text-amber-400 shrink-0" />
              <div>
                <div className="font-medium text-stone-900 dark:text-stone-100">
                  {imageName ? `Analyzed: ${imageName}` : 'Drop an image here or choose a file'}
                </div>
                <div className="text-[11px] text-stone-500">
                  100% client-side quantization (PNG, JPG, WebP) — nothing leaves your browser.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                aria-label="Upload image to extract Sanzo Wada palette"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={extracting}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 hover:opacity-90 cursor-pointer"
              >
                {extracting ? 'Extracting…' : 'Choose Image'}
              </button>
              {onOpenExtractedStudio && distinctMatchedWadaColors.length >= 2 && (
                <button
                  type="button"
                  onClick={handleOpenMatchedPalette}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-amber-900 text-amber-50 hover:bg-amber-800 cursor-pointer"
                >
                  <Sparkles size={13} />
                  <span>Open Wada Mix ({distinctMatchedWadaColors.length})</span>
                </button>
              )}
            </div>
          </div>

          {extractError && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-code">{extractError}</p>
          )}

          {imageMatches.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {imageMatches.map(({ extracted: srcColor, match }) => {
                if (!match) return null;
                const { color, deltaE } = match;
                return (
                  <button
                    type="button"
                    key={`${srcColor.hex}-${color.id}`}
                    onClick={() => onSelectColor(color)}
                    className="group p-2.5 rounded-xl border border-stone-200 dark:border-stone-800 hover:border-amber-800/50 dark:hover:border-amber-500/50 bg-stone-50/70 dark:bg-stone-950/40 text-left transition-colors cursor-pointer space-y-2"
                  >
                    <div className="h-12 rounded-lg overflow-hidden flex border border-stone-300 dark:border-stone-700">
                      <div
                        style={{ backgroundColor: srcColor.hex }}
                        className="w-1/2 h-full"
                        title={`Extracted ${srcColor.hex} (${Math.round(srcColor.ratio * 100)}%)`}
                      />
                      <div
                        style={{ backgroundColor: color.hex }}
                        className="w-1/2 h-full"
                        title={`Wada match ${color.hex}`}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-editorial font-bold truncate text-stone-900 dark:text-stone-100">
                        {color.name}
                      </div>
                      <div className="text-[10px] font-code text-stone-500">
                        {srcColor.hex.toUpperCase()} ({Math.round(srcColor.ratio * 100)}%) →{' '}
                        {color.hex.toUpperCase()}
                      </div>
                      <div className="text-[10px] font-code text-amber-800 dark:text-amber-400 mt-0.5">
                        #{color.id} • ΔE {deltaE.toFixed(1)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
