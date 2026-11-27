/**
 * Weave preview helpers. Pure functions only so they can be unit tested.
 *
 * A woven cloth is made of vertical threads (warp) and horizontal threads (weft).
 * At each crossing either the warp or the weft shows on top. The pattern of that
 * choice is the "interlacement" (plain, twill, herringbone, basket, satin).
 */

export type WeavePattern = 'plain' | 'twill' | 'twill31' | 'herringbone' | 'basket' | 'satin';
export type WeaveColorMode = 'same' | 'warp-only' | 'reverse';

export const WEAVE_PATTERNS: ReadonlyArray<{ key: WeavePattern; label: string; note: string }> = [
  { key: 'plain', label: 'Plain', note: 'Over 1, under 1. The simplest weave.' },
  { key: 'twill', label: 'Twill 2/2', note: 'Over 2, under 2, shifted one step each row. Diagonal ribs.' },
  { key: 'twill31', label: 'Twill 3/1', note: 'Over 3, under 1. Strong diagonal, used for denim.' },
  { key: 'herringbone', label: 'Herringbone', note: 'Twill that reverses direction every few threads.' },
  { key: 'basket', label: 'Basket 2/2', note: 'Pairs of threads woven together like a basket.' },
  { key: 'satin', label: 'Satin 5', note: 'Long floats, smooth surface, few visible crossings.' },
];

export const WEAVE_COLOR_MODES: ReadonlyArray<{ key: WeaveColorMode; label: string }> = [
  { key: 'same', label: 'Warp and weft use the palette' },
  { key: 'warp-only', label: 'Warp = palette, weft = first color' },
  { key: 'reverse', label: 'Weft uses the palette reversed' },
];

/** True when the warp (vertical) thread is on top at column x, row y. */
export function isWarpOnTop(pattern: WeavePattern, x: number, y: number): boolean {
  const mx = ((x % 1000) + 1000) % 1000;
  const my = ((y % 1000) + 1000) % 1000;
  switch (pattern) {
    case 'plain':
      return (mx + my) % 2 === 0;
    case 'twill':
      return (mx + my) % 4 < 2;
    case 'twill31':
      return (mx + my) % 4 !== 0;
    case 'herringbone': {
      // 8-thread repeat: first half goes one diagonal way, second half the other.
      const half = Math.floor((mx % 8) / 4);
      const lx = mx % 4;
      const shift = half === 0 ? lx + my : -lx + my + 4;
      return ((shift % 4) + 4) % 4 < 2;
    }
    case 'basket':
      return (Math.floor(mx / 2) + Math.floor(my / 2)) % 2 === 0;
    case 'satin':
      // 5-end satin with step 2: warp is on top at all but one crossing per thread.
      return (mx * 2) % 5 !== my % 5;
  }
}

/**
 * Build the sequence of thread colors for one direction.
 * Each palette color gets `stripe` threads, repeating until `count` threads exist.
 */
export function buildThreadColors(
  palette: readonly string[],
  count: number,
  stripe: number,
  reverse = false,
): string[] {
  if (palette.length === 0 || count <= 0) return [];
  const src = reverse ? [...palette].reverse() : [...palette];
  const width = Math.max(1, Math.floor(stripe));
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    out.push(src[Math.floor(i / width) % src.length]);
  }
  return out;
}

export interface WeaveGrid {
  size: number;
  warp: string[];
  weft: string[];
  /** cells[row][col] is the hex of the thread on top at that crossing */
  cells: string[][];
  /** warpUp[row][col] is true when the warp thread is on top */
  warpUp: boolean[][];
}

export function buildWeaveGrid(params: {
  palette: readonly string[];
  pattern: WeavePattern;
  colorMode: WeaveColorMode;
  size: number;
  stripe: number;
}): WeaveGrid {
  const { palette, pattern, colorMode, size, stripe } = params;
  const warp = buildThreadColors(palette, size, stripe);
  const weft =
    colorMode === 'warp-only'
      ? Array.from({ length: size }, () => palette[0] ?? '#808080')
      : buildThreadColors(palette, size, stripe, colorMode === 'reverse');
  const cells: string[][] = [];
  const warpUp: boolean[][] = [];
  for (let y = 0; y < size; y++) {
    const row: string[] = [];
    const upRow: boolean[] = [];
    for (let x = 0; x < size; x++) {
      const up = isWarpOnTop(pattern, x, y);
      upRow.push(up);
      row.push(up ? warp[x] : weft[y]);
    }
    cells.push(row);
    warpUp.push(upRow);
  }
  return { size, warp, weft, cells, warpUp };
}

/** Loom draft (lift plan): 1 where the warp is lifted (on top), 0 otherwise. */
export function buildLiftPlanText(grid: WeaveGrid): string {
  return grid.warpUp.map((row) => row.map((v) => (v ? '1' : '0')).join(' ')).join('\n');
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Standalone SVG of the weave, with a subtle thread shading look. */
export function buildWeaveSvg(grid: WeaveGrid, cellPx = 12, title = 'Weave preview'): string {
  const n = grid.size;
  const w = n * cellPx;
  const gap = Math.max(0.5, cellPx * 0.06);
  const r = cellPx * 0.22;
  const parts: string[] = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" role="img" aria-label="${esc(title)}">`,
    `<title>${esc(title)}</title>`,
    '<defs>',
    '<linearGradient id="shadeV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>',
    '<linearGradient id="shadeH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>',
    '</defs>',
    `<rect width="${w}" height="${w}" fill="#1c1917"/>`,
  );
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const up = grid.warpUp[y][x];
      const px = x * cellPx;
      const py = y * cellPx;
      // Warp on top: a tall thread piece, weft on top: a wide thread piece.
      const rx = up ? px + gap : px;
      const ry = up ? py : py + gap;
      const rw = up ? cellPx - gap * 2 : cellPx;
      const rh = up ? cellPx : cellPx - gap * 2;
      parts.push(
        `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" rx="${r.toFixed(2)}" fill="${esc(grid.cells[y][x])}"/>`,
        `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" rx="${r.toFixed(2)}" fill="url(#${up ? 'shadeV' : 'shadeH'})"/>`,
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}

/** Number of threads after which each interlacement repeats. */
export const WEAVE_REPEAT: Record<WeavePattern, number> = {
  plain: 2,
  twill: 4,
  twill31: 4,
  herringbone: 8,
  basket: 4,
  satin: 5,
};

function shade(hex: string, factor: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v * factor)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function lighten(hex: string, t: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const mix = (v: number) => Math.round(v + (255 - v) * t);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export type FabricKey = 'flat' | 'cotton' | 'wool' | 'linen' | 'denim' | 'silk' | 'leather';

export interface FabricSpec {
  key: FabricKey;
  label: string;
  note: string;
  /** null = no woven structure (flat color or leather grain) */
  pattern: WeavePattern | null;
  /** thread size in SVG units at scale 1 */
  cell: number;
  /** 0..1 thread-to-thread brightness drift */
  drift: number;
  /** 0..1 yarn thickness irregularity (slubs) */
  slub: number;
  /** weft color: 1 = same as warp, <1 darker, >1 lighter (denim has a pale weft) */
  weftTone: number;
  /** pull the weft toward white by this amount (0..1) */
  weftBleach: number;
  fiberOpacity: number;
  fiberFreq: number;
  /** blur in px applied to the weave, for fuzzy yarns */
  soften: number;
  /** drape/fold relief strength and frequency */
  foldScale: number;
  foldFreq: string;
  /** 0 = matte, >0 = sheen strength */
  sheen: number;
  sheenExp: number;
  /** edge rounding strength */
  edgeScale: number;
}

export const FABRICS: Record<FabricKey, FabricSpec> = {
  flat: { key: 'flat', label: 'Flat color', note: 'No fabric effect', pattern: null, cell: 1, drift: 0, slub: 0, weftTone: 1, weftBleach: 0, fiberOpacity: 0, fiberFreq: 1, soften: 0, foldScale: 0, foldFreq: '0.01 0.03', sheen: 0, sheenExp: 10, edgeScale: 0 },
  cotton: { key: 'cotton', label: 'Cotton', note: 'Plain weave, matte, crisp small creases', pattern: 'plain', cell: 1.3, drift: 0.5, slub: 0.08, weftTone: 0.94, weftBleach: 0, fiberOpacity: 0.12, fiberFreq: 1.1, soften: 0, foldScale: 0.9, foldFreq: '0.016 0.04', sheen: 0, sheenExp: 10, edgeScale: 4 },
  wool: { key: 'wool', label: 'Wool', note: 'Twill, soft and fuzzy, heavy drape', pattern: 'twill', cell: 1.6, drift: 0.8, slub: 0.1, weftTone: 0.95, weftBleach: 0, fiberOpacity: 0.24, fiberFreq: 0.7, soften: 0.3, foldScale: 0.7, foldFreq: '0.009 0.026', sheen: 0, sheenExp: 10, edgeScale: 6 },
  linen: { key: 'linen', label: 'Linen', note: 'Plain weave, uneven slubby yarn, sharp creases', pattern: 'plain', cell: 2.1, drift: 1, slub: 0.3, weftTone: 0.97, weftBleach: 0, fiberOpacity: 0.16, fiberFreq: 0.9, soften: 0.1, foldScale: 1.5, foldFreq: '0.02 0.05', sheen: 0, sheenExp: 10, edgeScale: 3 },
  denim: { key: 'denim', label: 'Denim', note: 'Twill 3/1, dark warp with a paler weft', pattern: 'twill31', cell: 1.5, drift: 0.7, slub: 0.15, weftTone: 1, weftBleach: 0.5, fiberOpacity: 0.18, fiberFreq: 0.9, soften: 0.1, foldScale: 1.1, foldFreq: '0.014 0.04', sheen: 0, sheenExp: 10, edgeScale: 4 },
  silk: { key: 'silk', label: 'Silk / satin', note: 'Satin weave with a soft sheen', pattern: 'satin', cell: 1, drift: 0.2, slub: 0, weftTone: 0.98, weftBleach: 0, fiberOpacity: 0.04, fiberFreq: 1.3, soften: 0.15, foldScale: 1, foldFreq: '0.007 0.02', sheen: 0.55, sheenExp: 14, edgeScale: 5 },
  leather: { key: 'leather', label: 'Leather', note: 'No weave. Grain and sheen only', pattern: null, cell: 1, drift: 0, slub: 0, weftTone: 1, weftBleach: 0, fiberOpacity: 0.22, fiberFreq: 0.45, soften: 0, foldScale: 0.6, foldFreq: '0.012 0.03', sheen: 0.4, sheenExp: 22, edgeScale: 4 },
};

export const FABRIC_ORDER: FabricKey[] = ['flat', 'cotton', 'wool', 'linen', 'denim', 'silk', 'leather'];

/** Cells per side of a garment tile: a multiple of every pattern repeat (satin uses 15). */
export function garmentTileCells(pattern: WeavePattern): number {
  return pattern === 'satin' ? 15 : 16;
}

/** Deterministic 0..1 value from two integers, so the cloth looks irregular but never flickers. */
function hash01(a: number, b: number): number {
  let h = Math.imul(a + 374761393, 668265263) ^ Math.imul(b + 1274126177, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

/**
 * One repeating tile of cloth in a single color, for use inside an SVG <pattern>.
 * Each thread drifts a little in brightness and thickness (yarn is never even), each
 * crossing a little more. Fabric settings decide how much, and how the weft is toned.
 * `idPrefix` keeps the gradient ids unique when several tiles share one SVG.
 */
export function buildGarmentWeaveTile(
  hex: string,
  pattern: WeavePattern,
  cell: number,
  idPrefix: string,
  fabric: Pick<FabricSpec, 'drift' | 'slub' | 'weftTone' | 'weftBleach'> = FABRICS.cotton,
): { size: number; markup: string } {
  const n = garmentTileCells(pattern);
  const size = n * cell;
  const gap = Math.max(0.04, cell * 0.05);
  const r = cell * 0.3;
  const stops = '<stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.35" stop-color="#fff" stop-opacity="0.12"/><stop offset="0.55" stop-color="#fff" stop-opacity="0.2"/><stop offset="1" stop-color="#000" stop-opacity="0.34"/>';
  const weftBase = fabric.weftBleach > 0 ? lighten(hex, fabric.weftBleach) : hex;
  const parts: string[] = [
    `<linearGradient id="${idPrefix}V" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient>`,
    `<linearGradient id="${idPrefix}H" x1="0" y1="0" x2="0" y2="1">${stops}</linearGradient>`,
    `<rect width="${size}" height="${size}" fill="${shade(hex, 0.5)}"/>`,
  ];
  const d = fabric.drift;
  const warpDrift = Array.from({ length: n }, (_, i) => 1 + (hash01(i, 11) - 0.5) * 0.1 * d);
  const weftDrift = Array.from({ length: n }, (_, i) => 1 + (hash01(i, 29) - 0.5) * 0.1 * d);
  const warpThick = Array.from({ length: n }, (_, i) => 1 - hash01(i, 41) * fabric.slub);
  const weftThick = Array.from({ length: n }, (_, i) => 1 - hash01(i, 53) * fabric.slub);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const up = isWarpOnTop(pattern, x, y);
      const px = x * cell;
      const py = y * cell;
      let rx = up ? px + gap : px;
      let ry = up ? py : py + gap;
      let rw = up ? cell - gap * 2 : cell;
      let rh = up ? cell : cell - gap * 2;
      if (up) {
        const t = warpThick[x];
        rx += (rw * (1 - t)) / 2;
        rw *= t;
      } else {
        const t = weftThick[y];
        ry += (rh * (1 - t)) / 2;
        rh *= t;
      }
      const dims = `x="${rx.toFixed(3)}" y="${ry.toFixed(3)}" width="${rw.toFixed(3)}" height="${rh.toFixed(3)}" rx="${r.toFixed(3)}"`;
      const local = 1 + (hash01(x * 7 + 3, y * 13 + 5) - 0.5) * 0.08 * Math.max(0.5, d);
      const base = up ? hex : weftBase;
      const factor = (up ? warpDrift[x] : weftDrift[y] * fabric.weftTone) * local;
      parts.push(
        `<rect ${dims} fill="${shade(base, factor)}"/>`,
        `<rect ${dims} fill="url(#${idPrefix}${up ? 'V' : 'H'})"/>`,
      );
    }
  }
  return { size, markup: parts.join('') };
}
