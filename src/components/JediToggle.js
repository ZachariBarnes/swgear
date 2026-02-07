/**
 * JediToggle Component
 * Stylish toggle button for Jedi build mode
 */

/**
 * Render the Jedi toggle as a stylish button
 * @param {HTMLElement} container - Container element
 * @param {boolean} isJediMode - Current Jedi mode state
 * @param {Function} onChange - Callback when toggle changes
 */
export function renderJediToggle(container, isJediMode, onChange) {
  const activeClass = isJediMode ? 'active' : '';
  
  container.innerHTML = `
    <button class="jedi-toggle-btn ${activeClass}" id="jedi-mode-btn" title="${isJediMode ? 'Switch to Standard Build' : 'Switch to Jedi Build Mode'}">
      <span class="jedi-icon">⚔️</span>
      <span class="jedi-text">${isJediMode ? 'Jedi Mode' : 'Standard Mode'}</span>
    </button>
  `;
  
  const btn = container.querySelector('#jedi-mode-btn');
  if (btn) {
    btn.addEventListener('click', () => {
      onChange(!isJediMode);
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
