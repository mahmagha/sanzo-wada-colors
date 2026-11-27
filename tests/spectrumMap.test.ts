import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import { ColorItem } from '../src/types/color';
import {
  findNearestWheelNode,
  layoutColorWheelPoints,
  layoutSpectrumPoints,
} from '../src/utils/spectrumLayout';

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

  it('places all 171 pigments cleanly on the 360-degree Color Wheel with separated chromatic and neutral rings', () => {
    const wheelNodes = layoutColorWheelPoints(masterColors);
    assert.equal(wheelNodes.length, masterColors.length);

    const chromatic = wheelNodes.filter((n) => !n.isNeutral);
    const neutral = wheelNodes.filter((n) => n.isNeutral);
    assert.equal(neutral.length, 8);
    assert.equal(chromatic.length + neutral.length, masterColors.length);

    for (const node of wheelNodes) {
      const r = Math.hypot(node.xPct - 50, node.yPct - 50);
      if (node.isNeutral) {
        assert.ok(r <= 13.5, `neutral node #${node.color.id} escaped center core: r=${r}`);
      } else {
        assert.ok(r >= 17.0 && r <= 46.5, `chromatic node #${node.color.id} out of ring: r=${r}`);
      }
    }

    const first = wheelNodes[0];
    const nearest = findNearestWheelNode(wheelNodes, first.xPct + 0.1, first.yPct - 0.1);
    assert.ok(nearest);
    assert.equal(nearest.color.id, first.color.id);
  });
});
