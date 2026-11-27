import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import rawColors from '../src/data/wadaColors.json';
import rawCombinations from '../src/data/wadaCombinations.json';
import { ColorItem, RawCombination } from '../src/types/color';
import { hydrateCombinations } from '../src/utils/paletteData';
import {
  analyzeOutfitHarmony,
  GARMENT_SLOT_ORDER,
  generateMenswearCss,
  mapComboToGarmentOutfit,
  MENSWEAR_PRESETS,
  serializeOutfitIds,
  STYLE_PRESET_PIECES,
} from '../src/utils/menswearUtils';

const colors = rawColors as ColorItem[];
const colorById = new Map<number, ColorItem>(colors.map((c) => [c.id, c]));
const combos = hydrateCombinations(rawCombinations as RawCombination[], colors);

describe('Menswear garment mapping & harmony analysis', () => {
  it('validates all curated Menswear presets reference real 1..171 pigment IDs', () => {
    for (const preset of MENSWEAR_PRESETS) {
      for (const slot of GARMENT_SLOT_ORDER) {
        const id = preset.outfit[slot];
        assert.ok(colorById.has(id), `Preset ${preset.id} slot ${slot} invalid ID ${id}`);
      }
      assert.equal(serializeOutfitIds(preset.outfit).length, 5);
    }
  });

  it('maps 2-color and multi-color Sanzo Wada combinations cleanly onto all 5 garment slots', () => {
    const twoColor = combos.find((c) => c.size === 2);
    const fourColor = combos.find((c) => c.size === 4);
    assert.ok(twoColor && fourColor);

    const mappedTwo = mapComboToGarmentOutfit(twoColor);
    const mappedFour = mapComboToGarmentOutfit(fourColor);
    for (const slot of GARMENT_SLOT_ORDER) {
      assert.ok(colorById.has(mappedTwo[slot]));
      assert.ok(colorById.has(mappedFour[slot]));
    }
    // Shirt/Top and Bottom shouldn't collapse to same swatch on multi-color plates
    assert.notEqual(mappedTwo.top, mappedTwo.bottom);
    assert.notEqual(mappedFour.top, mappedFour.bottom);
  });

  it('computes sartorial contrast, ΔE separation, top matching Wada plates, and CSS tokens', () => {
    const preset = MENSWEAR_PRESETS[0].outfit;
    const outfitColors = {
      outerwear: colorById.get(preset.outerwear)!,
      top: colorById.get(preset.top)!,
      bottom: colorById.get(preset.bottom)!,
      accent: colorById.get(preset.accent)!,
      footwear: colorById.get(preset.footwear)!,
    };

    const report = analyzeOutfitHarmony(outfitColors, combos, STYLE_PRESET_PIECES.suit);
    assert.ok(report.primaryContrast > 8);
    assert.ok(report.separationDeltaE >= 0);
    assert.equal(report.matchedCombos.length, 3);
    assert.ok(report.separationNote.length > 0);

    const noCoatReport = analyzeOutfitHarmony(outfitColors, combos, STYLE_PRESET_PIECES['smart-casual']);
    assert.equal(noCoatReport.primaryLabel, 'Shirt / Bottom Contrast');

    const css = generateMenswearCss('suit', outfitColors, STYLE_PRESET_PIECES.suit);
    assert.ok(css.includes('--garment-outerwear:'));
    assert.ok(css.includes('--garment-footwear:'));

    const noCoatCss = generateMenswearCss('resort', outfitColors, STYLE_PRESET_PIECES.resort);
    assert.ok(!noCoatCss.includes('--garment-outerwear:'));
    assert.ok(noCoatCss.includes('--garment-top:'));
  });
});
