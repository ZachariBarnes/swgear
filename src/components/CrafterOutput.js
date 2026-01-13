/**
 * CrafterOutput Component - Combination Explorer
 * Allows crafters to explore junk loot combinations for each stat
 */

import { findCombinations } from '../utils/export.js';

// Track selected combinations for each modifier
let selectedCombos = {};

// Track which modifiers have been split out (Map: modifier -> splitCount)
let splitModifiers = new Map();

// Store combinations data for validation
let combinationsDataCache = null;

// Store references for re-rendering
let lastRenderParams = null;

/**
 * Get all items that can combine with a given item to make the target modifier
 */
function getCompatibleItems(selectedItem, targetModifier, combinationsData, allItems) {
  const compatible = [];
  
  for (const item of allItems) {
    if (item === selectedItem) continue;
    
    if (combinationsData[selectedItem] && combinationsData[selectedItem][item]) {
      if (combinationsData[selectedItem][item].name === targetModifier) {
        compatible.push(item);
        continue;
      }
    }
    
    if (combinationsData[item] && combinationsData[item][selectedItem]) {
      if (combinationsData[item][selectedItem].name === targetModifier) {
        compatible.push(item);
      }
    }
  }
  
  return compatible.sort();
}

/**
 * Get all unique items that can produce a specific modifier
 */
function getAllItemsForModifier(statCombos) {
  const allItems = new Set();
  
  statCombos.combinations.forEach(c => {
    allItems.add(c.item1);
    allItems.add(c.item2);
  });
  
  return [...allItems].sort();
}

/**
 * Process stats - consolidate or split based on user preference
 * splitModifiers is a Map: modifier -> array of split counts [4, 3, 2] for x4/x3/x2
 */
function processStats(needed) {
  const result = [];
  
  // First, consolidate all stats by modifier
  const consolidated = new Map();
  needed.forEach(item => {
    const key = item.modifier;
    if (consolidated.has(key)) {
      const existing = consolidated.get(key);
      existing.count++;
      existing.slots.push(item.slotName);
      if (item.powerBit > existing.powerBit) {
        existing.powerBit = item.powerBit;
      }
    } else {
      consolidated.set(key, {
        modifier: item.modifier,
        powerBit: item.powerBit,
        combinations: item.combinations,
        count: 1,
        slots: [item.slotName]
      });
    }
  });
  
  // Then apply splits
  consolidated.forEach((item, modifier) => {
    if (splitModifiers.has(modifier)) {
      const splitCounts = splitModifiers.get(modifier); // array like [4, 3, 2]
      let remaining = item.count;
      
      // Add each split group
      splitCounts.forEach((splitCount, index) => {
        const actualCount = Math.min(splitCount, remaining);
        if (actualCount > 0) {
          result.push({
            ...item,
            cardId: `${modifier}-split-${index}`,
            count: actualCount,
            slots: item.slots.slice(0, actualCount),
            isSplit: true
          });
          remaining -= actualCount;
        }
      });
      
      // Add remaining as consolidated if any left
      if (remaining > 0) {
        result.push({
          ...item,
          cardId: modifier,
          count: remaining,
          slots: item.slots.slice(-remaining),
          isSplit: false
        });
      }
    } else {
      // No splits - add as consolidated
      result.push({
        ...item,
        cardId: modifier,
        isSplit: false
      });
    }
  });
  
  return result;
}

/**
 * Render the crafter view with combination explorer
 */
export function renderCrafterView(contentContainer, shoppingContainer, build, combinationsData, modifiers) {
  combinationsDataCache = combinationsData;
  lastRenderParams = { contentContainer, shoppingContainer, build, combinationsData, modifiers };
  
  const needed = findCombinations(build, combinationsData);
  
  if (needed.length === 0) {
    contentContainer.innerHTML = `<p class="empty-state">Add stats to your build (in the Build tab) to see combination options here.</p>`;
    shoppingContainer.innerHTML = `<p class="empty-state">No items needed yet.</p>`;
    return;
  }
  
  // Process stats (consolidate or split)
  const processedStats = processStats(needed);
  
  const modMap = new Map(modifiers.map(m => [m.name, m]));
  
  // Define core stats
  const CORE_STAT_NAMES = ['Ranged General', 'Melee General', 'Defense General', 'Toughness Boost', 'Endurance Boost', 'Opportune Chance'];
  
  // Separate core and exotic
  const coreStats = processedStats.filter(s => CORE_STAT_NAMES.includes(s.modifier));
  const exoticStats = processedStats.filter(s => !CORE_STAT_NAMES.includes(s.modifier));
  
  // Helper to render a single stat card
  const renderStatCard = (item) => {
    const mod = modMap.get(item.modifier);
    const value = Math.floor(item.powerBit / (mod?.ratio || 1));
    const cardId = item.cardId;
    
    const allItems = getAllItemsForModifier(item);
    
    // Default selection
    if (!selectedCombos[cardId] && item.combinations.length > 0) {
      selectedCombos[cardId] = {
        item1: item.combinations[0].item1,
        item2: item.combinations[0].item2
      };
    }
    
    const selected = selectedCombos[cardId] || {};
    const compatibleItem2s = getCompatibleItems(selected.item1, item.modifier, combinationsData, allItems);
    
    if (selected.item2 && !compatibleItem2s.includes(selected.item2)) {
      selected.item2 = compatibleItem2s[0] || '';
      selectedCombos[cardId] = selected;
    }
    
    // Build slot label - comma-separated for 3 or fewer, abbreviated for more
    let slotLabel;
    if (item.count === 1) {
      slotLabel = item.slots[0] || item.modifier;
    } else if (item.count <= 3) {
      slotLabel = item.slots.join(', ');
    } else {
      slotLabel = `${item.slots.slice(0, 2).join(', ')} + ${item.count - 2} more`;
    }
    
    const showSplitBtn = item.count > 1 && !item.isSplit;
    const showMergeBtn = item.isSplit;
    
    return `
      <div class="stat-card" data-card-id="${cardId}" data-modifier="${item.modifier}" data-count="${item.count}">
        <div class="stat-card-header">
          <div class="stat-card-title">
            <span class="stat-card-slot">${slotLabel}</span>
            <span class="stat-card-modifier">${item.modifier}</span>
            ${item.count > 1 ? `<span class="stat-card-count">x${item.count}</span>` : ''}
            ${showSplitBtn ? `<button class="split-btn" data-modifier="${item.modifier}">Split</button>` : ''}
            ${showMergeBtn ? `<button class="split-btn merge-btn" data-modifier="${item.modifier}">Merge</button>` : ''}
          </div>
          <span class="stat-card-value">+${value}</span>
        </div>
        <div class="stat-card-body">
          ${item.combinations.length > 0 ? `
            <div class="combo-selector">
              <div class="combo-select-wrap">
                <div class="searchable-select" data-card-id="${cardId}" data-type="item1">
                  <input type="text" class="searchable-input" placeholder="Search..." value="${selected.item1 || ''}" data-card-id="${cardId}" data-type="item1">
                  <div class="searchable-dropdown">
                    ${allItems.map(itemName => `
                      <div class="searchable-option ${itemName === selected.item1 ? 'selected' : ''}" data-value="${itemName}">${itemName}</div>
                    `).join('')}
                  </div>
                </div>
              </div>
              <span class="plus">+</span>
              <div class="combo-select-wrap">
                <div class="searchable-select" data-card-id="${cardId}" data-type="item2">
                  <input type="text" class="searchable-input" placeholder="Search..." value="${selected.item2 || ''}" data-card-id="${cardId}" data-type="item2">
                  <div class="searchable-dropdown">
                    ${compatibleItem2s.map(itemName => `
                      <div class="searchable-option ${itemName === selected.item2 ? 'selected' : ''}" data-value="${itemName}">${itemName}</div>
                    `).join('')}
                  </div>
                </div>
              </div>
            </div>
          ` : `
            <p class="empty-state">No combinations found for this modifier</p>
          `}
        </div>
      </div>
    `;
  };
  
  // Render with section headers
  let html = '';
  if (coreStats.length > 0) {
    html += `<div class="crafter-section"><h3 class="crafter-section-title">Core Stats</h3>${coreStats.map(renderStatCard).join('')}</div>`;
  }
  if (exoticStats.length > 0) {
    html += `<div class="crafter-section"><h3 class="crafter-section-title">Exotic Stats</h3>${exoticStats.map(renderStatCard).join('')}</div>`;
  }
  contentContainer.innerHTML = html;
  
  // Attach event listeners
  attachCrafterListeners(contentContainer, shoppingContainer, build, combinationsData, modifiers, processedStats);
  
  // Render shopping list
  updateShoppingList(shoppingContainer, processedStats, modifiers);
}

/**
 * Attach event listeners to combination selectors
 */
function attachCrafterListeners(contentContainer, shoppingContainer, build, combinationsData, modifiers, processedStats) {
  
  // Split button handlers
  contentContainer.querySelectorAll('.split-btn:not(.merge-btn)').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modifier = btn.dataset.modifier;
      const card = btn.closest('.stat-card');
      const currentCount = parseInt(card.dataset.count, 10);
      
      // Prompt for how many to split out
      const input = window.prompt(`Split "${modifier}" (currently x${currentCount}).\n\nHow many do you want in a separate group? (1-${currentCount})`, Math.min(currentCount, 1).toString());
      if (input === null) return; // Cancelled
      
      const splitCount = Math.min(Math.max(1, parseInt(input, 10) || 1), currentCount);
      
      // Get existing splits or create new array
      const existingSplits = splitModifiers.get(modifier) || [];
      existingSplits.push(splitCount);
      splitModifiers.set(modifier, existingSplits);
      
      // Clear any consolidated selection for this modifier
      delete selectedCombos[modifier];
      
      // Re-render
      if (lastRenderParams) {
        renderCrafterView(
          lastRenderParams.contentContainer,
          lastRenderParams.shoppingContainer,
          lastRenderParams.build,
          lastRenderParams.combinationsData,
          lastRenderParams.modifiers
        );
      }
    });
  });
  
  // Merge button handlers
  contentContainer.querySelectorAll('.merge-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const modifier = btn.dataset.modifier;
      splitModifiers.delete(modifier);
      
      // Clear split selections for this modifier
      Object.keys(selectedCombos).forEach(key => {
        if (key.startsWith(`${modifier}-split-`)) {
          delete selectedCombos[key];
        }
      });
      
      // Re-render
      if (lastRenderParams) {
        renderCrafterView(
          lastRenderParams.contentContainer,
          lastRenderParams.shoppingContainer,
          lastRenderParams.build,
          lastRenderParams.combinationsData,
          lastRenderParams.modifiers
        );
      }
    });
  });
  
  // Searchable select - input handling
  contentContainer.querySelectorAll('.searchable-input').forEach(input => {
    const cardId = input.dataset.cardId;
    const type = input.dataset.type;
    const wrapper = input.closest('.searchable-select');
    const dropdown = wrapper.querySelector('.searchable-dropdown');
    
    input.addEventListener('focus', () => {
      wrapper.classList.add('open');
      input.select();
    });
    
    input.addEventListener('blur', () => {
      setTimeout(() => {
        wrapper.classList.remove('open');
        const selected = selectedCombos[cardId];
        if (type === 'item1' && selected?.item1) {
          input.value = selected.item1;
        } else if (type === 'item2' && selected?.item2) {
          input.value = selected.item2;
        }
      }, 200);
    });
    
    input.addEventListener('input', () => {
      const query = input.value.toLowerCase();
      const options = dropdown.querySelectorAll('.searchable-option');
      options.forEach(opt => {
        const text = opt.textContent.toLowerCase();
        opt.style.display = text.includes(query) ? '' : 'none';
      });
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        wrapper.classList.remove('open');
        input.blur();
      } else if (e.key === 'Enter') {
        const visible = dropdown.querySelectorAll('.searchable-option:not([style*="display: none"])');
        if (visible.length > 0) {
          visible[0].click();
        }
      }
    });
  });
  
  // Searchable select - option click
  contentContainer.querySelectorAll('.searchable-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const wrapper = option.closest('.searchable-select');
      const dropdown = wrapper.querySelector('.searchable-dropdown');
      const input = wrapper.querySelector('.searchable-input');
      const cardId = input.dataset.cardId;
      const type = input.dataset.type;
      const value = option.dataset.value;
      const card = contentContainer.querySelector(`[data-card-id="${cardId}"]`);
      const modifier = card.dataset.modifier;
      
      // Set value and close dropdown
      input.value = value;
      wrapper.classList.remove('open');
      
      // Reset filter - show all options for next open
      dropdown.querySelectorAll('.searchable-option').forEach(opt => {
        opt.style.display = '';
        opt.classList.remove('selected');
      });
      option.classList.add('selected');
      
      if (type === 'item1') {
        const statCombos = processedStats.find(n => n.cardId === cardId);
        const allItems = getAllItemsForModifier(statCombos);
        const compatibleItem2s = getCompatibleItems(value, modifier, combinationsData, allItems);
        
        const item2Wrapper = card.querySelector('.searchable-select[data-type="item2"]');
        const item2Input = item2Wrapper.querySelector('.searchable-input');
        const item2Dropdown = item2Wrapper.querySelector('.searchable-dropdown');
        
        item2Dropdown.innerHTML = compatibleItem2s.map(item2 => `
          <div class="searchable-option" data-value="${item2}">${item2}</div>
        `).join('');
        
        item2Dropdown.querySelectorAll('.searchable-option').forEach(opt => {
          opt.addEventListener('click', function() {
            const val = this.dataset.value;
            item2Input.value = val;
            item2Wrapper.classList.remove('open');
            item2Dropdown.querySelectorAll('.searchable-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            
            selectedCombos[cardId] = { item1: value, item2: val };
            updateShoppingList(shoppingContainer, processedStats, modifiers);
          });
        });
        
        selectedCombos[cardId] = { item1: value, item2: compatibleItem2s[0] || '' };
        item2Input.value = compatibleItem2s[0] || '';
        if (compatibleItem2s[0]) {
          item2Dropdown.querySelector(`[data-value="${compatibleItem2s[0]}"]`)?.classList.add('selected');
        }
        
      } else {
        const item1Input = card.querySelector('.searchable-select[data-type="item1"] .searchable-input');
        selectedCombos[cardId] = { item1: item1Input.value, item2: value };
      }
      
      updateShoppingList(shoppingContainer, processedStats, modifiers);
    });
  });
}

/**
 * Update the shopping list based on selected combinations
 */
function updateShoppingList(container, processedStats, modifiers) {
  const items = {};
  
  processedStats.forEach((stat) => {
    const cardId = stat.cardId;
    const selected = selectedCombos[cardId];
    const count = stat.count;
    
    if (selected && selected.item1 && selected.item2) {
      if (!items[selected.item1]) {
        items[selected.item1] = { qty: 0, forStats: [] };
      }
      items[selected.item1].qty += count;
      if (!items[selected.item1].forStats.includes(stat.modifier)) {
        items[selected.item1].forStats.push(stat.modifier);
      }
      
      if (!items[selected.item2]) {
        items[selected.item2] = { qty: 0, forStats: [] };
      }
      items[selected.item2].qty += count;
      if (!items[selected.item2].forStats.includes(stat.modifier)) {
        items[selected.item2].forStats.push(stat.modifier);
      }
    }
  });
  
  const sortedItems = Object.entries(items).sort((a, b) => b[1].qty - a[1].qty);
  
  if (sortedItems.length === 0) {
    container.innerHTML = `<p class="empty-state">Select combinations above to build your shopping list.</p>`;
    return;
  }
  
  container.innerHTML = `
    <table class="shopping-table">
      <thead>
        <tr>
          <th>Junk Loot Item</th>
          <th>Qty</th>
          <th>For Stats</th>
        </tr>
      </thead>
      <tbody>
        ${sortedItems.map(([itemName, data]) => `
          <tr>
            <td>${itemName}</td>
            <td class="shopping-qty">${data.qty}x</td>
            <td class="shopping-for">${[...new Set(data.forStats)].join(', ')}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Format shopping list as copyable text
 */
export function formatShoppingListText(needed, modifiers) {
  const processedStats = processStats(needed);
  const items = {};
  
  processedStats.forEach((stat) => {
    const cardId = stat.cardId;
    const selected = selectedCombos[cardId];
    const count = stat.count;
    
    if (selected && selected.item1 && selected.item2) {
      if (!items[selected.item1]) items[selected.item1] = 0;
      items[selected.item1] += count;
      
      if (!items[selected.item2]) items[selected.item2] = 0;
      items[selected.item2] += count;
    }
  });
  
  const sortedItems = Object.entries(items).sort((a, b) => b[1] - a[1]);
  
  let text = "SEA Builder Shopping List\n";
  text += "========================\n\n";
  
  sortedItems.forEach(([item, qty]) => {
    text += `${qty}x ${item}\n`;
  });
  
  return text;
}

/**
 * Reset selected combinations (called when build changes)
 */
export function resetSelectedCombos() {
  selectedCombos = {};
  splitModifiers = new Map();
}
