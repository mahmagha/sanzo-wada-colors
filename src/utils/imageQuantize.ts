import { rgbToHex } from './colorUtils';

export interface ExtractedColor {
  hex: string;
  rgb: [number, number, number];
  ratio: number;
}

function sqDist(a: [number, number, number], b: [number, number, number]): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/**
 * Extract top `k` dominant RGB colors from flat RGBA pixel bytes using deterministic
 * farthest-point seeding and k-means refinement. Skips semi-transparent pixels (alpha < 128).
 */
export function quantizeRgbSamples(
  rgbaPixels: ArrayLike<number>,
  k = 5,
  maxSamples = 2500
): ExtractedColor[] {
  const totalPixels = Math.floor(rgbaPixels.length / 4);
  if (totalPixels === 0 || k <= 0) return [];

  const step = Math.max(1, Math.floor(totalPixels / maxSamples));
  const samples: [number, number, number][] = [];

  for (let i = 0; i < totalPixels; i += step) {
    const idx = i * 4;
    const alpha = rgbaPixels[idx + 3];
    if (alpha !== undefined && alpha < 128) continue;
    samples.push([rgbaPixels[idx], rgbaPixels[idx + 1], rgbaPixels[idx + 2]]);
  }

  if (samples.length === 0) return [];

  const targetK = Math.min(k, samples.length);

  // Deterministic farthest-point initialization starting from the most central/first sample
  const centroids: [number, number, number][] = [[...samples[0]]];
  while (centroids.length < targetK) {
    let bestIdx = 0;
    let bestMinDist = -1;
    for (let i = 0; i < samples.length; i++) {
      let minDist = Infinity;
      for (const c of centroids) {
        const d = sqDist(samples[i], c);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestMinDist) {
        bestMinDist = minDist;
        bestIdx = i;
      }
    }
    if (bestMinDist <= 0) break;
    centroids.push([...samples[bestIdx]]);
  }

  const actualK = centroids.length;
  const assignments = new Int32Array(samples.length);

  for (let iter = 0; iter < 12; iter++) {
    const sums = Array.from({ length: actualK }, () => [0, 0, 0, 0]);
    let changed = false;

    for (let i = 0; i < samples.length; i++) {
      const p = samples[i];
      let bestCluster = 0;
      let bestDist = Infinity;
      for (let c = 0; c < actualK; c++) {
        const d = sqDist(p, centroids[c]);
        if (d < bestDist) {
          bestDist = d;
          bestCluster = c;
        }
      }
      if (assignments[i] !== bestCluster) {
        assignments[i] = bestCluster;
        changed = true;
      }
      sums[bestCluster][0] += p[0];
      sums[bestCluster][1] += p[1];
      sums[bestCluster][2] += p[2];
      sums[bestCluster][3] += 1;
    }

    for (let c = 0; c < actualK; c++) {
      const count = sums[c][3];
      if (count > 0) {
        centroids[c] = [
          Math.round(sums[c][0] / count),
          Math.round(sums[c][1] / count),
          Math.round(sums[c][2] / count),
        ];
      }
    }

    if (!changed) break;
  }

  // Final counts per centroid and merge identical hex centroids
  const counts = new Array<number>(actualK).fill(0);
  for (let i = 0; i < samples.length; i++) {
    counts[assignments[i]] += 1;
  }

  const merged = new Map<string, { rgb: [number, number, number]; count: number }>();
  for (let c = 0; c < actualK; c++) {
    if (counts[c] === 0) continue;
    const rgb = centroids[c];
    const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
    const existing = merged.get(hex);
    if (existing) {
      existing.count += counts[c];
    } else {
      merged.set(hex, { rgb, count: counts[c] });
    }
  }

  return Array.from(merged.entries())
    .map(([hex, { rgb, count }]) => ({
      hex,
      rgb,
      ratio: count / samples.length,
    }))
    .sort((a, b) => b.ratio - a.ratio);
}

/**
 * Decode an uploaded image file onto an offscreen canvas and extract top dominant colors.
 */
export async function extractColorsFromImageFile(
  file: File,
  k = 5
): Promise<ExtractedColor[]> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode image file'));
      el.src = objectUrl;
    });

    const maxDim = 96;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height, 1));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');

    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    return quantizeRgbSamples(data, k);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
