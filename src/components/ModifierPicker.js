/**
 * ModifierPicker Component
 * Modal for selecting modifiers to add to slots
 * Now includes popular stat prioritization
 */

import { maxValueAtPowerBit } from '../utils/calculator.js';

// Category display names
const CATEGORY_DISPLAY = {
  core_armor: 'Core Armor Stats',
  core_stats: 'Core Stats',
  combat_defense: 'Combat Defense',
  combat_offense: 'Combat Offense',
  combat_weapon_specific: 'Weapon Specific',
  combat_profession_specific: 'Profession Specific',
  profession_trader: 'Trader',
  profession_entertainer: 'Entertainer',
  profession_jedi: 'Jedi',
  profession_shipwright: 'Shipwright',
  profession_commando: 'Commando',
  beast_master: 'Beast Master',
  elemental_penetration: 'Elemental Penetration'
};

// Popular stats that should appear at top
const POPULAR_STATS = [
  'Healing Potency',
  'Medical Combat Speed',
  'Weapon Speed',
  'Surveying',
  'Experimentation',
  'Luck',
  'Precision',
  'Agility',
  'Strength',
  'Constitution',
  'Stamina',
  'Block Chance',
  'Block Value',
  'Evasion Chance',
  'Evasion Value',
  'Critical Hit Chance',
  'Strikethrough Chance',
  'Action Cost Reduction'
];

// Core armor stats - ONLY these can be used in normal (non-exotic) armor slots
// Source: SWG Restoration wiki - these are the base attribute SEAs for armor
const CORE_ARMOR_STATS = [
  'Camouflage',
  'Defense General',
  'Endurance Boost', 
  'Melee General',
  'Toughness Boost',
  'Opportune Chance',
  'Ranged General'
];

let currentModifiers = [];
let combinationsData = null;
let currentCallback = null;
let currentSlotId = null;
let currentStatIndex = null;
let currentIsExotic = false; // Track if current slot is exotic
let currentExcludedStats = []; // Stats already in this slot (prevent duplicates)

/**
 * Initialize the modifier picker
 * @param {Array} modifiers - All available modifiers
 * @param {Object} combinations - Combination data to check recipe availability
 */
export function initModifierPicker(modifiers, combinations = null) {
  currentModifiers = modifiers;
  combinationsData = combinations;
  
  const modal = document.getElementById('modifier-modal');
  const backdrop = modal.querySelector('.modal-backdrop');
  const closeBtn = modal.querySelector('.modal-close');
  const searchInput = document.getElementById('modifier-search');
  const filterBtns = modal.querySelectorAll('.filter-btn');
  
  // Close handlers
  backdrop.addEventListener('click', closeModifierPicker);
  closeBtn.addEventListener('click', closeModifierPicker);
  
  // Search handler - use stored isExotic state
  searchInput.addEventListener('input', (e) => {
    renderModifierList(e.target.value, getActiveFilter(), currentIsExotic);
  });
  
  // Filter handlers
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderModifierList(searchInput.value, btn.dataset.category, currentIsExotic);
    });
  });
  
  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !modal.hidden) {
      closeModifierPicker();
    }
  });
}

/**
 * Open the modifier picker for a slot
 * @param {string} slotId - ID of the slot
 * @param {number} statIndex - Index of the stat being edited
 * @param {Function} onSelect - Callback when modifier is selected
 * @param {boolean} isExotic - Whether slot is exotic (allows all modifiers)
 * @param {Array} excludedStats - Stats already in this slot (to prevent duplicates)
 */
export function openModifierPicker(slotId, statIndex, onSelect, isExotic = false, excludedStats = []) {
  currentCallback = onSelect;
  currentSlotId = slotId;
  currentStatIndex = statIndex;
  currentIsExotic = isExotic; // Store for filter/search handlers
  currentExcludedStats = excludedStats; // Stats to exclude from picker
  
  const modal = document.getElementById('modifier-modal');
  const searchInput = document.getElementById('modifier-search');
  const modalHeader = modal.querySelector('.modal-header h3');
  const filterBtns = modal.querySelectorAll('.filter-btn');
  
  // Update modal title based on slot type
  modalHeader.textContent = isExotic ? 'Select Modifier (Exotic - Any Stat)' : 'Select Modifier (Core Stats Only)';
  
  // Set default filter: Core for non-exotic, All for exotic
  const defaultFilter = isExotic ? 'all' : 'core';
  filterBtns.forEach(btn => {
    // Hide Popular filter for now
    if (btn.dataset.category === 'popular') {
      btn.style.display = 'none';
    }
    btn.classList.toggle('active', btn.dataset.category === defaultFilter);
  });
  
  searchInput.value = '';
  modal.hidden = false;
  
  // Focus search input
  setTimeout(() => searchInput.focus(), 100);
  
  // Render initial list with the default filter
  renderModifierList('', defaultFilter, isExotic);
}

/**
 * Close the modifier picker
 */
export function closeModifierPicker() {
  const modal = document.getElementById('modifier-modal');
  modal.hidden = true;
  currentCallback = null;
}

/**
 * Get the currently active filter category
 */
function getActiveFilter() {
  const activeBtn = document.querySelector('.filter-btn.active');
  return activeBtn?.dataset.category || 'all';
}

/**
 * Check if a modifier has known combinations
 */
function hasRecipe(modifierName) {
  if (!combinationsData) return true; // Assume available if no data
  
  for (const item1 of Object.keys(combinationsData)) {
    for (const combo of Object.values(combinationsData[item1])) {
      if (combo.name === modifierName) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Render the modifier list with current filters
 * @param {string} searchQuery - Search text
 * @param {string} categoryFilter - Category filter
 * @param {boolean} isExotic - Whether exotic slot (allows all)
 */
function renderModifierList(searchQuery, categoryFilter, isExotic = false) {
  const listContainer = document.getElementById('modifier-list');
  
  let filtered = currentModifiers;
  
  // Apply category filter
  if (categoryFilter === 'core') {
    filtered = filtered.filter(m => CORE_ARMOR_STATS.includes(m.name));
  } else if (categoryFilter === 'popular') {
    filtered = filtered.filter(m => POPULAR_STATS.includes(m.name));
  } else if (categoryFilter === 'combat') {
    filtered = filtered.filter(m => 
      m.category.startsWith('combat_') || 
      m.category === 'elemental_penetration'
    );
  } else if (categoryFilter === 'crafting') {
    filtered = filtered.filter(m => 
      m.category.startsWith('profession_') || 
      m.category === 'beast_master'
    );
  }
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(m => 
      m.name.toLowerCase().includes(query) ||
      m.category.toLowerCase().includes(query)
    );
  }
  
  // Filter out modifiers without known recipes (can't be crafted)
  filtered = filtered.filter(m => hasRecipe(m.name));
  
  // Filter out already-selected stats in this slot (prevent duplicates)
  if (currentExcludedStats && currentExcludedStats.length > 0) {
    filtered = filtered.filter(m => !currentExcludedStats.includes(m.name));
  }
  
  // CRITICAL: If NOT exotic slot, only show core armor stats
  if (!isExotic) {
    filtered = filtered.filter(m => CORE_ARMOR_STATS.includes(m.name));
  }
  
  // Sort: popular first, then alphabetically
  filtered.sort((a, b) => {
    const aPopular = POPULAR_STATS.includes(a.name);
    const bPopular = POPULAR_STATS.includes(b.name);
    if (aPopular && !bPopular) return -1;
    if (!aPopular && bPopular) return 1;
    
    // Within popular, maintain order from POPULAR_STATS array
    if (aPopular && bPopular) {
      return POPULAR_STATS.indexOf(a.name) - POPULAR_STATS.indexOf(b.name);
    }
    
    return a.name.localeCompare(b.name);
  });
  
  listContainer.innerHTML = filtered.map(mod => {
    const isPopular = POPULAR_STATS.includes(mod.name);
    const maxVal = maxValueAtPowerBit(mod.ratio, 35);
    const categoryName = CATEGORY_DISPLAY[mod.category] || mod.category;
    
    const classes = [
      'modifier-item',
      isPopular ? 'popular' : ''
    ].filter(Boolean).join(' ');
    
    return `
      <div class="${classes}" data-modifier="${mod.name}" data-ratio="${mod.ratio}">
        <div class="modifier-info">
          <span class="modifier-name">${mod.name}</span>
          <span class="modifier-category">${categoryName}</span>
        </div>
        <div class="modifier-stats">
          <span class="modifier-ratio">1:${mod.ratio}</span>
          <span class="modifier-max">Max +${maxVal}</span>
        </div>
      </div>
    `;
  }).join('');
  
  // Add click handlers
  listContainer.querySelectorAll('.modifier-item').forEach(item => {
    item.addEventListener('click', () => {
      const modName = item.dataset.modifier;
      const ratio = parseInt(item.dataset.ratio, 10);
      
      if (currentCallback) {
        currentCallback(currentSlotId, currentStatIndex, { modifier: modName, ratio });
      }
      
      closeModifierPicker();
    });
  });
}
