/**
 * SlotBuilder Component
 * Renders armor slots in SWG-style layout
 * Based on SWG Restoration armor/SEA system:
 * - Exotic slots: Shirt, Chest, Weapon (can accept any modifier)
 * - Regular slots: Head, Biceps, Bracers, Gloves, Belt, Leggings, Boots
 */

// Slot configuration - accurate to SWG Restoration
export const SLOT_CONFIG = [
  // Head
  { id: 'helmet', name: 'Head', isExotic: false, maxStats: 3 },
  
  // Upper arms (biceps)
  { id: 'lbicep', name: 'L. Bicep', isExotic: false, maxStats: 3 },
  { id: 'rbicep', name: 'R. Bicep', isExotic: false, maxStats: 3 },
  
  // Exotic torso slots
  { id: 'chest', name: 'Chest', isExotic: true, maxStats: 3 },
  { id: 'shirt', name: 'Shirt', isExotic: true, maxStats: 3 },
  
  // Lower arms (bracers)
  { id: 'lbracer', name: 'L. Bracer', isExotic: false, maxStats: 3 },
  { id: 'rbracer', name: 'R. Bracer', isExotic: false, maxStats: 3 },
  
  // Hands and waist
  { id: 'gloves', name: 'Gloves', isExotic: false, maxStats: 3 },
  { id: 'belt', name: 'Belt', isExotic: false, maxStats: 3 },
  
  // Lower body
  { id: 'pants', name: 'Leggings', isExotic: false, maxStats: 3 },
  { id: 'boots', name: 'Boots', isExotic: false, maxStats: 3 },
  
  // Exotic weapon slot
  { id: 'weapon', name: 'Weapon', isExotic: true, maxStats: 3 },
];

/**
 * Create a new empty build
 * @returns {Object} - Empty build object
 */
export function createEmptyBuild() {
  const build = {
    name: 'New Build',
    slots: {},
    externalBuffs: [],
    armorBonusHP: 0  // Bonus HP from crafted armor (up to ~800-900 from capped resources)
  };
  
  for (const slot of SLOT_CONFIG) {
    build.slots[slot.id] = {
      id: slot.id,
      name: slot.name,
      isExotic: slot.isExotic,
      powerBit: 35,
      stats: []
    };
  }
  
  return build;
}

/**
 * Render the slot builder visual view with humanoid silhouette (A-pose)
 * @param {HTMLElement} container - Container element
 * @param {Object} build - Current build state
 * @param {Function} onSlotClick - Callback when slot is clicked
 */
export function renderVisualView(container, build, onSlotClick) {
  container.innerHTML = `
    <div class="armor-visual">
      ${SLOT_CONFIG.map(slot => renderSlotCard(slot, build.slots[slot.id])).join('')}
    </div>
  `;
  
  // Add click handlers for slot wrappers
  container.querySelectorAll('.slot-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', () => {
      container.querySelectorAll('.slot-card').forEach(c => c.classList.remove('active'));
      const card = wrapper.querySelector('.slot-card');
      if (card) card.classList.add('active');
      const slotId = wrapper.dataset.slotId;
      onSlotClick(slotId);
    });
  });
}

/**
 * Render the slot builder list view
 * @param {HTMLElement} container - Container element
 * @param {Object} build - Current build state
 * @param {Function} onSlotClick - Callback when slot is clicked
 */
export function renderListView(container, build, onSlotClick) {
  container.innerHTML = `
    ${SLOT_CONFIG.map(slot => {
      const slotData = build.slots[slot.id];
      return renderSlotListItem(slot, slotData);
    }).join('')}
  `;
  
  container.querySelectorAll('.slot-list-item').forEach(item => {
    item.addEventListener('click', () => {
      container.querySelectorAll('.slot-list-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const slotId = item.dataset.slotId;
      onSlotClick(slotId);
    });
  });
}

/**
 * Stat name abbreviations for compact display
 */
const STAT_ABBREVIATIONS = {
  'Camouflage': 'CAM',
  'Defense General': 'DEF',
  'Endurance Boost': 'END',
  'Melee General': 'MLE',
  'Toughness Boost': 'TGH',
  'Opportune Chance': 'OPP',
  'Ranged General': 'RNG',
  // Exotic/Popular stats
  'Healing Potency': 'HEAL',
  'Medical Combat Speed': 'MCS',
  'Weapon Speed': 'WSP',
  'Surveying': 'SRV',
  'Experimentation': 'EXP',
  'Luck': 'LCK',
  'Precision': 'PRC',
  'Agility': 'AGI',
  'Strength': 'STR',
  'Constitution': 'CON',
  'Stamina': 'STA',
  'Block Chance': 'BLK',
  'Block Value': 'BLV',
  'Evasion Chance': 'EVA',
  'Evasion Value': 'EVV',
  'Critical Hit Chance': 'CRT',
  'Strikethrough Chance': 'STK',
  'Action Cost Reduction': 'ACR',
  'Dodge': 'DDG'
};

// Core armor stats - can be used in normal armor slots
const CORE_ARMOR_STATS = [
  'Camouflage',
  'Defense General',
  'Endurance Boost', 
  'Melee General',
  'Toughness Boost',
  'Opportune Chance',
  'Ranged General'
];

/**
 * Get abbreviated stat name
 */
function getStatAbbr(statName) {
  if (STAT_ABBREVIATIONS[statName]) {
    return STAT_ABBREVIATIONS[statName];
  }
  // Generate abbreviation from first 3 letters
  return statName.substring(0, 3).toUpperCase();
}

/**
 * Check if a stat is a core armor stat
 */
function isCoreArmorStat(statName) {
  return CORE_ARMOR_STATS.includes(statName);
}

/**
 * Render a single slot card for visual view
 * Uses wrapper structure with stat tags in sidebar
 */
function renderSlotCard(slot, slotData) {
  const hasStats = slotData?.stats?.length > 0 && slotData.stats.some(s => s.modifier);
  const statList = slotData?.stats?.filter(s => s.modifier) || [];
  
  const classes = [
    'slot-card',
    slot.isExotic ? 'exotic' : '',
    hasStats ? 'has-stats' : ''
  ].filter(Boolean).join(' ');
  
  // Build stat tags for sidebar display
  const statTagsHtml = statList.map(s => {
    const abbr = getStatAbbr(s.modifier);
    const isCore = isCoreArmorStat(s.modifier);
    const tagClass = isCore ? 'stat-tag core' : 'stat-tag exotic';
    return `<span class="${tagClass}" title="${s.modifier}">${abbr}</span>`;
  }).join('');
  
  // Determine column position for correct tag placement
  const leftColumn = ['lbicep', 'lbracer', 'gloves'];
  const rightColumn = ['rbicep', 'rbracer', 'weapon'];
  const isLeft = leftColumn.includes(slot.id);
  const isRight = rightColumn.includes(slot.id);
  
  // Wrapper class determines layout direction
  let wrapperClass = 'slot-wrapper';
  if (isRight) wrapperClass += ' slot-right';
  else if (!isLeft) wrapperClass += ' slot-center';
  
  // Only render sidebar if there are stats
  const sidebarHtml = hasStats ? `<div class="slot-tags-sidebar">${statTagsHtml}</div>` : '';
  
  return `
    <div class="${wrapperClass}" data-slot-id="${slot.id}">
      ${sidebarHtml}
      <div class="${classes}">
        <span class="slot-name">${slot.name}</span>
        ${slot.isExotic ? '<span class="exotic-label">EXOTIC</span>' : ''}
      </div>
    </div>
  `;
}

/**
 * Render a single slot list item
 */
function renderSlotListItem(slot, slotData) {
  const hasStats = slotData?.stats?.length > 0 && slotData.stats.some(s => s.modifier);
  const statList = slotData?.stats
    ?.filter(s => s.modifier)
    .map(s => s.modifier)
    .join(', ') || 'Empty';
  
  const classes = [
    'slot-list-item',
    slot.isExotic ? 'exotic' : '',
    hasStats ? 'has-stats' : ''
  ].filter(Boolean).join(' ');
  
  return `
    <div class="${classes}" data-slot-id="${slot.id}">
      <div class="slot-list-header">
        <span class="slot-name">${slot.name}</span>
        ${slot.isExotic ? '<span class="exotic-badge">EXOTIC</span>' : ''}
      </div>
      <div class="slot-list-stats">${statList}</div>
      <div class="slot-list-power">+${slotData?.powerBit || 35}</div>
    </div>
  `;
}
