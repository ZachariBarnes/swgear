/**
 * FamiliarPicker Component
 * Allows selection of one familiar at a time for stat bonuses
 */

// Familiar definitions with their stat bonuses
export const FAMILIARS = {
  none: {
    name: 'None',
    icon: '❌',
    description: 'No familiar active',
    stats: []
  },
  gackle_bat: {
    name: 'Gackle Bat',
    icon: '🦇',
    description: '+40 Ranged, +40 Melee',
    stats: [
      { modifier: 'Ranged General', value: 40 },
      { modifier: 'Melee General', value: 40 }
    ]
  },
  xwing_tie: {
    name: 'X-Wing / TIE Fighter',
    icon: '✈️',
    description: '+40 Defense General',
    stats: [
      { modifier: 'Defense General', value: 40 }
    ]
  },
  nightspider: {
    name: 'Nightspider',
    icon: '🕷️',
    description: '+40 Endurance',
    stats: [
      { modifier: 'Endurance', value: 40 }
    ]
  },
  mouse_droid: {
    name: 'Mouse Droid',
    icon: '🤖',
    description: '+60 Toughness',
    stats: [
      { modifier: 'Toughness', value: 60 }
    ]
  }
};

/**
 * Get the stat bonuses from the selected familiar
 * @param {string} familiarId - The familiar ID (key from FAMILIARS)
 * @returns {Array} Array of {modifier, value, source: 'familiar'}
 */
export function getFamiliarStats(familiarId) {
  const familiar = FAMILIARS[familiarId];
  if (!familiar || familiarId === 'none') return [];
  
  return familiar.stats.map(s => ({
    modifier: s.modifier,
    value: s.value,
    source: 'familiar'
  }));
}

/**
 * Render the familiar picker section
 * @param {HTMLElement} container - Container element
 * @param {string} selectedFamiliar - Currently selected familiar ID
 * @param {Function} onSelect - Callback when familiar changes (familiarId) => void
 */
export function renderFamiliarPicker(container, selectedFamiliar = 'none', onSelect) {
  const current = FAMILIARS[selectedFamiliar] || FAMILIARS.none;
  
  const html = `
    <div class="familiar-section">
      <div class="familiar-header">
        <h4>🐾 Familiar</h4>
        <span class="familiar-hint">One at a time, stacks with food buffs</span>
      </div>
      
      <div class="familiar-picker">
        <div class="familiar-current" id="familiar-dropdown-toggle">
          <span class="familiar-icon">${current.icon}</span>
          <div class="familiar-info">
            <span class="familiar-name">${current.name}</span>
            ${selectedFamiliar !== 'none' ? `<span class="familiar-stats">${current.description}</span>` : ''}
          </div>
          <span class="familiar-arrow">▾</span>
        </div>
        
        <div class="familiar-dropdown" id="familiar-dropdown" hidden>
          ${Object.entries(FAMILIARS).map(([id, fam]) => `
            <button class="familiar-option ${id === selectedFamiliar ? 'selected' : ''}" data-familiar="${id}">
              <span class="familiar-icon">${fam.icon}</span>
              <div class="familiar-option-info">
                <span class="familiar-name">${fam.name}</span>
                <span class="familiar-desc">${fam.description}</span>
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Set up event listeners
  const toggle = container.querySelector('#familiar-dropdown-toggle');
  const dropdown = container.querySelector('#familiar-dropdown');
  
  const positionDropdown = () => {
    const rect = toggle.getBoundingClientRect();
    dropdown.style.position = 'fixed';
    dropdown.style.left = `${rect.left}px`;
    dropdown.style.width = `${rect.width}px`;
    dropdown.style.bottom = `${window.innerHeight - rect.top + 4}px`;
    dropdown.style.top = 'auto';
  };
  
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const wasHidden = dropdown.hidden;
    dropdown.hidden = !wasHidden;
    if (wasHidden) {
      positionDropdown();
    }
  });
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    dropdown.hidden = true;
  });
  
  // Handle familiar selection
  container.querySelectorAll('.familiar-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const familiarId = btn.dataset.familiar;
      dropdown.hidden = true;
      onSelect(familiarId);
    });
  });
}
