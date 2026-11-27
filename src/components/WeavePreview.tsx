import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import {
  WEAVE_COLOR_MODES,
  WEAVE_PATTERNS,
  WeaveColorMode,
  WeavePattern,
  buildLiftPlanText,
  buildWeaveGrid,
  buildWeaveSvg,
} from '../utils/weaveUtils';

interface WeavePreviewProps {
  /** Palette hex colors (already adjusted for color-vision simulation if needed). */
  palette: string[];
  /** Original palette hexes used for exports so downloads never carry a simulation. */
  exportPalette: string[];
  label: string;
  fileBase: string;
}

function download(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const WeavePreview: React.FC<WeavePreviewProps> = ({ palette, exportPalette, label, fileBase }) => {
  const [pattern, setPattern] = useState<WeavePattern>('twill');
  const [colorMode, setColorMode] = useState<WeaveColorMode>('same');
  const [threadSize, setThreadSize] = useState(14);
  const [stripe, setStripe] = useState(4);

  const size = 36;
  const svg = useMemo(
    () => buildWeaveSvg(buildWeaveGrid({ palette, pattern, colorMode, size, stripe }), threadSize, `${label} woven as ${pattern}`),
    [palette, pattern, colorMode, stripe, threadSize, label],
  );
  const note = WEAVE_PATTERNS.find((p) => p.key === pattern)?.note ?? '';

  const exportSvg = () => {
    const grid = buildWeaveGrid({ palette: exportPalette, pattern, colorMode, size, stripe });
    download(buildWeaveSvg(grid, 12, `${label} woven as ${pattern}`), `${fileBase}-weave-${pattern}.svg`, 'image/svg+xml;charset=utf-8');
  };
  const exportDraft = () => {
    const grid = buildWeaveGrid({ palette: exportPalette, pattern, colorMode, size, stripe });
    const header = [
      `Loom draft: ${label}`,
      `Pattern: ${pattern}. Grid ${size} x ${size} threads. Stripe width ${stripe} thread(s) per color.`,
      `Warp colors (left to right): ${grid.warp.join(' ')}`,
      `Weft colors (top to bottom): ${grid.weft.join(' ')}`,
      'Lift plan: 1 = warp thread on top at that crossing, 0 = weft on top.',
      '',
    ].join('\n');
    download(`${header}${buildLiftPlanText(grid)}\n`, `${fileBase}-loom-draft-${pattern}.txt`, 'text/plain;charset=utf-8');
  };

  const chip =
    'px-2.5 py-1 rounded-full text-xs border transition-colors cursor-pointer ';
  const on = 'bg-amber-800 text-amber-50 border-amber-800 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500';
  const off = 'border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800';

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start" data-testid="weave-preview">
      <div className="md:col-span-7 flex justify-center">
        <div
          className="rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-sm max-w-full [&>svg]:block [&>svg]:max-w-full [&>svg]:h-auto"
          // The SVG is generated locally from palette hex values only.
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
      <div className="md:col-span-5 space-y-4 text-sm">
        <div>
          <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">Weave</h4>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Weave pattern">
            {WEAVE_PATTERNS.map((p) => (
              <button type="button" key={p.key} aria-pressed={pattern === p.key} onClick={() => setPattern(p.key)} className={chip + (pattern === p.key ? on : off)}>
                {p.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-stone-500">{note}</p>
        </div>
        <div>
          <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2">Thread colors</h4>
          <div className="flex flex-col gap-1.5" role="group" aria-label="Thread color mode">
            {WEAVE_COLOR_MODES.map((m) => (
              <button type="button" key={m.key} aria-pressed={colorMode === m.key} onClick={() => setColorMode(m.key)} className={chip + 'text-left ' + (colorMode === m.key ? on : off)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-xs text-stone-600 dark:text-stone-400">
          Thread size: {threadSize}px
          <input type="range" min={6} max={24} value={threadSize} onChange={(e) => setThreadSize(Number(e.target.value))} className="w-full accent-amber-800" />
        </label>
        <label className="block text-xs text-stone-600 dark:text-stone-400">
          Stripe width: {stripe} thread{stripe === 1 ? '' : 's'} per color
          <input type="range" min={1} max={8} value={stripe} onChange={(e) => setStripe(Number(e.target.value))} className="w-full accent-amber-800" />
        </label>
        <div className="flex flex-wrap gap-2 pt-1">
          <button type="button" onClick={exportSvg} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-stone-50 dark:bg-stone-100 dark:text-stone-900 cursor-pointer">
            <Download size={14} /> Weave SVG
          </button>
          <button type="button" onClick={exportDraft} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200 cursor-pointer">
            <Download size={14} /> Loom draft (.txt)
          </button>
        </div>
        <p className="text-xs text-stone-500">
          A visual preview, not a production-ready textile spec. Real cloth depends on yarn, density and dye.
        </p>
      </div>
    </div>
  );
};
