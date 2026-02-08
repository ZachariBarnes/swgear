/**
 * SlotBuilder Component
 * Renders armor slots in SWG-style layout
 * Based on SWG Restoration armor/SEA system:
 * - Exotic slots: Shirt, Chest, Weapon (can accept any modifier)
 * - Regular slots: Head, Biceps, Bracers, Gloves, Belt, Leggings, Boots
 * - Jedi mode: Locks biceps/bracers (robe), belt (Bodo Baas), renames weapon to Lightsaber
 */

import { JEDI_LOCKED_SLOTS } from './JediToggle.js';

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
  { id: 'belt', name: 'Belt', isExotic: false, maxStats: 3, canToggleExotic: true }, // Can be clothing (exotic) or PSG (armor)
  
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
    armorBonusHP: 0,  // Bonus HP from crafted armor (up to ~800-900 from capped resources)
    jewelry: {},       // Jewelry slots with stats
    beltType: 'clothing', // 'clothing' (exotic allowed) or 'armor' (PSG - core only)
    bakeInStats: {     // Stats baked into armor during manufacture
      enabled: false,
      global: null,    // { modifier, value } applied to all slots
      perSlot: {}      // { slotId: { modifier, value } } for per-slot customization
    }
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
 * @param {Function} onBeltToggle - Callback when belt toggle is clicked (optional)
 * @param {boolean} jediMode - Whether Jedi mode is active
 */
export function renderVisualView(container, build, onSlotClick, onBeltToggle, jediMode = false) {
  container.innerHTML = `
    <div class="armor-visual">
      ${SLOT_CONFIG.map(slot => renderSlotCard(slot, build.slots[slot.id], build.beltType, jediMode)).join('')}
    </div>
  `;
  
  // Add click handlers for slot wrappers
  container.querySelectorAll('.slot-wrapper').forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      // Don't trigger slot click if clicking belt toggle
      if (e.target.closest('.belt-toggle-inline')) return;
      
      // Don't allow clicking locked Jedi slots
      const slotId = wrapper.dataset.slotId;
      if (jediMode && isSlotLockedByJedi(slotId)) return;
      
      container.querySelectorAll('.slot-card').forEach(c => c.classList.remove('active'));
      const card = wrapper.querySelector('.slot-card');
      if (card) card.classList.add('active');
      onSlotClick(slotId);
    });
  });
  
  // Add click handler for belt toggle button
  if (onBeltToggle) {
    container.querySelectorAll('.belt-toggle-inline').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentType = build.beltType || 'clothing';
        const newType = currentType === 'clothing' ? 'armor' : 'clothing';
        onBeltToggle(newType);
      });
    });
  }
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
 * Check if a slot is locked in Jedi mode
 * Locked slots: biceps, bracers (robe) + belt (Bodo Baas)
 */
function isSlotLockedByJedi(slotId) {
  return JEDI_LOCKED_SLOTS.includes(slotId) || slotId === 'belt';
}

/**
 * Get display name for a slot, accounting for Jedi mode
 */
function getSlotDisplayName(slot, jediMode) {
  if (!jediMode) return slot.name;
  if (JEDI_LOCKED_SLOTS.includes(slot.id)) return slot.name; // Keep normal name, show "Jedi Robe" label
  if (slot.id === 'belt') return 'Belt'; // Will show "Bodo Baas" label
  if (slot.id === 'weapon') return 'Lightsaber';
  return slot.name;
}

/**
 * Render a single slot card for visual view
 * Uses wrapper structure with stat tags in sidebar
 * @param {Object} slot - Slot config
 * @param {Object} slotData - Slot build data
 * @param {string} beltType - Current belt type ('clothing' or 'armor')
 * @param {boolean} jediMode - Whether Jedi mode is active
 */
function renderSlotCard(slot, slotData, beltType = 'clothing', jediMode = false) {
  const isLocked = jediMode && isSlotLockedByJedi(slot.id);
  const isBeltLocked = jediMode && slot.id === 'belt';
  const isRobeLocked = jediMode && JEDI_LOCKED_SLOTS.includes(slot.id);
  const displayName = getSlotDisplayName(slot, jediMode);
  
  // If slot is locked by Jedi mode, render a locked version
  if (isLocked) {
    const lockedLabel = isBeltLocked ? 'Bodo Baas' : 'Jedi Robe';
    const lockedIcon = isBeltLocked ? '🗡️' : '🥋';
    
    // Show Bodo Baas stats for belt
    const lockedStatsHtml = isBeltLocked ? `
      <div class="slot-tags-sidebar">
        <span class="stat-tag core" title="Toughness Boost +50">TGH</span>
        <span class="stat-tag core" title="Opportune Chance +50">OPP</span>
        <span class="stat-tag core" title="Ranged General +50">RNG</span>
        <span class="stat-tag core" title="Melee General +50">MLE</span>
      </div>
    ` : '';
    
    // Determine column for wrapper class
    const leftColumn = ['lbicep', 'lbracer', 'gloves'];
    const rightColumn = ['rbicep', 'rbracer', 'weapon'];
    const isLeft = leftColumn.includes(slot.id);
    const isRight = rightColumn.includes(slot.id);
    let wrapperClass = 'slot-wrapper jedi-locked';
    if (isRight) wrapperClass += ' slot-right';
    else if (!isLeft) wrapperClass += ' slot-center';
    
    return `
      <div class="${wrapperClass}" data-slot-id="${slot.id}">
        ${lockedStatsHtml}
        <div class="slot-card jedi-locked-card" title="${lockedLabel}">
          <span class="slot-name">${displayName}</span>
          <span class="jedi-locked-label">${lockedIcon} ${lockedLabel}</span>
        </div>
      </div>
    `;
  }

  const hasStats = slotData?.stats?.length > 0 && slotData.stats.some(s => s.modifier);
  const statList = slotData?.stats?.filter(s => s.modifier) || [];
  
  const classes = [
    'slot-card',
    slot.isExotic ? 'exotic' : '',
    hasStats ? 'has-stats' : '',
    jediMode && slot.id === 'weapon' ? 'jedi-weapon' : ''
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
  
  // Belt toggle inline button (only for belt slot when NOT in Jedi mode) - shows current state
  const isClothing = beltType === 'clothing';
  const beltToggleHtml = (slot.canToggleExotic && !jediMode) ? `
    <button class="belt-toggle-inline ${isClothing ? 'clothing' : 'armor'}" 
            data-slot-id="${slot.id}" 
            title="${isClothing ? 'Belt (Clothing) - Click for PSG' : 'PSG (Armor) - Click for Belt'}">
      <span class="toggle-icon">${isClothing ? '👔' : '🛡️'}</span>
    </button>
  ` : '';
  
  return `
    <div class="${wrapperClass}" data-slot-id="${slot.id}">
      ${sidebarHtml}
      <div class="${classes}">
        <span class="slot-name">${displayName}</span>
        ${beltToggleHtml}
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
