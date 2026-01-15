/**
 * BackpackSection Component
 * Manages backpack stat bonuses with popular presets and custom stats
 */

import { openModifierPicker } from './ModifierPicker.js';
import backpacksData from '../data/backpacks.json';

/**
 * Render the backpack section
 * @param {HTMLElement} container - Container element
 * @param {Object} backpack - Current backpack state { selectedId, customStats: [{modifier, value}] }
 * @param {Function} onUpdate - Callback when backpack changes (newBackpack) => void
 */
export function renderBackpackSection(container, backpack, onUpdate) {
  if (!backpack) {
    backpack = { selectedId: null, customStats: [] };
  }
  
  const selectedBackpack = backpacksData.find(b => b.id === backpack.selectedId);
  const isCustom = backpack.selectedId === 'custom';
  const hasBackpack = backpack.selectedId && backpack.selectedId !== 'none';
  
  // Get stats to display
  const displayStats = isCustom ? backpack.customStats : (selectedBackpack?.stats || []);
  
  const html = `
    <div class="backpack-section">
      <div class="backpack-header">
        <h3>🎒 Backpack</h3>
        <select id="backpack-select" class="backpack-select">
          <option value="none" ${!backpack.selectedId || backpack.selectedId === 'none' ? 'selected' : ''}>No Backpack</option>
          <optgroup label="Popular Backpacks">
            ${backpacksData.filter(b => b.isPopular).map(b => `
              <option value="${b.id}" ${backpack.selectedId === b.id ? 'selected' : ''}>${b.name}</option>
            `).join('')}
          </optgroup>
          <optgroup label="Other">
            <option value="custom" ${isCustom ? 'selected' : ''}>Custom Stats</option>
          </optgroup>
        </select>
      </div>
      
      ${hasBackpack ? `
        <div class="backpack-description">
          ${selectedBackpack?.description || 'Enter your backpack stats manually.'}
        </div>
        
        <div class="backpack-stats">
          ${isCustom ? renderCustomStats(backpack.customStats) : renderPresetStats(displayStats)}
        </div>
        
        ${isCustom ? `
          <button class="btn btn-sm btn-secondary add-stat-btn" id="add-backpack-stat">+ Add Stat</button>
        ` : ''}
      ` : `
        <p class="backpack-empty">Select a backpack to add stat bonuses.</p>
      `}
    </div>
  `;
  
  container.innerHTML = html;
  
  // Event listeners
  setupEventListeners(container, backpack, onUpdate);
}

/**
 * Render preset backpack stats (read-only display)
 */
function renderPresetStats(stats) {
  if (!stats || stats.length === 0) return '<p class="backpack-empty">No stats</p>';
  
  return stats.map(stat => `
    <div class="backpack-stat-row preset">
      <span class="backpack-stat-name">${stat.modifier}</span>
      <span class="backpack-stat-value">+${stat.value}</span>
    </div>
  `).join('');
}

/**
 * Render custom backpack stats (editable)
 */
function renderCustomStats(customStats) {
  if (!customStats || customStats.length === 0) {
    return '<p class="backpack-empty">No custom stats added yet.</p>';
  }
  
  return customStats.map((stat, index) => `
    <div class="backpack-stat-row custom" data-index="${index}">
      <span class="backpack-stat-name">${stat.modifier}</span>
      <div class="backpack-stat-input">
        <span class="prefix">+</span>
        <input type="number" class="backpack-value-input" value="${stat.value}" data-index="${index}" min="0" max="100" autocomplete="off">
      </div>
      <button class="btn-icon remove-stat-btn" data-index="${index}" title="Remove">×</button>
    </div>
  `).join('');
}

/**
 * Set up event listeners
 */
function setupEventListeners(container, backpack, onUpdate) {
  // Backpack selection
  const select = container.querySelector('#backpack-select');
  if (select) {
    select.addEventListener('change', (e) => {
      const newBackpack = {
        selectedId: e.target.value === 'none' ? null : e.target.value,
        customStats: backpack.customStats || []
      };
      onUpdate(newBackpack);
    });
  }
  
  // Custom stat value changes
  container.querySelectorAll('.backpack-value-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const newValue = parseInt(e.target.value, 10) || 0;
      
      const newCustomStats = [...(backpack.customStats || [])];
      if (newCustomStats[index]) {
        newCustomStats[index] = { ...newCustomStats[index], value: newValue };
      }
      
      onUpdate({ ...backpack, customStats: newCustomStats });
    });
  });
  
  // Remove stat
  container.querySelectorAll('.remove-stat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const newCustomStats = (backpack.customStats || []).filter((_, i) => i !== index);
      onUpdate({ ...backpack, customStats: newCustomStats });
    });
  });
  
  // Add stat button
  const addBtn = container.querySelector('#add-backpack-stat');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      // Get existing stat names to exclude
      const existingStats = (backpack.customStats || []).map(s => s.modifier);
      
      openModifierPicker(null, null, (slotId, statIndex, selection) => {
        const newCustomStats = [...(backpack.customStats || []), {
          modifier: selection.modifier,
          value: 15 // Default value
        }];
        onUpdate({ ...backpack, customStats: newCustomStats });
      }, true, existingStats);
    });
  }
}

/**
 * Get the total stats from the backpack
 * @param {Object} backpack - Backpack state
 * @returns {Array} - Array of { modifier, value } objects
 */
export function getBackpackStats(backpack) {
  if (!backpack || !backpack.selectedId || backpack.selectedId === 'none') {
    return [];
  }
  
  if (backpack.selectedId === 'custom') {
    return backpack.customStats || [];
  }
  
  const preset = backpacksData.find(b => b.id === backpack.selectedId);
  return preset?.stats || [];
}
