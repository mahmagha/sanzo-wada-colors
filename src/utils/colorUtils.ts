import { Combination } from '../types/color';

export function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const bigint = parseInt(cleanHex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
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

export function getMaxPaletteContrast(combination: Combination): number {
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

export function classifyColorTone(rgb: [number, number, number]): 'warm' | 'cool' | 'earthy' | 'pastel' | 'deep' {
  const [r, g, b] = rgb;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  const l = (max + min) / (2 * 255);
  const s = l > 0.5 ? d / (510 - max - min) : d / (max + min || 1);

  if (l > 0.72 && s < 0.6) return 'pastel';
  if (l < 0.30) return 'deep';

  // Hue calculation
  let h = 0;
  if (d > 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  // Earthy tones: browns, ochre, muted greens/khaki
  if (s < 0.5 && l >= 0.25 && l <= 0.65 && ((h >= 20 && h <= 100) || h >= 340)) {
    return 'earthy';
  }

  // Warm vs Cool
  if (h >= 340 || h <= 75) return 'warm';
  return 'cool';
}

export function generateCssVariables(combo: Combination): string {
  const volPrefix = combo.volume === 2 ? `wada-v2-${combo.id}` : `wada-${combo.id}`;
  const lines = combo.colors.map(
    (c, i) => `  --${volPrefix}-color-${i + 1}: ${c.hex}; /* ${c.name}${c.ja ? ` (${c.ja})` : ''} */`
  );
  const title = combo.volume === 2
    ? `Sanzo Wada Vol. 2 № ${combo.id} (${combo.monthName} / ${combo.monthJa})`
    : `Sanzo Wada Vol. 1 № ${combo.id} (${combo.size}-Color)`;
  return `/* ${title} */\n:root {\n${lines.join('\n')}\n}`;
}

export function generateTailwindConfig(combo: Combination): string {
  const volKey = combo.volume === 2 ? `wada-v2-${combo.id}` : `wada-${combo.id}`;
  const entries = combo.colors.map(
    (c, i) => `        'color-${i + 1}': '${c.hex}', // ${c.name}${c.ja ? ` (${c.ja})` : ''}`
  );
  return `// Tailwind CSS Config\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        '${volKey}': {\n${entries.join('\n')}\n        }\n      }\n    }\n  }\n};`;
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
      colors: combo.colors.map(c => ({
        name: c.name,
        ja: c.ja || undefined,
        hex: c.hex,
        rgb: c.rgb,
        cmyk: c.cmyk,
        lab: c.lab,
      })),
    },
    null,
    2
  );
}

export function downloadSvgCard(combo: Combination): void {
  const width = 800;
  const height = 1000;
  const swatchesCount = combo.colors.length;
  const swatchWidth = 640;
  const swatchHeight = Math.floor(480 / swatchesCount);

  const swatchesSvg = combo.colors
    .map((c, idx) => {
      const y = 230 + idx * swatchHeight;
      const textFill = getIdealTextColor(c.hex);
      const displayName = c.ja ? `${c.name} (${c.ja})` : c.name;
      const showDetails = swatchHeight >= 45;
      return `
      <g transform="translate(80, ${y})">
        <rect width="${swatchWidth}" height="${swatchHeight - 4}" fill="${c.hex}" rx="4" />
        <text x="20" y="${showDetails ? swatchHeight / 2 - 4 : swatchHeight / 2 + 5}" fill="${textFill}" font-family="'Noto Serif JP', serif" font-size="${swatchHeight < 50 ? 14 : 17}" font-weight="bold">${displayName}</text>
        ${
          showDetails
            ? `<text x="20" y="${swatchHeight / 2 + 18}" fill="${textFill}" opacity="0.85" font-family="'JetBrains Mono', monospace" font-size="11">${c.hex.toUpperCase()} • RGB(${c.rgb.join(', ')}) • CMYK(${c.cmyk.join(', ')})</text>`
            : ''
        }
      </g>`;
    })
    .join('');

  const subtitle = combo.volume === 2
    ? `VOLUME 2 • ${combo.monthName?.toUpperCase()} (${combo.monthJa} • ${combo.monthMeaning})`
    : `${combo.size}-COLOR HARMONY`;

  const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&amp;family=Noto+Serif+JP:wght@400;700&amp;family=JetBrains+Mono&amp;display=swap');
  </style>
  <rect width="100%" height="100%" fill="#FAF7F2" />
  <rect x="30" y="30" width="${width - 60}" height="${height - 60}" fill="none" stroke="#2B2B2B" stroke-width="1.5" stroke-opacity="0.25" />
  
  <!-- Header Japanese and English Typography -->
  <text x="80" y="85" font-family="'Cinzel', serif" font-size="26" font-weight="bold" fill="#1C1A17" letter-spacing="2">A DICTIONARY OF COLOR COMBINATIONS</text>
  <text x="80" y="118" font-family="'Noto Serif JP', serif" font-size="15" fill="#6B665E">和田三造 (Sanzo Wada, 1933) — 配色総鑑 ${combo.volume === 2 ? 'B篇' : ''}</text>
  <text x="80" y="165" font-family="'Cinzel', serif" font-size="22" font-weight="bold" fill="#B93826">VOL. ${combo.volume} № ${combo.id.toString().padStart(3, '0')}</text>
  <text x="80" y="195" font-family="'Noto Serif JP', serif" font-size="13" fill="#888177" text-transform="uppercase" letter-spacing="1.5">${subtitle}</text>

  <!-- Hanko Stamp Impression -->
  <g transform="translate(660, 75)">
    <rect width="60" height="60" fill="none" stroke="#B93826" stroke-width="2.5" rx="6" />
    <text x="30" y="38" font-family="'Noto Serif JP', serif" font-size="22" font-weight="900" fill="#B93826" text-anchor="middle">三造</text>
  </g>

  <!-- Swatches -->
  ${swatchesSvg}

  <!-- Footer -->
  <text x="80" y="930" font-family="'Noto Serif JP', serif" font-size="12" fill="#999185">Digitized from the original 1930s Showa plates • Japan Standard Color Association</text>
  <text x="720" y="930" font-family="'JetBrains Mono', monospace" font-size="12" fill="#999185" text-anchor="end">sanzo-wada-palette</text>
</svg>
`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sanzo-wada-vol${combo.volume}-combo-${combo.id}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
