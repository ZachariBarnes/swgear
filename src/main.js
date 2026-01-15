/**
 * SEA Builder Main Application
 * Entry point that wires together all components
 */

import { SLOT_CONFIG, createEmptyBuild, renderVisualView, renderListView } from './components/SlotBuilder.js';
import { initModifierPicker, openModifierPicker } from './components/ModifierPicker.js';
import { renderStatSummary } from './components/StatSummary.js';
import { renderCrafterView, formatShoppingListText, resetSelectedCombos } from './components/CrafterOutput.js';
import { renderExternalBuffs } from './components/ExternalBuffs.js';
import { renderBackpackSection, getBackpackStats } from './components/BackpackSection.js';
import { loadFromURL, updateURL, getShareableURL } from './utils/urlState.js';
import { findCombinations, copyToClipboard } from './utils/export.js';
import { logShareEvent, getBuildSummary } from './utils/analytics.js';

// Import data
import modifiersData from './data/modifiers.json';
import combinationsData from './data/combinations.json';
import { PRESETS, applyPreset } from './data/presets.js';
import { analyzeSkillCalcText, generateBuildRecommendation } from './utils/skillCalc.js';

// Application state
let currentBuild = null;
let currentView = 'visual';
let currentTab = 'builder';
let activeSlotId = null;
let copiedSlotConfig = null; // For copy/paste slot stats

// DOM elements (initialized in init())
let slotContainer = null;
let statSummary = null;
let externalBuffsContainer = null;
let backpackContainer = null;
let shareBtn = null;
let viewToggleBtns = null;

/**
 * Initialize the application
 */
function init() {
  console.log('SEA Builder initializing...');
  console.log(`Loaded ${modifiersData.length} modifiers`);
  console.log(`Loaded combinations data`);
  
  // Get DOM elements
  slotContainer = document.getElementById('slot-container');
  statSummary = document.getElementById('stat-summary');
  externalBuffsContainer = document.getElementById('external-buffs-container');
  backpackContainer = document.getElementById('backpack-container');
  shareBtn = document.getElementById('share-btn');
  viewToggleBtns = document.querySelectorAll('.view-toggle .toggle-btn');
  
  // Try to load build from URL, or create empty
  currentBuild = loadFromURL() || createEmptyBuild();
  
  // Initialize components
  initModifierPicker(modifiersData, combinationsData);
  
  // Set up event listeners
  setupEventListeners();
  
  // Initial render
  render();
  
  console.log('SEA Builder ready!');
}

/**
 * Called when buffs update
 */
function handleBuffsUpdate(newBuffs) {
  currentBuild.externalBuffs = newBuffs;
  onBuildChanged();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Get DOM elements
  const resetBtn = document.getElementById('reset-btn');
  const editorSection = document.getElementById('editor-section');
  const tabBtns = document.querySelectorAll('.tab-btn');
  const builderView = document.getElementById('builder-view');
  const jewelryView = document.getElementById('jewelry-view');
  const crafterView = document.getElementById('crafter-view');
  const crafterContent = document.getElementById('crafter-content');
  const jewelryContent = document.getElementById('jewelry-content');
  const shoppingList = document.getElementById('shopping-list');
  const copyShoppingBtn = document.getElementById('copy-shopping-btn');
  
  // Tab switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTab = btn.dataset.tab;
      
      // Toggle view containers
      builderView.classList.toggle('active', currentTab === 'builder');
      jewelryView.classList.toggle('active', currentTab === 'jewelry');
      crafterView.classList.toggle('active', currentTab === 'crafter');
      
      // Render jewelry view when switching to it
      if (currentTab === 'jewelry') {
        const { renderJewelryEditor } = await import('./components/JewelryEditor.js');
        renderJewelryEditor(jewelryContent, currentBuild.jewelry || {}, handleJewelryUpdate);
      }
      
      // Render crafter view when switching to it
      if (currentTab === 'crafter') {
        renderCrafterView(crafterContent, shoppingList, currentBuild, combinationsData, modifiersData);
      }
    });
  });
  
  // View toggle (visual/list)
  viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentView = btn.dataset.view;
      renderSlots();
    });
  });
  
  // Share button
  shareBtn.addEventListener('click', async () => {
    const url = getShareableURL(currentBuild);
    const success = await copyToClipboard(url);
    
    if (success) {
      // Log share event to analytics
      logShareEvent(url, getBuildSummary(currentBuild));
      
      const originalText = shareBtn.innerHTML;
      shareBtn.innerHTML = 'Copied!';
      setTimeout(() => {
        shareBtn.innerHTML = originalText;
      }, 2000);
    }
  });
  
  // Copy shopping list button
  copyShoppingBtn.addEventListener('click', async () => {
    const needed = findCombinations(currentBuild, combinationsData);
    const text = formatShoppingListText(needed, modifiersData);
    const success = await copyToClipboard(text);
    
    if (success) {
      const originalText = copyShoppingBtn.innerHTML;
      copyShoppingBtn.innerHTML = 'Copied!';
      setTimeout(() => {
        copyShoppingBtn.innerHTML = originalText;
      }, 2000);
    }
  });
  
  // Reset button - no confirmation needed
  resetBtn.addEventListener('click', () => {
    currentBuild = createEmptyBuild();
    activeSlotId = null;
    resetSelectedCombos();
    editorSection.innerHTML = '<div class="editor-placeholder"><p>Select an armor slot to add stats</p></div>';
    document.querySelectorAll('.slot-card, .slot-list-item').forEach(el => el.classList.remove('active'));
    render();
    
    // Re-render crafter if on that tab
    if (currentTab === 'crafter') {
      const crafterContent = document.getElementById('crafter-content');
      const shoppingList = document.getElementById('shopping-list');
      renderCrafterView(crafterContent, shoppingList, currentBuild, combinationsData, modifiersData);
    }
  });
  
  // Preset dropdown
  setupPresetDropdown();
  
  // Quick preset buttons
  setupQuickPresets();
  
  // Skill calculator import
  setupImportModal();
}

// Quick preset configurations (for core armor slots only)
const QUICK_PRESETS = {
  'ranged-dps': {
    name: 'Ranged DPS',
    stats: ['Ranged General', 'Defense General', 'Opportune Chance']
  },
  'melee-dps': {
    name: 'Melee DPS',
    stats: ['Melee General', 'Defense General', 'Opportune Chance']
  },
  'healer': {
    name: 'Healer',
    stats: ['Endurance Boost', 'Toughness Boost', 'Defense General']
  },
  'tank': {
    name: 'Tank',
    stats: ['Toughness Boost', 'Defense General', 'Melee General']
  },
  'hybrid': {
    name: 'Hybrid',
    stats: ['Ranged General', 'Melee General', 'Opportune Chance']
  }
};

// Core armor slots (non-exotic)
const CORE_SLOTS = ['helmet', 'lbicep', 'rbicep', 'lbracer', 'rbracer', 'gloves', 'belt', 'pants', 'boots'];

/**
 * Set up quick preset buttons
 */
function setupQuickPresets() {
  const quickPresetsContainer = document.getElementById('quick-presets');
  const clearBtn = document.getElementById('clear-all-btn');
  const editorSection = document.getElementById('editor-section');
  
  if (!quickPresetsContainer) return;
  
  // Quick preset buttons
  quickPresetsContainer.querySelectorAll('.quick-preset-btn[data-preset]').forEach(btn => {
    btn.addEventListener('click', () => {
      const presetId = btn.dataset.preset;
      const preset = QUICK_PRESETS[presetId];
      if (!preset) return;
      
      // Apply stats to all core slots
      CORE_SLOTS.forEach(slotId => {
        if (currentBuild.slots[slotId]) {
          currentBuild.slots[slotId].stats = preset.stats.map(name => ({
            modifier: name,
            ratio: modifiersData.find(m => m.name === name)?.ratio || 1
          }));
          currentBuild.slots[slotId].powerBit = 35;
        }
      });
      
      onBuildChanged();
      
      // Flash feedback
      btn.style.backgroundColor = 'var(--color-accent-green)';
      btn.style.color = 'white';
      setTimeout(() => {
        btn.style.backgroundColor = '';
        btn.style.color = '';
      }, 300);
    });
  });
  
  // Clear all button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      currentBuild = createEmptyBuild();
      activeSlotId = null;
      resetSelectedCombos();
      editorSection.innerHTML = '<div class="editor-placeholder"><p>Select an armor slot to add stats</p></div>';
      document.querySelectorAll('.slot-card, .slot-list-item').forEach(el => el.classList.remove('active'));
      render();
      
      // Re-render crafter if on that tab
      if (currentTab === 'crafter') {
        const crafterContent = document.getElementById('crafter-content');
        const shoppingList = document.getElementById('shopping-list');
        renderCrafterView(crafterContent, shoppingList, currentBuild, combinationsData, modifiersData);
      }
    });
  }
}

/**
 * Handle slot click - show slot editor
 */
function handleSlotClick(slotId) {
  activeSlotId = slotId;
  showSlotEditor(slotId);
}

/**
 * Show the slot editor modal/panel
 */
function showSlotEditor(slotId) {
  const slot = currentBuild.slots[slotId];
  const slotConfig = SLOT_CONFIG.find(s => s.id === slotId);
  const editorSection = document.getElementById('editor-section');
  
  // Only show copy button when slot has 3 stats
  const hasFullStats = slot.stats.filter(s => s.modifier).length === 3;
  
  // Add exotic indicator if applicable
  const exoticNote = slotConfig.isExotic 
    ? '<p class="exotic-note">Exotic slot - can use any modifier type</p>' 
    : '';
  
  editorSection.innerHTML = `
    <div class="slot-editor">
      <div class="editor-header">
        <h3>${slot.name}${slotConfig.isExotic ? ' <span class="exotic-badge">EXOTIC</span>' : ''}</h3>
        <div class="editor-header-actions">
          ${hasFullStats ? '<button class="btn-icon" id="copy-slot-btn" title="Copy Stats"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg></button>' : ''}
          ${copiedSlotConfig ? '<button class="btn-icon" id="paste-slot-btn" title="Paste Stats"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg></button>' : ''}
          <button class="editor-close" aria-label="Close">X</button>
        </div>
      </div>
      <div class="editor-body">
        ${exoticNote}
        <div class="power-selector">
          <label for="power-select">Power Bit:</label>
          <select id="power-select">
            ${[30, 31, 32, 33, 34, 35].map(p => 
              `<option value="${p}" ${slot.powerBit === p ? 'selected' : ''}>+${p}</option>`
            ).join('')}
          </select>
        </div>
        <div class="stats-editor">
          <label>Stats (${slotConfig.maxStats} max):</label>
          <div class="stat-slots">
            ${[0, 1, 2].map(i => {
              const stat = slot.stats[i];
              return `
                <div class="stat-slot" data-index="${i}">
                  ${stat?.modifier 
                    ? `<span class="stat-name">${stat.modifier}</span>
                       <button class="stat-remove" data-index="${i}">X</button>`
                    : `<span class="stat-empty">+ Add Stat</span>`
                  }
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Close button
  editorSection.querySelector('.editor-close').addEventListener('click', () => {
    editorSection.innerHTML = '<div class="editor-placeholder"><p>Select an armor slot to add stats</p></div>';
    activeSlotId = null;
    document.querySelectorAll('.slot-card, .slot-list-item').forEach(el => el.classList.remove('active'));
  });
  
  // Power selector
  editorSection.querySelector('#power-select').addEventListener('change', (e) => {
    slot.powerBit = parseInt(e.target.value, 10);
    onBuildChanged();
  });
  
  // Stat slots - click to add/edit
  editorSection.querySelectorAll('.stat-slot').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('stat-remove')) return;
      
      const index = parseInt(el.dataset.index, 10);
      // Get currently selected stats to exclude from picker (prevent duplicates)
      const excludedStats = slot.stats
        .filter((s, i) => s.modifier && i !== index)
        .map(s => s.modifier);
      openModifierPicker(slotId, index, handleModifierSelected, slotConfig.isExotic, excludedStats);
    });
  });
  
  // Remove stat buttons
  editorSection.querySelectorAll('.stat-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.dataset.index, 10);
      slot.stats.splice(index, 1);
      onBuildChanged();
      showSlotEditor(slotId); // Re-render editor
    });
  });
  
  // Copy stats button
  const copyBtn = editorSection.querySelector('#copy-slot-btn');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copiedSlotConfig = {
        stats: JSON.parse(JSON.stringify(slot.stats.filter(s => s.modifier))),
        powerBit: slot.powerBit
      };
      // Show feedback
      copyBtn.textContent = '✓ Copied!';
      setTimeout(() => {
        copyBtn.innerHTML = '📋 Copy Stats';
      }, 1500);
      // Re-render to enable paste button
      showSlotEditor(slotId);
    });
  }
  
  // Paste stats button
  const pasteBtn = editorSection.querySelector('#paste-slot-btn');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      if (!copiedSlotConfig) return;
      
      // Apply copied stats (respecting slot max)
      const slotConf = SLOT_CONFIG.find(s => s.id === slotId);
      slot.stats = JSON.parse(JSON.stringify(copiedSlotConfig.stats)).slice(0, slotConf.maxStats);
      slot.powerBit = copiedSlotConfig.powerBit;
      
      onBuildChanged();
      showSlotEditor(slotId); // Re-render editor
    });
  }
}

/**
 * Handle modifier selection from picker
 */
function handleModifierSelected(slotId, statIndex, modData) {
  const slot = currentBuild.slots[slotId];
  
  // Ensure stats array exists and has room
  while (slot.stats.length <= statIndex) {
    slot.stats.push({});
  }
  
  slot.stats[statIndex] = {
    modifier: modData.modifier,
    ratio: modData.ratio
  };
  
  onBuildChanged();
  
  // Re-render the slot editor if still open
  if (activeSlotId === slotId) {
    showSlotEditor(slotId);
  }
}

/**
 * Called when build changes - update URL and re-render
 */
function onBuildChanged() {
  updateURL(currentBuild);
  render();
}

/**
 * Render all components
 */
function render() {
  renderSlots();
  
  // Get backpack stats for totals calculation
  const backpackStats = getBackpackStats(currentBuild.backpack);
  
  // Combine external buffs with backpack stats for the summary
  const allExternalStats = [...(currentBuild.externalBuffs || []), ...backpackStats.map(s => ({
    modifier: s.modifier,
    value: s.value,
    source: 'backpack'
  }))];
  
  renderStatSummary(statSummary, currentBuild, modifiersData, allExternalStats, currentBuild.armorBonusHP || 0);
  renderExternalBuffs(externalBuffsContainer, currentBuild.externalBuffs, handleBuffsUpdate, currentBuild.armorBonusHP || 0, handleArmorHPUpdate);
  
  // Render backpack section
  if (backpackContainer) {
    renderBackpackSection(backpackContainer, currentBuild.backpack, handleBackpackUpdate);
  }
  
  // Note: Crafter view is now rendered on-demand when the Crafter tab is clicked
}

/**
 * Handle armor bonus HP changes
 */
function handleArmorHPUpdate(value) {
  currentBuild.armorBonusHP = value;
  onBuildChanged();
}

/**
 * Handle jewelry changes
 */
function handleJewelryUpdate(jewelry) {
  currentBuild.jewelry = jewelry;
  onBuildChanged();
}

/**
 * Handle backpack changes
 */
function handleBackpackUpdate(backpack) {
  currentBuild.backpack = backpack;
  onBuildChanged();
}

/**
 * Render just the slots
 */
function renderSlots() {
  if (currentView === 'visual') {
    renderVisualView(slotContainer, currentBuild, handleSlotClick);
    slotContainer.classList.add('visual-view');
    slotContainer.classList.remove('list-view');
  } else {
    renderListView(slotContainer, currentBuild, handleSlotClick);
    slotContainer.classList.add('list-view');
    slotContainer.classList.remove('visual-view');
  }
}

/**
 * Set up the preset dropdown menu
 */
function setupPresetDropdown() {
  const presetBtn = document.getElementById('preset-btn');
  const presetMenu = document.getElementById('preset-menu');
  
  if (!presetBtn || !presetMenu) return;
  
  // SVG icons for preset types
  const presetIcons = {
    shield: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    sword: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/><path d="M19 21l2-2"/></svg>',
    crosshair: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>',
    castle: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="10" width="16" height="12" rx="1"/><path d="M4 10V6a2 2 0 012-2h2V2h2v2h4V2h2v2h2a2 2 0 012 2v4"/><path d="M10 22v-4h4v4"/></svg>',
    medkit: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M12 9v6"/><path d="M9 12h6"/></svg>'
  };
  
  // Populate menu
  presetMenu.innerHTML = PRESETS.map(preset => `
    <button class="preset-option" data-preset-id="${preset.id}">
      <span class="preset-icon">${presetIcons[preset.iconType] || presetIcons.shield}</span>
      <span class="preset-info">
        <span class="preset-name">${preset.name}</span>
        <span class="preset-desc">${preset.description}</span>
      </span>
    </button>
  `).join('');
  
  // Toggle dropdown
  presetBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    presetMenu.hidden = !presetMenu.hidden;
  });
  
  // Close on outside click
  document.addEventListener('click', () => {
    presetMenu.hidden = true;
  });
  
  // Preset selection
  presetMenu.querySelectorAll('.preset-option').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const presetId = btn.dataset.presetId;
      const preset = PRESETS.find(p => p.id === presetId);
      
      if (preset) {
        // Ask if they want to overwrite existing stats
        const hasStats = Object.values(currentBuild.slots).some(s => s.stats && s.stats.some(st => st.modifier));
        
        if (hasStats) {
          // For now, only fill empty slots
          applyPreset(currentBuild, preset, modifiersData, false);
        } else {
          applyPreset(currentBuild, preset, modifiersData, true);
        }
        
        onBuildChanged();
        
        // Close menu and show feedback
        presetMenu.hidden = true;
        presetBtn.textContent = `✓ ${preset.name}`;
        setTimeout(() => {
          presetBtn.textContent = 'Load Preset ▾';
        }, 2000);
      }
    });
  });
}

/**
 * Set up the skill calculator import modal
 */
function setupImportModal() {
  const importBtn = document.getElementById('import-calc-btn');
  const importModal = document.getElementById('import-modal');
  const urlInput = document.getElementById('skill-calc-url');
  const analyzeBtn = document.getElementById('analyze-build-btn');
  const applyBtn = document.getElementById('apply-suggestions-btn');
  const resultDiv = document.getElementById('import-result');
  const closeBtn = importModal?.querySelector('.modal-close');
  
  if (!importBtn || !importModal) return;
  
  let currentAnalysis = null;
  
  // Open modal
  importBtn.addEventListener('click', () => {
    importModal.hidden = false;
    urlInput.value = '';
    resultDiv.hidden = true;
    applyBtn.disabled = true;
    setTimeout(() => urlInput.focus(), 100);
  });
  
  // Close modal
  closeBtn?.addEventListener('click', () => {
    importModal.hidden = true;
  });
  
  // Click outside to close
  importModal.addEventListener('click', (e) => {
    if (e.target === importModal) {
      importModal.hidden = true;
    }
  });
  
  // Analyze build
  analyzeBtn.addEventListener('click', async () => {
    const url = urlInput.value.trim();
    if (!url || !url.includes('swgr.org/skill-calculator')) {
      resultDiv.innerHTML = '<p style="color: var(--color-accent-red);">Please enter a valid SWGR Skill Calculator URL</p>';
      resultDiv.hidden = false;
      return;
    }
    
    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Analyzing...';
    
    try {
      // Fetch the skill calculator page
      const response = await fetch(url);
      const pageText = await response.text();
      
      // Analyze the page content
      currentAnalysis = analyzeSkillCalcText(pageText);
      const recommendation = generateBuildRecommendation(currentAnalysis);
      
      // Display results
      let html = '<h4>Build Analysis</h4>';
      html += '<div style="margin-bottom: 8px;">';
      if (currentAnalysis.ranged) html += '<span class="stat-suggestion">🎯 Ranged Build</span>';
      if (currentAnalysis.melee) html += '<span class="stat-suggestion">⚔️ Melee Build</span>';
      if (currentAnalysis.healing) html += '<span class="stat-suggestion exotic">💉 Healing Build</span>';
      if (currentAnalysis.crafting) html += '<span class="stat-suggestion exotic">🔧 Crafter Build</span>';
      html += '</div>';
      
      html += '<h4>Recommended SEA Stats</h4>';
      html += '<div>';
      currentAnalysis.suggestedStats.forEach(stat => {
        const isExotic = !['Endurance Boost', 'Defense General', 'Opportune Chance', 'Ranged General', 'Melee General', 'Toughness Boost', 'Camouflage'].includes(stat);
        html += `<span class="stat-suggestion ${isExotic ? 'exotic' : ''}">${stat}</span>`;
      });
      html += '</div>';
      
      resultDiv.innerHTML = html;
      resultDiv.hidden = false;
      applyBtn.disabled = false;
      
    } catch (error) {
      resultDiv.innerHTML = `<p style="color: var(--color-accent-red);">Unable to fetch skill calculator. Due to CORS restrictions, you may need to manually select your build type from presets.</p>`;
      resultDiv.hidden = false;
    }
    
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = 'Analyze Build';
  });
  
  // Apply suggestions
  applyBtn.addEventListener('click', () => {
    if (!currentAnalysis) return;
    
    const recommendation = generateBuildRecommendation(currentAnalysis);
    
    // Apply to core slots
    Object.entries(recommendation.coreSlots).forEach(([slotId, stats]) => {
      if (currentBuild.slots[slotId]) {
        currentBuild.slots[slotId].stats = stats.map(name => ({
          modifier: name,
          ratio: modifiersData.find(m => m.name === name)?.ratio || 1
        }));
        currentBuild.slots[slotId].powerBit = 35;
      }
    });
    
    // Apply to exotic slots
    Object.entries(recommendation.exoticSlots).forEach(([slotId, stats]) => {
      if (currentBuild.slots[slotId]) {
        currentBuild.slots[slotId].stats = stats.map(name => ({
          modifier: name,
          ratio: modifiersData.find(m => m.name === name)?.ratio || 1
        }));
        currentBuild.slots[slotId].powerBit = 35;
      }
    });
    
    onBuildChanged();
    importModal.hidden = true;
    
    // Show confirmation
    importBtn.textContent = '✓ Applied!';
    setTimeout(() => {
      importBtn.textContent = '📥 Import Build';
    }, 2000);
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

