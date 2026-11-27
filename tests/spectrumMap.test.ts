import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import { ColorItem } from '../src/types/color';
import { layoutSpectrumPoints } from '../src/utils/spectrumLayout';

const masterColors = colorsData as ColorItem[];

describe('SpectrumMap deterministic layout', () => {
  it('keeps all nodes within chart bounds and repels overlapping identical-color coordinates', () => {
    const identicalA: ColorItem = { ...masterColors[0], id: 901 };
    const identicalB: ColorItem = { ...masterColors[0], id: 902 };
    const identicalC: ColorItem = { ...masterColors[0], id: 903 };

    const laidOut = layoutSpectrumPoints([identicalA, identicalB, identicalC]);
    assert.equal(laidOut.length, 3);

    const dAB = Math.hypot(laidOut[0].xPct - laidOut[1].xPct, laidOut[0].yPct - laidOut[1].yPct);
    const dAC = Math.hypot(laidOut[0].xPct - laidOut[2].xPct, laidOut[0].yPct - laidOut[2].yPct);
    const dBC = Math.hypot(laidOut[1].xPct - laidOut[2].xPct, laidOut[1].yPct - laidOut[2].yPct);
    assert.ok(dAB > 0.5 && dAC > 0.5 && dBC > 0.5);

    const full = layoutSpectrumPoints(masterColors);
    assert.equal(full.length, masterColors.length);
    for (const node of full) {
      assert.ok(node.xPct >= 3 && node.xPct <= 96, `xPct out of bounds: ${node.xPct}`);
      assert.ok(node.yPct >= 6 && node.yPct <= 94, `yPct out of bounds: ${node.yPct}`);
    }
  });
});
