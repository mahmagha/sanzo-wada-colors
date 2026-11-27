import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { hexToRgb255, shadeFabricPixels } from '../src/utils/fabricShader';

const base = { sheen: 0, specExp: 10, anisotropic: false, fuzz: 0, tint: 0, ao: 0 };
const flatNormal = [128, 128, 255, 255];
const flatOrm = [255, 128, 128, 255];

describe('fabricShader', () => {
  it('parses hex', () => {
    assert.deepEqual(hexToRgb255('#12354e'), [0x12, 0x35, 0x4e]);
    assert.deepEqual(hexToRgb255('nope'), [128, 128, 128]);
  });

  it('keeps a flat, unoccluded surface close to the base color', () => {
    const out = shadeFabricPixels(flatNormal, flatOrm, 1, { ...base, baseHex: '#808080' });
    assert.ok(Math.abs(out[0] - 128) < 28, `got ${out[0]}`);
    assert.equal(out[3], 255);
  });

  it('is darker facing away from the light than toward it', () => {
    const toward = [128 - 60, 128 - 70, 230, 255]; // leans toward the top-left light
    const away = [128 + 60, 128 + 70, 230, 255];
    const a = shadeFabricPixels(toward, flatOrm, 1, { ...base, baseHex: '#808080' });
    const b = shadeFabricPixels(away, flatOrm, 1, { ...base, baseHex: '#808080' });
    assert.ok(a[0] > b[0]);
  });

  it('occlusion darkens, sheen and fuzz lighten, anisotropic highlight differs', () => {
    const plain = shadeFabricPixels(flatNormal, flatOrm, 1, { ...base, baseHex: '#406080' });
    const occluded = shadeFabricPixels(flatNormal, [60, 128, 128, 255], 1, { ...base, baseHex: '#406080', ao: 1 });
    assert.ok(occluded[2] < plain[2]);
    const glossyOrm = [255, 40, 128, 255];
    const sheen = shadeFabricPixels(flatNormal, glossyOrm, 1, { ...base, baseHex: '#406080', sheen: 0.8, specExp: 12 });
    assert.ok(sheen[2] >= plain[2]);
    const aniso = shadeFabricPixels(flatNormal, glossyOrm, 1, { ...base, baseHex: '#406080', sheen: 0.8, specExp: 12, anisotropic: true });
    assert.ok(aniso[0] !== sheen[0] || aniso[2] !== sheen[2]);
    const slanted = [128, 128 + 90, 170, 255];
    const nofuzz = shadeFabricPixels(slanted, flatOrm, 1, { ...base, baseHex: '#406080' });
    const fuzzy = shadeFabricPixels(slanted, flatOrm, 1, { ...base, baseHex: '#406080', fuzz: 0.8 });
    assert.ok(fuzzy[2] > nofuzz[2]);
  });

  it('shades a full tile without NaN', () => {
    const n = 64 * 64;
    const normal = new Uint8ClampedArray(n * 4).fill(200);
    const orm = new Uint8ClampedArray(n * 4).fill(100);
    const out = shadeFabricPixels(normal, orm, n, { ...base, baseHex: '#ffffff', sheen: 0.5, fuzz: 0.5, tint: 1, ao: 1 });
    assert.equal(out.length, n * 4);
    assert.ok(out.every((v) => Number.isFinite(v)));
  });
});
