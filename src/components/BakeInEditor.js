/**
 * BakeInEditor Component
 * Manages baked-in armor stats (stats applied during factory manufacture)
 * 
 * BAKE-IN RULES (per SWGR wiki):
 * - Core stats only (Defense General, Ranged/Melee General, Toughness, Endurance, Opportune)
 * - Max +14 per slot at 35 powerbit
 * - Only applies to chest and weapon slots
 * - In Jedi mode, locked slots (biceps, bracers, belt) are excluded
 */

// Armor slots that can have bake-in stats (only chest and weapon)
const BAKEABLE_SLOTS = ['chest', 'weapon'];

// Core stats that can be baked in (confirmed by SWGR wiki)
const BAKEABLE_STATS = [
  'Defense General',
  'Ranged General',
  'Melee General', 
  'Toughness Boost',
  'Endurance Boost',
  'Opportune Chance'
];

// Default bake-in value for 35 powerbit armor
const DEFAULT_BAKEIN_VALUE = 14;

// Slot display names
const SLOT_NAMES = {
  chest: 'Chest', weapon: 'Weapon'
};

/**
 * Render the bake-in stats editor
 * @param {HTMLElement} container - Container element
 * @param {Object} bakeInStats - Current bake-in config {enabled, global, perSlot}
 * @param {Function} onUpdate - Callback when bake-in changes
 * @param {Array} jediLockedSlots - Array of slot IDs locked by Jedi equipment
 */
export function renderBakeInEditor(container, bakeInStats, onUpdate, jediLockedSlots = []) {
  if (!bakeInStats) {
    bakeInStats = { enabled: false, global: null, perSlot: {} };
  }
  
  // Filter out Jedi-locked slots
  const availableSlots = BAKEABLE_SLOTS.filter(s => !jediLockedSlots.includes(s));
  
  const { enabled, global, perSlot } = bakeInStats;
  const showPerSlot = enabled && Object.keys(perSlot).length > 0;
  
  // Build stat options for dropdown
  const statOptions = BAKEABLE_STATS.map(stat => 
    `<option value="${stat}">${stat}</option>`
  ).join('');
  
  const html = `
    <div class="bakein-editor">
      <div class="bakein-header">
        <h4>🔧 Bake-In Stats</h4>
        <label class="toggle-switch" title="Enable baked-in stats on armor">
          <input type="checkbox" id="bakein-enabled" ${enabled ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
      
      ${enabled ? `
        <p class="bakein-hint">Core stats only, +${DEFAULT_BAKEIN_VALUE} per slot at 35 powerbit. Only chest and weapon can have bake-in stats.</p>
        
        <div class="bakein-global">
          <div class="bakein-global-row">
            <span class="bakein-label">Apply to chest &amp; weapon:</span>
            <select class="bakein-select" id="bakein-global-stat">
              <option value="">— None —</option>
              ${BAKEABLE_STATS.map(stat => 
                `<option value="${stat}" ${global?.modifier === stat ? 'selected' : ''}>${stat}</option>`
              ).join('')}
            </select>
            <div class="bakein-value-input">
              <span class="prefix">+</span>
              <input type="number" id="bakein-global-value" value="${global?.value || DEFAULT_BAKEIN_VALUE}" min="1" max="35" step="1">
            </div>
          </div>
          
          <div class="bakein-actions">
            <button class="btn btn-sm btn-secondary" id="bakein-toggle-perslot">
              ${showPerSlot ? 'Hide Per-Slot' : 'Customize Per-Slot'}
            </button>
          </div>
        </div>
        
        ${showPerSlot ? `
          <div class="bakein-perslot">
            ${availableSlots.map(slotId => {
              const slotBake = perSlot[slotId];
              const effectiveStat = slotBake?.modifier || global?.modifier || '';
              const effectiveValue = slotBake?.value ?? global?.value ?? DEFAULT_BAKEIN_VALUE;
              return `
                <div class="bakein-slot-row" data-slot="${slotId}">
                  <span class="bakein-slot-name">${SLOT_NAMES[slotId]}</span>
                  <select class="bakein-slot-select" data-slot="${slotId}">
                    <option value="">— ${global ? 'Use Global' : 'None'} —</option>
                    ${BAKEABLE_STATS.map(stat => 
                      `<option value="${stat}" ${slotBake?.modifier === stat ? 'selected' : ''}>${stat}</option>`
                    ).join('')}
                  </select>
                  <div class="bakein-value-input bakein-slot-value-input">
                    <span class="prefix">+</span>
                    <input type="number" class="bakein-slot-value" data-slot="${slotId}" 
                           value="${slotBake?.value ?? DEFAULT_BAKEIN_VALUE}" min="1" max="35" step="1"
                           ${!slotBake?.modifier ? 'disabled' : ''}>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : ''}
      ` : `
        <p class="bakein-hint-disabled">Enable to add core stats baked into your armor pieces.</p>
      `}
    </div>
  `;
  
  container.innerHTML = html;
  setupBakeInListeners(container, bakeInStats, onUpdate);
}

/**
 * Set up event listeners for bake-in controls
 */
function setupBakeInListeners(container, bakeInStats, onUpdate) {
  // Enable/disable toggle
  const enableToggle = container.querySelector('#bakein-enabled');
  if (enableToggle) {
    enableToggle.addEventListener('change', (e) => {
      onUpdate({ ...bakeInStats, enabled: e.target.checked });
    });
  }
  
  // Global stat select
  const globalStatSelect = container.querySelector('#bakein-global-stat');
  const globalValueInput = container.querySelector('#bakein-global-value');
  
  if (globalStatSelect) {
    globalStatSelect.addEventListener('change', (e) => {
      const modifier = e.target.value;
      const value = parseInt(globalValueInput?.value || DEFAULT_BAKEIN_VALUE, 10);
      
      if (modifier) {
        onUpdate({
          ...bakeInStats,
          global: { modifier, value }
        });
      } else {
        onUpdate({ ...bakeInStats, global: null });
      }
    });
  }
  
  if (globalValueInput) {
    globalValueInput.addEventListener('change', (e) => {
      const value = parseInt(e.target.value, 10) || DEFAULT_BAKEIN_VALUE;
      const modifier = globalStatSelect?.value;
      
      if (modifier) {
        onUpdate({
          ...bakeInStats,
          global: { modifier, value }
        });
      }
    });
  }
  
  // Toggle per-slot view
  const togglePerSlot = container.querySelector('#bakein-toggle-perslot');
  if (togglePerSlot) {
    togglePerSlot.addEventListener('click', () => {
      const hasPerSlot = Object.keys(bakeInStats.perSlot).length > 0;
      if (hasPerSlot) {
        // Clear per-slot to hide
        onUpdate({ ...bakeInStats, perSlot: {} });
      } else {
        // Initialize with empty per-slot to show (will inherit global)
        onUpdate({ 
          ...bakeInStats, 
          perSlot: BAKEABLE_SLOTS.reduce((acc, id) => ({ ...acc, [id]: null }), {})
        });
      }
    });
  }
  
  // Per-slot selects
  container.querySelectorAll('.bakein-slot-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const slotId = select.dataset.slot;
      const modifier = e.target.value;
      const valueInput = container.querySelector(`.bakein-slot-value[data-slot="${slotId}"]`);
      const value = parseInt(valueInput?.value || DEFAULT_BAKEIN_VALUE, 10);
      
      if (modifier) {
        if (valueInput) valueInput.disabled = false;
        onUpdate({
          ...bakeInStats,
          perSlot: {
            ...bakeInStats.perSlot,
            [slotId]: { modifier, value }
          }
        });
      } else {
        if (valueInput) valueInput.disabled = true;
        const newPerSlot = { ...bakeInStats.perSlot };
        newPerSlot[slotId] = null;
        onUpdate({ ...bakeInStats, perSlot: newPerSlot });
      }
    });
  });
  
  // Per-slot value inputs
  container.querySelectorAll('.bakein-slot-value').forEach(input => {
    input.addEventListener('change', (e) => {
      const slotId = input.dataset.slot;
      const value = parseInt(e.target.value, 10) || DEFAULT_BAKEIN_VALUE;
      const select = container.querySelector(`.bakein-slot-select[data-slot="${slotId}"]`);
      const modifier = select?.value;
      
      if (modifier) {
        onUpdate({
          ...bakeInStats,
          perSlot: {
            ...bakeInStats.perSlot,
            [slotId]: { modifier, value }
          }
        });
      }
    });
  });
}

/**
 * Calculate total bake-in stat bonuses
 * @param {Object} bakeInStats - Bake-in configuration
 * @param {Array} jediLockedSlots - Array of slot IDs locked by Jedi equipment
 * @returns {Array} - Array of { modifier, value } totals
 */
export function calculateBakeInTotals(bakeInStats, jediLockedSlots = []) {
  if (!bakeInStats || !bakeInStats.enabled) return [];
  
  const availableSlots = BAKEABLE_SLOTS.filter(s => !jediLockedSlots.includes(s));
  
  const totals = {};
  
  for (const slotId of availableSlots) {
    // Per-slot overrides global
    const slotBake = bakeInStats.perSlot?.[slotId] || bakeInStats.global;
    
    if (slotBake && slotBake.modifier) {
      if (!totals[slotBake.modifier]) {
        totals[slotBake.modifier] = 0;
      }
      totals[slotBake.modifier] += slotBake.value;
    }
  }
  
  return Object.entries(totals).map(([modifier, value]) => ({ modifier, value }));
}
