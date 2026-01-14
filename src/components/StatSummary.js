/**
 * StatSummary Component
 * Displays stat totals with thresholds and warnings
 */

import { calculateTotals, getSoftCapWarnings, STAT_THRESHOLDS, calculateHAM } from '../utils/calculator.js';

// Core stats display order
const CORE_STAT_ORDER = [
  'Ranged General',
  'Melee General',
  'Defense General',
  'Toughness Boost',
  'Endurance Boost',
  'Opportune Chance'
];

/**
 * Render the stat summary panel
 * @param {HTMLElement} container - Container element
 * @param {Object} build - Current build state
 * @param {Array} modifiers - All modifiers data
 * @param {Array} externalBuffs - External buffs data
 */
export function renderStatSummary(container, build, modifiers, externalBuffs = []) {
  const totals = calculateTotals(build, modifiers, externalBuffs);
  const warnings = getSoftCapWarnings(totals, modifiers);
  
  // Separate core stats from exotic stats
  const coreStats = {};
  const exoticStats = {};
  
  for (const [name, total] of Object.entries(totals)) {
    if (CORE_STAT_ORDER.includes(name)) {
      coreStats[name] = total;
    } else {
      exoticStats[name] = total;
    }
  }
  
  // Calculate wasted points
  let totalWasted = 0;
  for (const w of Object.values(warnings)) {
    totalWasted += w.wasted;
  }
  
  container.innerHTML = `
    ${Object.keys(totals).length === 0 ? `
      <p class="empty-state">Add stats (or external buffs) to see totals here.</p>
    ` : `
      ${renderCoreStats(coreStats, warnings)}
      ${renderHAMPools(totals)}
      ${renderExoticStats(exoticStats, warnings, modifiers)}
      ${renderSummaryFooter(totals, totalWasted)}
    `}
  `;
}

/**
 * Render core stats with progress bars and color-coded values
 * Always shows all 6 core stats like the in-game Character Attributes panel
 */
function renderCoreStats(coreStats, warnings) {
  const displayMax = 400; // Use 400 as the visible max for the bar
  
  // Official stat descriptions from swgr.org wiki
  const STAT_DESCRIPTIONS = {
    'Ranged General': 'Per point: +0.33 Ranged Speed, +0.25 Ranged Defense, +0.25 Ranged Accuracy',
    'Melee General': 'Per point: +0.33 Melee Speed, +0.25 Melee Defense, +0.25 Melee Accuracy',
    'Defense General': 'Per point: +0.33 Defense, +0.5 Healing Efficiency. Per 100 pts: +1% State Resist',
    'Toughness Boost': 'Per point: +2 Health. Per 100 pts: +1% State Resist',
    'Endurance Boost': 'Per point: +1 Action, +1 Mind, +0.1% H/A/M Regen, +0.05% Healing, -0.05% Heal Cost',
    'Opportune Chance': 'Per point: +0.33 Accuracy, +0.33 Med Speed. Per 100 pts: +1% Crit Hit Chance, +1% Crit Hit Reduction. Also affects rare loot, crafting crits, fishing, and foraging.'
  };
  
  // Wiki URLs for stats
  const STAT_URLS = {
    'Ranged General': 'https://swgr.org/wiki/ranged_general/',
    'Melee General': 'https://swgr.org/wiki/melee_general/',
    'Defense General': 'https://swgr.org/wiki/Defense_General',
    'Toughness Boost': 'https://swgr.org/wiki/toughness/',
    'Endurance Boost': 'https://swgr.org/wiki/endurance/',
    'Opportune Chance': 'https://swgr.org/wiki/opportune_chance/'
  };
  
  // SVG icons
  const cautionIcon = `<svg class="stat-icon caution" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
  const exclamationIcon = `<svg class="stat-icon overcapped" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  const checkIcon = `<svg class="stat-icon ideal" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
  
  // Always show all 6 core stats in order (like in-game character panel)
  const rows = CORE_STAT_ORDER.map(name => {
    const total = coreStats[name] || 0;
    const warning = warnings[name];
    const status = warning?.status || (total === 0 ? 'zero' : 'under');
    const description = STAT_DESCRIPTIONS[name] || '';
    
    const percent = Math.min((total / displayMax) * 100, 100);
    
    // Determine icon and tooltip based on status
    let statusIcon = '';
    let statusTooltip = '';
    if (status === 'ideal') {
      statusIcon = checkIcon;
      statusTooltip = 'Ideal Range: 250-300 for maximum effectiveness';
    } else if (status === 'diminishing') {
      statusIcon = cautionIcon;
      statusTooltip = 'Diminishing Returns: Stats above 300 have reduced effectiveness';
    } else if (status === 'hard-cap') {
      statusIcon = exclamationIcon;
      statusTooltip = 'Overcapped: Stats above 350 have very low efficiency';
    }
    
    // Full tooltip with description and status
    const fullTooltip = description + (statusTooltip ? `\n\n${statusTooltip}` : '');
    
    return `
      <div class="stat-row ${status === 'zero' ? 'stat-zero' : ''}" title="${fullTooltip}">
        <span class="stat-name">${name}</span>
        <div class="stat-value-group">
          <span class="stat-value ${status}">${total}</span>
          ${statusIcon}
        </div>
      </div>
    `;
  }).join('');
  
  return `
    <div class="stat-group">
      <div class="stat-group-title">Core Stats</div>
      <div class="stat-legend">
        <span class="legend-item ideal">250-300 Ideal</span>
        <span class="legend-item diminishing">300-350 Diminishing</span>
        <span class="legend-item hard-cap">350+ Overcapped</span>
      </div>
      ${rows}
    </div>
  `;
}

/**
 * Render HAM pools (Health, Action, Mind) display
 */
function renderHAMPools(totals) {
  const ham = calculateHAM(totals);
  
  // Only show if we have any stats
  const hasToughness = (totals['Toughness Boost'] || 0) > 0;
  const hasEndurance = (totals['Endurance Boost'] || 0) > 0;
  const hasDefense = (totals['Defense General'] || 0) > 0;
  const hasOpportune = (totals['Opportune Chance'] || 0) > 0;
  
  if (!hasToughness && !hasEndurance && !hasDefense && !hasOpportune) return '';
  
  return `
    <div class="stat-group ham-pools">
      <div class="stat-group-title">Calculated Stats</div>
      <div class="ham-bars">
        <div class="ham-bar health" title="Base 3500 + (Effective Toughness × 2)">
          <span class="ham-label">Health</span>
          <span class="ham-value">${ham.health.toLocaleString()}</span>
        </div>
        <div class="ham-bar action" title="Base 3500 + Effective Endurance">
          <span class="ham-label">Action</span>
          <span class="ham-value">${ham.action.toLocaleString()}</span>
        </div>
        <div class="ham-bar mind" title="Base 3500 + Effective Endurance">
          <span class="ham-label">Mind</span>
          <span class="ham-value">${ham.mind.toLocaleString()}</span>
        </div>
      </div>
      <div class="secondary-stats">
        ${hasDefense ? `<span class="sec-stat" title="Defense General × 0.33">Defense: +${ham.defense}</span>` : ''}
        ${ham.stateResist > 0 ? `<span class="sec-stat" title="1% per 100 Toughness + Defense">State Resist: +${ham.stateResist}%</span>` : ''}
        ${hasOpportune ? `<span class="sec-stat" title="1% per 100 Opportune">Crit: +${ham.critChance}%</span>` : ''}
        ${hasEndurance ? `<span class="sec-stat" title="Endurance × 0.1%">Regen: +${ham.regenPercent.toFixed(1)}%</span>` : ''}
      </div>
    </div>
  `;
}

/**
 * Render exotic stats
 */
function renderExoticStats(exoticStats, warnings, modifiers) {
  if (Object.keys(exoticStats).length === 0) return '';
  
  const modMap = new Map(modifiers.map(m => [m.name, m]));
  
  const rows = Object.entries(exoticStats)
    .sort((a, b) => b[1] - a[1]) // Sort by value descending
    .map(([name, total]) => {
      const mod = modMap.get(name);
      const ratio = mod?.ratio || 1;
      
      return `
        <div class="stat-row">
          <span class="stat-name">${name}</span>
          <span class="stat-value exotic">+${total} <span class="ratio-info">(1:${ratio})</span></span>
        </div>
      `;
    })
    .join('');
  
  return `
    <div class="stat-group">
      <div class="stat-group-title">★ Exotic Stats</div>
      ${rows}
    </div>
  `;
}

/**
 * Render summary footer with totals
 */
function renderSummaryFooter(totals, totalWasted) {
  const statCount = Object.keys(totals).length;
  
  return `
    <div class="stat-group summary-footer">
      <div class="stat-row">
        <span class="stat-name">Total Stats</span>
        <span class="stat-value">${statCount}</span>
      </div>
      ${totalWasted > 0 ? `
        <div class="stat-row warning-row">
          <span class="stat-name">
            <svg class="stat-icon caution" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>
            Overcapped Points
          </span>
          <span class="stat-value hard-cap">${totalWasted}</span>
        </div>
      ` : ''}
    </div>
  `;
}
