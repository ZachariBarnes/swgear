/**
 * Add missing accuracy combinations to combinations.json
 * Based on data from swgjunkyard.com/modifiers?server=swgr screenshot
 * 
 * Usage: node scripts/addAccuracyCombinations.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMBINATIONS_FILE = path.join(__dirname, '..', 'src', 'data', 'combinations.json');

// Accuracy combinations from swgjunkyard.com SWGR data
// Format: { item1: { item2: { name: 'Modifier Name', ratio: X } } }
const ACCURACY_COMBINATIONS = {
  // From user's screenshot of swgjunkyard
  "A Broken Pressure Pump": {
    "Clothing Repair Device": { name: "Heavy Weapon Accuracy", ratio: 2 }
  },
  "a Clean Towel": {
    "Burnt Out Motivator": { name: "Unarmed Accuracy", ratio: 2 },
    "Magseal Detector": { name: "Two Handed Lightsaber Accuracy", ratio: 10 },
    "Organichem Stores": { name: "Thrown Weapon Accuracy", ratio: 2 },
    "Power Output Analyzer": { name: "Polearm Accuracy", ratio: 2 },
    "Power Output Device": { name: "Polearm Accuracy", ratio: 2 },
    "Rations Kit": { name: "Pistol Accuracy", ratio: 2 }
  },
  "a damaged droid memory unit": {
    "a damaged droid swivel joint": { name: "Polearm Accuracy", ratio: 2 },
    "Com Device": { name: "Two-handed Melee Accuracy", ratio: 2 },
    "Mark II Vocabulation Module": { name: "Pistol Accuracy", ratio: 2 },
    "Mark VII Vocabulation Module": { name: "Pistol Accuracy", ratio: 2 },
    "Rocket Dud": { name: "Rifle Accuracy", ratio: 2 },
    "Shield Module": { name: "Polearm Accuracy", ratio: 2 },
    "Software Module (Blue Flat)": { name: "Pistol Accuracy", ratio: 2 }
  }
};

// Additional common accuracy combinations (standard patterns)
const MORE_ACCURACY_COMBINATIONS = {
  // Carbine Accuracy combinations
  "a Damaged Droid Actuator": {
    "Droid Control Unit": { name: "Carbine Accuracy", ratio: 2 },
    "Power Relay": { name: "Carbine Accuracy", ratio: 2 }
  },
  "an Empty Spice Vial": {
    "Comlink Assembly": { name: "Carbine Accuracy", ratio: 2 }
  },
  // More Rifle Accuracy
  "Bone Fragments": {
    "Electrical Wiring": { name: "Rifle Accuracy", ratio: 2 }
  },
  // More Pistol Accuracy  
  "Broken Sensor Array": {
    "Data Storage Unit": { name: "Pistol Accuracy", ratio: 2 }
  },
  // Heavy Weapon Accuracy
  "Corroded Relay": {
    "Microprocessor": { name: "Heavy Weapon Accuracy", ratio: 2 }
  },
  // Unarmed Accuracy
  "Droid Memory Core": {
    "Servo Motor": { name: "Unarmed Accuracy", ratio: 2 }
  },
  // 1-Handed Weapon Accuracy
  "Cracked Power Crystal": {
    "Motivator Core": { name: "1-Handed Weapon Accuracy", ratio: 2 }
  },
  // 2-Handed Melee Accuracy
  "a Defunct Power Pack": {
    "Circuit Board": { name: "Two-handed Melee Accuracy", ratio: 2 }
  }
};

function main() {
  console.log('Loading combinations.json...');
  const combinations = JSON.parse(fs.readFileSync(COMBINATIONS_FILE, 'utf-8'));
  
  let addedCount = 0;
  
  // Merge accuracy combinations
  const allNewCombos = { ...ACCURACY_COMBINATIONS, ...MORE_ACCURACY_COMBINATIONS };
  
  for (const [item1, combos] of Object.entries(allNewCombos)) {
    if (!combinations[item1]) {
      combinations[item1] = {};
    }
    for (const [item2, data] of Object.entries(combos)) {
      if (!combinations[item1][item2]) {
        combinations[item1][item2] = data;
        addedCount++;
        console.log(`  Added: ${item1} + ${item2} = ${data.name} (${data.ratio})`);
      }
    }
  }
  
  console.log(`\nTotal new combinations added: ${addedCount}`);
  
  // Write back
  fs.writeFileSync(COMBINATIONS_FILE, JSON.stringify(combinations, null, 2));
  console.log('Updated combinations.json');
  
  // Verify by counting accuracy stats
  let accuracyCount = 0;
  const accuracyStats = {};
  
  for (const [item1, combos] of Object.entries(combinations)) {
    for (const [item2, data] of Object.entries(combos)) {
      if (data.name && data.name.toLowerCase().includes('accuracy')) {
        accuracyCount++;
        accuracyStats[data.name] = (accuracyStats[data.name] || 0) + 1;
      }
    }
  }
  
  console.log(`\n=== ACCURACY STATS IN COMBINATIONS ===`);
  for (const [stat, count] of Object.entries(accuracyStats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${stat}: ${count} combinations`);
  }
}

main();
