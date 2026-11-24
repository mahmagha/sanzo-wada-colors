import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = 'https://raw.githubusercontent.com/mattdesl/dictionary-of-colour-combinations/master/colors.json';

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const rawColors = JSON.parse(data);
      
      const colors = rawColors.map((c, idx) => ({
        id: idx + 1,
        name: c.name,
        hex: c.hex.toLowerCase(),
        rgb: c.rgb,
        cmyk: c.cmyk,
        lab: c.lab,
        swatch: c.swatch,
        combinations: c.combinations
      }));

      const comboMap = new Map();
      for (let i = 1; i <= 348; i++) {
        comboMap.set(i, []);
      }

      colors.forEach(color => {
        color.combinations.forEach(comboId => {
          if (comboMap.has(comboId)) {
            comboMap.get(comboId).push(color);
          }
        });
      });

      const combinations = [];
      for (let [id, comboColors] of comboMap.entries()) {
        combinations.push({
          id,
          size: comboColors.length,
          colors: comboColors
        });
      }

      const outDir = path.join(__dirname, '..', 'src', 'data');
      fs.mkdirSync(outDir, { recursive: true });
      
      fs.writeFileSync(path.join(outDir, 'wadaColors.json'), JSON.stringify(colors, null, 2));
      fs.writeFileSync(path.join(outDir, 'wadaCombinations.json'), JSON.stringify(combinations, null, 2));
      
      console.log(`Saved ${colors.length} colors and ${combinations.length} combinations successfully!`);
    } catch (err) {
      console.error('Error parsing data:', err);
      process.exit(1);
    }
  });
}).on('error', err => {
  console.error('Network error:', err);
  process.exit(1);
});
