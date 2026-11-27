import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUrlState, serializeUrlState } from '../src/utils/urlState';

describe('URL state parsing and serialization', () => {
  it('returns defaults for empty or invalid query params', () => {
    const empty = parseUrlState('');
    assert.equal(empty.viewMode, 'combinations');
    assert.equal(empty.volumeFilter, 'all');
    assert.equal(empty.monthFilter, 'all');
    assert.equal(empty.comboKey, null);
    assert.equal(empty.colorId, null);

    const invalid = parseUrlState('?view=bad&vol=9&season=monsoon&month=13&size=9&tone=neon&sort=foo&combo=bad&color=-3');
    assert.equal(invalid.viewMode, 'combinations');
    assert.equal(invalid.volumeFilter, 'all');
    assert.equal(invalid.seasonFilter, 'all');
    assert.equal(invalid.monthFilter, 'all');
    assert.equal(invalid.sizeFilter, 'all');
    assert.equal(invalid.toneFilter, 'all');
    assert.equal(invalid.sortBy, 'number-asc');
    assert.equal(invalid.comboKey, null);
    assert.equal(invalid.colorId, null);
  });

  it('serializes and round-trips non-default filter and modal state', () => {
    const query = serializeUrlState({
      viewMode: 'colors',
      volumeFilter: 2,
      seasonFilter: 'spring',
      monthFilter: 4,
      sizeFilter: 5,
      toneFilter: 'neutral',
      sortBy: 'popularity',
      searchQuery: 'sakura',
      onlyFavorites: true,
      comboKey: 'v2-14',
      colorId: 42,
    });

    const parsed = parseUrlState(query);
    assert.deepEqual(parsed, {
      viewMode: 'colors',
      volumeFilter: 2,
      seasonFilter: 'spring',
      monthFilter: 4,
      sizeFilter: 5,
      toneFilter: 'neutral',
      sortBy: 'popularity',
      searchQuery: 'sakura',
      onlyFavorites: true,
      comboKey: 'v2-14',
      colorId: 42,
    });

    assert.equal(
      serializeUrlState({
        viewMode: 'combinations',
        volumeFilter: 'all',
        seasonFilter: 'all',
        monthFilter: 'all',
        sizeFilter: 'all',
        toneFilter: 'all',
        sortBy: 'number-asc',
        searchQuery: '',
        onlyFavorites: false,
        comboKey: null,
        colorId: null,
      }),
      ''
    );
  });
});
