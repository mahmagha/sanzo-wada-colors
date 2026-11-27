import { FabricKey } from './weaveUtils';
import { FabricShadeParams, hexToRgb255, shadeFabricPixels } from './fabricShader';

type Baked = Exclude<FabricKey, 'flat'>;

const mapUrls = import.meta.glob('../assets/fabrics/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const urlOf = (name: string) => mapUrls[`../assets/fabrics/${name}.png`];

/** Threads per baked tile (leather: 0 = a grain tile with no threads). */
const THREADS: Record<Baked, number> = {
  cotton: 8,
  wool: 8,
  linen: 12,
  denim: 8,
  silk: 10,
  leather: 0,
};
/** Size of one thread (or, for leather, of the whole tile) in illustration units at scale 1. */
const UNITS: Record<Baked, number> = {
  cotton: 2.4,
  wool: 3,
  linen: 3.4,
  denim: 2.6,
  silk: 2,
  leather: 30,
};

const SHADE: Record<Baked, Omit<FabricShadeParams, 'baseHex'>> = {
  cotton: {
    sheen: 0.04,
    specExp: 8,
    anisotropic: false,
    fuzz: 0.15,
    tint: 0.18,
    ao: 0.9,
  },
  wool: {
    sheen: 0,
    specExp: 6,
    anisotropic: false,
    fuzz: 0.75,
    tint: 0.18,
    ao: 1,
  },
  linen: {
    sheen: 0.03,
    specExp: 8,
    anisotropic: false,
    fuzz: 0.2,
    tint: 0.18,
    ao: 0.9,
  },
  denim: {
    sheen: 0.03,
    specExp: 8,
    anisotropic: false,
    fuzz: 0.25,
    tint: 0.18,
    ao: 1,
  },
  silk: {
    sheen: 0.7,
    specExp: 18,
    anisotropic: true,
    fuzz: 0,
    tint: 0.18,
    ao: 0.6,
  },
  leather: {
    sheen: 0.28,
    specExp: 28,
    anisotropic: false,
    fuzz: 0,
    tint: 0.18,
    ao: 0.9,
  },
};

export const isBaked = (k: FabricKey): k is Baked => k !== 'flat';
export const bakedTileUnits = (k: Baked, scale: number) => (THREADS[k] || 1) * UNITS[k] * scale;

const imageCache = new Map<string, Promise<ImageData>>();
function loadMap(name: string): Promise<ImageData> {
  let p = imageCache.get(name);
  if (!p) {
    p = new Promise<ImageData>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return reject(new Error('no 2d context'));
        ctx.drawImage(img, 0, 0);
        resolve(ctx.getImageData(0, 0, c.width, c.height));
      };
      img.onerror = () => reject(new Error(`cannot load ${name}`));
      img.src = urlOf(name);
    });
    imageCache.set(name, p);
  }
  return p;
}

const tileCache = new Map<string, Promise<string>>();
/** Shades a fabric tile for a base color and returns a PNG data URL. Cached per fabric and color. */
export function shadedTileUrl(fabric: Baked, hex: string): Promise<string> {
  const key = `${fabric}|${hex}`;
  let p = tileCache.get(key);
  if (!p) {
    p = Promise.all([loadMap(`${fabric}-n`), loadMap(`${fabric}-o`)]).then(([n, o]) => {
      const c = document.createElement('canvas');
      c.width = n.width;
      c.height = n.height;
      const ctx = c.getContext('2d');
      if (!ctx) throw new Error('no 2d context');
      const px = shadeFabricPixels(n.data, o.data, n.width * n.height, {
        ...SHADE[fabric],
        baseHex: hex,
      });
      // Keep the cloth color true to the swatch: rescale so the tile's average equals the base color.
      const base = hexToRgb255(hex);
      const sum = [0, 0, 0];
      for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) sum[c] += px[i + c];
      const count = px.length / 4;
      const gain = sum.map((t, c) => (t > 0 ? base[c] / (t / count) : 1));
      for (let i = 0; i < px.length; i += 4) for (let c = 0; c < 3; c++) px[i + c] = px[i + c] * gain[c];
      ctx.putImageData(new ImageData(px, n.width, n.height), 0, 0);
      return c.toDataURL('image/png');
    });
    tileCache.set(key, p);
  }
  return p;
}
