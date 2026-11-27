import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function oklchToRgb(L, C, h) {
  const rad = (h * Math.PI) / 180;
  const a = C * Math.cos(rad);
  const b = C * Math.sin(rad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const r_lin = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_lin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_lin = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const transfer = (c) =>
    c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;

  const red = Math.min(255, Math.max(0, Math.round(transfer(r_lin) * 255)));
  const green = Math.min(255, Math.max(0, Math.round(transfer(g_lin) * 255)));
  const blue = Math.min(255, Math.max(0, Math.round(transfer(b_lin) * 255)));

  const hex = '#' + [red, green, blue].map((x) => x.toString(16).padStart(2, '0')).join('');
  return { rgb: [red, green, blue], hex };
}

// Convert sRGB to CIE LAB
function rgbToLab(r, g, b) {
  let [rL, gL, bL] = [r / 255, g / 255, b / 255].map(v =>
    v > 0.04045 ? Math.pow((v + 0.055) / 1.055, 2.4) : v / 12.92
  );
  // D65 reference white
  let X = rL * 0.4124564 + gL * 0.3575761 + bL * 0.1804375;
  let Y = rL * 0.2126729 + gL * 0.7151522 + bL * 0.0721750;
  let Z = rL * 0.0193339 + gL * 0.1191920 + bL * 0.9503041;

  X = X / 0.95047;
  Y = Y / 1.00000;
  Z = Z / 1.08883;

  const f = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(X), fy = f(Y), fz = f(Z);

  return [
    parseFloat((116 * fy - 16).toFixed(2)),
    parseFloat((500 * (fx - fy)).toFixed(2)),
    parseFloat((200 * (fy - fz)).toFixed(2))
  ];
}

const MONTH_DATA = [
  { month: 1, name: 'January', ja: '睦月', meaning: 'Month of Harmony' },
  { month: 2, name: 'February', ja: '如月', meaning: 'Month of Layering Clothes' },
  { month: 3, name: 'March', ja: '弥生', meaning: 'Month of New Sprouting' },
  { month: 4, name: 'April', ja: '卯月', meaning: 'Month of Deutzia' },
  { month: 5, name: 'May', ja: '皐月', meaning: 'Month of Rice Seedlings' },
  { month: 6, name: 'June', ja: '水無月', meaning: 'Month of Water' },
  { month: 7, name: 'July', ja: '文月', meaning: 'Month of Poetry' },
  { month: 8, name: 'August', ja: '葉月', meaning: 'Month of Leaves' },
  { month: 9, name: 'September', ja: '長月', meaning: 'Month of Long Nights' },
  { month: 10, name: 'October', ja: '神無月', meaning: 'Month of the Gods' },
  { month: 11, name: 'November', ja: '霜月', meaning: 'Month of Frost' },
  { month: 12, name: 'December', ja: '師走', meaning: 'Month of Year End' },
];

async function main() {
  console.log('Fetching raw datasets...');
  const mattColors = await fetchJson('https://raw.githubusercontent.com/mattdesl/dictionary-of-colour-combinations/master/colors.json');
  const adrianColors = await fetchJson('https://raw.githubusercontent.com/adrian729/wada-sanzo-colors/main/colors.json');
  const seasons = await fetchJson('https://raw.githubusercontent.com/adrian729/wada-sanzo-colors/main/seasons.json');

  console.log(`Loaded ${mattColors.length} Vol 1 colors, ${adrianColors.length} full colors, and ${seasons.length} seasonal cards.`);

  // 1. Build master list of 171 colors
  const masterColors = [];

  for (let i = 0; i < adrianColors.length; i++) {
    const rem = adrianColors[i];
    const isVol2 = i >= 159;

    let hex, rgb, cmyk, lab, swatch, combinationsVol1;

    if (!isVol2 && mattColors[i]) {
      const loc = mattColors[i];
      hex = loc.hex.toLowerCase();
      rgb = loc.rgb;
      cmyk = loc.cmyk;
      lab = loc.lab;
      swatch = loc.swatch;
      combinationsVol1 = loc.combinations;
    } else {
      // 12 new colors in Vol 2
      const converted = oklchToRgb(rem.oklch[0], rem.oklch[1], rem.oklch[2]);
      hex = converted.hex;
      rgb = converted.rgb;
      cmyk = rem.cmyk;
      lab = rgbToLab(rgb[0], rgb[1], rgb[2]);
      swatch = 'Vol. 2';
      combinationsVol1 = [];
    }

    const jaName = rem.atlas?.ja || null;
    const jaReading = rem.atlas?.reading || null;

    masterColors.push({
      id: i + 1,
      name: rem.name,
      ja: jaName,
      reading: jaReading,
      hex,
      rgb,
      cmyk,
      lab,
      swatch,
      volume: isVol2 ? 2 : 1,
      combinations: combinationsVol1,
      vol2Cards: [] // to populate below
    });
  }

  // 2. Build 348 Volume 1 combinations
  const vol1CombosMap = new Map();
  for (let id = 1; id <= 348; id++) {
    vol1CombosMap.set(id, []);
  }

  masterColors.forEach(c => {
    if (c.volume === 1) {
      c.combinations.forEach(comboId => {
        if (vol1CombosMap.has(comboId)) {
          vol1CombosMap.get(comboId).push(c);
        }
      });
    }
  });

  const allCombinations = [];

  // Add Vol 1 combinations (normalized to colorIds; hydrated at runtime from wadaColors.json)
  for (const [id, comboColors] of vol1CombosMap.entries()) {
    allCombinations.push({
      id,
      volume: 1,
      size: comboColors.length,
      colorIds: comboColors.map(c => c.id)
    });
  }

  // 3. Build 72 Volume 2 seasonal combinations
  for (let cardIdx = 0; cardIdx < seasons.length; cardIdx++) {
    const cardNum = cardIdx + 1;
    const monthNum = Math.floor(cardIdx / 6) + 1;
    const monthInfo = MONTH_DATA[monthNum - 1];
    const colorIndices = seasons[cardIdx];

    const comboColorIds = [];
    colorIndices.forEach(idx => {
      const c = masterColors[idx];
      if (c) {
        if (!c.vol2Cards.includes(cardNum)) {
          c.vol2Cards.push(cardNum);
        }
        comboColorIds.push(c.id);
      }
    });

    allCombinations.push({
      id: cardNum,
      volume: 2,
      month: monthNum,
      monthName: monthInfo.name,
      monthJa: monthInfo.ja,
      monthMeaning: monthInfo.meaning,
      cardInMonth: (cardIdx % 6) + 1,
      size: comboColorIds.length,
      colorIds: comboColorIds
    });
  }

  const outDir = path.join(__dirname, '..', 'src', 'data');
  fs.writeFileSync(path.join(outDir, 'wadaColors.json'), JSON.stringify(masterColors, null, 2));
  fs.writeFileSync(path.join(outDir, 'wadaCombinations.json'), JSON.stringify(allCombinations));

  console.log(`Success! Saved ${masterColors.length} colors and ${allCombinations.length} combinations.`);
  console.log(`- Volume 1: 348 combinations (IDs 1-348)`);
  console.log(`- Volume 2: 72 seasonal combinations (IDs 1-72, 12 months)`);
}

main().catch(err => {
  console.error('Error generating data:', err);
  process.exit(1);
});
