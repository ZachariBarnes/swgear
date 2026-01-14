/**
 * URL State Management
 * Encode/decode builds to shareable URL parameters
 */

import { SLOT_CONFIG } from '../components/SlotBuilder.js';

// Modifier abbreviation map for URL compression
// Format: full name -> 2-3 char code
const MODIFIER_CODES = {
  // Core stats
  'Ranged General': 'RG',
  'Melee General': 'MG',
  'Defense General': 'DG',
  'Toughness Boost': 'TB',
  'Endurance Boost': 'EB',
  'Opportune Chance': 'OC',
  // Exotic stats
  'Strikethrough Chance': 'SC',
  'Block Value': 'BV',
  'Critical Hit Chance': 'CC',
  'Evasion Value': 'EV',
  'Evasion Chance': 'EC',
  'Glancing Blow': 'GB',
  'Parry': 'PA',
  'Critical Hit Value': 'CV',
  'Action Cost Reduction': 'AC',
  'Healing Potency': 'HP'
};

// Reverse map for decoding
const CODE_TO_MODIFIER = Object.fromEntries(
  Object.entries(MODIFIER_CODES).map(([name, code]) => [code, name])
);

// Slot abbreviations
const SLOT_CODES = {
  helmet: 'H', chest: 'C', shirt: 'S', belt: 'B', pants: 'P', boots: 'O',
  lbicep: 'LB', lbracer: 'LR', gloves: 'G',
  rbicep: 'RB', rbracer: 'RR', weapon: 'W'
};

const CODE_TO_SLOT = Object.fromEntries(
  Object.entries(SLOT_CODES).map(([slot, code]) => [code, slot])
);

/**
 * Encode a build to a compact URL-safe string
 * Format: H.35.RG.DG.OC|C.35.MG|... (slot.power.mod1.mod2...)
 */
export function encodeBuild(build) {
  const parts = [];
  
  for (const [slotId, slot] of Object.entries(build.slots)) {
    if (!slot.stats || slot.stats.length === 0) continue;
    
    const slotCode = SLOT_CODES[slotId] || slotId;
    const mods = slot.stats
      .filter(s => s.modifier)
      .map(s => MODIFIER_CODES[s.modifier] || s.modifier.substring(0, 3).toUpperCase())
      .join('.');
    
    if (mods) {
      parts.push(`${slotCode}.${slot.powerBit || 35}.${mods}`);
    }
  }
  
  // Add external buffs (format: X.modifier=value)
  if (build.externalBuffs && build.externalBuffs.length > 0) {
    const buffsStr = build.externalBuffs
      .map(b => {
        const code = MODIFIER_CODES[b.modifier] || b.modifier.substring(0, 3).toUpperCase();
        return `${code}=${b.value}`;
      })
      .join('.');
    parts.push(`X.${buffsStr}`);
  }
  
  return parts.join('|');
}

/**
 * Decode a URL string back to a build object
 */
export function decodeBuild(encoded) {
  const build = {
    name: 'Imported Build',
    slots: {},
    externalBuffs: []
  };
  
  // Initialize all slots
  for (const slot of SLOT_CONFIG) {
    build.slots[slot.id] = {
      id: slot.id,
      name: slot.name,
      isExotic: slot.isExotic,
      powerBit: 35,
      stats: []
    };
  }
  
  if (!encoded) return build;
  
  // Support legacy format (uses colons and commas)
  const isLegacy = encoded.includes(':') && encoded.includes(',');
  
  if (isLegacy) {
    return decodeLegacyBuild(encoded, build);
  }
  
  const parts = encoded.split('|');
  
  for (const part of parts) {
    const segments = part.split('.');
    const slotCode = segments[0];
    
    // Check for external buffs (starts with X)
    if (slotCode === 'X') {
      for (let i = 1; i < segments.length; i++) {
        const [code, val] = segments[i].split('=');
        const modifier = CODE_TO_MODIFIER[code] || code;
        build.externalBuffs.push({
          modifier,
          value: parseInt(val, 10) || 0,
          source: 'imported'
        });
      }
      continue;
    }
    
    const slotId = CODE_TO_SLOT[slotCode] || slotCode;
    
    if (slotId && build.slots[slotId]) {
      build.slots[slotId].powerBit = parseInt(segments[1], 10) || 35;
      build.slots[slotId].stats = segments.slice(2)
        .filter(code => code)
        .map(code => ({ modifier: CODE_TO_MODIFIER[code] || code }));
    }
  }
  
  return build;
}

/**
 * Decode legacy URL format (pre-compression)
 */
function decodeLegacyBuild(encoded, build) {
  const parts = encoded.split('|');
  
  for (const part of parts) {
    if (part.startsWith('buffs:')) {
      const [_, buffsStr] = part.split('buffs:');
      if (buffsStr) {
        build.externalBuffs = buffsStr.split(',').map(b => {
          const [modVal, source] = b.split(':');
          const [mod, val] = modVal.split('=');
          return {
            modifier: decodeURIComponent(mod),
            value: parseInt(val, 10) || 0,
            source: source || 'unknown'
          };
        });
      }
      continue;
    }

    const [slotId, powerStr, modsStr] = part.split(':');
    
    if (slotId && build.slots[slotId] && modsStr) {
      build.slots[slotId].powerBit = parseInt(powerStr, 10) || 35;
      build.slots[slotId].stats = modsStr
        .split(',')
        .filter(m => m)
        .map(m => ({ modifier: decodeURIComponent(m) }));
    }
  }
  
  return build;
}

/**
 * Update the URL with the current build state
 * @param {Object} build - Current build
 */
export function updateURL(build) {
  const encoded = encodeBuild(build);
  const url = new URL(window.location.href);
  
  if (encoded) {
    url.searchParams.set('build', encoded);
  } else {
    url.searchParams.delete('build');
  }
  
  window.history.replaceState(null, '', url.toString());
}

/**
 * Load build from current URL
 * @returns {Object|null} - Decoded build or null if no build in URL
 */
export function loadFromURL() {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('build');
  
  if (encoded) {
    try {
      return decodeBuild(encoded);
    } catch (e) {
      console.warn('Failed to parse build from URL:', e);
      return null;
    }
  }
  
  return null;
}

/**
 * Generate a shareable URL for the current build
 * @param {Object} build - Current build
 * @returns {string} - Full shareable URL
 */
export function getShareableURL(build) {
  const url = new URL(window.location.origin + window.location.pathname);
  const encoded = encodeBuild(build);
  
  if (encoded) {
    url.searchParams.set('build', encoded);
  }
  
  return url.toString();
}
