/**
 * ExternalBuffs Component
 * Manages external stat bonuses with source categories
 */

import { openModifierPicker } from './ModifierPicker.js';

// Buff source types
const BUFF_SOURCES = {
  jewelry: { label: 'Jewelry/Gear', icon: '💎', permanent: true },
  food: { label: 'Food/Buffs', icon: '🍖', permanent: false },
  class: { label: 'Class/Abilities', icon: '⚔️', permanent: true }
};

/**
 * Render the external buffs editor
 * @param {HTMLElement} container - Container element
 * @param {Array} buffs - Current buffs array [{modifier, value, source}]
 * @param {Function} onUpdate - Callback when buffs change (newBuffs) => void
 */
export function renderExternalBuffs(container, buffs, onUpdate) {
  if (!buffs) buffs = [];
  
  // Add index to each buff for tracking
  const indexedBuffs = buffs.map((b, i) => ({ ...b, _index: i }));
  
  // Group buffs by source
  const grouped = {
    jewelry: indexedBuffs.filter(b => b.source === 'jewelry'),
    food: indexedBuffs.filter(b => b.source === 'food'),
    class: indexedBuffs.filter(b => b.source === 'class'),
    unknown: indexedBuffs.filter(b => !b.source || !BUFF_SOURCES[b.source])
  };
  
  const hasBuffs = buffs.length > 0;
  
  const html = `
    <div class="external-buffs-header">
      <h3>External Stat Sources</h3>
      <div class="add-buff-dropdown">
        <button class="btn btn-sm btn-secondary" id="add-buff-toggle">+ Add ▾</button>
        <div class="add-buff-menu" id="add-buff-menu" hidden>
          ${Object.entries(BUFF_SOURCES).map(([key, src]) => `
            <button class="add-buff-option" data-source="${key}">
              ${src.icon} ${src.label}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    <div class="external-buffs-list">
      ${!hasBuffs ? `
        <p class="empty-state-sm">No external buffs. Add stats from jewelry, food, or abilities.</p>
      ` : `
        ${renderBuffGroup('jewelry', grouped.jewelry)}
        ${renderBuffGroup('food', grouped.food)}
        ${renderBuffGroup('class', grouped.class)}
        ${grouped.unknown.length > 0 ? renderBuffGroup('unknown', grouped.unknown, 'Other') : ''}
      `}
    </div>
  `;
  
  container.innerHTML = html;
  
  // Event Listeners
  setupEventListeners(container, buffs, onUpdate);
}

/**
 * Set up all event listeners
 */
function setupEventListeners(container, buffs, onUpdate) {
  const toggleBtn = container.querySelector('#add-buff-toggle');
  const menu = container.querySelector('#add-buff-menu');
  
  if (!toggleBtn || !menu) return;
  
  // Toggle dropdown
  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });
  
  // Close dropdown when clicking outside
  const closeMenu = () => { menu.hidden = true; };
  document.addEventListener('click', closeMenu, { once: true });
  
  // Add buff with specific source
  container.querySelectorAll('.add-buff-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const source = btn.dataset.source;
      menu.hidden = true;
      
      openModifierPicker(null, null, (slotId, statIndex, selection) => {
        const newBuffs = [...buffs, { 
          modifier: selection.modifier, 
          value: 0, 
          source: source 
        }];
        onUpdate(newBuffs);
      }, true);
    });
  });
  
  // Value Change
  container.querySelectorAll('.buff-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const val = parseInt(e.target.value, 10) || 0;
      
      const newBuffs = [...buffs];
      newBuffs[index] = { ...newBuffs[index], value: val };
      onUpdate(newBuffs);
    });
  });
  
  // Remove Buff
  container.querySelectorAll('.remove-buff-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index, 10);
      const newBuffs = buffs.filter((_, i) => i !== index);
      onUpdate(newBuffs);
    });
  });
}

/**
 * Render a group of buffs by source
 */
function renderBuffGroup(sourceKey, groupBuffs, overrideLabel = null) {
  if (groupBuffs.length === 0) return '';
  
  const source = BUFF_SOURCES[sourceKey] || { label: overrideLabel || 'Other', icon: '📦', permanent: false };
  
  return `
    <div class="buff-group">
      <div class="buff-group-header">
        <span class="buff-group-icon">${source.icon}</span>
        <span class="buff-group-label">${source.label}</span>
        ${source.permanent 
          ? '<span class="buff-tag permanent">Permanent</span>' 
          : '<span class="buff-tag temporary">Temporary</span>'}
      </div>
      ${groupBuffs.map(buff => `
        <div class="buff-row" data-source="${sourceKey}">
          <span class="buff-name" title="${buff.modifier}">${buff.modifier}</span>
          <div class="buff-value-input">
            <span class="prefix">+</span>
            <input type="number" class="buff-input" value="${buff.value}" data-index="${buff._index}" min="0" max="1000" autocomplete="off">
          </div>
          <button class="btn-icon remove-buff-btn" data-index="${buff._index}" title="Remove">×</button>
        </div>
      `).join('')}
    </div>
  `;
}
