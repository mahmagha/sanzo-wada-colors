import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import { ColorItem, Combination } from '../src/types/color';
import {
  buildAseBytes,
  buildSvgCardMarkup,
  classifyColorTone,
  escapeXml,
  findClosestColors,
  formatOklch,
  generateCssVariables,
  generateDesignTokensJson,
  generateGplPalette,
  generateJsonExport,
  generateRoleCssVariables,
  generateSvgPaletteSnippet,
  generateTailwindConfig,
  generateTailwindV4Theme,
  getAccessibleBadgeColors,
  getContrastRatio,
  getDeltaE2000,
  getIdealTextColor,
  hexToRgb,
  normalizeHex,
  rgbToLab,
  rgbToOklch,
  simulateColorVision,
} from '../src/utils/colorUtils';

const masterColors = colorsData as ColorItem[];

describe('hex & contrast utilities', () => {
  it('normalizes 3-digit and 6-digit hex codes and rejects invalid inputs', () => {
    assert.equal(normalizeHex('#f90'), '#ff9900');
    assert.equal(normalizeHex(' C54432 '), '#c54432');
    assert.equal(normalizeHex('#12345'), null);
    assert.equal(normalizeHex('not-hex'), null);
  });

  it('parses hex to RGB and computes WCAG contrast accurately', () => {
    assert.deepEqual(hexToRgb('#c54432'), [197, 68, 50]);
    assert.deepEqual(hexToRgb('#09f'), [0, 153, 255]);
    assert.equal(Number(getContrastRatio('#000000', '#ffffff').toFixed(2)), 21);
    assert.equal(getContrastRatio('#284b63', '#284b63'), 1);
    assert.equal(getIdealTextColor('#ffffff'), '#111314');
    assert.equal(getIdealTextColor('#111314'), '#ffffff');
  });

  it('switches UI mockup badge to solid high-contrast fill when accent has low contrast on background', () => {
    const lowContrast = getAccessibleBadgeColors('#f5ecc2', '#ffffff');
    assert.equal(lowContrast.backgroundColor, '#f5ecc2');
    assert.equal(lowContrast.color, '#111314');

    const highContrast = getAccessibleBadgeColors('#284b63', '#ffffff');
    assert.equal(highContrast.backgroundColor, '#284b6322');
    assert.equal(highContrast.color, '#284b63');
  });
});

describe('tone classification', () => {
  it('classifies true grays, white, and near-achromatic blacks as neutral', () => {
    assert.equal(classifyColorTone([255, 255, 255]), 'neutral');
    assert.equal(classifyColorTone([17, 19, 20]), 'neutral');
    assert.equal(classifyColorTone([182, 191, 193]), 'neutral');
    assert.equal(classifyColorTone([161, 163, 154]), 'neutral');
  });

  it('preserves chromatic deep, pastel, warm, cool, and earthy tones', () => {
    assert.equal(classifyColorTone([37, 49, 34]), 'deep'); // Deep Slate Olive
    assert.equal(classifyColorTone([249, 193, 206]), 'pastel'); // Hermosa Pink
    assert.equal(classifyColorTone([197, 68, 50]), 'warm');
    assert.equal(classifyColorTone([60, 130, 175]), 'cool');
    assert.equal(classifyColorTone([140, 115, 75]), 'earthy');
  });
});

describe('OKLCH, LAB, and CIEDE2000 perceptual matching', () => {
  it('converts sRGB to OKLCH and CIE-LAB cleanly', () => {
    const [L, C] = rgbToOklch(255, 255, 255);
    assert.ok(Math.abs(L - 1) < 0.001);
    assert.ok(C < 0.001);
    assert.match(formatOklch([0, 0, 0]), /^oklch\(0\.0% 0\.000 /);

    const whiteLab = rgbToLab(255, 255, 255);
    assert.ok(Math.abs(whiteLab[0] - 100) < 0.01);
  });

  it('matches Sharma et al. (2005) CIEDE2000 reference pair', () => {
    const dE = getDeltaE2000([50, 2.6772, -79.7751], [50, 0, -82.7485]);
    assert.ok(Math.abs(dE - 2.0425) < 0.001, `expected ~2.0425, got ${dE}`);
    assert.equal(getDeltaE2000([60, 10, -20], [60, 10, -20]), 0);
  });

  it('finds exact and closest Wada colors for a target hex', () => {
    const first = masterColors[0];
    const matches = findClosestColors(first.hex, masterColors, 5);
    assert.equal(matches.length, 5);
    assert.equal(matches[0].color.id, first.id);
    assert.ok(matches[0].deltaE < 0.5);
    assert.deepEqual(findClosestColors('invalid', masterColors), []);
  });
});

describe('SVG & code exporters', () => {
  const sampleCombo: Combination = {
    id: 1,
    volume: 2,
    size: 2,
    month: 1,
    monthName: 'January & Frost',
    monthJa: '睦月',
    monthMeaning: 'Month <Harmony>',
    colors: [
      {
        ...masterColors[0],
        name: 'Red & <Rose>',
        ja: '紅',
      },
      masterColors[1],
    ],
  };

  it('escapes XML entities in SVG export and includes vertical kanji spine', () => {
    const svg = buildSvgCardMarkup(sampleCombo);
    assert.ok(svg.includes('Red &amp; &lt;Rose&gt;'));
    assert.ok(svg.includes('JANUARY &amp; FROST'));
    assert.ok(svg.includes('MONTH &lt;HARMONY&gt;'));
    assert.ok(!svg.includes('text-transform='));
    assert.ok(svg.includes('配'));
    assert.ok(svg.includes('鑑'));
  });

  it('generates CSS (HEX and OKLCH), Tailwind v4 @theme, Tailwind v3, and JSON exports', () => {
    const cssHex = generateCssVariables(sampleCombo, false);
    assert.ok(cssHex.includes('--wada-v2-1-color-1: #f9c1ce;'));

    const cssOklch = generateCssVariables(sampleCombo, true);
    assert.ok(cssOklch.includes('oklch('));

    const tw4 = generateTailwindV4Theme(sampleCombo);
    assert.ok(tw4.includes('@theme {'));
    assert.ok(tw4.includes('--color-wada-v2-1-1:'));

    const tw3 = generateTailwindConfig(sampleCombo);
    assert.ok(tw3.includes("'wada-v2-1'"));

    const parsedJson = JSON.parse(generateJsonExport(sampleCombo));
    assert.equal(parsedJson.volume, 2);
    assert.equal(parsedJson.colors.length, 2);
    assert.equal(parsedJson.colors[0].oklch.length, 3);

    const roleCss = generateRoleCssVariables(sampleCombo, {
      bg: masterColors[0],
      surface: masterColors[1],
      accent: masterColors[0],
      textHex: '#111314',
    });
    assert.ok(roleCss.includes('--color-bg:'));
    assert.ok(roleCss.includes('--color-text: #111314;'));

    const tokens = JSON.parse(generateDesignTokensJson(sampleCombo));
    assert.equal(tokens['wada-v2-1']['color-1'].$type, 'color');

    const gpl = generateGplPalette(sampleCombo);
    assert.ok(gpl.startsWith('GIMP Palette\nName: Sanzo Wada Vol. 2'));

    const svgSnippet = generateSvgPaletteSnippet(sampleCombo);
    assert.ok(svgSnippet.includes('viewBox="0 0 200 100"'));

    const ase = buildAseBytes(sampleCombo);
    assert.equal(String.fromCharCode(ase[0], ase[1], ase[2], ase[3]), 'ASEF');
    const aseView = new DataView(ase.buffer);
    assert.equal(aseView.getUint16(4, false), 1); // major version 1
    assert.equal(aseView.getUint32(8, false), 4); // group start + 2 colors + group end
  });

  it('simulates color vision deficiency across protanopia, deuteranopia, tritanopia, and achromatopsia', () => {
    assert.equal(simulateColorVision('#C54432', 'normal'), '#c54432');

    const mono = simulateColorVision('#c54432', 'achromatopsia');
    const [mr, mg, mb] = hexToRgb(mono);
    assert.equal(mr, mg);
    assert.equal(mg, mb);

    const protan = simulateColorVision('#ff0000', 'protanopia');
    assert.notEqual(protan, '#ff0000');
    const [pr] = hexToRgb(protan);
    assert.ok(pr < 200); // Pure red loses luminance/chroma under protanopia

    const tritan = simulateColorVision('#0000ff', 'tritanopia');
    assert.notEqual(tritan, '#0000ff');
  });

  it('escapes all five XML special characters', () => {
    assert.equal(escapeXml(`a&b<c>d"e'f`), 'a&amp;b&lt;c&gt;d&quot;e&apos;f');
  });
});
