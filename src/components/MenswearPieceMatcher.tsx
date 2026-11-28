import React, { useRef, useState } from 'react';
import { Lock, Pipette, Upload, X } from 'lucide-react';
import { ColorItem } from '../types/color';
import { findClosestColors, getIdealTextColor, normalizeHex } from '../utils/colorUtils';
import { ExtractedColor, extractColorsFromImageFile } from '../utils/imageQuantize';

interface MenswearPieceMatcherProps {
  allColors: ColorItem[];
  activeSlotLabel: string;
  onAssignMatchedColor: (color: ColorItem, lockSlot: boolean) => void;
  onClose: () => void;
}

export const MenswearPieceMatcher: React.FC<MenswearPieceMatcherProps> = ({
  allColors,
  activeSlotLabel,
  onAssignMatchedColor,
  onClose,
}) => {
  const [hexInput, setHexInput] = useState('#2b4257');
  const [extracted, setExtracted] = useState<ExtractedColor[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [lockOnAssign, setLockOnAssign] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  const validHex = normalizeHex(hexInput);
  const hexMatches = validHex ? findClosestColors(validHex, allColors, 4) : [];

  const handlePhotoUpload = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    setLoadingImage(true);
    try {
      const colors = await extractColorsFromImageFile(file, 4);
      if (colors.length === 0) {
        setImageError('Could not read opaque garment pixels from this image.');
        setExtracted([]);
      } else {
        setExtracted(colors);
      }
    } catch {
      setImageError('Could not decode image — try PNG or JPG.');
      setExtracted([]);
    } finally {
      setLoadingImage(false);
    }
  };

  return (
    <div
      data-testid="menswear-piece-matcher"
      className="rounded-xl border border-amber-800/30 dark:border-amber-500/30 bg-amber-50/40 dark:bg-stone-950/60 p-3 space-y-2.5 text-xs"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 font-editorial font-bold text-stone-900 dark:text-stone-100">
          <Pipette size={13} className="text-amber-800 dark:text-amber-400" />
          <span>Match My Garment for {activeSlotLabel}</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1 text-[11px] text-stone-600 dark:text-stone-300 cursor-pointer">
            <input
              type="checkbox"
              checked={lockOnAssign}
              onChange={(e) => setLockOnAssign(e.target.checked)}
              className="rounded border-stone-300 dark:border-stone-700"
            />
            <Lock size={10} />
            <span>Lock slot on pick</span>
          </label>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close garment matcher"
            className="p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="color"
          aria-label="Pick garment color"
          value={validHex || '#2b4257'}
          onChange={(e) => setHexInput(e.target.value)}
          className="w-8 h-8 rounded border border-stone-300 dark:border-stone-700 bg-transparent cursor-pointer shrink-0"
        />
        <input
          type="text"
          aria-label="Garment hex color code"
          value={hexInput}
          onChange={(e) => setHexInput(e.target.value)}
          placeholder="#2b4257"
          className="w-24 px-2 py-1.5 font-code text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
        />

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          aria-label="Upload garment photo to match Wada color"
          onChange={(e) => handlePhotoUpload(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={loadingImage}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-200 font-medium cursor-pointer"
        >
          <Upload size={12} />
          <span>{loadingImage ? 'Scanning...' : 'Scan Garment Photo'}</span>
        </button>

        {extracted.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[10px] font-code text-stone-500">Photo tones:</span>
            {extracted.map((item) => (
              <button
                type="button"
                key={item.hex}
                onClick={() => setHexInput(item.hex)}
                title={`Match ${item.hex}`}
                style={{ backgroundColor: item.hex }}
                className="w-5 h-5 rounded border border-black/25 cursor-pointer hover:scale-110 transition-transform"
              />
            ))}
          </div>
        )}
      </div>

      {imageError && <p className="text-[11px] font-code text-rose-600">{imageError}</p>}

      {hexMatches.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {hexMatches.map(({ color, deltaE }) => (
            <button
              type="button"
              key={color.id}
              onClick={() => onAssignMatchedColor(color, lockOnAssign)}
              style={{ backgroundColor: color.hex, color: getIdealTextColor(color.hex) }}
              className="p-2 rounded-lg text-left border border-black/15 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <div className="text-[10px] font-code opacity-85">
                #{color.id} • ΔE {deltaE.toFixed(1)}
              </div>
              <div className="text-xs font-editorial font-bold truncate">{color.name}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
