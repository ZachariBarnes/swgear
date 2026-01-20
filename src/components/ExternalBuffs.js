/**
 * ExternalBuffs Component
 * Manages external stat bonuses with source categories
 */

import { openModifierPicker } from './ModifierPicker.js';
import { BACKPACK_PRESETS } from '../data/backpacks.js';

// Buff source types
const BUFF_SOURCES = {
  backpack: { label: 'Backpack', icon: '🎒', permanent: true },
  jewelry: { label: 'Jewelry', icon: '💎', permanent: true },
  armor: { label: 'Armor Bonuses', icon: '🛡️', permanent: true },
  food: { label: 'Food/Buffs', icon: '🍖', permanent: false },
  class: { label: 'Class/Abilities', icon: '⚔️', permanent: true }
};

// Jewelry slot configuration (5 pieces)
const JEWELRY_SLOTS = [
  { id: 'necklace', name: 'Necklace' },
  { id: 'ring1', name: 'Ring 1' },
  { id: 'ring2', name: 'Ring 2' },
  { id: 'bracelet1', name: 'Left Bracelet' },
  { id: 'bracelet2', name: 'Right Bracelet' }
];

/**
 * Render the external buffs editor
 * @param {HTMLElement} container - Container element
 * @param {Array} buffs - Current buffs array [{modifier, value, source}]
 * @param {Function} onUpdate - Callback when buffs change (newBuffs) => void
 */
export function renderExternalBuffs(container, buffs, onUpdate, armorBonusHP = 0, onArmorHPUpdate = () => {}) {
  if (!buffs) buffs = [];
  
  // Add index to each buff for tracking
  const indexedBuffs = buffs.map((b, i) => ({ ...b, _index: i }));
  
  // Group buffs by source
  const grouped = {
    backpack: indexedBuffs.filter(b => b.source === 'backpack'),
    jewelry: indexedBuffs.filter(b => b.source === 'jewelry'),
    armor: indexedBuffs.filter(b => b.source === 'armor'),
    food: indexedBuffs.filter(b => b.source === 'food'),
    class: indexedBuffs.filter(b => b.source === 'class'),
    unknown: indexedBuffs.filter(b => !b.source || !BUFF_SOURCES[b.source])
  };
  
  const hasBuffs = buffs.length > 0 || armorBonusHP > 0;
  
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
    
    <!-- Armor Bonus HP Section -->
    <div class="armor-bonus-section">
      <div class="armor-bonus-row">
        <span class="armor-bonus-label" title="Bonus HP from crafted armor with capped resources (up to ~800-900)">
          🛡️ Armor Bonus HP
        </span>
        <div class="armor-bonus-input">
          <span class="prefix">+</span>
          <input type="number" id="armor-bonus-hp" value="${armorBonusHP}" min="0" max="1000" step="50" autocomplete="off">
        </div>
      </div>
    </div>
    
    <div class="external-buffs-list">
      ${!hasBuffs ? `
        <p class="empty-state-sm">No external buffs. Add backpack, jewelry, food, or ability stats.</p>
      ` : `
        ${renderBuffGroup('backpack', grouped.backpack)}
        ${renderBuffGroup('jewelry', grouped.jewelry)}
        ${renderBuffGroup('armor', grouped.armor)}
        ${renderBuffGroup('food', grouped.food)}
        ${renderBuffGroup('class', grouped.class)}
        ${grouped.unknown.length > 0 ? renderBuffGroup('unknown', grouped.unknown, 'Other') : ''}
      `}
    </div>
  `;
  
  container.innerHTML = html;
  
  // Armor bonus HP listener
  const armorHPInput = container.querySelector('#armor-bonus-hp');
  if (armorHPInput) {
    armorHPInput.addEventListener('change', (e) => {
      onArmorHPUpdate(parseInt(e.target.value, 10) || 0);
    });
  }
  
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
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const source = btn.dataset.source;
      menu.hidden = true;
      
      if (source === 'backpack') {
        // Show backpack preset picker
        openBackpackPicker(container, (preset) => {
          // Add all stats from the selected backpack
          const newBuffs = [...buffs];
          preset.stats.forEach(stat => {
            newBuffs.push({
              modifier: stat.modifier,
              value: stat.value,
              source: 'backpack',
              backpackName: preset.name
            });
          });
          onUpdate(newBuffs);
        });
      } else if (source === 'food') {
        // Use FoodPicker for foods
        const { openFoodPicker } = await import('./FoodPicker.js');
        openFoodPicker((food) => {
          if (food.isCustom) {
            // Custom option - use modifier picker
            openModifierPicker(null, null, (slotId, statIndex, selection) => {
              const newBuffs = [...buffs, { 
                modifier: selection.modifier, 
                value: 0, 
                source: source 
              }];
              onUpdate(newBuffs);
            }, true);
          } else {
            // Add all effects from the selected food
            const newBuffs = [...buffs];
            food.effects.forEach(effect => {
              newBuffs.push({
                modifier: effect.modifier,
                value: effect.value,
                source: source,
                foodName: food.name
              });
            });
            onUpdate(newBuffs);
          }
        });
      } else {
        // Other sources use modifier picker
        openModifierPicker(null, null, (slotId, statIndex, selection) => {
          const newBuffs = [...buffs, { 
            modifier: selection.modifier, 
            value: 0, 
            source: source 
          }];
          onUpdate(newBuffs);
        }, true);
      }
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

/**
 * Open backpack preset picker modal
 */
function openBackpackPicker(container, onSelect) {
  // Remove any existing picker
  const existing = document.querySelector('.backpack-picker-overlay');
  if (existing) existing.remove();
  
  const overlay = document.createElement('div');
  overlay.className = 'backpack-picker-overlay';
  overlay.innerHTML = `
    <div class="backpack-picker-modal">
      <div class="backpack-picker-header">
        <h3>🎒 Select Backpack</h3>
        <button class="btn-icon close-picker">×</button>
      </div>
      <div class="backpack-picker-list">
        ${BACKPACK_PRESETS.map(preset => `
          <div class="backpack-option" data-id="${preset.id}">
            <div class="backpack-name">${preset.name}</div>
            <div class="backpack-description">${preset.description}</div>
            <div class="backpack-stats">
              ${preset.stats.map(s => `
                <span class="backpack-stat">+${s.value} ${s.modifier}</span>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Close on overlay click
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
  
  // Close button
  overlay.querySelector('.close-picker').addEventListener('click', () => {
    overlay.remove();
  });
  
  // Select backpack
  overlay.querySelectorAll('.backpack-option').forEach(option => {
    option.addEventListener('click', () => {
      const presetId = option.dataset.id;
      const preset = BACKPACK_PRESETS.find(p => p.id === presetId);
      if (preset) {
        onSelect(preset);
        overlay.remove();
      }
    });
  });
}
