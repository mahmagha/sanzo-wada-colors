import React, { useEffect, useState } from "react";
import { isBaked, shadedTileUrl } from "../utils/fabricTexture";
import { FABRICS, FABRIC_ORDER, FabricKey } from "../utils/weaveUtils";
import { GarmentPieces, getSlotDisplayLabel } from "../utils/menswearUtils";
import type { ClothSlot, GarmentFabrics } from "./MenswearIllustration";

interface Props {
  value: GarmentFabrics;
  onChange: (next: GarmentFabrics) => void;
  pieces: GarmentPieces;
  /** Garment colors, used for the close-up swatches. */
  colors?: Partial<Record<ClothSlot, string>>;
}

/** Close-up of the baked yarn geometry, lit from the top left (the same maps the figure uses). */
const Swatch: React.FC<{ fabric: FabricKey; hex: string }> = ({
  fabric,
  hex,
}) => {
  const [url, setUrl] = useState<string>();
  useEffect(() => {
    let live = true;
    setUrl(undefined);
    if (isBaked(fabric))
      shadedTileUrl(fabric, hex)
        .then((u) => live && setUrl(u))
        .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [fabric, hex]);
  if (!isBaked(fabric)) return null;
  return (
    <div
      role="img"
      aria-label={`Close-up of ${FABRICS[fabric].label.toLowerCase()} in this garment color`}
      data-testid="fabric-swatch"
      className="h-14 w-14 shrink-0 rounded-md border border-stone-300 dark:border-stone-700 shadow-inner"
      style={{
        backgroundColor: hex,
        backgroundImage: url ? `url(${url})` : undefined,
        backgroundSize: "112px 112px",
        backgroundPosition: "center",
      }}
    />
  );
};

const SLOTS: ClothSlot[] = ["outerwear", "top", "bottom"];

export const GarmentWeaveControls: React.FC<Props> = ({
  value,
  onChange,
  pieces,
  colors,
}) => {
  const set = (slot: ClothSlot, fabric: FabricKey, scale?: number) =>
    onChange({
      ...value,
      [slot]: { fabric, scale: scale ?? value[slot]?.scale ?? 1 },
    });

  return (
    <div
      className="mt-3 space-y-2 text-xs"
      data-testid="garment-weave-controls"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-800 dark:text-stone-200">
          Fabric per garment
        </span>
        <span className="text-[11px] text-stone-500">
          Shoes and accents stay flat
        </span>
      </div>
      {SLOTS.filter(
        (slot) => !(slot === "outerwear" && pieces.outerwear === "none"),
      ).map((slot) => {
        const current = value[slot]?.fabric ?? "flat";
        const spec = FABRICS[current];
        const label = getSlotDisplayLabel(slot, pieces);
        return (
          <div
            key={slot}
            className="rounded-lg border border-stone-200 dark:border-stone-800 p-2 space-y-1.5"
            data-slot={slot}
          >
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`fabric-${slot}`}
                className="font-medium text-stone-700 dark:text-stone-300 truncate"
              >
                {label}
              </label>
              <select
                id={`fabric-${slot}`}
                value={current}
                onChange={(e) => set(slot, e.target.value as FabricKey)}
                className="px-2 py-1 rounded-md border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200"
              >
                {FABRIC_ORDER.map((k) => (
                  <option key={k} value={k}>
                    {FABRICS[k].label}
                  </option>
                ))}
              </select>
            </div>
            {current !== "flat" && (
              <div className="flex items-center gap-2">
                {colors?.[slot] && (
                  <Swatch fabric={current} hex={colors[slot] as string} />
                )}
                <p className="text-[11px] text-stone-500">{spec.note}</p>
              </div>
            )}
            {spec.pattern && (
              <label className="block text-[11px] text-stone-600 dark:text-stone-400">
                Thread size
                <input
                  type="range"
                  min={0.6}
                  max={3}
                  step={0.1}
                  value={value[slot]?.scale ?? 1}
                  onChange={(e) => set(slot, current, Number(e.target.value))}
                  className="w-full accent-amber-800"
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
};
