import { ColorItem, Combination, CvdMode, ToneFilter } from '../types/color';

/**
 * Normalize 3- or 6-character hex strings into lowercase `#rrggbb`, or return null if invalid.
 */
export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{3}$/.test(trimmed)) {
    return (
      '#' +
      trimmed
        .split('')
        .map((ch) => ch + ch)
        .join('')
        .toLowerCase()
    );
  }
  if (/^[0-9a-fA-F]{6}$/.test(trimmed)) {
    return '#' + trimmed.toLowerCase();
  }
  return null;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  const cleanHex = normalized ? normalized.slice(1) : '000000';
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.min(255, Math.max(0, Math.round(n)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  const l1 = getLuminance(rgb1[0], rgb1[1], rgb1[2]);
  const l2 = getLuminance(rgb2[0], rgb2[1], rgb2[2]);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function getIdealTextColor(bgHex: string): '#111314' | '#ffffff' {
  const [r, g, b] = hexToRgb(bgHex);
  const lum = getLuminance(r, g, b);
  return lum > 0.38 ? '#111314' : '#ffffff';
}

/**
 * Pick readable badge colors in the UI mockup even when accent and background have low contrast.
 */
export function getAccessibleBadgeColors(
  accentHex: string,
  bgHex: string
): { backgroundColor: string; color: string; borderColor: string } {
  const ratio = getContrastRatio(accentHex, bgHex);
  if (ratio >= 3.2) {
    return {
      backgroundColor: `${accentHex}22`,
      color: accentHex,
      borderColor: `${accentHex}55`,
    };
  }
  return {
    backgroundColor: accentHex,
    color: getIdealTextColor(accentHex),
    borderColor: `${getIdealTextColor(accentHex)}33`,
  };
}

/**
 * Derive a distinct elevated surface hex from a background color so 2-color palettes
 * never collide between Surface and Accent roles.
 */
export function deriveSurfaceHex(bgHex: string): string {
  const [r, g, b] = hexToRgb(bgHex);
  const lum = getLuminance(r, g, b);

  // Mix toward warm ink on near-white backgrounds, or lift toward white on mid/dark tones
  const target: [number, number, number] = lum >= 0.82 ? [28, 25, 23] : [255, 255, 255];
  const t = lum >= 0.82 ? 0.08 : lum > 0.35 ? 0.42 : 0.14;

  return rgbToHex(
    r + (target[0] - r) * t,
    g + (target[1] - g) * t,
    b + (target[2] - b) * t
  );
}

export function getMaxPaletteContrast(combination: Pick<Combination, 'colors'>): number {
  let maxRatio = 1;
  const { colors } = combination;
  for (let i = 0; i < colors.length; i++) {
    for (let j = i + 1; j < colors.length; j++) {
      const ratio = getContrastRatio(colors[i].hex, colors[j].hex);
      if (ratio > maxRatio) maxRatio = ratio;
    }
  }
  return maxRatio;
}

/**
 * Convert sRGB (0-255) to HSL [hue 0-360, saturation 0-1, lightness 0-1].
 */
export function rgbToHsl(rgb: [number, number, number]): [number, number, number] {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / 510;
  const s = d === 0 ? 0 : l > 0.5 ? d / (510 - max - min) : d / (max + min);

  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  return [h, s, l];
}

export function classifyColorTone(
  rgb: [number, number, number]
): Exclude<ToneFilter, 'all'> {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const [h, s, l] = rgbToHsl(rgb);
  const sHsv = max === 0 ? 0 : d / max;

  if (s < 0.09) return 'neutral';
  if (l > 0.72 && sHsv < 0.42) return 'pastel';
  if (l < 0.30) return 'deep';

  // Earthy tones: browns, ochre, muted greens/khaki
  if (s < 0.5 && l >= 0.25 && l <= 0.65 && ((h >= 20 && h <= 100) || h >= 340)) {
    return 'earthy';
  }

  if (h >= 340 || h <= 75) return 'warm';
  return 'cool';
}

const CVD_MATRICES: Record<Exclude<CvdMode, 'normal' | 'achromatopsia'>, number[]> = {
  // Machado et al. (2009) severe dichromacy matrices in linear sRGB
  protanopia: [
    0.152286, 1.052583, -0.204868,
    0.114503, 0.786281, 0.099216,
    -0.003882, -0.048116, 1.051998,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968,
    0.280085, 0.672501, 0.047413,
    -0.011820, 0.042940, 0.968881,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779,
    -0.078411, 0.930809, 0.147602,
    0.004733, 0.691367, 0.303900,
  ],
};

/**
 * Simulate how a hex color appears under color vision deficiency (CVD) in linear sRGB.
 */
export function simulateColorVision(hex: string, mode: CvdMode): string {
  const normalized = normalizeHex(hex);
  if (!normalized) return hex;
  if (mode === 'normal') return normalized;

  const [r, g, b] = hexToRgb(normalized);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const toSrgb = (c: number) => {
    const clamped = Math.min(1, Math.max(0, c));
    return (
      (clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255
    );
  };

  const rL = toLinear(r);
  const gL = toLinear(g);
  const bL = toLinear(b);

  if (mode === 'achromatopsia') {
    const lum = 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    const gray = toSrgb(lum);
    return rgbToHex(gray, gray, gray);
  }

  const m = CVD_MATRICES[mode];
  const simR = toSrgb(m[0] * rL + m[1] * gL + m[2] * bL);
  const simG = toSrgb(m[3] * rL + m[4] * gL + m[5] * bL);
  const simB = toSrgb(m[6] * rL + m[7] * gL + m[8] * bL);
  return rgbToHex(simR, simG, simB);
}

/**
 * Convert sRGB (0-255) to CIE-LAB (D65).
 */
export function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const [rL, gL, bL] = [r / 255, g / 255, b / 255].map((v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  const X = (rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375) / 0.95047;
  const Y = (rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750) / 1.0;
  const Z = (rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041) / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X);
  const fy = f(Y);
  const fz = f(Z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/**
 * Convert sRGB (0-255) to OKLCH [L (0..1), C, h (0..360)].
 */
export function rgbToOklch(r: number, g: number, b: number): [number, number, number] {
  const [rL, gL, bL] = [r / 255, g / 255, b / 255].map((v) =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );

  const l = Math.cbrt(0.4122214708 * rL + 0.5363325363 * gL + 0.0514459929 * bL);
  const m = Math.cbrt(0.2119034982 * rL + 0.6806995451 * gL + 0.1073969566 * bL);
  const s = Math.cbrt(0.0883024619 * rL + 0.2817188376 * gL + 0.6299787005 * bL);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bOk = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.hypot(a, bOk);
  let h = C < 1e-6 ? 0 : (Math.atan2(bOk, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return [
    parseFloat(L.toFixed(4)),
    parseFloat(C.toFixed(4)),
    parseFloat(h.toFixed(1)),
  ];
}

export function formatOklch(rgb: [number, number, number]): string {
  const [L, C, h] = rgbToOklch(rgb[0], rgb[1], rgb[2]);
  return `oklch(${(L * 100).toFixed(1)}% ${C.toFixed(3)} ${h.toFixed(1)})`;
}

/**
 * Perceptual color difference using CIEDE2000 (kL = kC = kH = 1).
 */
export function getDeltaE2000(
  lab1: [number, number, number],
  lab2: [number, number, number]
): number {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const deg2rad = Math.PI / 180;
  const rad2deg = 180 / Math.PI;
  const pow25_7 = 6103515625;

  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar = (C1 + C2) / 2;
  const Cbar7 = Math.pow(Cbar, 7);
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + pow25_7)));

  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);

  const h1p = b1 === 0 && a1p === 0 ? 0 : (Math.atan2(b1, a1p) * rad2deg + 360) % 360;
  const h2p = b2 === 0 && a2p === 0 ? 0 : (Math.atan2(b2, a2p) * rad2deg + 360) % 360;

  const dLp = L2 - L1;
  const dCp = C2p - C1p;

  let dhp = 0;
  if (C1p * C2p !== 0) {
    const diff = h2p - h1p;
    if (Math.abs(diff) <= 180) dhp = diff;
    else if (diff > 180) dhp = diff - 360;
    else dhp = diff + 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * deg2rad) / 2);

  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;

  let hbarp = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hbarp = (h1p + h2p) / 2;
    else if (h1p + h2p < 360) hbarp = (h1p + h2p + 360) / 2;
    else hbarp = (h1p + h2p - 360) / 2;
  }

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * deg2rad) +
    0.24 * Math.cos(2 * hbarp * deg2rad) +
    0.32 * Math.cos((3 * hbarp + 6) * deg2rad) -
    0.2 * Math.cos((4 * hbarp - 63) * deg2rad);

  const dTheta = 30 * Math.exp(-Math.pow((hbarp - 275) / 25, 2));
  const Cbarp7 = Math.pow(Cbarp, 7);
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + pow25_7));

  const Lbarp50Sq = Math.pow(Lbarp - 50, 2);
  const SL = 1 + (0.015 * Lbarp50Sq) / Math.sqrt(20 + Lbarp50Sq);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(2 * dTheta * deg2rad) * RC;

  const termL = dLp / SL;
  const termC = dCp / SC;
  const termH = dHp / SH;

  return Math.sqrt(
    termL * termL + termC * termC + termH * termH + RT * termC * termH
  );
}

export interface ColorMatch {
  color: ColorItem;
  deltaE: number;
}

/**
 * Find the closest master swatches to any hex color using CIEDE2000.
 */
export function findClosestColors(
  targetHex: string,
  colors: ColorItem[],
  limit = 6
): ColorMatch[] {
  const normalized = normalizeHex(targetHex);
  if (!normalized) return [];
  const rgb = hexToRgb(normalized);
  const targetLab = rgbToLab(rgb[0], rgb[1], rgb[2]);

  return colors
    .map((color) => ({
      color,
      deltaE: getDeltaE2000(targetLab, color.lab),
    }))
    .sort((a, b) => a.deltaE - b.deltaE)
    .slice(0, limit);
}

/**
 * Compute clean 60/30/10-inspired proportional percentages summing to 100 for any palette size.
 */
export function getProportionWeights(count: number): number[] {
  if (count <= 1) return [100];
  if (count === 2) return [70, 30];
  if (count === 3) return [60, 30, 10];
  if (count === 4) return [60, 20, 10, 10];
  if (count === 5) return [55, 25, 8, 6, 6];

  const tailCount = count - 2;
  const tailBudget = 25;
  const base = Math.floor(tailBudget / tailCount);
  const rem = tailBudget % tailCount;
  return [
    50,
    25,
    ...Array.from({ length: tailCount }, (_, idx) => base + (idx < rem ? 1 : 0)),
  ];
}

function getComboTitle(combo: Combination): string {
  if (combo.id === 0) {
    return `Sanzo Wada Custom Mix (${combo.size}-Color)`;
  }
  return combo.volume === 2
    ? `Sanzo Wada Vol. 2 № ${combo.id} (${combo.monthName} / ${combo.monthJa})`
    : `Sanzo Wada Vol. 1 № ${combo.id} (${combo.size}-Color)`;
}

function getComboPrefix(combo: Combination): string {
  if (combo.id === 0) return 'wada-custom';
  return combo.volume === 2 ? `wada-v2-${combo.id}` : `wada-${combo.id}`;
}

function getComboFileBase(combo: Combination): string {
  if (combo.id === 0) return 'sanzo-wada-custom-mix';
  return `sanzo-wada-vol${combo.volume}-combo-${combo.id}`;
}

export function generateCssVariables(
  combo: Combination,
  useOklch = false
): string {
  const volPrefix = getComboPrefix(combo);
  const lines = combo.colors.map((c, i) => {
    const val = useOklch ? formatOklch(c.rgb) : c.hex;
    return `  --${volPrefix}-color-${i + 1}: ${val}; /* ${c.name}${c.ja ? ` (${c.ja})` : ''} */`;
  });
  return `/* ${getComboTitle(combo)} */\n:root {\n${lines.join('\n')}\n}`;
}

export function generateRoleCssVariables(
  combo: Combination,
  roles: {
    bg: { hex: string; name: string };
    surface: { hex: string; name: string };
    accent: { hex: string; name: string };
    textHex: string;
  }
): string {
  return `/* Semantic UI Roles — ${getComboTitle(combo)} */\n:root {\n  --color-bg: ${roles.bg.hex}; /* ${roles.bg.name} */\n  --color-surface: ${roles.surface.hex}; /* ${roles.surface.name} */\n  --color-accent: ${roles.accent.hex}; /* ${roles.accent.name} */\n  --color-text: ${roles.textHex};\n}`;
}

export function generateTailwindV4Theme(combo: Combination): string {
  const volPrefix = getComboPrefix(combo);
  const lines = combo.colors.map(
    (c, i) =>
      `  --color-${volPrefix}-${i + 1}: ${c.hex}; /* ${c.name}${c.ja ? ` (${c.ja})` : ''} • ${formatOklch(c.rgb)} */`
  );
  return `/* Tailwind CSS v4 @theme — ${getComboTitle(combo)} */\n@theme {\n${lines.join('\n')}\n}`;
}

export function generateTailwindConfig(combo: Combination): string {
  const volKey = getComboPrefix(combo);
  const entries = combo.colors.map(
    (c, i) =>
      `        'color-${i + 1}': '${c.hex}', // ${c.name}${c.ja ? ` (${c.ja})` : ''}`
  );
  return `// Tailwind CSS v3 Config\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${volKey}': {\n${entries.join('\n')}\n        }\n      }\n    }\n  }\n};`;
}

export function generateJsonExport(combo: Combination): string {
  return JSON.stringify(
    {
      volume: combo.volume,
      combinationId: combo.id,
      month: combo.month,
      monthName: combo.monthName,
      monthJa: combo.monthJa,
      size: combo.size,
      colors: combo.colors.map((c) => ({
        id: c.id,
        name: c.name,
        ja: c.ja || undefined,
        reading: c.reading || undefined,
        hex: c.hex,
        rgb: c.rgb,
        cmyk: c.cmyk,
        lab: c.lab,
        oklch: rgbToOklch(c.rgb[0], c.rgb[1], c.rgb[2]),
      })),
    },
    null,
    2
  );
}

/**
 * W3C Design Tokens / Figma Tokens Studio compatible JSON output.
 */
export function generateDesignTokensJson(combo: Combination): string {
  const groupKey = getComboPrefix(combo);
  const tokens: Record<string, { $value: string; $type: 'color'; $description: string }> = {};
  combo.colors.forEach((c, i) => {
    tokens[`color-${i + 1}`] = {
      $value: c.hex.toUpperCase(),
      $type: 'color',
      $description: `${c.name}${c.ja ? ` (${c.ja})` : ''} — ${formatOklch(c.rgb)}`,
    };
  });
  return JSON.stringify({ [groupKey]: tokens }, null, 2);
}

/**
 * GIMP / Inkscape / Krita / Procreate compatible .gpl palette format.
 */
export function generateGplPalette(combo: Combination): string {
  const header = [
    'GIMP Palette',
    `Name: ${getComboTitle(combo)}`,
    `Columns: ${Math.min(combo.colors.length, 4)}`,
    '# Digitized from Sanzo Wada Haishoku Sokan (1933-1935)',
  ];
  const entries = combo.colors.map(
    (c) =>
      `${c.rgb[0].toString().padStart(3, ' ')} ${c.rgb[1].toString().padStart(3, ' ')} ${c.rgb[2].toString().padStart(3, ' ')}\t${c.name}${c.ja ? ` (${c.ja})` : ''}`
  );
  return [...header, ...entries].join('\n');
}

/**
 * Inline SVG <palette> snippet (useful for Coolors/design workflows).
 */
export function generateSvgPaletteSnippet(combo: Combination): string {
  const width = combo.colors.length * 100;
  const rects = combo.colors
    .map(
      (c, i) =>
        `  <rect x="${i * 100}" y="0" width="100" height="100" fill="${escapeXml(c.hex)}"><title>${escapeXml(c.name)}</title></rect>`
    )
    .join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 100">\n${rects}\n</svg>`;
}

/**
 * Encode a combination as an Adobe Swatch Exchange (.ase v1.0) binary buffer.
 */
export function buildAseBytes(combo: Combination): Uint8Array {
  const encoder = new TextEncoder();
  const encodeUtf16BeNull = (text: string): Uint8Array => {
    const out = new Uint8Array((text.length + 1) * 2);
    const view = new DataView(out.buffer);
    for (let i = 0; i < text.length; i++) {
      view.setUint16(i * 2, text.charCodeAt(i), false);
    }
    view.setUint16(text.length * 2, 0, false);
    return out;
  };

  const chunks: Uint8Array[] = [];

  // Group start block (0xC001)
  const groupNameBytes = encodeUtf16BeNull(getComboTitle(combo));
  const groupStart = new Uint8Array(6 + 2 + groupNameBytes.length);
  const gsView = new DataView(groupStart.buffer);
  gsView.setUint16(0, 0xc001, false);
  gsView.setUint32(2, 2 + groupNameBytes.length, false);
  gsView.setUint16(6, combo.colors.length + 1, false);
  groupStart.set(groupNameBytes, 8);
  chunks.push(groupStart);

  // Color entry blocks (0x0001)
  for (const c of combo.colors) {
    const label = c.ja ? `${c.name} (${c.ja})` : c.name;
    const nameBytes = encodeUtf16BeNull(label);
    const blockDataLen = 2 + nameBytes.length + 4 + 12 + 2;
    const block = new Uint8Array(6 + blockDataLen);
    const bv = new DataView(block.buffer);
    let offset = 0;
    bv.setUint16(offset, 0x0001, false); offset += 2;
    bv.setUint32(offset, blockDataLen, false); offset += 4;
    bv.setUint16(offset, label.length + 1, false); offset += 2;
    block.set(nameBytes, offset); offset += nameBytes.length;
    block.set(encoder.encode('RGB '), offset); offset += 4;
    bv.setFloat32(offset, c.rgb[0] / 255, false); offset += 4;
    bv.setFloat32(offset, c.rgb[1] / 255, false); offset += 4;
    bv.setFloat32(offset, c.rgb[2] / 255, false); offset += 4;
    bv.setUint16(offset, 2, false); // Normal color type
    chunks.push(block);
  }

  // Group end block (0xC002)
  const groupEnd = new Uint8Array(6);
  new DataView(groupEnd.buffer).setUint16(0, 0xc002, false);
  chunks.push(groupEnd);

  const totalBodyLen = chunks.reduce((sum, ch) => sum + ch.length, 0);
  const result = new Uint8Array(12 + totalBodyLen);
  const headerView = new DataView(result.buffer);
  result.set(encoder.encode('ASEF'), 0);
  headerView.setUint16(4, 1, false);
  headerView.setUint16(6, 0, false);
  headerView.setUint32(8, chunks.length, false);

  let cursor = 12;
  for (const chunk of chunks) {
    result.set(chunk, cursor);
    cursor += chunk.length;
  }

  return result;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface PosterExportOptions {
  weighted?: boolean;
}

function getPosterBarRects(
  count: number,
  weighted: boolean
): Array<{ y: number; height: number; weightPct: number }> {
  const startY = 240;
  const gap = 6;
  const totalHeight = 560;

  if (!weighted || count <= 1) {
    const slot = Math.floor(510 / Math.max(1, count));
    const eqPct = Math.round(100 / Math.max(1, count));
    return Array.from({ length: count }, (_, idx) => ({
      y: startY + idx * slot,
      height: slot - gap,
      weightPct: eqPct,
    }));
  }

  const weights = getProportionWeights(count);
  const usableHeight = totalHeight - gap * (count - 1);
  let cursorY = startY;
  return weights.map((pct, idx) => {
    const rawH = Math.round((pct / 100) * usableHeight);
    const h = idx === count - 1 ? Math.max(26, startY + totalHeight - cursorY) : Math.max(26, rawH);
    const rect = { y: cursorY, height: h, weightPct: pct };
    cursorY += h + gap;
    return rect;
  });
}

export function buildSvgCardMarkup(
  combo: Combination,
  options: PosterExportOptions = {}
): string {
  const width = 800;
  const height = 1000;
  const swatchesCount = combo.colors.length;
  const swatchWidth = 600;
  const weighted = Boolean(options.weighted);
  const rects = getPosterBarRects(swatchesCount, weighted);

  const swatchesSvg = combo.colors
    .map((c, idx) => {
      const { y, height: barH, weightPct } = rects[idx];
      const textFill = getIdealTextColor(c.hex);
      const rawName = c.ja ? `${c.name} (${c.ja})` : c.name;
      const showTwoLines = barH >= 48;
      const singleLineText = escapeXml(
        weighted
          ? `${rawName} • ${c.hex.toUpperCase()} (${weightPct}%)`
          : `${rawName} • ${c.hex.toUpperCase()}`
      );
      const titleText = escapeXml(weighted ? `${rawName} (${weightPct}%)` : rawName);
      const detailsText = escapeXml(
        `${c.hex.toUpperCase()} • RGB(${c.rgb.join(', ')}) • CMYK(${c.cmyk.join(', ')})`
      );
      return `
      <g transform="translate(80, ${y})">
        <rect width="${swatchWidth}" height="${barH}" fill="${escapeXml(c.hex)}" rx="4" />
        <text x="20" y="${showTwoLines ? barH / 2 - 4 : barH / 2 + 5}" fill="${textFill}" font-family="'Noto Serif JP', Georgia, serif" font-size="${barH < 44 ? 13 : 17}" font-weight="bold">${showTwoLines ? titleText : singleLineText}</text>
        ${
          showTwoLines
            ? `<text x="20" y="${barH / 2 + 16}" fill="${textFill}" opacity="0.85" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="11">${detailsText}</text>`
            : ''
        }
      </g>`;
    })
    .join('');

  const isCustom = combo.id === 0;
  const rawSubtitle = isCustom
    ? `${combo.size}-COLOR CUSTOM COMPOSITION`
    : combo.volume === 2
    ? `VOLUME 2 • ${(combo.monthName || '').toUpperCase()} (${combo.monthJa || ''} • ${(combo.monthMeaning || '').toUpperCase()})`
    : `${combo.size}-COLOR HARMONY`;
  const subtitle = escapeXml(rawSubtitle);
  const titleNum = isCustom
    ? 'CUSTOM MIX'
    : combo.volume === 2
    ? `VOL. 2 CARD № ${combo.id.toString().padStart(2, '0')}`
    : `VOL. 1 № ${combo.id.toString().padStart(3, '0')}`;
  const volLabel = escapeXml(
    isCustom
      ? '和田三造 (Sanzo Wada) — Custom Palette Study'
      : `和田三造 (Sanzo Wada, 1933) — 配色総鑑${combo.volume === 2 ? ' B篇' : ''}`
  );
  const verticalCharacters =
    !isCustom && combo.volume === 2 ? ['配', '色', '総', '鑑', 'B'] : ['配', '色', '総', '鑑'];
  const verticalSvg = verticalCharacters
    .map(
      (ch, idx) =>
        `<text x="720" y="${265 + idx * 32}" font-family="'Noto Serif JP', serif" font-size="22" font-weight="700" fill="#8C8478" text-anchor="middle">${ch}</text>`
    )
    .join('');

  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#FAF7F2" />
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="#2B2B2B" stroke-width="1.5" stroke-opacity="0.25" />

  <!-- Header Japanese and English Typography -->
  <text x="80" y="85" font-family="'Cinzel', Georgia, serif" font-size="25" font-weight="bold" fill="#1C1A17" letter-spacing="2">A DICTIONARY OF COLOR COMBINATIONS</text>
  <text x="80" y="118" font-family="'Noto Serif JP', Georgia, serif" font-size="15" fill="#6B665E">${volLabel}</text>
  <text x="80" y="168" font-family="'Cinzel', Georgia, serif" font-size="22" font-weight="bold" fill="#B93826">${escapeXml(titleNum)}</text>
  <text x="80" y="198" font-family="'Noto Serif JP', Georgia, serif" font-size="12" fill="#888177" letter-spacing="1.5">${subtitle}</text>

  <!-- Hanko Stamp Impression -->
  <g transform="translate(680, 72)">
    <rect width="56" height="56" fill="none" stroke="#B93826" stroke-width="2.5" rx="6" />
    <text x="28" y="36" font-family="'Noto Serif JP', Georgia, serif" font-size="20" font-weight="900" fill="#B93826" text-anchor="middle">三造</text>
  </g>

  <!-- Vertical Kanji Editorial Spine -->
  ${verticalSvg}

  <!-- Swatches -->
  ${swatchesSvg}

  <!-- Footer -->
  <line x1="80" y1="885" x2="720" y2="885" stroke="#D6CFC2" stroke-width="1" />
  <text x="80" y="925" font-family="'Noto Serif JP', Georgia, serif" font-size="12" fill="#999185">Digitized from the original 1930s Showa plates • Japan Standard Color Association</text>
  <text x="720" y="925" font-family="'JetBrains Mono', ui-monospace, monospace" font-size="12" fill="#999185" text-anchor="end">sanzo-wada-palette</text>
</svg>
`.trim();
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadSvgCard(
  combo: Combination,
  options: PosterExportOptions = {}
): void {
  const svgContent = buildSvgCardMarkup(combo, options);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  triggerBlobDownload(blob, `${getComboFileBase(combo)}.svg`);
}

export function downloadGplPalette(combo: Combination): void {
  const gpl = generateGplPalette(combo);
  const blob = new Blob([gpl], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(blob, `${getComboFileBase(combo)}.gpl`);
}

export function downloadAsePalette(combo: Combination): void {
  const bytes = buildAseBytes(combo);
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  const blob = new Blob([copy.buffer], { type: 'application/octet-stream' });
  triggerBlobDownload(blob, `${getComboFileBase(combo)}.ase`);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

/**
 * Render a crisp 2x Showa Art Print poster directly onto a Canvas and download as PNG,
 * awaiting document.fonts.ready so web fonts render cleanly.
 */
export async function downloadPngCard(
  combo: Combination,
  options: PosterExportOptions = {}
): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.all([
        document.fonts.load('700 24px "Cinzel"'),
        document.fonts.load('400 12px "JetBrains Mono"'),
        document.fonts.ready,
      ]);
    } catch {
      // Ignore font readiness failures and draw with available fonts
    }
  }

  const scale = 2;
  const width = 800;
  const height = 1000;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.scale(scale, scale);

  const isCustom = combo.id === 0;
  const weighted = Boolean(options.weighted);

  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = 'rgba(43, 43, 43, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(30, 30, width - 60, height - 60);

  ctx.fillStyle = '#1C1A17';
  ctx.font = '700 24px "Cinzel", Georgia, serif';
  ctx.fillText('A DICTIONARY OF COLOR COMBINATIONS', 80, 85);

  ctx.fillStyle = '#6B665E';
  ctx.font = '400 15px "Noto Serif JP", Georgia, serif';
  ctx.fillText(
    isCustom
      ? '和田三造 (Sanzo Wada) — Custom Palette Study'
      : `和田三造 (Sanzo Wada, 1933) — 配色総鑑${combo.volume === 2 ? ' B篇' : ''}`,
    80,
    118
  );

  ctx.fillStyle = '#B93826';
  ctx.font = '700 22px "Cinzel", Georgia, serif';
  const titleNum = isCustom
    ? 'CUSTOM MIX'
    : combo.volume === 2
    ? `VOL. 2 CARD № ${combo.id.toString().padStart(2, '0')}`
    : `VOL. 1 № ${combo.id.toString().padStart(3, '0')}`;
  ctx.fillText(titleNum, 80, 168);

  ctx.fillStyle = '#888177';
  ctx.font = '500 12px "Noto Serif JP", Georgia, serif';
  const subtitle = isCustom
    ? `${combo.size}-COLOR CUSTOM COMPOSITION`
    : combo.volume === 2
    ? `VOLUME 2 • ${(combo.monthName || '').toUpperCase()} (${combo.monthJa || ''} • ${(combo.monthMeaning || '').toUpperCase()})`
    : `${combo.size}-COLOR HARMONY`;
  ctx.fillText(subtitle, 80, 198);

  ctx.strokeStyle = '#B93826';
  ctx.lineWidth = 2.5;
  drawRoundedRect(ctx, 680, 72, 56, 56, 6);
  ctx.stroke();
  ctx.fillStyle = '#B93826';
  ctx.font = '900 20px "Noto Serif JP", Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('三造', 708, 108);

  ctx.fillStyle = '#8C8478';
  ctx.font = '700 22px "Noto Serif JP", Georgia, serif';
  const chars =
    !isCustom && combo.volume === 2 ? ['配', '色', '総', '鑑', 'B'] : ['配', '色', '総', '鑑'];
  chars.forEach((ch, idx) => ctx.fillText(ch, 720, 265 + idx * 32));
  ctx.textAlign = 'left';

  const swatchWidth = 600;
  const rects = getPosterBarRects(combo.colors.length, weighted);
  combo.colors.forEach((c, idx) => {
    const { y, height: barH, weightPct } = rects[idx];
    const textFill = getIdealTextColor(c.hex);
    const rawName = c.ja ? `${c.name} (${c.ja})` : c.name;
    const showTwoLines = barH >= 48;

    ctx.fillStyle = c.hex;
    drawRoundedRect(ctx, 80, y, swatchWidth, barH, 4);
    ctx.fill();

    ctx.fillStyle = textFill;
    ctx.font = `700 ${barH < 44 ? 13 : 17}px "Noto Serif JP", Georgia, serif`;
    const primaryLine = showTwoLines
      ? weighted
        ? `${rawName} (${weightPct}%)`
        : rawName
      : weighted
      ? `${rawName} • ${c.hex.toUpperCase()} (${weightPct}%)`
      : `${rawName} • ${c.hex.toUpperCase()}`;

    ctx.fillText(
      primaryLine,
      100,
      y + (showTwoLines ? barH / 2 - 4 : barH / 2 + 5)
    );

    if (showTwoLines) {
      ctx.globalAlpha = 0.85;
      ctx.font = '500 11px "JetBrains Mono", ui-monospace, monospace';
      ctx.fillText(
        `${c.hex.toUpperCase()} • RGB(${c.rgb.join(', ')}) • CMYK(${c.cmyk.join(', ')})`,
        100,
        y + barH / 2 + 16
      );
      ctx.globalAlpha = 1;
    }
  });

  ctx.strokeStyle = '#D6CFC2';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(80, 885);
  ctx.lineTo(720, 885);
  ctx.stroke();

  ctx.fillStyle = '#999185';
  ctx.font = '400 12px "Noto Serif JP", Georgia, serif';
  ctx.fillText(
    'Digitized from the original 1930s Showa plates • Japan Standard Color Association',
    80,
    925
  );
  ctx.textAlign = 'right';
  ctx.font = '500 12px "JetBrains Mono", ui-monospace, monospace';
  ctx.fillText('sanzo-wada-palette', 720, 925);
  ctx.textAlign = 'left';

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob'));
        return;
      }
      triggerBlobDownload(blob, `${getComboFileBase(combo)}.png`);
      resolve();
    }, 'image/png');
  });
}
