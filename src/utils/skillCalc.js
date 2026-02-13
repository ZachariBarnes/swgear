/**
 * Skill Calculator Integration
 * Profession-based SEA recommendations for SWG Restoration
 * 
 * Instead of fetching the skill calculator page (blocked by CORS),
 * users pick their professions and we recommend stats directly.
 */

// SWG Restoration profession definitions with SEA recommendations
export const PROFESSIONS = [
  // Ranged combat
  { id: 'commando', name: 'Commando', icon: '💥', category: 'ranged' },
  { id: 'rifleman', name: 'Rifleman', icon: '🎯', category: 'ranged' },
  { id: 'carbineer', name: 'Carbineer', icon: '🔫', category: 'ranged' },
  { id: 'pistoleer', name: 'Pistoleer', icon: '🔫', category: 'ranged' },
  { id: 'bounty-hunter', name: 'Bounty Hunter', icon: '🏹', category: 'ranged' },
  
  // Melee combat
  { id: 'swordsman', name: 'Swordsman', icon: '⚔️', category: 'melee' },
  { id: 'pikeman', name: 'Pikeman', icon: '🔱', category: 'melee' },
  { id: 'fencer', name: 'Fencer', icon: '🤺', category: 'melee' },
  { id: 'tka', name: 'Teras Kasi Artist', icon: '👊', category: 'melee' },
  
  // Healing
  { id: 'doctor', name: 'Doctor', icon: '💉', category: 'healing' },
  { id: 'combat-medic', name: 'Combat Medic', icon: '⚕️', category: 'healing' },
  
  // Jedi
  { id: 'jedi', name: 'Jedi', icon: '⚡', category: 'jedi' },
  
  // Support
  { id: 'smuggler', name: 'Smuggler', icon: '🃏', category: 'support' },
  { id: 'squad-leader', name: 'Squad Leader', icon: '📣', category: 'support' },
  { id: 'ranger', name: 'Ranger', icon: '🌿', category: 'support' },
  { id: 'creature-handler', name: 'Creature Handler', icon: '🐾', category: 'support' },
  
  // Crafting
  { id: 'armorsmith', name: 'Armorsmith', icon: '🛡️', category: 'crafting' },
  { id: 'weaponsmith', name: 'Weaponsmith', icon: '⚒️', category: 'crafting' },
  { id: 'chef', name: 'Chef', icon: '🍖', category: 'crafting' },
  { id: 'droid-engineer', name: 'Droid Engineer', icon: '🤖', category: 'crafting' },
  { id: 'bio-engineer', name: 'Bio-Engineer', icon: '🧬', category: 'crafting' }
];

export const CATEGORY_LABELS = {
  ranged: 'Ranged Combat',
  melee: 'Melee Combat',
  healing: 'Healing',
  jedi: 'Force User',
  support: 'Support',
  crafting: 'Crafting'
};

/**
 * Analyze selected professions and generate SEA recommendations
 * @param {string[]} selectedProfessionIds - Array of selected profession IDs
 * @returns {Object} - Analysis with type flags and suggested stats
 */
export function analyzeProfessions(selectedProfessionIds) {
  const selected = PROFESSIONS.filter(p => selectedProfessionIds.includes(p.id));
  
  const analysis = {
    ranged: selected.some(p => p.category === 'ranged'),
    melee: selected.some(p => p.category === 'melee' || p.category === 'jedi'),
    healing: selected.some(p => p.category === 'healing'),
    crafting: selected.some(p => p.category === 'crafting'),
    jedi: selected.some(p => p.category === 'jedi'),
    suggestedStats: [],
    selectedNames: selected.map(p => p.name)
  };
  
  // Primary stats from professions
  if (analysis.ranged) analysis.suggestedStats.push('Ranged General');
  if (analysis.melee) analysis.suggestedStats.push('Melee General');
  if (analysis.healing) {
    analysis.suggestedStats.push('Healing Potency');
    analysis.suggestedStats.push('Medical Combat Speed');
  }
  if (analysis.crafting) {
    analysis.suggestedStats.push('Experimentation');
    analysis.suggestedStats.push('Surveying');
  }
  
  // Core defensive stats for combat builds
  if (analysis.ranged || analysis.melee || analysis.jedi) {
    if (!analysis.suggestedStats.includes('Defense General')) analysis.suggestedStats.push('Defense General');
    if (!analysis.suggestedStats.includes('Opportune Chance')) analysis.suggestedStats.push('Opportune Chance');
    if (!analysis.suggestedStats.includes('Endurance Boost')) analysis.suggestedStats.push('Endurance Boost');
    if (!analysis.suggestedStats.includes('Toughness Boost')) analysis.suggestedStats.push('Toughness Boost');
  }
  
  // Remove duplicates
  analysis.suggestedStats = [...new Set(analysis.suggestedStats)];
  
  return analysis;
}

/**
 * Generate a concrete build recommendation from the analysis
 * @param {Object} analysis - Output from analyzeProfessions
 * @returns {Object} - Recommended build config with core and exotic slot assignments
 */
export function generateBuildRecommendation(analysis) {
  const coreSlots = ['helmet', 'lbicep', 'rbicep', 'lbracer', 'rbracer', 'gloves', 'belt', 'pants', 'boots'];
  
  // Pick the 3 best core stats for armor
  let coreStats;
  
  if (analysis.ranged && analysis.melee) {
    coreStats = ['Ranged General', 'Melee General', 'Defense General'];
  } else if (analysis.ranged) {
    coreStats = ['Ranged General', 'Defense General', 'Opportune Chance'];
  } else if (analysis.melee || analysis.jedi) {
    coreStats = ['Melee General', 'Defense General', 'Opportune Chance'];
  } else if (analysis.healing) {
    coreStats = ['Endurance Boost', 'Toughness Boost', 'Defense General'];
  } else if (analysis.crafting) {
    coreStats = ['Endurance Boost', 'Toughness Boost', 'Defense General'];
  } else {
    coreStats = ['Defense General', 'Endurance Boost', 'Toughness Boost'];
  }
  
  const recommendation = {
    coreSlots: {},
    exoticSlots: {},
    description: ''
  };
  
  // Fill core slots
  coreSlots.forEach(slot => {
    recommendation.coreSlots[slot] = [...coreStats];
  });
  
  // Fill exotic slots
  if (analysis.healing) {
    recommendation.exoticSlots.chest = ['Healing Potency', 'Medical Combat Speed', 'Endurance Boost'];
    recommendation.exoticSlots.shirt = ['Healing Potency', 'Medical Combat Speed', 'Toughness Boost'];
    recommendation.exoticSlots.weapon = ['Healing Potency', 'Medical Combat Speed', 'Opportune Chance'];
  } else if (analysis.crafting) {
    recommendation.exoticSlots.chest = ['Experimentation', 'Endurance Boost', 'Toughness Boost'];
    recommendation.exoticSlots.shirt = ['Experimentation', 'Endurance Boost', 'Toughness Boost'];
    recommendation.exoticSlots.weapon = ['Surveying', 'Experimentation', 'Luck'];
  } else {
    const dmg = analysis.ranged ? 'Ranged General' : 'Melee General';
    recommendation.exoticSlots.chest = [dmg, 'Toughness Boost', 'Endurance Boost'];
    recommendation.exoticSlots.shirt = [dmg, 'Toughness Boost', 'Endurance Boost'];
    recommendation.exoticSlots.weapon = [dmg, 'Opportune Chance', 'Toughness Boost'];
  }
  
  // Build description
  const types = [];
  if (analysis.ranged) types.push('Ranged');
  if (analysis.melee) types.push('Melee');
  if (analysis.jedi) types.push('Jedi');
  if (analysis.healing) types.push('Healer');
  if (analysis.crafting) types.push('Crafter');
  recommendation.description = types.length ? types.join('/') + ' Build' : 'Balanced Build';
  
  return recommendation;
}
