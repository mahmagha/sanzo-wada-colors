import { ColorItem, Combination, MoodFilter } from '../types/color';
import {
  classifyColorTone,
  getMaxPaletteContrast,
  rgbToHsl,
  rgbToOklch,
} from './colorUtils';

export type PaletteMood = Exclude<MoodFilter, 'all'>;

export interface MoodMeta {
  id: PaletteMood;
  label: string;
  shortLabel: string;
  cue: string;
  psychologySummary: string;
  balancedUsage: string;
  keywords: string[];
  badgeClass: string;
}

export const MOOD_META: Record<PaletteMood, MoodMeta> = {
  serene: {
    id: 'serene',
    label: 'Serene & Restorative',
    shortLabel: 'Serene',
    cue: 'Calm focus, open clarity & cool composure',
    psychologySummary:
      'Cool blues, celadons, and mineral greens lower visual noise and create mental space.',
    balancedUsage:
      'Ideal for reading interfaces, wellness/editorial brands, and crisp summer cotton or poplin wardrobes.',
    keywords: ['serene', 'calm', 'restful', 'tranquil', 'peaceful', 'cool', 'clarity'],
    badgeClass:
      'bg-teal-100 text-teal-900 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-400/40 dark:border-teal-700',
  },
  grounded: {
    id: 'grounded',
    label: 'Earthy & Grounded',
    shortLabel: 'Earthy',
    cue: 'Warm stability, craft & tactile comfort',
    psychologySummary:
      'Ochre, olive, and mineral browns evoke natural paper, timber, and woven heritage textiles.',
    balancedUsage:
      'Strong for heritage identity, long-form publications, tactile packaging, and wool/corduroy suiting.',
    keywords: ['grounded', 'earthy', 'warm', 'organic', 'rustic', 'autumn', 'natural'],
    badgeClass:
      'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-400/50 dark:border-amber-700',
  },
  luminous: {
    id: 'luminous',
    label: 'Soft & Luminous',
    shortLabel: 'Luminous',
    cue: 'Gentle optimism, airiness & delicate grace',
    psychologySummary:
      'High-value pastels and translucent paper tints lift mood softly without straining the eyes.',
    balancedUsage:
      'Works effortlessly as daylight UI surfaces, seasonal stationery, and relaxed ivory/pastel layering.',
    keywords: ['luminous', 'soft', 'pastel', 'airy', 'gentle', 'fresh', 'daylight', 'spring'],
    badgeClass:
      'bg-rose-100/80 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200 border border-rose-300/60 dark:border-rose-700',
  },
  energetic: {
    id: 'energetic',
    label: 'Vibrant & Energetic',
    shortLabel: 'Energetic',
    cue: 'Warm vitality, celebratory focus & momentum',
    psychologySummary:
      'Long-wavelength crimsons, corals, and sunlit yellows capture immediate attention and convey optimism.',
    balancedUsage:
      'Most effective when held at a 10% focal share—CTAs and badges in UI, or ties, pocket squares, and knit accents.',
    keywords: ['energetic', 'vibrant', 'bold', 'warm', 'playful', 'vivid', 'active', 'joyful'],
    badgeClass:
      'bg-orange-100 text-orange-900 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-400/50 dark:border-orange-700',
  },
  contemplative: {
    id: 'contemplative',
    label: 'Quiet & Contemplative',
    shortLabel: 'Contemplative',
    cue: 'Poetic depth, creative restraint & dusk stillness',
    psychologySummary:
      'Muted violets, wistful lavenders, and dusty indigos foster reflective mood and quiet individuality.',
    balancedUsage:
      'Suited for cultural/museum aesthetics, evening gallery UI, and nuanced dusk tailoring or Japanese wa-mono.',
    keywords: ['contemplative', 'quiet', 'poetic', 'violet', 'indigo', 'subtle', 'dusk', 'reflective'],
    badgeClass:
      'bg-indigo-100 text-indigo-900 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-400/40 dark:border-indigo-700',
  },
  dramatic: {
    id: 'dramatic',
    label: 'Bold & Dramatic',
    shortLabel: 'Dramatic',
    cue: 'Commanding structure, clarity & formal poise',
    psychologySummary:
      'Deep ink blacks, dark pigments, and high light–dark contrast establish clear hierarchy and authority.',
    balancedUsage:
      'Delivers crisp typographic legibility in luxury UI and sharp silhouette contrast in evening/formal tailoring.',
    keywords: ['dramatic', 'bold', 'formal', 'high-contrast', 'deep', 'luxury', 'authoritative'],
    badgeClass:
      'bg-stone-900 text-stone-100 dark:bg-stone-100 dark:text-stone-900 border border-stone-700 dark:border-stone-300',
  },
};

export const MOOD_LIST: MoodMeta[] = [
  MOOD_META.serene,
  MOOD_META.grounded,
  MOOD_META.luminous,
  MOOD_META.energetic,
  MOOD_META.contemplative,
  MOOD_META.dramatic,
];

export interface SwatchPsychology {
  primaryMood: PaletteMood;
  temperature: 'Warm' | 'Cool' | 'Neutral';
  arousal: 'Soothing' | 'Balanced' | 'Stimulating';
  headline: string;
  effectNote: string;
  culturalNuance: string;
  pairingGuidance: string;
}

export interface PalettePsychology {
  primaryMood: PaletteMood;
  secondaryMood: PaletteMood | null;
  temperatureBalance: string;
  contrastFeel: string;
  headline: string;
  whyItWorks: string;
  uiGuidance: string;
  menswearGuidance: string;
}

function getHueFamily(hue: number, saturation: number, lightness: number) {
  if (saturation < 0.09) {
    if (lightness > 0.85) return 'light-neutral' as const;
    if (lightness < 0.28) return 'dark-neutral' as const;
    return 'mid-neutral' as const;
  }
  if (hue >= 340 || hue < 22) return 'red-pink' as const;
  if (hue >= 22 && hue < 50) return 'orange-brown' as const;
  if (hue >= 50 && hue < 75) return 'yellow' as const;
  if (hue >= 75 && hue < 165) return 'green' as const;
  if (hue >= 165 && hue < 250) return 'blue-cyan' as const;
  return 'violet' as const;
}

/**
 * Derive a deterministic color psychology profile for an individual Wada pigment
 * using perceptual lightness, OKLCH chroma, hue family, and temperature.
 */
export function analyzeColorPsychology(
  color: Pick<ColorItem, 'id' | 'name' | 'rgb' | 'hex' | 'volume'>
): SwatchPsychology {
  const [h, s, l] = rgbToHsl(color.rgb);
  const [, c] = rgbToOklch(color.rgb[0], color.rgb[1], color.rgb[2]);
  const tone = classifyColorTone(color.rgb);
  const family = getHueFamily(h, s, l);

  const temperature: SwatchPsychology['temperature'] =
    tone === 'neutral' ? 'Neutral' : h >= 335 || h <= 78 ? 'Warm' : 'Cool';

  let primaryMood: PaletteMood = 'serene';
  let arousal: SwatchPsychology['arousal'] = 'Balanced';
  let headline = 'Composed Clarity';
  let effectNote = '';
  let culturalNuance = '';
  let pairingGuidance = '';

  if (family === 'light-neutral') {
    primaryMood = 'luminous';
    arousal = 'Soothing';
    headline = 'Breathing Space & Daylight';
    effectNote =
      'High-value paper whites deflect visual glare and give surrounding hues room to register purely.';
    culturalNuance =
      'In Japanese aesthetics white signifies ritual stillness and paper purity rather than cold sterility; in Western modernism it signals openness.';
    pairingGuidance =
      'UI: generous canvas background with dark ink copy. Menswear: dress shirt, ecru trouser, or resort base (60%).';
  } else if (family === 'dark-neutral') {
    primaryMood = 'dramatic';
    arousal = 'Balanced';
    headline = 'Structural Anchor & Gravitas';
    effectNote =
      'Low-luminance ink shades establish immediate visual anchors, crisp hierarchy, and timeless restraint.';
    culturalNuance =
      'Evokes sumi ink (墨) calligraphy discipline alongside Western evening formality.';
    pairingGuidance =
      'UI: primary typography & dark mode surface. Menswear: overcoat, footwear, or sharp suiting foundation.';
  } else if (family === 'mid-neutral') {
    primaryMood = 'contemplative';
    arousal = 'Soothing';
    headline = 'Quiet Mediation (Nezumi Balance)';
    effectNote =
      'Muted grays bridge warm and cool pigments without competing for emotional dominance.';
    culturalNuance =
      'Edo–Showa “Shijūhachi-cha / Hyaku-nezumi” tradition celebrated nuanced grays as understated refinement (iki).';
    pairingGuidance =
      'UI: secondary text, dividers, and neutral chrome. Menswear: trousers, flannel suiting, and versatile layers.';
  } else if (tone === 'pastel') {
    primaryMood = 'luminous';
    arousal = 'Soothing';
    headline = 'Soft Sunlight & Gentle Air';
    effectNote =
      'High lightness combined with low chroma softens emotional intensity, inviting calm openness and optimism.';
    culturalNuance =
      'Close to Wada’s sakura, young-leaf, and pale sky washes used in seasonal kimono layering (kasane).';
    pairingGuidance =
      'UI: subtle status cards & editorial surfaces. Menswear: oxford shirting, knit polo, or light silk pocket squares.';
  } else if (tone === 'deep' && family !== 'orange-brown') {
    primaryMood = family === 'violet' || family === 'blue-cyan' ? 'contemplative' : 'dramatic';
    arousal = family === 'red-pink' ? 'Stimulating' : 'Soothing';
    headline =
      family === 'red-pink'
        ? 'Velvet Intensity & Warmth'
        : 'Deep Resonance & Composure';
    effectNote =
      'Dark, full-bodied pigments carry quiet gravity—commanding focus while reducing screen or fabric harshness.';
    culturalNuance =
      'Deep indigo (kachi-iro) and dark plum were prized in craft dyeing for quiet durability and resolve.';
    pairingGuidance =
      'UI: hero cards, headings, and rich buttons paired with pale paper tints. Menswear: blazers, coats, and knitwear.';
  } else if (tone === 'earthy') {
    primaryMood = 'grounded';
    arousal = 'Balanced';
    headline = 'Organic Warmth & Heritage Craft';
    effectNote =
      'Desaturated ochres, drabs, and moss tones feel tactile and trustworthy, anchoring bright highlights.';
    culturalNuance =
      'Reflects mineral earth pigments, tea hues (cha-iro), and architectural cedar in Showa graphic printmaking.';
    pairingGuidance =
      'UI: warm archival badges & craft borders. Menswear: tweed jackets, chinos, suede shoes, and leather belts.';
  } else if (family === 'red-pink' || family === 'orange-brown' || family === 'yellow') {
    primaryMood = tone === 'warm' && c >= 0.08 ? 'energetic' : 'grounded';
    arousal = c >= 0.11 ? 'Stimulating' : 'Balanced';
    headline =
      family === 'yellow'
        ? 'Daylight Clarity & Optimism'
        : family === 'orange-brown'
        ? 'Approachable Warmth & Momentum'
        : 'Vitality & Immediate Focus';
    effectNote =
      'Warm long-wavelength pigments naturally pull gaze first, conveying life, urgency, or welcoming glow depending on chroma.';
    culturalNuance =
      'While modern UI uses red/amber for warnings or CTAs, East Asian traditions equally prize vermilion (shu-iro) for vitality and celebration.';
    pairingGuidance =
      'UI: primary CTAs & notification accents (10%). Menswear: neckties, striped weave threads, or bold knit statements.';
  } else if (family === 'green' || family === 'blue-cyan') {
    primaryMood = 'serene';
    arousal = 'Soothing';
    headline =
      family === 'green' ? 'Botanical Balance & Ease' : 'Clear Focus & Calm Reliability';
    effectNote =
      'Cool greens and blues support sustained attention and visual rest, lowering perceived tension.';
    culturalNuance =
      'Bridges universal sky/foliage restoration with Edo asagi and seiji celadon ceramics.';
    pairingGuidance =
      'UI: navigation states, wellness sections, and data highlights. Menswear: shirting, summer linen, and navy trousers.';
  } else {
    primaryMood = 'contemplative';
    arousal = 'Soothing';
    headline = 'Poetic Nuance & Creative Poise';
    effectNote =
      'Sitting at the red-blue boundary, muted violets feel reflective, distinctive, and slightly enigmatic.';
    culturalNuance =
      'Historically rare purple dyes (murasaki) carried court prestige while Wada’s grayish lavenders feel lyrical and modern.';
    pairingGuidance =
      'UI: creative studio accents paired with stone neutrals. Menswear: statement ties, haori linings, or evening knitwear.';
  }

  return {
    primaryMood,
    temperature,
    arousal,
    headline,
    effectNote,
    culturalNuance,
    pairingGuidance,
  };
}

/**
 * Evaluate the psychological signature of an entire color combination based on
 * swatch mood distribution, value contrast, chroma peaks, and warm/cool interplay.
 */
export function analyzePalettePsychology(
  combo: Pick<Combination, 'colors' | 'maxContrast' | 'volume' | 'month'>
): PalettePsychology {
  const colors = combo.colors;
  const maxContrast = combo.maxContrast ?? getMaxPaletteContrast({ colors });

  if (colors.length === 0) {
    return {
      primaryMood: 'serene',
      secondaryMood: null,
      temperatureBalance: 'Balanced palette',
      contrastFeel: 'Editorial Mid-Contrast',
      headline: MOOD_META.serene.label,
      whyItWorks: MOOD_META.serene.psychologySummary,
      uiGuidance: MOOD_META.serene.balancedUsage,
      menswearGuidance: 'Pair a darker structural base with light shirting.',
    };
  }

  const scores: Record<PaletteMood, number> = {
    serene: 0,
    grounded: 0,
    luminous: 0,
    energetic: 0,
    contemplative: 0,
    dramatic: 0,
  };

  let warmCount = 0;
  let coolCount = 0;
  let neutralCount = 0;
  let deepCount = 0;
  let pastelCount = 0;
  let chromaSum = 0;
  let lightSum = 0;

  for (const color of colors) {
    const sw = analyzeColorPsychology(color);
    const [, s, l] = rgbToHsl(color.rgb);
    const [, c] = rgbToOklch(color.rgb[0], color.rgb[1], color.rgb[2]);
    const tone = classifyColorTone(color.rgb);

    chromaSum += c;
    lightSum += l;
    scores[sw.primaryMood] += 1.4;

    if (sw.temperature === 'Warm') warmCount++;
    else if (sw.temperature === 'Cool') coolCount++;
    else neutralCount++;

    if (tone === 'deep' || l < 0.28) deepCount++;
    if (tone === 'pastel' || l > 0.78) pastelCount++;

    // Multi-dimensional nuanced weight boosts
    if (c >= 0.14 && (tone === 'warm' || s > 0.55)) scores.energetic += 0.9;
    if (tone === 'earthy') scores.grounded += 0.9;
    if (sw.primaryMood === 'contemplative' && s > 0.08) scores.contemplative += 0.6;
  }

  const n = colors.length;
  const avgChroma = chromaSum / n;
  const avgLight = lightSum / n;

  // Holistic combination-level Gestalt modifiers (Gestalt > sum of individual swatches)
  if (maxContrast >= 9.0 && deepCount >= 1) scores.dramatic += 2.35;
  else if (maxContrast >= 7.8 && deepCount > 0) scores.dramatic += 1.65;
  else if (maxContrast >= 6.0 && deepCount > 0) scores.dramatic += 0.85;

  if (avgLight >= 0.72 && avgChroma < 0.09) scores.luminous += 1.65;
  else if (pastelCount >= Math.ceil(n / 2)) scores.luminous += 0.85;

  if (avgChroma < 0.07 && deepCount === 0 && avgLight < 0.72 && neutralCount + coolCount > 0) {
    scores.contemplative += 0.75;
  }
  if (coolCount > warmCount && avgChroma <= 0.11 && maxContrast < 9.5) {
    scores.serene += 0.9;
  }
  if (warmCount >= coolCount && maxContrast >= 5.0 && avgChroma >= 0.105) {
    scores.energetic += 0.8;
  }

  const ranked = (Object.entries(scores) as [PaletteMood, number][]).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  );

  const primaryMood = ranked[0][0];
  const secondaryMood =
    ranked[1] && ranked[1][1] >= ranked[0][1] * 0.62 && ranked[1][0] !== primaryMood
      ? ranked[1][0]
      : null;

  const temperatureBalance =
    warmCount > 0 && coolCount > 0
      ? neutralCount > 0
        ? 'Balanced warm–cool dialogue anchored by neutral rest'
        : 'Dynamic warm–cool temperature contrast'
      : warmCount > 0
      ? neutralCount > 0
        ? 'Warm-leaning harmony tempered with neutral breathing room'
        : 'Focused warm temperature unity'
      : coolCount > 0
      ? neutralCount > 0
        ? 'Cool composure stabilized by neutral structure'
        : 'Monochrome-temperature cool harmony'
      : 'Pure achromatic value architecture';

  const contrastFeel =
    maxContrast >= 7.0
      ? `Crisp High-Contrast (${maxContrast.toFixed(1)}:1 peak)`
      : maxContrast >= 3.5
      ? `Balanced Editorial Contrast (${maxContrast.toFixed(1)}:1 peak)`
      : `Soft Tonal Whisper (${maxContrast.toFixed(1)}:1 peak)`;

  const meta = MOOD_META[primaryMood];
  const headline = secondaryMood
    ? `${meta.shortLabel} with ${MOOD_META[secondaryMood].shortLabel} Undertones`
    : meta.label;

  const whyItWorks =
    `${temperatureBalance} across ${n} swatches with ${contrastFeel.toLowerCase()}. ` +
    meta.psychologySummary;

  const uiGuidance =
    maxContrast >= 4.5
      ? `Apply the dominant surface (60%) cleanly behind legible high-contrast copy; reserve the highest-chroma swatch (10%) for calls to action. ${meta.balancedUsage}`
      : `Best used as subtle cards, tags, and editorial gradients paired with a deeper ink neutral for body copy legibility. ${meta.balancedUsage}`;

  const menswearGuidance =
    primaryMood === 'dramatic'
      ? 'Anchor blazer or overcoat with the darkest shade and let the lightest swatch brighten collar and cuffs.'
      : primaryMood === 'energetic'
      ? 'Keep tailoring neutral/deep at 60% and concentrate the high-energy hue in tie, pocket square, or striped weave threads.'
      : primaryMood === 'grounded'
      ? 'Lean into matte tweed, brushed flannel, or corduroy so organic earth warmth reads rich rather than flat.'
      : primaryMood === 'luminous'
      ? 'Works best in crisp oxford cotton, ivory chinos, or linen for breathable daylight refinement.'
      : 'Balance matte worsted suiting against softer muted shirting for understated confidence.';

  return {
    primaryMood,
    secondaryMood,
    temperatureBalance,
    contrastFeel,
    headline,
    whyItWorks,
    uiGuidance,
    menswearGuidance,
  };
}
