import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import { ColorItem, Combination } from '../src/types/color';
import { generateAndroidColorsXml, generateCssGradients, generateSwiftUiColors } from '../src/utils/colorUtils';

const colors = colorsData as unknown as ColorItem[];
const combo: Combination = {
  id: 7,
  volume: 1,
  size: 2,
  colors: [{ ...colors[0], name: 'Red & <Rose>' }, colors[1]],
};

describe('platform exports', () => {
  it('builds smooth and striped CSS gradients with every color', () => {
    const css = generateCssGradients(combo);
    assert.ok(css.includes('.wada-7-smooth'));
    assert.ok(css.includes('.wada-7-stripes'));
    for (const c of combo.colors) assert.ok(css.includes(c.hex));
    assert.ok(css.includes('0.00% 50.00%'));
    assert.ok(css.includes('50.00% 100.00%'));
  });

  it('builds Android XML with ARGB values and escaped names', () => {
    const xml = generateAndroidColorsXml(combo);
    assert.ok(xml.includes(`#FF${colors[0].hex.slice(1).toUpperCase()}`));
    assert.ok(xml.includes('Red &amp; &lt;Rose&gt;'));
    assert.ok(xml.includes('name="wada_7_color_1"'));
  });

  it('builds SwiftUI colors in 0..1 sRGB', () => {
    const swift = generateSwiftUiColors(combo);
    assert.ok(swift.includes('import SwiftUI'));
    assert.ok(swift.includes('static let wada7Color1'));
    assert.ok(/red: [01]\.\d{3}/.test(swift));
  });
});
