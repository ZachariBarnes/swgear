/**
 * Data Extraction Script for SEA Builder
 * Fetches modifier data from SWG Junkyard and Google Sheets
 * Run with: node scripts/extractData.js
 */

const fs = require('fs');
const path = require('path');

// Google Sheets CSV export URL
const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/1Zb3kFdBGYVaSSarAWATFmzChffEN0UIR_f6yH-v8Xk4/export?format=csv&gid=0';

// SWG Junkyard modifiers API (embedded in page)
const MODIFIERS_PAGES = [
  'https://www.swgjunkyard.com/modifiers?page=1',
  'https://www.swgjunkyard.com/modifiers?page=2',
  'https://www.swgjunkyard.com/modifiers?page=3',
  'https://www.swgjunkyard.com/modifiers?page=4',
  'https://www.swgjunkyard.com/modifiers?page=5',
  'https://www.swgjunkyard.com/modifiers?page=6',
];

const DATA_DIR = path.join(__dirname, '..', 'src', 'data');

// Core stats that have soft cap of ~250
const CORE_STATS = [
  'Ranged General',
  'Melee General',
  'Defense General',
  'Toughness Boost',
  'Endurance Boost',
  'Opportune Chance',
];

async function fetchModifiersFromPage(url) {
  console.log(`Fetching modifiers from ${url}...`);
  const response = await fetch(url);
  const html = await response.text();
  
  // Extract the data-page JSON from the HTML
  const match = html.match(/data-page="([^"]+)"/);
  if (!match) {
    throw new Error('Could not find data-page in HTML');
  }
  
  // Decode HTML entities and parse JSON
  const jsonStr = match[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  
  const data = JSON.parse(jsonStr);
  return data.props.modifiers.data;
}

async function fetchAllModifiers() {
  const allModifiers = [];
  
  for (const url of MODIFIERS_PAGES) {
    const modifiers = await fetchModifiersFromPage(url);
    allModifiers.push(...modifiers);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  // Transform to our format
  return allModifiers.map(mod => ({
    id: mod.internal,
    name: mod.name,
    ratio: mod.ratio,
    category: mod.category,
    isCore: CORE_STATS.includes(mod.name),
    hasPowerup: mod.pup,
    combinationCount: mod.combinations,
  }));
}

async function fetchCombinationsCSV() {
  console.log('Fetching combinations from Google Sheets...');
  const response = await fetch(SHEETS_CSV_URL);
  const csvText = await response.text();
  return csvText;
}

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const result = {};
  const unknownCombos = [];
  
  // First row contains all junk loot names as column headers
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  
  // Each subsequent row is a junk loot item with combinations
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line);
    const rowItem = values[0]; // First column is the junk loot name
    
    if (!rowItem) continue;
    
    result[rowItem] = {};
    
    for (let j = 1; j < values.length && j < headers.length; j++) {
      const colItem = headers[j];
      const modifier = values[j];
      
      if (modifier && modifier !== 'X' && modifier.trim()) {
        // Parse modifier name and ratio from format "Ranged General (1)"
        const match = modifier.match(/^(.+?)\s*\((\d+)\)$/);
        if (match) {
          result[rowItem][colItem] = {
            name: match[1].trim(),
            ratio: parseInt(match[2], 10)
          };
        } else if (modifier.trim()) {
          // If no ratio format, store just the name
          result[rowItem][colItem] = { name: modifier.trim() };
          unknownCombos.push({ item1: rowItem, item2: colItem, value: modifier });
        }
      }
    }
  }
  
  return { combinations: result, unknownCombos };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
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

function extractJunkLootList(combinations) {
  const items = new Set();
  
  for (const item1 of Object.keys(combinations)) {
    items.add(item1);
    for (const item2 of Object.keys(combinations[item1])) {
      items.add(item2);
    }
  }
  
  return Array.from(items).sort();
}

async function main() {
  console.log('=== SEA Builder Data Extraction ===\n');
  
  // Ensure data directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  
  try {
    // Fetch modifiers
    console.log('\n1. Fetching modifiers from SWG Junkyard...');
    const modifiers = await fetchAllModifiers();
    console.log(`   Found ${modifiers.length} modifiers`);
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'modifiers.json'),
      JSON.stringify(modifiers, null, 2)
    );
    console.log('   Saved to src/data/modifiers.json');
    
    // Fetch combinations
    console.log('\n2. Fetching combinations from Google Sheets...');
    const csvText = await fetchCombinationsCSV();
    const { combinations, unknownCombos } = parseCSV(csvText);
    
    const comboCount = Object.values(combinations).reduce(
      (sum, item) => sum + Object.keys(item).length, 0
    );
    console.log(`   Found ${comboCount} combinations`);
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'combinations.json'),
      JSON.stringify(combinations, null, 2)
    );
    console.log('   Saved to src/data/combinations.json');
    
    // Extract junk loot list
    console.log('\n3. Extracting junk loot list...');
    const junkLoot = extractJunkLootList(combinations);
    console.log(`   Found ${junkLoot.length} unique junk loot items`);
    
    fs.writeFileSync(
      path.join(DATA_DIR, 'junkLoot.json'),
      JSON.stringify(junkLoot, null, 2)
    );
    console.log('   Saved to src/data/junkLoot.json');
    
    // Save unknown combos for testing
    if (unknownCombos.length > 0) {
      console.log(`\n4. Found ${unknownCombos.length} unknown/special combinations`);
      fs.writeFileSync(
        path.join(DATA_DIR, 'unknownCombos.json'),
        JSON.stringify(unknownCombos, null, 2)
      );
      console.log('   Saved to src/data/unknownCombos.json');
    }
    
    console.log('\n=== Data extraction complete! ===');
    
  } catch (error) {
    console.error('Error during extraction:', error);
    process.exit(1);
  }
}

main();
