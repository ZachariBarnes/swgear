/**
 * JewelrySection Component
 * Manages heroic jewelry set bonuses with presets and custom stats
 */

import { openModifierPicker } from './ModifierPicker.js';
import jewelryData from '../data/jewelry.json';

/**
 * Render the jewelry section
 * @param {HTMLElement} container - Container element
 * @param {Object} jewelry - Current jewelry state { selectedId, customStats: [{modifier, value}] }
 * @param {Function} onUpdate - Callback when jewelry changes (newJewelry) => void
 */
export function renderJewelrySection(container, jewelry, onUpdate) {
  if (!jewelry) {
    jewelry = { selectedId: null, customStats: [] };
  }
  
  const selectedSet = jewelryData.find(j => j.id === jewelry.selectedId);
  const isCustom = jewelry.selectedId === 'custom';
  const hasJewelry = jewelry.selectedId && jewelry.selectedId !== 'none';
  
  // Get stats to display
  const displayStats = isCustom ? jewelry.customStats : (selectedSet?.stats || []);
  
  // Count of popular vs other sets
  const popularSets = jewelryData.filter(j => j.isPopular && j.id !== 'custom');
  const otherSets = jewelryData.filter(j => !j.isPopular && j.id !== 'custom');
  
  const html = `
    <div class="jewelry-section">
      <div class="jewelry-header">
        <h3>💎 Heroic Jewelry</h3>
        <select id="jewelry-select" class="jewelry-select">
          <option value="none" ${!jewelry.selectedId || jewelry.selectedId === 'none' ? 'selected' : ''}>No Jewelry Set</option>
          <optgroup label="Popular Sets">
            ${popularSets.map(j => `
              <option value="${j.id}" ${jewelry.selectedId === j.id ? 'selected' : ''}>${j.name}</option>
            `).join('')}
          </optgroup>
          <optgroup label="Other Heroic Sets">
            ${otherSets.map(j => `
              <option value="${j.id}" ${jewelry.selectedId === j.id ? 'selected' : ''}>${j.name}</option>
            `).join('')}
          </optgroup>
          <optgroup label="Custom">
            <option value="custom" ${isCustom ? 'selected' : ''}>Custom Stats</option>
          </optgroup>
        </select>
      </div>
      
      ${hasJewelry ? `
        <div class="jewelry-description">
          ${selectedSet?.description || 'Enter your jewelry stats manually.'}
        </div>
        
        <div class="jewelry-stats">
          ${isCustom ? renderCustomStats(jewelry.customStats) : renderPresetStats(displayStats)}
        </div>
        
        ${isCustom ? `
          <button class="btn btn-sm btn-secondary add-stat-btn" id="add-jewelry-stat">+ Add Stat</button>
        ` : ''}
      ` : `
        <p class="jewelry-empty">Select a heroic jewelry set to add stat bonuses.</p>
      `}
    </div>
  `;
  
  container.innerHTML = html;
  
  // Event listeners
  setupEventListeners(container, jewelry, onUpdate);
}

/**
 * Render preset jewelry stats (read-only display)
 */
function renderPresetStats(stats) {
  if (!stats || stats.length === 0) return '<p class="jewelry-empty">No stats</p>';
  
  return stats.map(stat => `
    <div class="jewelry-stat-row preset">
      <span class="jewelry-stat-name">${stat.modifier}</span>
      <span class="jewelry-stat-value">+${stat.value}</span>
    </div>
  `).join('');
}

/**
 * Render custom jewelry stats (editable)
 */
function renderCustomStats(customStats) {
  if (!customStats || customStats.length === 0) {
    return '<p class="jewelry-empty">No custom stats added yet.</p>';
  }
  
  return customStats.map((stat, index) => `
    <div class="jewelry-stat-row custom" data-index="${index}">
      <span class="jewelry-stat-name">${stat.modifier}</span>
      <div class="jewelry-stat-input">
        <span class="prefix">+</span>
        <input type="number" class="jewelry-value-input" value="${stat.value}" data-index="${index}" min="0" max="100" autocomplete="off">
      </div>
      <button class="btn-icon remove-stat-btn" data-index="${index}" title="Remove">×</button>
    </div>
  `).join('');
}

/**
 * Set up event listeners
 */
function setupEventListeners(container, jewelry, onUpdate) {
  // Jewelry selection
  const select = container.querySelector('#jewelry-select');
  if (select) {
    select.addEventListener('change', (e) => {
      const newJewelry = {
        selectedId: e.target.value === 'none' ? null : e.target.value,
        customStats: jewelry.customStats || []
      };
      onUpdate(newJewelry);
    });
  }
  
  // Custom stat value changes
  container.querySelectorAll('.jewelry-value-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const newValue = parseInt(e.target.value, 10) || 0;
      
      const newCustomStats = [...(jewelry.customStats || [])];
      if (newCustomStats[index]) {
        newCustomStats[index] = { ...newCustomStats[index], value: newValue };
      }
      
      onUpdate({ ...jewelry, customStats: newCustomStats });
    });
  });
  
  // Remove stat
  container.querySelectorAll('.remove-stat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const newCustomStats = (jewelry.customStats || []).filter((_, i) => i !== index);
      onUpdate({ ...jewelry, customStats: newCustomStats });
    });
  });
  
  // Add stat button
  const addBtn = container.querySelector('#add-jewelry-stat');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Get existing stat names to exclude
      const existingStats = (jewelry.customStats || []).map(s => s.modifier);
      
      openModifierPicker(null, null, (slotId, statIndex, selection) => {
        const newCustomStats = [...(jewelry.customStats || []), {
          modifier: selection.modifier,
          value: 15 // Default value
        }];
        onUpdate({ ...jewelry, customStats: newCustomStats });
      }, true, existingStats);
    });
  }
}

/**
 * Get the total stats from the jewelry
 * @param {Object} jewelry - Jewelry state
 * @returns {Array} - Array of { modifier, value } objects
 */
export function getJewelryStats(jewelry) {
  if (!jewelry || !jewelry.selectedId || jewelry.selectedId === 'none') {
    return [];
  }
  
  if (jewelry.selectedId === 'custom') {
    return jewelry.customStats || [];
  }
  
  const preset = jewelryData.find(j => j.id === jewelry.selectedId);
  return preset?.stats || [];
}
