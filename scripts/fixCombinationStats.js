/**
 * Fix combinations.json by mapping NGE stat names to SWGR Restoration stat names
 * and removing invalid/deprecated stats
 * 
 * Usage: node scripts/fixCombinationStats.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINATIONS_FILE = path.join(__dirname, '..', 'src', 'data', 'combinations.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'combinations_fixed.json');

// NGE to SWGR stat name mappings from the wiki
// https://swgr.org/wiki/reverse_engineer/
const NGE_TO_SWGR_MAPPING = {
  // Core stats - NGE used different names
  'Precision': 'Ranged General',
  'Agility': 'Defense General', 
  'Luck': 'Opportune Chance',
  'Stamina': 'Endurance Boost',
  'Constitution': 'Toughness Boost',
  'Strength': 'Melee General',
  
  // Documented SWGR changes
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

// Stats that are deprecated/invalid in SWGR and should be removed
const DEPRECATED_STATS = [
  'Parry Rating',
  'Dodge Chance',
  'Intimidation',
  'Cybernetic Assembly',
  'Cybernetic Experimentation'
];

function fixStatName(statName) {
  // Check if it needs to be mapped
  if (NGE_TO_SWGR_MAPPING[statName]) {
    return NGE_TO_SWGR_MAPPING[statName];
  }
  return statName;
}

function isDeprecatedStat(statName) {
  return DEPRECATED_STATS.includes(statName);
}

function main() {
  console.log('Loading combinations.json...');
  const rawData = fs.readFileSync(COMBINATIONS_FILE, 'utf8');
  const combinations = JSON.parse(rawData);
  
  console.log('Processing combinations...');
  
  let mappedCount = 0;
  let removedCount = 0;
  let totalCombos = 0;
  const statCounts = {};
  
  const fixedCombinations = {};
  
  for (const [item1, item2Map] of Object.entries(combinations)) {
    fixedCombinations[item1] = {};
    
    for (const [item2, combo] of Object.entries(item2Map)) {
      totalCombos++;
      const originalName = combo.name;
      
      // Skip deprecated stats
      if (isDeprecatedStat(originalName)) {
        removedCount++;
        continue;
      }
      
      // Map NGE name to SWGR name
      const fixedName = fixStatName(originalName);
      
      if (fixedName !== originalName) {
        mappedCount++;
      }
      
      // Track stat counts
      statCounts[fixedName] = (statCounts[fixedName] || 0) + 1;
      
      fixedCombinations[item1][item2] = {
        name: fixedName,
        ratio: combo.ratio
      };
    }
    
    // Remove empty item1 entries
    if (Object.keys(fixedCombinations[item1]).length === 0) {
      delete fixedCombinations[item1];
    }
  }
  
  console.log('\n=== STATS SUMMARY ===');
  console.log(`Total combinations processed: ${totalCombos}`);
  console.log(`Stat names mapped: ${mappedCount}`);
  console.log(`Deprecated stats removed: ${removedCount}`);
  
  console.log('\n=== STAT COUNTS ===');
  const sortedStats = Object.entries(statCounts).sort((a, b) => b[1] - a[1]);
  for (const [stat, count] of sortedStats.slice(0, 30)) {
    console.log(`  ${stat}: ${count}`);
  }
  
  // Write fixed output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(fixedCombinations, null, 2));
  console.log(`\nWritten fixed combinations to: ${OUTPUT_FILE}`);
  
  // Also show which unique stats we now have
  console.log('\n=== ALL UNIQUE STATS ===');
  const uniqueStats = [...new Set(Object.keys(statCounts))].sort();
  uniqueStats.forEach(stat => console.log(`  - ${stat}`));
}

main();
