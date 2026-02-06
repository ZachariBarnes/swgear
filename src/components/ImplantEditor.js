/**
 * ImplantEditor Component
 * Manages veteran reward implants (+40 permanent stats, distributed in +5 increments)
 * Core stats only: Defense General, Ranged/Melee General, Toughness, Endurance, Opportune
 */

// Core stats available for implants
const IMPLANT_STATS = [
  { name: 'Defense General', abbr: 'DEF' },
  { name: 'Ranged General', abbr: 'RNG' },
  { name: 'Melee General', abbr: 'MEL' },
  { name: 'Toughness Boost', abbr: 'TGH' },
  { name: 'Endurance Boost', abbr: 'END' },
  { name: 'Opportune Chance', abbr: 'OPP' }
];

const MAX_IMPLANT_POINTS = 40;
const INCREMENT = 5;

/**
 * Render the implant editor
 * @param {HTMLElement} container - Container element
 * @param {Object} implants - Current implant distribution {statName: value}
 * @param {Function} onUpdate - Callback when implants change
 */
export function renderImplantEditor(container, implants = {}, onUpdate) {
  const totalUsed = getTotalImplantPoints(implants);
  const remaining = MAX_IMPLANT_POINTS - totalUsed;
  
  const html = `
    <div class="implant-editor">
      <div class="implant-header">
        <h4>💉 Veteran Implants</h4>
        <span class="implant-points ${remaining === 0 ? 'full' : ''}">${totalUsed}/${MAX_IMPLANT_POINTS}</span>
      </div>
      <p class="implant-hint">Permanent +40 total, distributed in +5 increments</p>
      
      <div class="implant-stats">
        ${IMPLANT_STATS.map(stat => {
          const value = implants[stat.name] || 0;
          const canIncrease = remaining >= INCREMENT;
          const canDecrease = value >= INCREMENT;
          
          return `
            <div class="implant-stat-row">
              <span class="implant-stat-name" title="${stat.name}">${stat.abbr}</span>
              <div class="implant-controls">
                <button class="implant-btn decrease ${!canDecrease ? 'disabled' : ''}" 
                        data-stat="${stat.name}" data-action="decrease"
                        ${!canDecrease ? 'disabled' : ''}>−</button>
                <span class="implant-value ${value > 0 ? 'has-value' : ''}">${value}</span>
                <button class="implant-btn increase ${!canIncrease ? 'disabled' : ''}" 
                        data-stat="${stat.name}" data-action="increase"
                        ${!canIncrease ? 'disabled' : ''}>+</button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
      
      ${totalUsed > 0 ? `
        <button class="btn btn-sm btn-ghost implant-reset" id="implant-reset">Reset All</button>
      ` : ''}
    </div>
  `;
  
  container.innerHTML = html;
  setupImplantListeners(container, implants, onUpdate);
}

/**
 * Set up event listeners
 */
function setupImplantListeners(container, implants, onUpdate) {
  // Increase/decrease buttons
  container.querySelectorAll('.implant-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      
      const statName = btn.dataset.stat;
      const action = btn.dataset.action;
      const currentValue = implants[statName] || 0;
      
      let newValue = currentValue;
      if (action === 'increase') {
        newValue = currentValue + INCREMENT;
      } else if (action === 'decrease') {
        newValue = Math.max(0, currentValue - INCREMENT);
      }
      
      const newImplants = { ...implants };
      if (newValue > 0) {
        newImplants[statName] = newValue;
      } else {
        delete newImplants[statName];
      }
      
      onUpdate(newImplants);
    });
  });
  
  // Reset button
  const resetBtn = container.querySelector('#implant-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      onUpdate({});
    });
  }
}

/**
 * Get total implant points used
 */
export function getTotalImplantPoints(implants = {}) {
  return Object.values(implants).reduce((sum, val) => sum + (val || 0), 0);
}

/**
 * Get implant stats as array for stat summary
 * @param {Object} implants - Implant distribution
 * @returns {Array} - Array of {modifier, value, source: 'implant'}
 */
export function getImplantStats(implants = {}) {
  return Object.entries(implants)
    .filter(([_, value]) => value > 0)
    .map(([modifier, value]) => ({
      modifier,
      value,
      source: 'implant'
    }));
}
