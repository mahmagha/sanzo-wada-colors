import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colorsPath = path.join(__dirname, '..', 'src', 'data', 'wadaColors.json');
const overridesPath = path.join(__dirname, 'ja-overrides.json');

const colors = JSON.parse(fs.readFileSync(colorsPath, 'utf8'));
const overrides = JSON.parse(fs.readFileSync(overridesPath, 'utf8'));

let updatedCount = 0;
const nextColors = colors.map((color) => {
  const entry = overrides[String(color.id)];
  if (!entry) return color;
  const nextJa = entry.ja ?? color.ja ?? null;
  const nextReading = entry.reading ?? color.reading ?? null;
  if (nextJa !== color.ja || nextReading !== color.reading) {
    updatedCount++;
  }
  return {
    ...color,
    ja: nextJa,
    reading: nextReading,
  };
});

fs.writeFileSync(colorsPath, JSON.stringify(nextColors, null, 2));

const withJa = nextColors.filter((c) => Boolean(c.ja)).length;
console.log(
  `Applied ${Object.keys(overrides).length} overrides (${updatedCount} updated). Total with Japanese kanji: ${withJa}/${nextColors.length}.`
);
