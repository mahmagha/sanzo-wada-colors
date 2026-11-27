import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import rawColors from '../src/data/wadaColors.json';
import rawCombinations from '../src/data/wadaCombinations.json';
import { ColorItem, RawCombination } from '../src/types/color';
import { hydrateCombinations, MONTH_OPTIONS, SEASON_MONTHS } from '../src/utils/paletteData';

describe('dataset integrity and hydration', () => {
  const colors = rawColors as ColorItem[];
  const combos = rawCombinations as RawCombination[];

  it('contains 171 master colors (159 Vol.1 + 12 Vol.2) and 420 normalized combinations', () => {
    assert.equal(colors.length, 171);
    assert.equal(colors.filter((c) => c.volume === 1).length, 159);
    assert.equal(colors.filter((c) => c.volume === 2).length, 12);

    assert.equal(combos.length, 420);
    assert.equal(combos.filter((c) => c.volume === 1).length, 348);
    assert.equal(combos.filter((c) => c.volume === 2).length, 72);
    assert.ok(combos.every((c) => Array.isArray(c.colorIds) && c.colorIds.length === c.size));
  });

  it('hydrates combinations cleanly and precomputes non-zero contrast and popularity', () => {
    const hydrated = hydrateCombinations(combos, colors);
    assert.equal(hydrated.length, 420);

    for (const combo of hydrated) {
      assert.equal(combo.colors.length, combo.size);
      assert.ok(combo.maxContrast >= 1);
      assert.ok(combo.popularity > 0, `combo v${combo.volume}-${combo.id} had zero popularity`);
    }
  });

  it('covers all 12 calendar months consistently across seasons', () => {
    assert.equal(MONTH_OPTIONS.length, 12);
    const allSeasonMonths = Object.values(SEASON_MONTHS).flat().sort((a, b) => a - b);
    assert.deepEqual(allSeasonMonths, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });
});
