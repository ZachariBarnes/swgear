/**
 * JewelryEditor Component
 * Manages 5 fixed jewelry slots with stat inputs
 */

// Core stats that can appear on jewelry
const CORE_STATS = [
  'Ranged General',
  'Melee General', 
  'Defense General',
  'Toughness Boost',
  'Endurance Boost',
  'Opportune Chance'
];

// Jewelry slot configuration
const JEWELRY_SLOTS = [
  { id: 'necklace', name: 'Necklace', icon: '📿', maxStats: 3 },
  { id: 'ring1', name: 'Ring 1', icon: '💍', maxStats: 3 },
  { id: 'ring2', name: 'Ring 2', icon: '💍', maxStats: 3 },
  { id: 'bracelet1', name: 'Left Bracelet', icon: '⌚', maxStats: 3 },
  { id: 'bracelet2', name: 'Right Bracelet', icon: '⌚', maxStats: 3 }
];

/**
 * Render the jewelry editor
 * @param {HTMLElement} container - Container element
 * @param {Object} jewelry - Current jewelry data { slotId: [{stat, value}] }
 * @param {Function} onUpdate - Callback when jewelry changes
 */
export function renderJewelryEditor(container, jewelry, onUpdate) {
  if (!jewelry) jewelry = {};
  
  const html = `
    <div class="jewelry-editor">
      <div class="jewelry-slots">
        ${JEWELRY_SLOTS.map(slot => renderJewelrySlot(slot, jewelry[slot.id] || [])).join('')}
      </div>
      
      <div class="jewelry-summary">
        <h3>Jewelry Stat Totals</h3>
        ${renderJewelryTotals(jewelry)}
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  setupJewelryListeners(container, jewelry, onUpdate);
}

/**
 * Render a single jewelry slot
 */
function renderJewelrySlot(slotConfig, stats) {
  const { id, name, icon, maxStats } = slotConfig;
  
  // Ensure we have stat slots (with empty placeholders)
  const statSlots = [...stats];
  while (statSlots.length < maxStats) {
    statSlots.push({ stat: '', value: 0 });
  }
  
  return `
    <div class="jewelry-slot" data-slot="${id}">
      <div class="jewelry-slot-header">
        <span class="jewelry-icon">${icon}</span>
        <span class="jewelry-name">${name}</span>
      </div>
      <div class="jewelry-stats">
        ${statSlots.map((s, idx) => `
          <div class="jewelry-stat-row">
            <select class="jewelry-stat-select" data-slot="${id}" data-idx="${idx}">
              <option value="">-- Select Stat --</option>
              ${CORE_STATS.map(stat => `
                <option value="${stat}" ${s.stat === stat ? 'selected' : ''}>${stat}</option>
              `).join('')}
            </select>
            <div class="jewelry-value-input">
              <span class="prefix">+</span>
              <input type="number" 
                     class="jewelry-value" 
                     data-slot="${id}" 
                     data-idx="${idx}" 
                     value="${s.value || ''}" 
                     min="0" 
                     max="50"
                     placeholder="0"
                     ${!s.stat ? 'disabled' : ''}>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

/**
 * Render jewelry totals summary
 */
function renderJewelryTotals(jewelry) {
  const totals = {};
  
  for (const stats of Object.values(jewelry)) {
    for (const { stat, value } of stats) {
      if (stat && value) {
        totals[stat] = (totals[stat] || 0) + parseInt(value, 10);
      }
    }
  }
  
  const entries = Object.entries(totals);
  if (entries.length === 0) {
    return '<p class="empty-state-sm">Add stats to your jewelry to see totals.</p>';
  }
  
  return `
    <div class="jewelry-totals-grid">
      ${entries.map(([stat, total]) => `
        <div class="jewelry-total-row">
          <span class="total-stat">${stat}</span>
          <span class="total-value">+${total}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Set up event listeners
 */
function setupJewelryListeners(container, jewelry, onUpdate) {
  // Stat selection
  container.querySelectorAll('.jewelry-stat-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const slotId = e.target.dataset.slot;
      const idx = parseInt(e.target.dataset.idx, 10);
      const newStat = e.target.value;
      
      // Update jewelry data
      if (!jewelry[slotId]) jewelry[slotId] = [];
      while (jewelry[slotId].length <= idx) {
        jewelry[slotId].push({ stat: '', value: 0 });
      }
      jewelry[slotId][idx].stat = newStat;
      
      // Enable/disable value input
      const valueInput = container.querySelector(
        `.jewelry-value[data-slot="${slotId}"][data-idx="${idx}"]`
      );
      if (valueInput) {
        valueInput.disabled = !newStat;
        if (!newStat) {
          valueInput.value = '';
          jewelry[slotId][idx].value = 0;
        }
      }
      
      onUpdate({ ...jewelry });
    });
  });
  
  // Value changes
  container.querySelectorAll('.jewelry-value').forEach(input => {
    input.addEventListener('change', (e) => {
      const slotId = e.target.dataset.slot;
      const idx = parseInt(e.target.dataset.idx, 10);
      const value = parseInt(e.target.value, 10) || 0;
      
      if (!jewelry[slotId]) jewelry[slotId] = [];
      while (jewelry[slotId].length <= idx) {
        jewelry[slotId].push({ stat: '', value: 0 });
      }
      jewelry[slotId][idx].value = value;
      
      onUpdate({ ...jewelry });
    });
  });
}

/**
 * Calculate total stats from jewelry
 * @param {Object} jewelry - Jewelry data
 * @returns {Object} - Map of stat name to total value
 */
export function calculateJewelryTotals(jewelry) {
  const totals = {};
  
  if (!jewelry) return totals;
  
  for (const stats of Object.values(jewelry)) {
    for (const { stat, value } of stats) {
      if (stat && value) {
        totals[stat] = (totals[stat] || 0) + parseInt(value, 10);
      }
    }
  }
  
  return totals;
}
