import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import { ColorItem } from '../src/types/color';
import {
  findHarmonyMatches,
  findNearestWheelNode,
  layoutColorWheelPoints,
  layoutSpectrumPoints,
  sortNodesByWheelAngle,
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

  it('finds closest archival pigment matches for geometric harmony rules', () => {
    const redAnchor = masterColors.find((c) => c.id === 29)!; // Carmine Red
    assert.deepEqual(findHarmonyMatches(redAnchor, masterColors, 'none'), []);

    const comp = findHarmonyMatches(redAnchor, masterColors, 'complementary', 3);
    assert.equal(comp.length, 1);
    assert.equal(comp[0].angleDeg, 180);
    assert.equal(comp[0].matches.length, 3);
    assert.ok(comp[0].matches.every((m) => m.id !== redAnchor.id));

    const triadic = findHarmonyMatches(redAnchor, masterColors, 'triadic', 2);
    assert.equal(triadic.length, 2);
    assert.equal(triadic[0].angleDeg, 120);
    assert.equal(triadic[1].angleDeg, 240);

    const split = findHarmonyMatches(redAnchor, masterColors, 'split', 2);
    assert.equal(split.length, 2);

    const analogous = findHarmonyMatches(redAnchor, masterColors, 'analogous', 2);
    assert.equal(analogous.length, 2);
  });

  it('orders wheel chord polygon vertices by polar angle so polygon edges never self-intersect', () => {
    const wheelNodes = layoutColorWheelPoints(masterColors);
    const byId = new Map(wheelNodes.map((n) => [n.color.id, n]));
    // Unsorted crossing-prone set (pink, lavender, yellow, neutral slate, indigo)
    const sample = [10, 134, 57, 158, 132, 42].map((id) => byId.get(id)!);
    const ordered = sortNodesByWheelAngle(sample);

    const ccw = (ax: number, ay: number, bx: number, by: number, cx: number, cy: number) =>
      (cy - ay) * (bx - ax) > (by - ay) * (cx - ax);
    const segmentsIntersect = (a: typeof ordered[0], b: typeof ordered[0], c: typeof ordered[0], d: typeof ordered[0]) =>
      ccw(a.xPct, a.yPct, c.xPct, c.yPct, d.xPct, d.yPct) !==
        ccw(b.xPct, b.yPct, c.xPct, c.yPct, d.xPct, d.yPct) &&
      ccw(a.xPct, a.yPct, b.xPct, b.yPct, c.xPct, c.yPct) !==
        ccw(a.xPct, a.yPct, b.xPct, b.yPct, d.xPct, d.yPct);

    for (let i = 0; i < ordered.length; i++) {
      const a = ordered[i];
      const b = ordered[(i + 1) % ordered.length];
      for (let j = i + 2; j < ordered.length; j++) {
        if (i === 0 && j === ordered.length - 1) continue;
        const c = ordered[j];
        const d = ordered[(j + 1) % ordered.length];
        assert.equal(segmentsIntersect(a, b, c, d), false, `Edges ${i} and ${j} intersected`);
      }
    }
  });
});
