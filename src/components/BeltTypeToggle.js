/**
 * BeltTypeToggle Component
 * Toggle between Belt (Clothing SEA - exotic allowed) and PSG (Armor SEA - core only)
 */

/**
 * Render the belt type toggle
 * @param {HTMLElement} container - Container element
 * @param {string} beltType - Current belt type ('clothing' or 'armor')
 * @param {Function} onToggle - Callback when toggled (newType) => void
 */
export function renderBeltTypeToggle(container, beltType = 'clothing', onToggle) {
  const isClothing = beltType === 'clothing';
  
  const html = `
    <div class="belt-type-toggle">
      <span class="belt-toggle-label">Belt Slot:</span>
      <div class="belt-toggle-options">
        <button class="belt-option ${isClothing ? 'active' : ''}" data-type="clothing" title="Clothing belt - can use exotic SEAs">
          👔 Belt (Clothing)
        </button>
        <button class="belt-option ${!isClothing ? 'active' : ''}" data-type="armor" title="Personal Shield Generator - armor stats only">
          🛡️ PSG (Armor)
        </button>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Set up event listeners
  container.querySelectorAll('.belt-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const newType = btn.dataset.type;
      if (newType !== beltType) {
        onToggle(newType);
      }
    });
  });
}

/**
 * Check if belt is in exotic mode (clothing)
 * @param {string} beltType - 'clothing' or 'armor'
 * @returns {boolean} - true if belt can use exotic stats
 */
export function isBeltExotic(beltType) {
  return beltType === 'clothing';
}
