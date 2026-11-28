import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import rawColors from '../src/data/wadaColors.json';
import rawCombinations from '../src/data/wadaCombinations.json';
import { ColorItem, RawCombination } from '../src/types/color';
import { hydrateCombinations } from '../src/utils/paletteData';
import {
  analyzeOutfitHarmony,
  buildMenswearLookbookSvg,
  DEFAULT_GARMENT_PATTERNS,
  FABRIC_MATERIAL_META,
  FABRIC_PATTERN_META,
  GARMENT_SLOT_ORDER,
  generateMenswearCss,
  generateStrategyOutfit,
  getDefaultMaterialsForPieces,
  LIGHTING_PRESET_META,
  mapComboToGarmentOutfit,
  MENSWEAR_PRESETS,
  menswearOutfitToCombination,
  OUTFIT_STRATEGY_LIST,
  PATTERNS_BY_SLOT,
  serializeOutfitIds,
  SKIN_TONE_PRESETS,
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
    assert.ok(css.includes('Worsted Wool'));
    assert.ok(css.includes('Full-Grain Leather'));

    const streetMats = getDefaultMaterialsForPieces(STYLE_PRESET_PIECES.streetwear);
    assert.equal(streetMats.outerwear, 'nylon-satin');
    assert.equal(streetMats.top, 'fleece-jersey');
    assert.equal(streetMats.bottom, 'selvedge-denim');
    assert.equal(streetMats.footwear, 'canvas-rubber');

    const noCoatCss = generateMenswearCss('resort', outfitColors, STYLE_PRESET_PIECES.resort);
    assert.ok(!noCoatCss.includes('--garment-outerwear:'));
    assert.ok(noCoatCss.includes('--garment-top:'));
    assert.ok(noCoatCss.includes('Textured Slub Linen'));

    const patCss = generateMenswearCss(
      'suit',
      outfitColors,
      STYLE_PRESET_PIECES.suit,
      getDefaultMaterialsForPieces(STYLE_PRESET_PIECES.suit),
      { ...DEFAULT_GARMENT_PATTERNS, outerwear: 'pinstripe' }
    );
    assert.ok(patCss.includes(FABRIC_PATTERN_META.pinstripe.label));
    assert.ok(PATTERNS_BY_SLOT.outerwear.includes('pinstripe'));
    assert.ok(Object.keys(SKIN_TONE_PRESETS).length === 5);
    assert.ok(Object.keys(LIGHTING_PRESET_META).length === 3);

    const lookbookSvg = buildMenswearLookbookSvg({
      croquisSvgMarkup: '<svg viewBox="0 0 360 490"><rect width="10" height="10"/></svg>',
      style: 'suit',
      pieces: STYLE_PRESET_PIECES.suit,
      materials: getDefaultMaterialsForPieces(STYLE_PRESET_PIECES.suit),
      patterns: { ...DEFAULT_GARMENT_PATTERNS, outerwear: 'windowpane' },
      outfit: outfitColors,
      skinTone: 'olive',
      lighting: 'evening-gallery',
    });
    assert.ok(lookbookSvg.includes('SANZO WADA — MENSWEAR LOOKBOOK'));
    assert.ok(lookbookSvg.includes('Olive Complexion'));
    assert.ok(lookbookSvg.includes(FABRIC_PATTERN_META.windowpane.label));

    const synthCombo = menswearOutfitToCombination(outfitColors, STYLE_PRESET_PIECES.resort);
    assert.equal(synthCombo.id, 0);
    assert.equal(synthCombo.colors.length, 4);
  });

  it('preserves locked slots across mapComboToGarmentOutfit and all styling strategies', () => {
    const baseOutfit = { ...MENSWEAR_PRESETS[0].outfit };
    const locked = { bottom: 82, footwear: 87 };
    const plate = combos.find((c) => c.size >= 3)!;
    const mappedLocked = mapComboToGarmentOutfit(plate, locked);
    assert.equal(mappedLocked.bottom, 82);
    assert.equal(mappedLocked.footwear, 87);

    assert.ok(FABRIC_MATERIAL_META['tweed-herringbone'].drapeNote.length > 10);
    assert.ok(MENSWEAR_PRESETS.every((p) => p.occasion.length > 0));

    for (const strat of OUTFIT_STRATEGY_LIST) {
      const result = generateStrategyOutfit({
        strategy: strat.id,
        anchorSlot: 'bottom',
        currentOutfit: { ...baseOutfit, bottom: 82, footwear: 87 },
        lockedSlots: { bottom: true, footwear: true },
        allColors: colors,
        allCombinations: combos,
        variantSeed: 1,
      });
      assert.equal(result.outfit.bottom, 82, `Strategy ${strat.id} broke bottom lock`);
      assert.equal(result.outfit.footwear, 87, `Strategy ${strat.id} broke footwear lock`);
      for (const slot of GARMENT_SLOT_ORDER) {
        assert.ok(colorById.has(result.outfit[slot]));
      }
    }
  });
});
