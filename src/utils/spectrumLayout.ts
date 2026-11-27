import { ColorItem } from '../types/color';
import { rgbToHsl } from './colorUtils';

export interface SpectrumNode {
  color: ColorItem;
  xPct: number;
  yPct: number;
  sizePx: number;
}

export interface WheelNode {
  color: ColorItem;
  xPct: number;
  yPct: number;
  sizePx: number;
  hueDeg: number;
  isNeutral: boolean;
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

function clampPolarRadius(node: WheelNode): void {
  const dx = node.xPct - 50;
  const dy = node.yPct - 50;
  const r = Math.hypot(dx, dy);
  const minR = node.isNeutral ? 1.5 : 17.5;
  const maxR = node.isNeutral ? 13.0 : 46.0;
  if (r < 0.0001) {
    node.xPct = 50 + minR;
    node.yPct = 50;
    return;
  }
  if (r < minR || r > maxR) {
    const clamped = Math.max(minR, Math.min(maxR, r));
    node.xPct = 50 + (dx / r) * clamped;
    node.yPct = 50 + (dy / r) * clamped;
  }
}

/**
 * Deterministic 360-degree polar Color Wheel layout spanning all Wada swatches:
 * - Chromatic pigments occupy the outer 360-degree spectrum ring (18%..46% radius)
 * - Neutral/achromatic pigments spiral smoothly across the central Neutral Core (2%..13% radius)
 */
export function layoutColorWheelPoints(colors: ColorItem[]): WheelNode[] {
  const rawNeutral: Array<{ color: ColorItem; h: number; l: number; sizePx: number }> = [];
  const nodes: WheelNode[] = [];

  for (const color of colors) {
    const [h, s, l] = rgbToHsl(color.rgb);
    const totalUses = (color.combinations?.length || 0) + (color.vol2Cards?.length || 0);
    const sizePx = Math.min(22, Math.max(13, 11 + Math.sqrt(totalUses) * 1.5));

    if (s < 0.09) {
      rawNeutral.push({ color, h, l, sizePx });
    } else {
      // Red (0 deg) at top 12 o'clock, sweeping clockwise
      const rad = ((h - 90) * Math.PI) / 180;
      // Blend lightness inversion + saturation so pale tints sit inner and deep tones radiate outward
      const toneDepth = (1 - l) * 0.72 + s * 0.28;
      const radius = 19 + Math.max(0, Math.min(1, toneDepth)) * 26;
      nodes.push({
        color,
        xPct: 50 + Math.cos(rad) * radius,
        yPct: 50 + Math.sin(rad) * radius,
        sizePx,
        hueDeg: Math.round(h),
        isNeutral: false,
      });
    }
  }

  // Order neutrals from darkest ink out to lightest paper along a golden-angle spiral in the core
  rawNeutral.sort((a, b) => a.l - b.l || a.color.id - b.color.id);
  const nCount = Math.max(1, rawNeutral.length);
  rawNeutral.forEach((item, idx) => {
    const t = nCount === 1 ? 0.5 : idx / (nCount - 1);
    const r = nCount === 1 ? 0 : 2.8 + t * 9.8;
    const angle = idx * 2.39996; // Golden angle avoids overlaps
    nodes.push({
      color: item.color,
      xPct: 50 + Math.cos(angle) * r,
      yPct: 50 + Math.sin(angle) * r,
      sizePx: item.sizePx,
      hueDeg: Math.round(item.h),
      isNeutral: true,
    });
  });

  // Gentle deterministic collision repulsion within respective rings
  const minDist = 3.0;
  for (let pass = 0; pass < 10; pass++) {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.xPct - a.xPct;
        const dy = b.yPct - a.yPct;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          const angle = dist > 0.001 ? Math.atan2(dy, dx) : (i + j) * 0.91;
          const push = (minDist - dist) * 0.45;
          a.xPct -= Math.cos(angle) * push;
          a.yPct -= Math.sin(angle) * push;
          b.xPct += Math.cos(angle) * push;
          b.yPct += Math.sin(angle) * push;
          clampPolarRadius(a);
          clampPolarRadius(b);
        }
      }
    }
  }

  return nodes;
}

/**
 * Find the closest placed pigment node to any normalized [0..100] wheel coordinate.
 */
export function findNearestWheelNode(
  nodes: WheelNode[],
  xPct: number,
  yPct: number
): WheelNode | null {
  let best: WheelNode | null = null;
  let bestDist = Infinity;
  for (const node of nodes) {
    const d = Math.hypot(node.xPct - xPct, node.yPct - yPct);
    if (d < bestDist) {
      bestDist = d;
      best = node;
    }
  }
  return best;
}
