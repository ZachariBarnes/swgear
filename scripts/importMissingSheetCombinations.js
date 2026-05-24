import fs from 'fs';

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Zb3kFdBGYVaSSarAWATFmzChffEN0UIR_f6yH-v8Xk4/export?format=csv&gid=0';
const COMBINATIONS_FILE = 'src/data/combinations.json';
const MODIFIERS_FILE = 'src/data/modifiers.json';

const NGE_TO_SWGR_MAPPING = {
  'Precision': 'Ranged General',
  'Agility': 'Defense General',
  'Luck': 'Opportune Chance',
  'Stamina': 'Endurance Boost',
  'Constitution': 'Toughness Boost',
  'Strength': 'Melee General',
  'Strikethrough Chance': 'Medical Combat Speed',
  'Strikethrough Value': 'Force Powers Critical Chance',
  'Combat Medicine Assembly': 'Force Heal Cost Reduction',
  'Combat Medicine Experimentation': 'Force Powers Cost Reduction',
  'Droid Critical Chance': 'One Handed Lightsaber Accuracy',
  'Humanoid Critical Chance': 'Two Handed Lightsaber Accuracy',
  'Creature Critical Chance': 'Double Bladed Lightsaber Accuracy',
  'Devastation': 'One Handed Lightsaber Speed',
  'Parry Reduction': 'Two Handed Lightsaber Speed',
  'Dodge Reduction': 'Double Bladed Lightsaber Speed',
  'Force Power Regeneration': 'Force Power Max',
  'Dance Knowledge': 'Medical Heal Speed'
};

const DEPRECATED_STATS = new Set([
  'Parry Rating',
  'Dodge Chance',
  'Intimidation',
  'Cybernetic Assembly',
  'Cybernetic Experimentation'
]);

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseSheet(csvText) {
  const lines = csvText.replace(/^\uFEFF/, '').split(/\r?\n/);
  const headers = parseCSVLine(lines[0]);
  const combinations = {};
  const statCounts = {};

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseCSVLine(lines[i]);
    const item1 = values[0];
    if (!item1) continue;

    for (let j = 1; j < values.length && j < headers.length; j++) {
      const item2 = headers[j];
      const raw = values[j]?.trim();
      if (!item2 || !raw || raw === 'X') continue;
      const match = raw.match(/^(.+?)\s*\((\d+)\)$/);
      if (!match) continue;
      const sourceName = match[1].trim();
      const name = NGE_TO_SWGR_MAPPING[sourceName] || sourceName;
      const ratio = Number(match[2]);
      combinations[item1] ||= {};
      combinations[item1][item2] = {
        name,
        ratio,
        source: 'google-sheet',
        sourceUrl: 'https://docs.google.com/spreadsheets/d/1Zb3kFdBGYVaSSarAWATFmzChffEN0UIR_f6yH-v8Xk4',
        sourceModifierName: sourceName
      };
      statCounts[name] = (statCounts[name] || 0) + 1;
    }
  }

  return { combinations, statCounts };
}

function countStats(data) {
  const counts = {};
  for (const pairs of Object.values(data)) {
    for (const combo of Object.values(pairs)) {
      counts[combo.name] = (counts[combo.name] || 0) + 1;
    }
  }
  return counts;
}

const modifiers = JSON.parse(fs.readFileSync(MODIFIERS_FILE, 'utf8'));
const validStats = new Set(modifiers.map(m => m.name));
const current = JSON.parse(fs.readFileSync(COMBINATIONS_FILE, 'utf8'));
const currentCounts = countStats(current);
const missingStats = new Set(
  modifiers
    .filter(m => (m.combinationCount || 0) > 0 && !currentCounts[m.name])
    .map(m => m.name)
    .filter(name => validStats.has(name) && !DEPRECATED_STATS.has(name))
);

async function fetchSheetCsv() {
  const response = await fetch(SHEETS_CSV_URL, {
    headers: { 'User-Agent': 'SWGear combination reconciler' }
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch sheet CSV: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

const csv = await fetchSheetCsv();
const { combinations: sheetCombinations, statCounts: sheetCounts } = parseSheet(csv);

let added = 0;
const addedByStat = {};
const stillMissing = [];

for (const stat of missingStats) {
  if (!sheetCounts[stat]) {
    stillMissing.push(stat);
  }
}

for (const [item1, pairs] of Object.entries(sheetCombinations)) {
  for (const [item2, combo] of Object.entries(pairs)) {
    if (!missingStats.has(combo.name)) continue;
    if (DEPRECATED_STATS.has(combo.sourceModifierName) || DEPRECATED_STATS.has(combo.name)) continue;
    current[item1] ||= {};
    if (current[item1][item2]) continue;
    current[item1][item2] = combo;
    added++;
    addedByStat[combo.name] = (addedByStat[combo.name] || 0) + 1;
  }
}

fs.writeFileSync(COMBINATIONS_FILE, JSON.stringify(current, null, 2));
console.log(JSON.stringify({
  missingStats: [...missingStats].sort(),
  added,
  addedByStat: Object.fromEntries(Object.entries(addedByStat).sort((a, b) => a[0].localeCompare(b[0]))),
  stillMissing: stillMissing.sort()
}, null, 2));
