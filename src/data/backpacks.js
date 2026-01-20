/**
 * Backpack Presets
 * Legendary backpack stat configurations for quick selection
 */

export const BACKPACK_PRESETS = [
  {
    id: 'ace-pack',
    name: 'Imperial Ace Field Pack',
    description: 'Legendaryendary reward from Imperial Ace missions',
    stats: [
      { modifier: 'Defense General', value: 35 },
      { modifier: 'Toughness Boost', value: 25 },
      { modifier: 'Opportune Chance', value: 35 },
      { modifier: 'Ranged General', value: 30 },
      { modifier: 'Endurance Boost', value: 25 },
      { modifier: 'Melee General', value: 30 }
    ]
  },
  {
    id: 'tusken-king',
    name: 'Tusken King Backpack',
    description: 'Legendary reward from Krayt/Tusken King heroic',
    stats: [
      { modifier: 'Defense General', value: 25 },
      { modifier: 'Toughness Boost', value: 30 },
      { modifier: 'Opportune Chance', value: 25 },
      { modifier: 'Ranged General', value: 35 },
      { modifier: 'Endurance Boost', value: 30 },
      { modifier: 'Melee General', value: 35 }
    ]
  }
];

/**
 * Heroic Junk Loot Items
 * Items that drop from heroic content and are rare/expensive
 * Used to filter combinations in the Crafter view
 */
export const HEROIC_JUNK_ITEMS = [
  // Krayt Dragon / Tusken King heroic
  'A Gackle Bat Wing',
  'Krayt Dragon Tissue',
  'Krayt Dragon Scale',
  'Ancient Krayt Dragon Scale',
  'Krayt Pearl Fragment',
  
  // Axkva Min (AM) heroic  
  'Axkva Min Relic',
  'Dark Jedi Heart',
  'Axkva Fang',
  
  // Exar Kun (EK) heroic
  'Exar Kun Fragment',
  'Sith Artifact Shard',
  'Dark Force Crystal',
  
  // Sher Kar / ISD heroic
  'Sher Kar Fang',
  'Sher Kar Scale',
  'Imperial Medal Fragment',
  
  // General heroic drops
  'Ancient Scroll Fragment',
  'Rare Crystal Shard',
  'Heroic Badge',
  'Dark Side Token'
];

/**
 * Check if a junk loot item is from heroic content
 * @param {string} itemName - Name of the junk loot item
 * @returns {boolean} - True if the item is heroic loot
 */
export function isHeroicItem(itemName) {
  const lowerName = itemName.toLowerCase();
  return HEROIC_JUNK_ITEMS.some(heroic => 
    lowerName.includes(heroic.toLowerCase())
  ) || lowerName.includes('gackle') || 
     lowerName.includes('krayt') ||
     lowerName.includes('axkva') ||
     lowerName.includes('exar kun') ||
     lowerName.includes('sher kar');
}
