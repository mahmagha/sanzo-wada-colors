import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  WEAVE_PATTERNS,
  buildLiftPlanText,
  buildThreadColors,
  buildWeaveGrid,
  buildWeaveSvg,
  isWarpOnTop,
} from '../src/utils/weaveUtils';

describe('weaveUtils', () => {
  it('alternates plain weave on both axes', () => {
    assert.equal(isWarpOnTop('plain', 0, 0), true);
    assert.equal(isWarpOnTop('plain', 1, 0), false);
    assert.equal(isWarpOnTop('plain', 0, 1), false);
    assert.equal(isWarpOnTop('plain', 1, 1), true);
  });

  it('mixes warp and weft across every weave structure cleanly', () => {
    for (const { key } of WEAVE_PATTERNS) {
      let up = 0;
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (isWarpOnTop(key, x, y)) up++;
        }
      }
      assert.ok(up > 0 && up < 1600, `${key} should mix warp and weft`);
      assert.equal(
        isWarpOnTop(key, 3, 2),
        isWarpOnTop(key, 3 + 40, 2 + 40),
        `${key} repeats cleanly`
      );
    }
  });

  it('enforces balanced twill/basket ratios and warp-faced satin', () => {
    const share = (p: 'twill' | 'basket' | 'satin') => {
      let up = 0;
      for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
          if (isWarpOnTop(p, x, y)) up++;
        }
      }
      return up / 1600;
    };
    assert.equal(share('twill'), 0.5);
    assert.equal(share('basket'), 0.5);
    assert.equal(share('satin'), 0.8);
  });

  it('builds striped and reversed thread sequences', () => {
    assert.deepEqual(buildThreadColors(['a', 'b'], 5, 2), ['a', 'a', 'b', 'b', 'a']);
    assert.deepEqual(buildThreadColors(['a', 'b'], 3, 1, true), ['b', 'a', 'b']);
    assert.deepEqual(buildThreadColors([], 3, 1), []);
  });

  it('builds grid, 1/0 lift plan, and valid SVG output', () => {
    const grid = buildWeaveGrid({
      palette: ['#ff0000', '#0000ff'],
      pattern: 'plain',
      colorMode: 'same',
      size: 4,
      stripe: 1,
    });
    assert.equal(grid.cells.length, 4);
    assert.equal(grid.cells[0][0], '#ff0000');
    assert.equal(grid.cells[0][1], '#ff0000');
    assert.equal(buildLiftPlanText(grid).split('\n').length, 4);
    const svg = buildWeaveSvg(grid, 10, 'T & <S>');
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.ok(svg.includes('T &amp; &lt;S&gt;'));
    assert.equal((svg.match(/<rect /g) ?? []).length, 1 + 4 * 4 * 2);
  });
});
