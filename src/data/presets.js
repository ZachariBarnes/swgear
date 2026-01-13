/**
 * Build Presets
 * Common SEA configurations for quick setup
 */

// Standard preset for all 9 core armor slots
export const PRESETS = [
  {
    id: 'standard-core',
    name: 'Standard Core Set',
    description: 'END/RNG/MLE on all 9 armor slots',
    iconType: 'shield',
    slots: {
      helmet: ['Endurance Boost', 'Ranged General', 'Melee General'],
      lbicep: ['Endurance Boost', 'Ranged General', 'Melee General'],
      rbicep: ['Endurance Boost', 'Ranged General', 'Melee General'],
      lbracer: ['Endurance Boost', 'Ranged General', 'Melee General'],
      rbracer: ['Endurance Boost', 'Ranged General', 'Melee General'],
      gloves: ['Endurance Boost', 'Ranged General', 'Melee General'],
      belt: ['Endurance Boost', 'Ranged General', 'Melee General'],
      pants: ['Endurance Boost', 'Ranged General', 'Melee General'],
      boots: ['Endurance Boost', 'Ranged General', 'Melee General']
    },
    powerBit: 35
  },
  {
    id: 'melee-dps',
    name: 'Melee DPS Set',
    description: 'MLE/DEF/OPP focus for melee builds',
    iconType: 'sword',
    slots: {
      helmet: ['Melee General', 'Defense General', 'Opportune Chance'],
      lbicep: ['Melee General', 'Defense General', 'Opportune Chance'],
      rbicep: ['Melee General', 'Defense General', 'Opportune Chance'],
      lbracer: ['Melee General', 'Defense General', 'Opportune Chance'],
      rbracer: ['Melee General', 'Defense General', 'Opportune Chance'],
      gloves: ['Melee General', 'Defense General', 'Opportune Chance'],
      belt: ['Melee General', 'Defense General', 'Opportune Chance'],
      pants: ['Melee General', 'Defense General', 'Opportune Chance'],
      boots: ['Melee General', 'Defense General', 'Opportune Chance']
    },
    powerBit: 35
  },
  {
    id: 'ranged-dps',
    name: 'Ranged DPS Set',
    description: 'RNG/DEF/OPP focus for ranged builds',
    iconType: 'crosshair',
    slots: {
      helmet: ['Ranged General', 'Defense General', 'Opportune Chance'],
      lbicep: ['Ranged General', 'Defense General', 'Opportune Chance'],
      rbicep: ['Ranged General', 'Defense General', 'Opportune Chance'],
      lbracer: ['Ranged General', 'Defense General', 'Opportune Chance'],
      rbracer: ['Ranged General', 'Defense General', 'Opportune Chance'],
      gloves: ['Ranged General', 'Defense General', 'Opportune Chance'],
      belt: ['Ranged General', 'Defense General', 'Opportune Chance'],
      pants: ['Ranged General', 'Defense General', 'Opportune Chance'],
      boots: ['Ranged General', 'Defense General', 'Opportune Chance']
    },
    powerBit: 35
  },
  {
    id: 'balanced-tank',
    name: 'Balanced Tank',
    description: 'END/DEF/OPP for survivability',
    iconType: 'castle',
    slots: {
      helmet: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      lbicep: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      rbicep: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      lbracer: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      rbracer: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      gloves: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      belt: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      pants: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      boots: ['Endurance Boost', 'Defense General', 'Opportune Chance']
    },
    powerBit: 35
  },
  {
    id: 'medic-set',
    name: 'Medic Set',
    description: 'Healing focused with core stats',
    iconType: 'medkit',
    slots: {
      helmet: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      chest: ['Healing Potency', 'Medical Combat Speed', 'Endurance Boost'],
      shirt: ['Healing Potency', 'Medical Combat Speed', 'Endurance Boost'],
      lbicep: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      rbicep: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      lbracer: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      rbracer: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      gloves: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      belt: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      pants: ['Endurance Boost', 'Defense General', 'Opportune Chance'],
      boots: ['Endurance Boost', 'Defense General', 'Opportune Chance']
    },
    powerBit: 35
  }
];

/**
 * Apply a preset to a build
 * @param {Object} build - Current build object
 * @param {Object} preset - Preset to apply
 * @param {Array} modifiers - All modifiers for ratio lookup
 * @param {boolean} overwriteExisting - Whether to overwrite slots that already have stats
 * @returns {Object} - Modified build
 */
export function applyPreset(build, preset, modifiers, overwriteExisting = false) {
  const modifierMap = new Map(modifiers.map(m => [m.name, m]));
  
  for (const [slotId, statNames] of Object.entries(preset.slots)) {
    const slot = build.slots[slotId];
    if (!slot) continue;
    
    // Skip if slot has stats and we're not overwriting
    const hasStats = slot.stats && slot.stats.some(s => s.modifier);
    if (hasStats && !overwriteExisting) continue;
    
    // Apply preset stats
    slot.stats = statNames.map(name => {
      const mod = modifierMap.get(name);
      return {
        modifier: name,
        ratio: mod?.ratio || 1
      };
    });
    
    slot.powerBit = preset.powerBit || 35;
  }
  
  return build;
}
