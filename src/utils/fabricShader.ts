/**
 * CPU "shader" for baked fabric maps. Pure functions on pixel arrays, so it runs in the browser
 * canvas and in unit tests.
 *
 * Inputs are tangent-space normal map pixels (RGBA, 0..255) and a packed map where
 * R = ambient occlusion, G = roughness, B = per-thread tint (see scripts/bake-fabric-maps.py).
 * Lighting is Lambert diffuse + Blinn-Phong highlight, or Kajiya-Kay anisotropic sheen for
 * silk, plus a rim term for fuzzy fibres (wool). It is done in linear light.
 */

export interface FabricShadeParams {
  /** base garment color as #rrggbb */
  baseHex: string;
  /** direction towards the light in tangent space (x right, y down, z toward the viewer) */
  light?: [number, number, number];
  /** highlight strength, 0 = matte */
  sheen: number;
  specExp: number;
  /** stretched highlight along the yarn (silk) */
  anisotropic: boolean;
  /** soft rim light from fuzzy fibres, 0..1 */
  fuzz: number;
  /** how much per-thread tint varies the color, 0..1 */
  tint: number;
  /** how much occlusion darkens the crevices, 0..1 */
  ao: number;
}

const toLinear = (v: number) => Math.pow(v / 255, 2.2);
const toSrgb = (v: number) => Math.round(255 * Math.pow(Math.min(1, Math.max(0, v)), 1 / 2.2));

export function hexToRgb255(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function shadeFabricPixels(
  normalRgba: ArrayLike<number>,
  ormRgba: ArrayLike<number>,
  pixelCount: number,
  p: FabricShadeParams,
): Uint8ClampedArray<ArrayBuffer> {
  const out = new Uint8ClampedArray(new ArrayBuffer(pixelCount * 4));
  const [r0, g0, b0] = hexToRgb255(p.baseHex).map(toLinear);
  let [lx, ly, lz] = p.light ?? [-0.5, -0.62, 0.6];
  const ll = Math.hypot(lx, ly, lz);
  lx /= ll;
  ly /= ll;
  lz /= ll;
  // half vector for a viewer straight on (0, 0, 1)
  let hx = lx;
  let hy = ly;
  let hz = lz + 1;
  const hl = Math.hypot(hx, hy, hz);
  hx /= hl;
  hy /= hl;
  hz /= hl;

  for (let i = 0; i < pixelCount; i++) {
    const o = i * 4;
    let nx = (normalRgba[o] / 255) * 2 - 1;
    let ny = (normalRgba[o + 1] / 255) * 2 - 1;
    let nz = (normalRgba[o + 2] / 255) * 2 - 1;
    const nl = Math.hypot(nx, ny, nz) || 1;
    nx /= nl;
    ny /= nl;
    nz /= nl;

    const ao = 1 - p.ao * (1 - ormRgba[o] / 255);
    const rough = ormRgba[o + 1] / 255;
    const tint = ormRgba[o + 2] / 255;
    const tintMul = 1 + (tint - 0.5) * p.tint * 1.4;

    const ndl = Math.max(0, nx * lx + ny * ly + nz * lz);
    const diffuse = 0.28 + 0.72 * (ndl / lz > 1.6 ? 1.6 : ndl / lz);

    let r = r0 * tintMul * diffuse * ao;
    let g = g0 * tintMul * diffuse * ao;
    let b = b0 * tintMul * diffuse * ao;

    if (p.sheen > 0) {
      let spec: number;
      if (p.anisotropic) {
        // yarn runs along y. Tangent made perpendicular to the normal.
        const tn = ny;
        let tx = -nx * tn;
        let ty = 1 - ny * tn;
        let tz = -nz * tn;
        const tl = Math.hypot(tx, ty, tz) || 1;
        tx /= tl;
        ty /= tl;
        tz /= tl;
        const th = tx * hx + ty * hy + tz * hz;
        spec = Math.pow(Math.sqrt(Math.max(0, 1 - th * th)), p.specExp) * Math.min(1, ndl * 2.2);
      } else {
        const nh = Math.max(0, nx * hx + ny * hy + nz * hz);
        spec = Math.pow(nh, p.specExp) * (ndl > 0 ? 1 : 0);
      }
      const amount = spec * p.sheen * (1 - rough * 0.85) * ao;
      r += amount;
      g += amount;
      b += amount;
    }

    if (p.fuzz > 0) {
      const rim = Math.pow(1 - Math.max(0, nz), 2.2) * p.fuzz * (0.35 + 0.65 * ndl);
      r += (r0 * 0.6 + 0.12) * rim;
      g += (g0 * 0.6 + 0.12) * rim;
      b += (b0 * 0.6 + 0.12) * rim;
    }

    out[o] = toSrgb(r);
    out[o + 1] = toSrgb(g);
    out[o + 2] = toSrgb(b);
    out[o + 3] = 255;
  }
  return out;
}
