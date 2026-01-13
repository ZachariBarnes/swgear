/**
 * Export Utilities
 * Generate various export formats for crafter output
 */

/**
 * Find all junk loot combinations needed for chosen modifiers
 * @param {Object} build - Current build
 * @param {Object} combinations - Combinations data
 * @returns {Array} - Array of { modifier, item1, item2, slotName }
 */
export function findCombinations(build, combinations) {
  const needed = [];
  
  for (const slot of Object.values(build.slots)) {
    if (!slot.stats) continue;
    
    for (const stat of slot.stats) {
      if (!stat.modifier) continue;
      
      // Search for combinations that produce this modifier
      const combosForMod = findCombinationsForModifier(stat.modifier, combinations);
      
      if (combosForMod.length > 0) {
        needed.push({
          modifier: stat.modifier,
          slotName: slot.name,
          powerBit: slot.powerBit || 35,
          combinations: combosForMod
        });
      } else {
        needed.push({
          modifier: stat.modifier,
          slotName: slot.name,
          powerBit: slot.powerBit || 35,
          combinations: [],
          notFound: true
        });
      }
    }
  }
  
  return needed;
}

/**
 * Find all junk loot pairs that produce a given modifier
 * @param {string} modifierName - Name of the modifier
 * @param {Object} combinations - Combinations data
 * @returns {Array} - Array of { item1, item2 }
 */
export function findCombinationsForModifier(modifierName, combinations) {
  const results = [];
  
  for (const [item1, pairs] of Object.entries(combinations)) {
    for (const [item2, combo] of Object.entries(pairs)) {
      if (combo.name === modifierName) {
        results.push({ item1, item2 });
      }
    }
  }
  
  return results;
}

/**
 * Aggregate junk loot into a shopping list with quantities
 * @param {Array} neededCombos - Array from findCombinations
 * @returns {Object} - Map of item name to quantity needed
 */
export function aggregateJunkLoot(neededCombos) {
  const items = {};
  
  for (const combo of neededCombos) {
    if (combo.combinations.length > 0) {
      // Use the first available combination
      const first = combo.combinations[0];
      items[first.item1] = (items[first.item1] || 0) + 1;
      items[first.item2] = (items[first.item2] || 0) + 1;
    }
  }
  
  return items;
}

/**
 * Format as plain text list
 * @param {Object} build - Current build
 * @param {Object} combinations - Combinations data
 * @param {Array} modifiers - Modifier data
 * @returns {string} - Plain text output
 */
export function formatAsText(build, combinations, modifiers) {
  const modMap = new Map(modifiers.map(m => [m.name, m]));
  const lines = ['=== SEA Builder Shopping List ===', ''];
  
  // Build summary
  lines.push('BUILD SUMMARY:');
  for (const slot of Object.values(build.slots)) {
    if (!slot.stats || slot.stats.length === 0) continue;
    
    const stats = slot.stats
      .filter(s => s.modifier)
      .map(s => {
        const mod = modMap.get(s.modifier);
        const value = Math.floor((slot.powerBit || 35) / (mod?.ratio || 1));
        return `  ${s.modifier}: +${value}`;
      })
      .join('\n');
    
    lines.push(`\n${slot.name} (Power: +${slot.powerBit || 35}):`);
    lines.push(stats);
  }
  
  lines.push('\n---\n');
  lines.push('JUNK LOOT COMBINATIONS NEEDED:');
  
  const needed = findCombinations(build, combinations);
  for (const item of needed) {
    lines.push(`\n${item.slotName} - ${item.modifier}:`);
    if (item.combinations.length > 0) {
      const combo = item.combinations[0];
      lines.push(`  ${combo.item1} + ${combo.item2}`);
      if (item.combinations.length > 1) {
        lines.push(`  (${item.combinations.length - 1} alternative combos available)`);
      }
    } else {
      lines.push(`  [NO COMBINATIONS FOUND]`);
    }
  }
  
  lines.push('\n---\n');
  lines.push('SHOPPING LIST (AGGREGATED):');
  
  const shopping = aggregateJunkLoot(needed);
  const sorted = Object.entries(shopping).sort((a, b) => b[1] - a[1]);
  for (const [item, qty] of sorted) {
    lines.push(`  ${qty}x ${item}`);
  }
  
  return lines.join('\n');
}

/**
 * Format as HTML table
 * @param {Object} build - Current build
 * @param {Object} combinations - Combinations data
 * @param {Array} modifiers - Modifier data
 * @returns {string} - HTML table
 */
export function formatAsHTML(build, combinations, modifiers) {
  const modMap = new Map(modifiers.map(m => [m.name, m]));
  const needed = findCombinations(build, combinations);
  
  let html = '<table border="1" cellpadding="8" cellspacing="0">';
  html += '<tr><th>Slot</th><th>Modifier</th><th>Value</th><th>Junk Loot 1</th><th>Junk Loot 2</th></tr>';
  
  for (const item of needed) {
    const slot = build.slots[Object.keys(build.slots).find(k => build.slots[k].name === item.slotName)];
    const mod = modMap.get(item.modifier);
    const value = Math.floor((slot?.powerBit || 35) / (mod?.ratio || 1));
    
    if (item.combinations.length > 0) {
      const combo = item.combinations[0];
      html += `<tr><td>${item.slotName}</td><td>${item.modifier}</td><td>+${value}</td><td>${combo.item1}</td><td>${combo.item2}</td></tr>`;
    } else {
      html += `<tr><td>${item.slotName}</td><td>${item.modifier}</td><td>+${value}</td><td colspan="2">Not found</td></tr>`;
    }
  }
  
  html += '</table>';
  return html;
}

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} - Success status
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (e) {
    console.error('Failed to copy:', e);
    return false;
  }
}
