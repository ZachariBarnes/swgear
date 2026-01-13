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
