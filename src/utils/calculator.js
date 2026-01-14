/**
 * SEA Calculator Utilities
 * Handles stat calculations with ratios and soft cap warnings
 */

// Threshold constants
export const STAT_THRESHOLDS = {
  IDEAL: 250,       // Start of ideal range (Green)
  DIMINISHING: 300, // Start of diminishing returns (Yellow)
  HARD_CAP: 350     // Hard cap (Red)
};

/**
 * Calculate the effective stat value from power bit strength and ratio
 * Uses floor division (rounds down)
 * @param {number} powerBit - Power bit strength (30-35)
 * @param {number} ratio - Modifier ratio (1, 2, 4, 8, 10, 14, etc.)
 * @returns {number} - Calculated stat value
 */
export function calculateStatValue(powerBit, ratio) {
  return Math.floor(powerBit / ratio);
}

/**
 * Calculate total stats from all slots in a build, including external buffs
 * @param {Object} build - Build object with slot configurations
 * @param {Array} modifiers - All available modifiers with ratio data
 * @param {Array} externalBuffs - Optional external buffs to include
 * @returns {Object} - Map of stat name to total value
 */
export function calculateTotals(build, modifiers, externalBuffs = []) {
  const totals = {};
  const modifierMap = new Map(modifiers.map(m => [m.name, m]));
  
  // Sum from slots
  for (const slot of Object.values(build.slots)) {
    if (!slot.stats) continue;
    
    for (const stat of slot.stats) {
      if (!stat.modifier) continue;
      
      const modInfo = modifierMap.get(stat.modifier);
      const ratio = modInfo?.ratio || stat.ratio || 1;
      const value = calculateStatValue(slot.powerBit || 35, ratio);
      
      totals[stat.modifier] = (totals[stat.modifier] || 0) + value;
    }
  }
  
  // Add external buffs
  for (const buff of externalBuffs) {
    if (buff.modifier && buff.value) {
      totals[buff.modifier] = (totals[buff.modifier] || 0) + parseInt(buff.value, 10);
    }
  }
  
  // Add jewelry stats
  if (build.jewelry) {
    for (const stats of Object.values(build.jewelry)) {
      for (const { stat, value } of stats) {
        if (stat && value) {
          totals[stat] = (totals[stat] || 0) + parseInt(value, 10);
        }
      }
    }
  }
  
  return totals;
}

/**
 * Get threshold warnings for stats based on new logic
 * @param {Object} totals - Map of stat name to total value
 * @param {Array} modifiers - All available modifiers
 * @returns {Object} - Map of stat name to status info
 */
export function getSoftCapWarnings(totals, modifiers) {
  const warnings = {};
  const modifierMap = new Map(modifiers.map(m => [m.name, m]));
  
  for (const [statName, total] of Object.entries(totals)) {
    const mod = modifierMap.get(statName);
    const isCore = mod?.isCore || false;
    
    // Check against thresholds
    if (total >= STAT_THRESHOLDS.HARD_CAP) {
      warnings[statName] = { 
        total, 
        status: 'hard-cap',
        label: 'Hard Cap',
        wasted: total - STAT_THRESHOLDS.HARD_CAP,
        isCore 
      };
    } else if (total >= STAT_THRESHOLDS.DIMINISHING) {
      warnings[statName] = { 
        total, 
        status: 'diminishing', 
        label: 'Diminishing Returns',
        wasted: 0, // Points strictly aren't wasted until hard cap, but logic implies inefficiency
        isCore
      };
    } else if (total >= STAT_THRESHOLDS.IDEAL) {
      warnings[statName] = { 
        total, 
        status: 'ideal', 
        label: 'Ideal Range',
        wasted: 0,
        isCore
      };
    } else {
      warnings[statName] = { 
        total, 
        status: 'under', 
        label: '',
        wasted: 0,
        isCore
      };
    }
  }
  
  return warnings;
}

/**
 * Calculate max value at +35 power bit for a modifier
 * @param {number} ratio - Modifier ratio
 * @returns {number} - Max value
 */
export function maxValueAtPowerBit(ratio, powerBit = 35) {
  return calculateStatValue(powerBit, ratio);
}

/**
 * Calculate effective stat points with diminishing returns
 * Based on Fez's Attribute/SEA Calculator formula
 * Formula: When actual > 250, effective = (750 * actual) / (500 + actual)
 * This caps at 500 effective points regardless of how high you stack
 * @param {number} actual - Raw stat total
 * @returns {number} - Effective stat value after diminishing returns
 */
export function calculateEffectivePoints(actual) {
  if (actual <= 250) {
    return actual;
  }
  // Diminishing returns formula from Fez's spreadsheet
  return Math.floor((750 * actual) / (500 + actual));
}

/**
 * Calculate HAM (Health, Action, Mind) pools from stats
 * Based on Fez's Attribute/SEA Calculator
 * @param {Object} totals - Map of stat name to total value
 * @param {Object} baseStats - Optional base HAM values (species/profession dependent)
 * @returns {Object} - HAM pool values and secondary stats
 */
export function calculateHAM(totals, baseStats = { health: 3500, action: 3500, mind: 3500 }) {
  const toughness = totals['Toughness Boost'] || 0;
  const endurance = totals['Endurance Boost'] || 0;
  const defenseGeneral = totals['Defense General'] || 0;
  const rangedGeneral = totals['Ranged General'] || 0;
  const meleeGeneral = totals['Melee General'] || 0;
  const opportune = totals['Opportune Chance'] || 0;
  
  // Calculate effective points for each stat
  const effToughness = calculateEffectivePoints(toughness);
  const effEndurance = calculateEffectivePoints(endurance);
  const effDefense = calculateEffectivePoints(defenseGeneral);
  const effRanged = calculateEffectivePoints(rangedGeneral);
  const effMelee = calculateEffectivePoints(meleeGeneral);
  const effOpportune = calculateEffectivePoints(opportune);
  
  return {
    // HAM pools
    health: baseStats.health + (effToughness * 2),
    action: baseStats.action + effEndurance,
    mind: baseStats.mind + effEndurance,
    
    // Regeneration (per second, as percentage)
    regenPercent: effEndurance * 0.1,
    
    // Defense stats
    defense: Math.floor(effDefense * 0.33),
    rangedDefense: Math.floor(effRanged * 0.25),
    meleeDefense: Math.floor(effMelee * 0.25),
    
    // Accuracy stats
    rangedAccuracy: Math.floor(effRanged * 0.25),
    meleeAccuracy: Math.floor(effMelee * 0.25),
    allAccuracy: Math.floor(effOpportune * 0.33),
    
    // Speed stats (as percentage reduction)
    rangedSpeed: Math.floor(effRanged * 0.33),
    meleeSpeed: Math.floor(effMelee * 0.33),
    medicSpeed: Math.floor(effOpportune * 0.33),
    
    // Special stats
    stateResist: Math.floor((effToughness + effDefense) / 100),
    healEfficiency: Math.floor((effDefense + effOpportune) * 0.5),
    critChance: Math.floor(effOpportune / 100),
    critReduction: Math.floor(effOpportune / 100),
    
    // Raw effective values for display
    effective: {
      toughness: effToughness,
      endurance: effEndurance,
      defense: effDefense,
      ranged: effRanged,
      melee: effMelee,
      opportune: effOpportune
    }
  };
}
