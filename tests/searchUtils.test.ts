import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import rawColors from '../src/data/wadaColors.json';
import rawCombinations from '../src/data/wadaCombinations.json';
import { ColorItem, RawCombination } from '../src/types/color';
import { hydrateCombinations } from '../src/utils/paletteData';
import {
  matchesColorTokens,
  matchesCombinationTokens,
  sortMasterColors,
} from '../src/utils/searchUtils';
import { classifyColorTone, rgbToHsl } from '../src/utils/colorUtils';

const colors = rawColors as ColorItem[];
const hydratedCombos = hydrateCombinations(rawCombinations as RawCombination[], colors);

describe('multi-term search & master color sorting', () => {
  it('supports multi-token search across color names, romaji, seasons, tones, and plate keys', () => {
    const springCombo = hydratedCombos.find((c) => c.volume === 2 && c.month === 4);
    assert.ok(springCombo);
    assert.equal(matchesCombinationTokens(springCombo, 'spring april'), true);
    assert.equal(matchesCombinationTokens(springCombo, 'winter april'), false);

    const hermosa = colors.find((c) => c.id === 1);
    assert.ok(hermosa);
    assert.equal(matchesColorTokens(hermosa, 'toki-iro pink'), true);
    assert.equal(matchesColorTokens(hermosa, 'toki-iro blue'), false);

    const v2Card14 = hydratedCombos.find((c) => c.volume === 2 && c.id === 14);
    assert.ok(v2Card14);
    assert.equal(matchesCombinationTokens(v2Card14, 'v2-14'), true);
  });

  it('sorts master colors by hue spectrum (neutrals last), lightness, popularity, and name', () => {
    const byHue = sortMasterColors(colors, 'hue');
    assert.equal(byHue.length, colors.length);
    const firstNeutralIdx = byHue.findIndex((c) => classifyColorTone(c.rgb) === 'neutral');
    assert.ok(firstNeutralIdx > 100);
    // All items after firstNeutralIdx have HSL saturation < 0.09
    assert.ok(
      byHue.slice(firstNeutralIdx).every((c) => rgbToHsl(c.rgb)[1] < 0.09)
    );

    const byLight = sortMasterColors(colors, 'lightness');
    assert.equal(byLight[0].hex, '#ffffff');
    assert.equal(byLight[byLight.length - 1].hex, '#111314');

    const byPop = sortMasterColors(colors, 'popularity');
    const popCount = (c: ColorItem) => (c.combinations?.length || 0) + (c.vol2Cards?.length || 0);
    assert.ok(popCount(byPop[0]) >= popCount(byPop[1]));
    assert.ok(popCount(byPop[1]) >= popCount(byPop[byPop.length - 1]));

    const byName = sortMasterColors(colors, 'name');
    assert.ok(byName[0].name.localeCompare(byName[1].name) <= 0);
  });
});
