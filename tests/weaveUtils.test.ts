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
  it('plain weave alternates on both axes', () => {
    assert.equal(isWarpOnTop('plain', 0, 0), true);
    assert.equal(isWarpOnTop('plain', 1, 0), false);
    assert.equal(isWarpOnTop('plain', 0, 1), false);
    assert.equal(isWarpOnTop('plain', 1, 1), true);
  });

  it('every pattern shows both warp and weft and repeats', () => {
    for (const { key } of WEAVE_PATTERNS) {
      let up = 0;
      for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (isWarpOnTop(key, x, y)) up++;
      assert.ok(up > 0 && up < 1600, `${key} should mix warp and weft`);
      assert.equal(isWarpOnTop(key, 3, 2), isWarpOnTop(key, 3 + 40, 2 + 40), `${key} repeats every 40`);
    }
  });

  it('twill and basket are balanced, satin is warp-faced', () => {
    const share = (p: 'twill' | 'basket' | 'satin') => {
      let up = 0;
      for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) if (isWarpOnTop(p, x, y)) up++;
      return up / 1600;
    };
    assert.equal(share('twill'), 0.5);
    assert.equal(share('basket'), 0.5);
    assert.equal(share('satin'), 0.8);
  });

  it('twill rows shift by one step', () => {
    assert.deepEqual(
      [0, 1, 2, 3].map((x) => isWarpOnTop('twill', x, 0)),
      [true, true, false, false],
    );
    assert.deepEqual(
      [0, 1, 2, 3].map((x) => isWarpOnTop('twill', x, 1)),
      [true, false, false, true],
    );
  });

  it('builds thread colors with stripes and reverse', () => {
    assert.deepEqual(buildThreadColors(['a', 'b'], 5, 2), ['a', 'a', 'b', 'b', 'a']);
    assert.deepEqual(buildThreadColors(['a', 'b'], 3, 1, true), ['b', 'a', 'b']);
    assert.deepEqual(buildThreadColors([], 3, 1), []);
  });

  it('builds a grid, lift plan and svg', () => {
    const grid = buildWeaveGrid({ palette: ['#ff0000', '#0000ff'], pattern: 'plain', colorMode: 'same', size: 4, stripe: 1 });
    assert.equal(grid.cells.length, 4);
    assert.equal(grid.cells[0][0], '#ff0000'); // warp on top at 0,0 -> warp[0]
    assert.equal(grid.cells[0][1], '#ff0000'); // weft on top at row 0 -> weft[0]
    assert.equal(buildLiftPlanText(grid).split('\n').length, 4);
    const svg = buildWeaveSvg(grid, 10, 'T');
    assert.ok(svg.startsWith('<svg') && svg.endsWith('</svg>'));
    assert.equal((svg.match(/<rect /g) ?? []).length, 1 + 4 * 4 * 2);
  });
});

import { WEAVE_REPEAT, buildGarmentWeaveTile, garmentTileCells } from '../src/utils/weaveUtils';

describe('garment weave tile', () => {
  it('builds a tile holding whole pattern repeats with unique gradient ids', () => {
    for (const key of Object.keys(WEAVE_REPEAT) as Array<keyof typeof WEAVE_REPEAT>) {
      const tile = buildGarmentWeaveTile('#12354e', key, 3, 'wg-test');
      const n = garmentTileCells(key);
      assert.equal(n % WEAVE_REPEAT[key], 0, `${key} tile must hold whole repeats`);
      assert.equal(tile.size, n * 3);
      assert.equal((tile.markup.match(/<rect /g) ?? []).length, 1 + n * n * 2);
      assert.ok(tile.markup.includes('id="wg-testV"') && tile.markup.includes('url(#wg-testH)'));
    }
  });
});

describe('garment weave tile variation', () => {
  it('is deterministic and varies thread colors slightly', () => {
    const a = buildGarmentWeaveTile('#12354e', 'twill', 2, 'a').markup;
    const b = buildGarmentWeaveTile('#12354e', 'twill', 2, 'a').markup;
    assert.equal(a, b);
    const fills = new Set(a.match(/fill="#[0-9a-f]{6}"/g));
    assert.ok(fills.size > 8, 'expected several distinct thread shades');
  });
});

import { FABRICS, FABRIC_ORDER } from '../src/utils/weaveUtils';

describe('fabrics', () => {
  it('every fabric with a weave builds a tile, and flat has no effect', () => {
    assert.equal(FABRICS.flat.pattern, null);
    assert.equal(FABRICS.flat.fiberOpacity, 0);
    for (const k of FABRIC_ORDER) {
      const f = FABRICS[k];
      assert.equal(f.key, k);
      if (f.pattern) {
        const tile = buildGarmentWeaveTile('#445566', f.pattern, f.cell, `t-${k}`, f);
        assert.ok(tile.markup.includes('<rect'));
      }
    }
  });

  it('denim has a paler weft than warp and a 3/1 twill', () => {
    assert.equal(FABRICS.denim.pattern, 'twill31');
    assert.ok(FABRICS.denim.weftBleach > 0);
    const share = Array.from({ length: 16 }, (_, i) => isWarpOnTop('twill31', i, 0)).filter(Boolean).length / 16;
    assert.equal(share, 0.75);
  });
});
