import { ColorItem } from '../types/color';
import { rgbToHsl } from './colorUtils';

export interface SpectrumNode {
  color: ColorItem;
  xPct: number;
  yPct: number;
  sizePx: number;
}

/**
 * Deterministic 2D scatter coordinates with gentle repulsion so similar Hue/Lightness
 * swatches remain clickable without piling on top of each other.
 */
export function layoutSpectrumPoints(colors: ColorItem[]): SpectrumNode[] {
  const nodes: SpectrumNode[] = colors.map((color) => {
    const [h, s, l] = rgbToHsl(color.rgb);
    const isNeutral = s < 0.09;
    const xPct = isNeutral ? 91.5 : 5 + (h / 360) * 78;
    const yPct = 9 + l * 82;
    const totalUses = (color.combinations?.length || 0) + (color.vol2Cards?.length || 0);
    const sizePx = Math.min(24, Math.max(14, 12 + Math.sqrt(totalUses) * 1.8));
    return { color, xPct, yPct, sizePx };
  });

  // Gentle repulsion pass to separate tight pigment clusters
  const minDist = 2.6;
  for (let pass = 0; pass < 8; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.xPct - a.xPct;
        const dy = b.yPct - a.yPct;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          const angle = dist > 0.001 ? Math.atan2(dy, dx) : (i + j) * 0.85;
          const push = (minDist - dist) * 0.45;
          a.xPct = Math.max(3, Math.min(96, a.xPct - Math.cos(angle) * push));
          a.yPct = Math.max(6, Math.min(94, a.yPct - Math.sin(angle) * push));
          b.xPct = Math.max(3, Math.min(96, b.xPct + Math.cos(angle) * push));
          b.yPct = Math.max(6, Math.min(94, b.yPct + Math.sin(angle) * push));
        }
      }
    }
  }

  return nodes;
}
