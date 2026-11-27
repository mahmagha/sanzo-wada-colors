import React from 'react';
import { FABRICS, FABRIC_ORDER, FabricKey } from '../utils/weaveUtils';
import { GarmentPieces, getSlotDisplayLabel } from '../utils/menswearUtils';
import type { ClothSlot, GarmentFabrics } from './MenswearIllustration';

interface Props {
  value: GarmentFabrics;
  onChange: (next: GarmentFabrics) => void;
  pieces: GarmentPieces;
}

const SLOTS: ClothSlot[] = ['outerwear', 'top', 'bottom'];

export const GarmentWeaveControls: React.FC<Props> = ({ value, onChange, pieces }) => {
  const set = (slot: ClothSlot, fabric: FabricKey, scale?: number) =>
    onChange({ ...value, [slot]: { fabric, scale: scale ?? value[slot]?.scale ?? 1 } });

  return (
    <div className="mt-3 space-y-2 text-xs" data-testid="garment-weave-controls">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-stone-800 dark:text-stone-200">Fabric per garment</span>
        <span className="text-[11px] text-stone-500">Shoes and accents stay flat</span>
      </div>
      {SLOTS.filter((slot) => !(slot === 'outerwear' && pieces.outerwear === 'none')).map((slot) => {
        const current = value[slot]?.fabric ?? 'flat';
        const spec = FABRICS[current];
        const label = getSlotDisplayLabel(slot, pieces);
        return (
          <div key={slot} className="rounded-lg border border-stone-200 dark:border-stone-800 p-2 space-y-1.5" data-slot={slot}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`fabric-${slot}`} className="font-medium text-stone-700 dark:text-stone-300 truncate">
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
            {current !== 'flat' && <p className="text-[11px] text-stone-500">{spec.note}</p>}
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
