import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { quantizeRgbSamples } from '../src/utils/imageQuantize';

describe('image quantization (Image-to-Sanzo-Wada extractor)', () => {
  it('extracts dominant clusters sorted by pixel ratio and skips transparent pixels', () => {
    const pixels: number[] = [];
    // 60 opaque red pixels
    for (let i = 0; i < 60; i++) pixels.push(200, 40, 40, 255);
    // 30 opaque blue pixels
    for (let i = 0; i < 30; i++) pixels.push(30, 70, 180, 255);
    // 100 transparent green pixels (must be ignored)
    for (let i = 0; i < 100; i++) pixels.push(0, 255, 0, 0);

    const extracted = quantizeRgbSamples(pixels, 3);
    assert.equal(extracted.length, 2);
    assert.equal(extracted[0].hex, '#c82828');
    assert.equal(extracted[1].hex, '#1e46b4');
    assert.ok(Math.abs(extracted[0].ratio - 60 / 90) < 0.02);
    assert.ok(Math.abs(extracted[1].ratio - 30 / 90) < 0.02);
  });

  it('returns empty array when all pixels are transparent or input is empty', () => {
    assert.deepEqual(quantizeRgbSamples([], 5), []);
    assert.deepEqual(quantizeRgbSamples([255, 0, 0, 10, 0, 255, 0, 0], 5), []);
  });
});
