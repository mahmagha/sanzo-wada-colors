import React from 'react';
import { WEAVE_PATTERNS, WeavePattern } from '../utils/weaveUtils';

export type GarmentWeave = { pattern: WeavePattern; cell: number } | null;

interface Props {
  value: GarmentWeave;
  onChange: (next: GarmentWeave) => void;
}

const chip = 'px-2 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ';
const on = 'bg-amber-800 text-amber-50 border-amber-800 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500';
const off = 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800';

export const GarmentWeaveControls: React.FC<Props> = ({ value, onChange }) => (
  <div className="mt-3 space-y-2 text-xs" data-testid="garment-weave-controls">
    <div className="flex items-center justify-between gap-2">
      <span className="font-semibold text-stone-800 dark:text-stone-200">Fabric weave</span>
      <span className="text-[11px] text-stone-500">Coat, top and trousers</span>
    </div>
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Garment fabric weave">
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)} className={chip + (value === null ? on : off)}>
        Flat color
      </button>
      {WEAVE_PATTERNS.map((p) => (
        <button
          type="button"
          key={p.key}
          aria-pressed={value?.pattern === p.key}
          onClick={() => onChange({ pattern: p.key, cell: value?.cell ?? 3.2 })}
          className={chip + (value?.pattern === p.key ? on : off)}
        >
          {p.label}
        </button>
      ))}
    </div>
    {value && (
      <label className="block text-[11px] text-stone-600 dark:text-stone-400">
        Thread size
        <input
          type="range"
          min={1.5}
          max={7}
          step={0.5}
          value={value.cell}
          onChange={(e) => onChange({ pattern: value.pattern, cell: Number(e.target.value) })}
          className="w-full accent-amber-800"
        />
      </label>
    )}
  </div>
);
