import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseUrlState, serializeUrlState } from '../src/utils/urlState';
import {
  DEFAULT_GARMENT_PATTERNS,
  DEFAULT_PATTERN_COLORS,
  getDefaultMaterialsForPieces,
  STYLE_PRESET_PIECES,
} from '../src/utils/menswearUtils';

describe('URL state parsing and serialization', () => {
  it('returns defaults for empty or invalid query params', () => {
    const empty = parseUrlState('');
    assert.equal(empty.viewMode, 'combinations');
    assert.equal(empty.colorsLayout, 'grid');
    assert.equal(empty.hasKanjiOnly, false);
    assert.equal(empty.volumeFilter, 'all');
    assert.equal(empty.monthFilter, 'all');
    assert.equal(empty.colorSort, 'id-asc');
    assert.equal(empty.swatchId, null);
    assert.deepEqual(empty.compareKeys, []);
    assert.equal(empty.comboKey, null);
    assert.deepEqual(empty.mixIds, []);
    assert.equal(empty.colorId, null);
    assert.equal(empty.menswearStyle, 'suit');
    assert.deepEqual(empty.menswearIds, []);
    assert.equal(empty.menswearSkin, 'warm-ivory');
    assert.equal(empty.menswearLighting, 'daylight');
    assert.equal(empty.menswearPieces, null);
    assert.equal(empty.menswearMaterials, null);
    assert.equal(empty.menswearPatterns, null);
    assert.equal(empty.menswearPatternColors, null);

    const invalid = parseUrlState('?view=bad&layout=3d&kanji=0&vol=9&season=monsoon&month=13&size=9&tone=neon&sort=foo&csort=bad&swatch=-1&compare=bad,v1-1,v2-5,v9-1,mix-999-bad,mix-1-74-134,v1-9&combo=bad&mix=999,bad&color=-3&mstyle=tux&outfit=1,2&mskin=alien&mlight=neon&mpieces=bad&mmats=fake&mpats=dots&mpcols=999');
    assert.equal(invalid.viewMode, 'combinations');
    assert.equal(invalid.colorsLayout, 'grid');
    assert.equal(invalid.hasKanjiOnly, false);
    assert.equal(invalid.volumeFilter, 'all');
    assert.equal(invalid.seasonFilter, 'all');
    assert.equal(invalid.monthFilter, 'all');
    assert.equal(invalid.sizeFilter, 'all');
    assert.equal(invalid.toneFilter, 'all');
    assert.equal(invalid.sortBy, 'number-asc');
    assert.equal(invalid.colorSort, 'id-asc');
    assert.equal(invalid.swatchId, null);
    assert.deepEqual(invalid.compareKeys, ['v1-1', 'v2-5', 'mix-1-74-134']);
    assert.equal(invalid.comboKey, null);
    assert.deepEqual(invalid.mixIds, []);
    assert.equal(invalid.colorId, null);
    assert.equal(invalid.menswearStyle, 'suit');
    assert.deepEqual(invalid.menswearIds, []);
    assert.equal(invalid.menswearSkin, 'warm-ivory');
    assert.equal(invalid.menswearLighting, 'daylight');
    assert.equal(invalid.menswearPieces, null);
    assert.equal(invalid.menswearMaterials, null);
    assert.equal(invalid.menswearPatterns, null);
    assert.equal(invalid.menswearPatternColors, null);

    const dedupedMix = parseUrlState('?mix=1,74,1,134,999,bad');
    assert.deepEqual(dedupedMix.mixIds, [1, 74, 134]);

    const menswearWheel = parseUrlState('?view=menswear&layout=wheel&mstyle=streetwear&outfit=158,128,132,8,159');
    assert.equal(menswearWheel.viewMode, 'menswear');
    assert.equal(menswearWheel.colorsLayout, 'grid');
    assert.equal(menswearWheel.menswearStyle, 'streetwear');
    assert.deepEqual(menswearWheel.menswearIds, [158, 128, 132, 8, 159]);

    const wheelPage = parseUrlState('?view=colors&layout=wheel');
    assert.equal(wheelPage.viewMode, 'wheel');
    assert.equal(wheelPage.colorsLayout, 'grid');

    const legacyCasual = parseUrlState('?view=menswear&mstyle=casual');
    assert.equal(legacyCasual.menswearStyle, 'smart-casual');
  });

  it('serializes and round-trips non-default filter and modal state', () => {
    const resortPieces = { ...STYLE_PRESET_PIECES.resort, outerwear: 'blazer' as const };
    const resortMats = { ...getDefaultMaterialsForPieces(resortPieces), outerwear: 'slub-linen' as const };
    const resortPats = { ...DEFAULT_GARMENT_PATTERNS, outerwear: 'pinstripe' as const };
    const resortPatCols = { ...DEFAULT_PATTERN_COLORS, outerwear: 110 };

    const query = serializeUrlState({
      viewMode: 'colors',
      colorsLayout: 'map',
      hasKanjiOnly: true,
      volumeFilter: 2,
      seasonFilter: 'spring',
      monthFilter: 4,
      sizeFilter: 5,
      toneFilter: 'neutral',
      sortBy: 'popularity',
      colorSort: 'hue',
      swatchId: 12,
      searchQuery: 'sakura',
      onlyFavorites: true,
      compareKeys: ['v1-1', 'v2-14'],
      comboKey: 'v2-14',
      mixIds: [1, 74, 134],
      colorId: 42,
      menswearStyle: 'resort',
      menswearIds: [110, 42, 82, 14, 87],
      menswearSkin: 'olive',
      menswearLighting: 'evening-gallery',
      menswearPieces: resortPieces,
      menswearMaterials: resortMats,
      menswearPatterns: resortPats,
      menswearPatternColors: resortPatCols,
    });

    assert.ok(query.includes('layout=map'));
    assert.ok(query.includes('kanji=1'));
    assert.ok(query.includes('mix='));
    assert.ok(query.includes('mstyle=resort'));
    assert.ok(query.includes('outfit='));
    assert.ok(query.includes('mskin=olive'));
    assert.ok(query.includes('mlight=evening-gallery'));
    assert.ok(query.includes('mpieces='));
    assert.ok(query.includes('mmats='));
    assert.ok(query.includes('mpats='));
    assert.ok(query.includes('mpcols='));

    const parsed = parseUrlState(query);
    assert.deepEqual(parsed, {
      viewMode: 'colors',
      colorsLayout: 'map',
      hasKanjiOnly: true,
      volumeFilter: 2,
      seasonFilter: 'spring',
      monthFilter: 4,
      sizeFilter: 5,
      toneFilter: 'neutral',
      sortBy: 'popularity',
      colorSort: 'hue',
      swatchId: 12,
      searchQuery: 'sakura',
      onlyFavorites: true,
      compareKeys: ['v1-1', 'v2-14'],
      comboKey: 'v2-14',
      mixIds: [1, 74, 134],
      colorId: 42,
      menswearStyle: 'resort',
      menswearIds: [110, 42, 82, 14, 87],
      menswearSkin: 'olive',
      menswearLighting: 'evening-gallery',
      menswearPieces: resortPieces,
      menswearMaterials: resortMats,
      menswearPatterns: resortPats,
      menswearPatternColors: resortPatCols,
    });

    assert.equal(
      serializeUrlState({
        viewMode: 'combinations',
        colorsLayout: 'grid',
        hasKanjiOnly: false,
        volumeFilter: 'all',
        seasonFilter: 'all',
        monthFilter: 'all',
        sizeFilter: 'all',
        toneFilter: 'all',
        sortBy: 'number-asc',
        colorSort: 'id-asc',
        swatchId: null,
        searchQuery: '',
        onlyFavorites: false,
        compareKeys: [],
        comboKey: null,
        mixIds: [],
        colorId: null,
        menswearStyle: 'suit',
        menswearIds: [],
        menswearSkin: 'warm-ivory',
        menswearLighting: 'daylight',
        menswearPieces: null,
        menswearMaterials: null,
        menswearPatterns: null,
        menswearPatternColors: null,
      }),
      ''
    );
  });
});
