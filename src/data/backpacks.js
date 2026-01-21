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
 * Items starting with "A " or "An " are special drops (heroic/dungeon loot)
 * Used to filter combinations in the Crafter view
 */
export const HEROIC_JUNK_ITEMS = [
  'A Gackle Bat Wing'
];

/**
 * Check if a junk loot item is from heroic/dungeon content
 * Items starting with "A " or "An " (case insensitive) are special drops
 * @param {string} itemName - Name of the junk loot item
 * @returns {boolean} - True if the item is heroic/special loot
 */
export function isHeroicItem(itemName) {
  const trimmed = itemName.trim();
  // Check if starts with "A " or "An " (case insensitive)
  const lowerName = trimmed.toLowerCase();
  return lowerName.startsWith('a ') || lowerName.startsWith('an ');
}

