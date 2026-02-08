/**
 * BraceletPicker Component
 * Quick-select for treasure map bracelets (left and right slots)
 * Heroic sets provide rings + necklace + earrings, but NOT bracelets
 */

import jewelryData from '../data/jewelry.json';

// Filter bracelets from jewelry data - items with "category" field or "Bracelet" in name
const BRACELETS = jewelryData.filter(item => 
  item.category || 
  item.name.toLowerCase().includes('bracelet') ||
  item.id.startsWith('bracelet_')
);

/**
 * Render bracelet picker section
 * @param {HTMLElement} container - Container element
 * @param {Object} bracelets - Current bracelet state { left: id, right: id }
 * @param {Function} onUpdate - Callback when bracelets change
 */
export function renderBraceletPicker(container, bracelets = {}, onUpdate) {
  // Group bracelets by category
  const categories = {};
  BRACELETS.forEach(b => {
    const cat = b.category || 'General';
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(b);
  });
  
  const categoryOrder = ['Combat', 'Weapon', 'Jedi', 'Medical', 'Utility', 'General'];
  
  const renderOptions = (selectedId) => {
    let html = '<option value="">None</option>';
    
    categoryOrder.forEach(cat => {
      if (categories[cat] && categories[cat].length > 0) {
        html += `<optgroup label="${cat}">`;
        categories[cat].forEach(b => {
          html += `<option value="${b.id}" ${selectedId === b.id ? 'selected' : ''}>${b.name}</option>`;
        });
        html += '</optgroup>';
      }
    });
    
    return html;
  };
  
  container.innerHTML = `
    <div class="bracelet-picker-inline">
      <span class="bracelet-label">🔗 Bracelets:</span>
      <select id="bracelet-left" class="bracelet-select-inline" title="Left Wrist">
        ${renderOptions(bracelets.left)}
      </select>
      <select id="bracelet-right" class="bracelet-select-inline" title="Right Wrist">
        ${renderOptions(bracelets.right)}
      </select>
    </div>
  `;
  
  // Event listeners
  container.querySelector('#bracelet-left')?.addEventListener('change', (e) => {
    onUpdate({ ...bracelets, left: e.target.value || null });
  });
  
  container.querySelector('#bracelet-right')?.addEventListener('change', (e) => {
    onUpdate({ ...bracelets, right: e.target.value || null });
  });
}

/**
 * Render bracelet stats summary
 */
function renderBraceletStats(bracelets) {
  const stats = getBraceletStats(bracelets);
  if (stats.length === 0) return '';
  
  return `
    <div class="bracelet-stats">
      ${stats.map(s => `
        <div class="bracelet-stat-row">
          <span class="stat-name">${s.modifier}</span>
          <span class="stat-value">+${s.value}</span>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Get combined stats from both bracelets
 * @param {Object} bracelets - { left: id, right: id }
 * @returns {Array} - Combined stats
 */
export function getBraceletStats(bracelets = {}) {
  const stats = [];
  
  ['left', 'right'].forEach(slot => {
    if (bracelets[slot]) {
      const bracelet = BRACELETS.find(b => b.id === bracelets[slot]);
      if (bracelet?.stats) {
        bracelet.stats.forEach(stat => {
          // Combine duplicate modifiers
          const existing = stats.find(s => s.modifier === stat.modifier);
          if (existing) {
            existing.value += stat.value;
          } else {
            stats.push({ ...stat });
          }
        });
      }
    }
  });
  
  return stats;
}
