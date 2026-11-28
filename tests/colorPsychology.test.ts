import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import colorsData from '../src/data/wadaColors.json';
import rawCombos from '../src/data/wadaCombinations.json';
import { ColorItem, RawCombination } from '../src/types/color';
import {
  analyzeColorPsychology,
  analyzePalettePsychology,
  MOOD_LIST,
} from '../src/utils/colorPsychology';
import { hydrateCombinations } from '../src/utils/paletteData';
import { matchesColorTokens, matchesCombinationTokens } from '../src/utils/searchUtils';

const masterColors = colorsData as ColorItem[];
const combos = hydrateCombinations(rawCombos as RawCombination[], masterColors);
const colorById = new Map(masterColors.map((c) => [c.id, c]));

describe('Color psychology & mood analyzer', () => {
  it('assigns complete psychological profiles across all 171 master pigments', () => {
    for (const color of masterColors) {
      const psych = analyzeColorPsychology(color);
      assert.ok(psych.headline.length > 0);
      assert.ok(psych.effectNote.length > 10);
      assert.ok(psych.culturalNuance.length > 10);
      assert.ok(psych.pairingGuidance.length > 10);
      assert.ok(['Warm', 'Cool', 'Neutral'].includes(psych.temperature));
      assert.ok(['Soothing', 'Balanced', 'Stimulating'].includes(psych.arousal));
    }
  });

  it('classifies all 420 combinations across every mood category without empty buckets', () => {
    const counts = new Map<string, number>();
    for (const m of MOOD_LIST) counts.set(m.id, 0);

    for (const combo of combos) {
      assert.ok(combo.mood, `Missing precomputed mood on Vol.${combo.volume} #${combo.id}`);
      counts.set(combo.mood, (counts.get(combo.mood) || 0) + 1);
      const analysis = analyzePalettePsychology(combo);
      assert.equal(analysis.primaryMood, combo.mood);
      assert.ok(analysis.whyItWorks.length > 20);
      assert.ok(analysis.uiGuidance.length > 20);
      assert.ok(analysis.menswearGuidance.length > 20);
    }

    for (const m of MOOD_LIST) {
      const total = counts.get(m.id) || 0;
      assert.ok(total >= 8, `Expected multiple combinations in mood '${m.id}', got ${total}`);
    }
  });

  it('distinguishes intuitive archetypes and supports mood search tokens', () => {
    // Black (#159) + White (#154) high-contrast dramatic architecture
    const dramaticCombo = {
      id: 999,
      volume: 1 as const,
      size: 2,
      colors: [colorById.get(159)!, colorById.get(154)!],
    };
    assert.equal(analyzePalettePsychology(dramaticCombo).primaryMood, 'dramatic');

    // Light luminous pastel pairing (Hermosa Pink #1 + Pale Lemon Yellow #40)
    const pastelCombo = {
      id: 998,
      volume: 1 as const,
      size: 2,
      colors: [colorById.get(1)!, colorById.get(40)!],
    };
    assert.equal(analyzePalettePsychology(pastelCombo).primaryMood, 'luminous');

    // Warm vivid red + yellow-orange energetic pairing (Carmine Red #29 + Yellow Orange #62)
    const vividCombo = {
      id: 997,
      volume: 1 as const,
      size: 2,
      colors: [colorById.get(29)!, colorById.get(62)!],
    };
    assert.equal(analyzePalettePsychology(vividCombo).primaryMood, 'energetic');

    const sereneCombo = combos.find((c) => c.mood === 'serene')!;
    assert.equal(matchesCombinationTokens(sereneCombo, 'serene'), true);
    assert.equal(matchesCombinationTokens(sereneCombo, 'calm'), true);
    assert.equal(matchesColorTokens(colorById.get(159)!, 'dramatic'), true);
  });
});
