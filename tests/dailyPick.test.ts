import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { dayKey, pickOfTheDay } from '../src/utils/dailyPick';

describe('dailyPick', () => {
  const pool = Array.from({ length: 420 }, (_, i) => i + 1);

  it('formats the local day key', () => {
    assert.equal(dayKey(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
  });

  it('returns the same item all day and handles empty pools', () => {
    const morning = pickOfTheDay(pool, new Date(2026, 10, 27, 6, 0));
    const night = pickOfTheDay(pool, new Date(2026, 10, 27, 23, 30));
    assert.equal(morning, night);
    assert.equal(pickOfTheDay([], new Date()), undefined);
  });

  it('changes across days and stays inside the pool', () => {
    const seen = new Set<number>();
    for (let d = 1; d <= 28; d++) {
      const v = pickOfTheDay(pool, new Date(2026, 1, d))!;
      assert.ok(v >= 1 && v <= 420);
      seen.add(v);
    }
    assert.ok(seen.size > 20);
  });
});
