/**
 * StatSummary Component
 * Displays stat totals with thresholds and warnings
 */

import { calculateTotals, getSoftCapWarnings, STAT_THRESHOLDS } from '../utils/calculator.js';

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
      ${renderExoticStats(exoticStats, warnings, modifiers)}
      ${renderSummaryFooter(totals, totalWasted)}
    `}
  `;
}

/**
 * Render core stats with progress bars and color-coded values
 */
function renderCoreStats(coreStats, warnings) {
  if (Object.keys(coreStats).length === 0) return '';
  
  const displayMax = 400; // Use 400 as the visible max for the bar
  
  // SVG icons
  const cautionIcon = `<svg class="stat-icon caution" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" title="Diminishing Returns: Stats above 300 have reduced effectiveness"><path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/></svg>`;
  const exclamationIcon = `<svg class="stat-icon wasted" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" title="Wasted Points: Stats above 350 provide almost no benefit"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>`;
  const checkIcon = `<svg class="stat-icon ideal" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" title="Ideal Range: 250-300 for maximum effectiveness"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>`;
  
  const rows = CORE_STAT_ORDER
    .filter(name => coreStats[name] !== undefined)
    .map(name => {
      const total = coreStats[name];
      const warning = warnings[name];
      const status = warning?.status || 'under';
      
      const percent = Math.min((total / displayMax) * 100, 100);
      
      // Determine icon and tooltip based on status
      let statusIcon = '';
      let tooltip = '';
      if (status === 'ideal') {
        statusIcon = checkIcon;
        tooltip = 'Ideal Range: 250-300 for maximum effectiveness';
      } else if (status === 'diminishing') {
        statusIcon = cautionIcon;
        tooltip = 'Diminishing Returns: Stats above 300 have reduced effectiveness';
      } else if (status === 'hard-cap') {
        statusIcon = exclamationIcon;
        tooltip = 'Wasted Points: Stats above 350 provide almost no benefit';
      }
      
      const label = warning?.label || '';
      
      return `
        <div class="stat-row" title="${tooltip}">
          <span class="stat-name">${name}</span>
          <div class="stat-value-group">
            <span class="stat-value ${status}">${total}</span>
            ${statusIcon}
          </div>
        </div>
      `;
    })
    .join('');
  
  return `
    <div class="stat-group">
      <div class="stat-group-title">Core Stats</div>
      <div class="stat-legend">
        <span class="legend-item ideal">250-300 Ideal</span>
        <span class="legend-item diminishing">300-350 Diminishing</span>
        <span class="legend-item hard-cap">350+ Wasted</span>
      </div>
      ${rows}
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
            Totally Wasted Points
          </span>
          <span class="stat-value hard-cap">${totalWasted}</span>
        </div>
      ` : ''}
    </div>
  `;
}
