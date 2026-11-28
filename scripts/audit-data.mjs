// Data integrity audit: node scripts/audit-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const colors = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wadaColors.json'), 'utf8'));
const combos = JSON.parse(fs.readFileSync(path.join(root, 'src/data/wadaCombinations.json'), 'utf8'));

const problems = [];
const ids = new Set();
for (const c of colors) {
  if (ids.has(c.id)) problems.push(`duplicate color id ${c.id}`);
  ids.add(c.id);
  if (!/^#[0-9a-f]{6}$/i.test(c.hex)) problems.push(`color ${c.id}: bad hex ${c.hex}`);
  const fromRgb = '#' + c.rgb.map((v) => v.toString(16).padStart(2, '0')).join('');
  if (fromRgb.toLowerCase() !== c.hex.toLowerCase()) {
    problems.push(`color ${c.id}: hex ${c.hex} does not match rgb ${fromRgb}`);
  }
  if (c.ja && !/[\u3040-\u30ff\u3400-\u9fff]/.test(c.ja)) {
    problems.push(`color ${c.id}: ja has no Japanese characters`);
  }
  if (c.ja && !c.reading) problems.push(`color ${c.id}: has ja but no reading`);
}

const list = Array.isArray(combos) ? combos : Object.values(combos);
for (const k of list) {
  for (const id of k.colorIds ?? []) {
    if (!ids.has(id)) problems.push(`combination ${k.id}: unknown color id ${id}`);
  }
}

const withJa = colors.filter((c) => c.ja);
console.log(
  `Colors: ${colors.length}. With Japanese name: ${withJa.length}. Missing: ${colors.length - withJa.length}.`
);
console.log(`Combinations: ${list.length}.`);
if (problems.length > 0) {
  console.error(`Problems (${problems.length}):`);
  for (const p of problems) console.error(' - ' + p);
}
process.exit(problems.length ? 1 : 0);
