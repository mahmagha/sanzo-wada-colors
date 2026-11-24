import https from 'node:https';
import fs from 'node:fs';

const localColors = JSON.parse(fs.readFileSync('src/data/wadaColors.json', 'utf-8'));

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function run() {
  const remoteColors = await fetchJson('https://raw.githubusercontent.com/adrian729/wada-sanzo-colors/main/colors.json');
  const seasons = await fetchJson('https://raw.githubusercontent.com/adrian729/wada-sanzo-colors/main/seasons.json');
  const extracted = await fetchJson('https://raw.githubusercontent.com/adrian729/wada-sanzo-colors/main/vol2/extracted.json');

  console.log(`Local colors: ${localColors.length}, Remote colors: ${remoteColors.length}`);
  console.log(`Seasons cards: ${seasons.length}, Extracted cards: ${extracted.length}`);

  let mismatches = 0;
  for (let i = 0; i < 159; i++) {
    const loc = localColors[i].name.toLowerCase().replace(/['\s-]/g, '');
    const rem = remoteColors[i].name.toLowerCase().replace(/['\s-]/g, '');
    if (loc !== rem) {
      console.log(`Index ${i}: local "${localColors[i].name}" !== remote "${remoteColors[i].name}"`);
      mismatches++;
    }
  }
  console.log(`Comparison done: ${159 - mismatches} / 159 matched directly!`);

  // Inspect the 12 new colors (index 159 to 170)
  console.log('\n--- 12 NEW COLORS IN VOLUME 2 ---');
  for (let i = 159; i < remoteColors.length; i++) {
    const c = remoteColors[i];
    console.log(`Vol2 Color #${i + 1}: ${c.name} | CMYK: [${c.cmyk.join(', ')}] | OKLCH: [${c.oklch.join(', ')}]`);
  }
}

run().catch(console.error);
