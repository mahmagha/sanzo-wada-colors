/**
 * Weave preview helpers. Pure functions only so they can be unit tested.
 *
 * A woven cloth is made of vertical threads (warp) and horizontal threads (weft).
 * At each crossing either the warp or the weft shows on top. The pattern of that
 * choice is the "interlacement" (plain, twill, herringbone, basket, satin).
 */

export type WeavePattern = 'plain' | 'twill' | 'herringbone' | 'basket' | 'satin';
export type WeaveColorMode = 'same' | 'warp-only' | 'reverse';

export const WEAVE_PATTERNS: ReadonlyArray<{ key: WeavePattern; label: string; note: string }> = [
  { key: 'plain', label: 'Plain', note: 'Over 1, under 1. The simplest weave.' },
  { key: 'twill', label: 'Twill 2/2', note: 'Over 2, under 2, shifted one step each row. Diagonal ribs.' },
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
