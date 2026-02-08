/**
 * JediToggle Component
 * Toggle button for Jedi build mode + cloak selector
 * 
 * When Jedi Mode is active:
 * - Locks bicep & bracer slots (lbicep, rbicep, lbracer, rbracer) — Jedi Robe
 * - Locks belt as Belt of Bodo Baas (+50 TGH/OPP/RNG/MLE)
 * - Renames weapon to "Lightsaber"
 * - Adds cloak selector for Jedi cloaks
 * - Other slots (helmet, chest, shirt, gloves, pants, boots) remain available for SEAs
 */

import jediCloaks from '../data/jediCloaks.json';

// Slots locked by Jedi robes (biceps + bracers only per user preference)
export const JEDI_LOCKED_SLOTS = ['lbicep', 'rbicep', 'lbracer', 'rbracer'];

// Belt of Bodo Baas fixed stats
export const BODO_BAAS_STATS = [
  { modifier: 'Toughness Boost', value: 50 },
  { modifier: 'Opportune Chance', value: 50 },
  { modifier: 'Ranged General', value: 50 },
  { modifier: 'Melee General', value: 50 }
];

/**
 * Get stats from the selected Jedi cloak
 * @param {string} cloakId - Selected cloak ID
 * @returns {Array} - Array of { modifier, value, source } stat objects
 */
export function getJediCloakStats(cloakId) {
  if (!cloakId || cloakId === 'none') return [];
  const cloak = jediCloaks.find(c => c.id === cloakId);
  if (!cloak) return [];
  
  const stats = [];
  // Add cloak skill mod stats
  for (const s of cloak.stats) {
    stats.push({ modifier: s.modifier, value: s.value, source: 'cloak' });
  }
  return stats;
}

/**
 * Get Belt of Bodo Baas stats when Jedi mode is active
 * @returns {Array} - Array of { modifier, value, source }
 */
export function getBodoBasStats() {
  return BODO_BAAS_STATS.map(s => ({ modifier: s.modifier, value: s.value, source: 'bodo-baas' }));
}

/**
 * Render the Jedi toggle + cloak selector
 * @param {HTMLElement} container - Container element
 * @param {Object} jediState - { enabled, cloakId }
 * @param {Function} onChange - Callback with updated jediState
 */
export function renderJediToggle(container, jediState, onChange) {
  const enabled = jediState?.enabled || false;
  const cloakId = jediState?.cloakId || 'none';
  const activeClass = enabled ? 'active' : '';
  
  const cloakOptions = jediCloaks.map(c => {
    const selected = c.id === cloakId ? 'selected' : '';
    const label = c.id === 'none' ? c.name : `${c.name}${c.attributes?.health ? ` (+${c.attributes.health} HP)` : ''}`;
    return `<option value="${c.id}" ${selected}>${label}</option>`;
  }).join('');
  
  // Get selected cloak info for display
  const selectedCloak = jediCloaks.find(c => c.id === cloakId);
  const cloakStatsHtml = selectedCloak && selectedCloak.id !== 'none' ? `
    <div class="jedi-cloak-stats">
      ${selectedCloak.stats.map(s => `<span class="jedi-stat">${s.modifier} +${s.value}</span>`).join('')}
      ${selectedCloak.attributes?.health ? `<span class="jedi-stat health">+${selectedCloak.attributes.health} HP</span>` : ''}
      ${selectedCloak.effect ? `<span class="jedi-stat force">${selectedCloak.effect}</span>` : ''}
    </div>
  ` : '';
  
  container.innerHTML = `
    <div class="jedi-controls">
      <button class="jedi-toggle-btn ${activeClass}" id="jedi-mode-btn" title="${enabled ? 'Switch to Standard Build' : 'Switch to Jedi Build Mode'}">
        <span class="jedi-icon">⚔️</span>
        <span class="jedi-text">${enabled ? 'Jedi Mode' : 'Standard Mode'}</span>
      </button>
      ${enabled ? `
        <div class="jedi-cloak-picker">
          <label class="jedi-cloak-label" for="jedi-cloak-select">Cloak:</label>
          <select class="jedi-cloak-select" id="jedi-cloak-select">
            ${cloakOptions}
          </select>
        </div>
        ${cloakStatsHtml}
        <div class="jedi-info">
          <span class="jedi-info-item" title="Belt of Bodo Baas: +50 TGH/OPP/RNG/MLE">🗡️ Bodo Baas Belt</span>
          <span class="jedi-info-item" title="Biceps & Bracers locked (Jedi Robe)">🥋 Robe (Biceps/Bracers)</span>
        </div>
      ` : ''}
    </div>
  `;
  
  // Toggle button
  const btn = container.querySelector('#jedi-mode-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      onChange({ enabled: !enabled, cloakId: enabled ? 'none' : cloakId });
    });
  }
  
  // Cloak selector
  const cloakSelect = container.querySelector('#jedi-cloak-select');
  if (cloakSelect) {
    cloakSelect.addEventListener('change', (e) => {
      onChange({ enabled, cloakId: e.target.value });
    });
  }
}

/**
 * Check if Jedi mode is active
 * @param {Object} build - Current build state
 * @returns {boolean}
 */
export function isJediMode(build) {
  return build?.jediMode?.enabled === true;
}
