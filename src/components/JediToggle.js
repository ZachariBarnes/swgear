/**
 * JediToggle Component
 * Toggle for Jedi build mode - affects available stats and slot visibility
 * Replaces belt toggle location at top of build section
 */

/**
 * Render the Jedi toggle
 * @param {HTMLElement} container - Container element
 * @param {boolean} isJediMode - Current Jedi mode state
 * @param {Function} onChange - Callback when toggle changes
 */
export function renderJediToggle(container, isJediMode, onChange) {
  const activeClass = isJediMode ? 'active' : '';
  
  container.innerHTML = `
    <div class="jedi-toggle ${activeClass}">
      <label>
        <input type="checkbox" id="jedi-mode-toggle" ${isJediMode ? 'checked' : ''}>
        <span class="jedi-icon">⚔️</span>
        Jedi Build Mode
      </label>
      <span class="jedi-hint">${isJediMode ? 'Lightsaber stats prioritized' : 'Standard armor build'}</span>
    </div>
  `;
  
  const toggle = container.querySelector('#jedi-mode-toggle');
  if (toggle) {
    toggle.addEventListener('change', (e) => {
      onChange(e.target.checked);
    });
  }
}

/**
 * Check if Jedi mode is active
 * @param {Object} build - Current build state
 * @returns {boolean}
 */
export function isJediMode(build) {
  return build?.jediMode === true;
}
