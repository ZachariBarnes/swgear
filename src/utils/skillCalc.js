/**
 * Skill Calculator Integration
 * Parses SWGR skill calculator builds and suggests SEA stats
 */

// Mapping of skill keywords to recommended SEA stats
const SKILL_TO_SEA_MAPPING = {
  // Ranged professions
  rifle: { stats: ['Ranged General'], priority: 1 },
  carbine: { stats: ['Ranged General'], priority: 1 },
  pistol: { stats: ['Ranged General'], priority: 1 },
  'ranged accuracy': { stats: ['Ranged General'], priority: 1 },
  'ranged speed': { stats: ['Ranged General'], priority: 2 },
  
  // Melee professions
  polearm: { stats: ['Melee General'], priority: 1 },
  'one-hand': { stats: ['Melee General'], priority: 1 },
  'two-hand': { stats: ['Melee General'], priority: 1 },
  unarmed: { stats: ['Melee General'], priority: 1 },
  fencing: { stats: ['Melee General'], priority: 1 },
  'melee accuracy': { stats: ['Melee General'], priority: 1 },
  'melee speed': { stats: ['Melee General'], priority: 2 },
  
  // Healing professions
  'healing': { stats: ['Healing Potency', 'Medical Combat Speed'], priority: 1 },
  'medical': { stats: ['Healing Potency', 'Medical Combat Speed'], priority: 1 },
  'medic': { stats: ['Healing Potency', 'Medical Combat Speed'], priority: 1 },
  'doctor': { stats: ['Healing Potency', 'Medical Combat Speed'], priority: 1 },
  
  // Defense
  'ranged defense': { stats: ['Defense General'], priority: 2 },
  'melee defense': { stats: ['Defense General'], priority: 2 },
  
  // Crafting/surveying
  'survey': { stats: ['Surveying'], priority: 3 },
  'experimentation': { stats: ['Experimentation'], priority: 3 },
  'assembly': { stats: ['Experimentation'], priority: 3 }
};

/**
 * Parse skill calculator URL to extract the skills parameter
 * @param {string} url - Skill calculator URL
 * @returns {string|null} - Skills parameter or null
 */
export function parseSkillCalcUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('skills');
  } catch (e) {
    return null;
  }
}

/**
 * Fetch and analyze skill calculator page
 * NOTE: This requires the page to be fetched server-side or via CORS proxy
 * For now, we'll provide a simpler text-based analysis
 * @param {string} pageText - Text content of the skill calculator page
 * @returns {Object} - Analysis result with recommended stats
 */
export function analyzeSkillCalcText(pageText) {
  const lowerText = pageText.toLowerCase();
  const recommendations = {
    ranged: false,
    melee: false,
    healing: false,
    crafting: false,
    suggestedStats: []
  };
  
  // Check for ranged skills
  if (lowerText.includes('rifle') || 
      lowerText.includes('carbine') || 
      lowerText.includes('pistol') ||
      lowerText.includes('ranged accuracy')) {
    recommendations.ranged = true;
    recommendations.suggestedStats.push('Ranged General');
  }
  
  // Check for melee skills
  if (lowerText.includes('polearm') || 
      lowerText.includes('fencing') || 
      lowerText.includes('unarmed') ||
      lowerText.includes('one-hand') ||
      lowerText.includes('two-hand') ||
      lowerText.includes('melee accuracy')) {
    recommendations.melee = true;
    recommendations.suggestedStats.push('Melee General');
  }
  
  // Check for healing skills
  if (lowerText.includes('healing potency') || 
      lowerText.includes('medical combat speed') || 
      lowerText.includes('combat medic') ||
      lowerText.includes('doctor')) {
    recommendations.healing = true;
    recommendations.suggestedStats.push('Healing Potency');
    recommendations.suggestedStats.push('Medical Combat Speed');
  }
  
  // Check for crafting skills
  if (lowerText.includes('survey') || 
      lowerText.includes('experimentation') ||
      lowerText.includes('assembly')) {
    recommendations.crafting = true;
    recommendations.suggestedStats.push('Surveying');
    recommendations.suggestedStats.push('Experimentation');
  }
  
  // Always add core defensive stats
  recommendations.suggestedStats.push('Defense General');
  recommendations.suggestedStats.push('Opportune Chance');
  recommendations.suggestedStats.push('Endurance Boost');
  
  // Remove duplicates
  recommendations.suggestedStats = [...new Set(recommendations.suggestedStats)];
  
  return recommendations;
}

/**
 * Generate build recommendation based on skill analysis
 * @param {Object} analysis - Output from analyzeSkillCalcText
 * @returns {Object} - Recommended build config
 */
export function generateBuildRecommendation(analysis) {
  const coreSlots = ['helmet', 'lbicep', 'rbicep', 'lbracer', 'rbracer', 'gloves', 'belt', 'pants', 'boots'];
  const exoticSlots = ['chest', 'shirt', 'weapon'];
  
  // Base core stats everyone should have
  const coreStats = ['Endurance Boost', 'Defense General', 'Opportune Chance'];
  
  // Replace based on build type
  if (analysis.ranged && !analysis.melee) {
    coreStats[2] = 'Ranged General'; // Replace OPP with RNG
  } else if (analysis.melee && !analysis.ranged) {
    coreStats[2] = 'Melee General'; // Replace OPP with MLE
  } else {
    // Hybrid - keep OPP or add one of each
    coreStats.push('Ranged General');
  }
  
  // Build the recommendation
  const recommendation = {
    coreSlots: {},
    exoticSlots: {}
  };
  
  // Fill core slots
  coreSlots.forEach(slot => {
    recommendation.coreSlots[slot] = coreStats.slice(0, 3);
  });
  
  // Fill exotic slots with profession-specific stats
  if (analysis.healing) {
    recommendation.exoticSlots.chest = ['Healing Potency', 'Medical Combat Speed', 'Endurance Boost'];
    recommendation.exoticSlots.shirt = ['Healing Potency', 'Medical Combat Speed', 'Endurance Boost'];
  }
  
  if (analysis.crafting) {
    recommendation.exoticSlots.weapon = ['Surveying', 'Experimentation', 'Luck'];
  }
  
  return recommendation;
}
