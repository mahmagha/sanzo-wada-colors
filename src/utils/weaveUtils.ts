import { escapeXml } from './colorUtils';

/**
 * Pure woven-fabric interlacement helpers for Plain, Twill 2/2, Herringbone, Basket 2/2, and Satin 5.
 * Computes warp/weft thread sequences, 1/0 loom lift plans, and shaded SVG previews.
 */

export type WeavePattern = 'plain' | 'twill' | 'herringbone' | 'basket' | 'satin';
export type WeaveColorMode = 'same' | 'warp-only' | 'reverse';

export const WEAVE_PATTERNS: ReadonlyArray<{ key: WeavePattern; label: string; note: string }> = [
  { key: 'plain', label: 'Plain', note: 'Over 1, under 1. Crisp checkerboard equilibrium.' },
  { key: 'twill', label: 'Twill 2/2', note: 'Over 2, under 2, shifted one step per row for diagonal ribs.' },
  { key: 'herringbone', label: 'Herringbone', note: 'Broken chevron twill reversing direction across ribs.' },
  { key: 'basket', label: 'Basket 2/2', note: 'Paired warp and weft bundles crossing together.' },
  { key: 'satin', label: 'Satin 5', note: 'Long warp floats with lustrous, quiet crossings.' },
];

export const WEAVE_COLOR_MODES: ReadonlyArray<{ key: WeaveColorMode; label: string }> = [
  { key: 'same', label: 'Warp & weft share palette' },
  { key: 'warp-only', label: 'Warp = palette, weft = first swatch' },
  { key: 'reverse', label: 'Weft reverses palette order' },
];

/** Returns true when the vertical warp thread sits on top at crossing (x, y). */
export function isWarpOnTop(pattern: WeavePattern, x: number, y: number): boolean {
  const mx = ((x % 1000) + 1000) % 1000;
  const my = ((y % 1000) + 1000) % 1000;
  switch (pattern) {
    case 'plain':
      return (mx + my) % 2 === 0;
    case 'twill':
      return (mx + my) % 4 < 2;
    case 'herringbone': {
      const half = Math.floor((mx % 8) / 4);
      const lx = mx % 4;
      const shift = half === 0 ? lx + my : -lx + my + 4;
      return ((shift % 4) + 4) % 4 < 2;
    }
    case 'basket':
      return (Math.floor(mx / 2) + Math.floor(my / 2)) % 2 === 0;
    case 'satin':
      return (mx * 2) % 5 !== my % 5;
  }
}

/** Expands a palette into `count` striped threads along one axis. */
export function buildThreadColors(
  palette: readonly string[],
  count: number,
  stripe: number,
  reverse = false
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
  cells: string[][];
  warpUp: boolean[][];
}

/** Builds the complete warp/weft matrix and crossing state for a weave preview. */
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

/** Encodes a 1/0 loom lift plan matrix (1 = warp lifted on top, 0 = weft on top). */
export function buildLiftPlanText(grid: WeaveGrid): string {
  return grid.warpUp.map((row) => row.map((v) => (v ? '1' : '0')).join(' ')).join('\n');
}

/** Renders a shaded scalable SVG representing the woven cloth matrix. */
export function buildWeaveSvg(grid: WeaveGrid, cellPx = 12, title = 'Weave preview'): string {
  const n = grid.size;
  const w = n * cellPx;
  const gap = Math.max(0.5, cellPx * 0.06);
  const r = cellPx * 0.22;
  const parts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 ${w} ${w}" role="img" aria-label="${escapeXml(title)}">`,
    `<title>${escapeXml(title)}</title>`,
    '<defs>',
    '<linearGradient id="weaveShadeV" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>',
    '<linearGradient id="weaveShadeH" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.16"/><stop offset="1" stop-color="#000" stop-opacity="0.28"/></linearGradient>',
    '</defs>',
    `<rect width="${w}" height="${w}" fill="#1c1917"/>`,
  ];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const up = grid.warpUp[y][x];
      const px = x * cellPx;
      const py = y * cellPx;
      const rx = up ? px + gap : px;
      const ry = up ? py : py + gap;
      const rw = up ? cellPx - gap * 2 : cellPx;
      const rh = up ? cellPx : cellPx - gap * 2;
      parts.push(
        `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" rx="${r.toFixed(2)}" fill="${escapeXml(grid.cells[y][x])}"/>`,
        `<rect x="${rx.toFixed(2)}" y="${ry.toFixed(2)}" width="${rw.toFixed(2)}" height="${rh.toFixed(2)}" rx="${r.toFixed(2)}" fill="url(#${up ? 'weaveShadeV' : 'weaveShadeH'})"/>`
      );
    }
  }
  parts.push('</svg>');
  return parts.join('');
}
