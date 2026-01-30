/**
 * URL State Management
 * Encode/decode builds to shareable URL parameters
 */

import { SLOT_CONFIG } from '../components/SlotBuilder.js';

// Modifier abbreviation map for URL compression
// Format: full name -> 2-4 char code
// IMPORTANT: Avoid common game abbreviations (STR, CON, AGI, DEX, INT, etc.)
const MODIFIER_CODES = {
  // Core stats
  'Ranged General': 'RNG',
  'Melee General': 'MEL',
  'Defense General': 'DEF',
  'Toughness Boost': 'TGH',
  'Endurance Boost': 'END',
  'Opportune Chance': 'OPP',
  
  // Combat defense
  'Strikethrough Chance': 'STC',
  'Block Value': 'BKV',
  'Block Chance': 'BKC',
  'Critical Hit Chance': 'CHC',
  'Critical Hit Reduction': 'CHR',
  'Evasion Value': 'EVV',
  'Evasion Chance': 'EVC',
  'Glancing Blow Increase': 'GBI',
  'Glancing Blow Increase (Melee)': 'GBM',
  'Glancing Blow Increase (Ranged)': 'GBR',
  'Parry': 'PRY',
  'Critical Hit Value': 'CRV',
  'Action Cost Reduction': 'ACR',
  'Healing Potency': 'HPO',
  'Dodge Chance': 'DDG',
  
  // Trader - use ASM/EXP suffixes
  'Structure Assembly': 'SAS',
  'Structure Experimentation': 'SEX',
  'Armor Assembly': 'AAS',
  'Armor Experimentation': 'AEX',
  'Weapon Assembly': 'WAS',
  'Weapon Experimentation': 'WEX',
  'Droid Assembly': 'DAS',
  'Droid Experimentation': 'DEX',
  'Food Assembly': 'FAS',
  'Food Experimentation': 'FEX',
  'Clothing Assembly': 'CAS',
  'Clothing Experimentation': 'CEX',
  'Cybernetic Assembly': 'YAS',
  'Cybernetic Experimentation': 'YEX',
  'Artisan Assembly': 'ART',
  'Artisan Experimentation': 'ARX',
  
  // Shipwright
  'Chassis Assembly': 'HAS',
  'Chassis Experimentation': 'HEX',
  'Engine Assembly': 'NAS',
  'Engine Experimentation': 'NEX',
  'Booster Assembly': 'BAS',
  'Booster Experimentation': 'BEX',
  'Advanced Assembly': 'VAS',
  'Advanced Component Experimentation': 'VEX',
  
  // Weapon specific
  'Carbine Damage': 'CBD',
  'Carbine Critical Chance': 'CBC',
  'Carbine Action Cost': 'CBA',
  'Rifle Damage': 'RFD',
  'Rifle Critical Chance': 'RFC',
  'Rifle Action Cost': 'RFA',
  'Pistol Damage': 'PTD',
  'Pistol Critical Chance': 'PTC',
  'Pistol Action Cost': 'PTA',
  'Heavy Weapon Damage': 'HWD',
  'Heavy Weapon Critical Chance': 'HWC',
  'Heavy Weapon Action Cost': 'HWA',
  'Pistol Accuracy': 'PAC',
  'Pistol Speed': 'PSP',
  '1-Handed Melee Damage': 'M1D',
  '1-H Critical Chance': 'M1C',
  '2-Handed Melee Damage': 'M2D',
  '2-H Critical Chance': 'M2C',
  'Polearm Damage': 'POD',
  'Polearm Critical Chance': 'POC',
  
  // Other common
  'Surveying': 'SRV',
  'Foraging': 'FRG',
  'Camouflage': 'CAM',
  
  // Legacy/mislabeled items (game uses Toughness/Endurance instead)
  // Kept for compatibility with any old data that might reference these
  'Constitution': 'COT',
  'Agility': 'AGL',
  'Stamina': 'STA',
  'Luck': 'LCK'
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
 * New format: HCPO.OPP.RNG.END|GLRR.OPP.RNG.TGH (grouped slots, no powerbit if 35)
 * With powerbit: HCPO.28.OPP.RNG.END (includes powerbit if not 35)
 */
export function encodeBuild(build) {
  // Group slots by their config signature (powerbit + modifiers)
  const configGroups = new Map();
  
  for (const [slotId, slot] of Object.entries(build.slots)) {
    if (!slot.stats || slot.stats.length === 0) continue;
    
    const slotCode = SLOT_CODES[slotId] || slotId;
    const powerBit = slot.powerBit || 35;
    const mods = slot.stats
      .filter(s => s.modifier)
      .map(s => MODIFIER_CODES[s.modifier] || s.modifier.substring(0, 3).toUpperCase())
      .sort() // Sort for consistent grouping
      .join('.');
    
    if (!mods) continue;
    
    // Create signature: powerbit.mods (for grouping identical configs)
    const signature = `${powerBit}.${mods}`;
    
    if (!configGroups.has(signature)) {
      configGroups.set(signature, { powerBit, mods, slots: [] });
    }
    configGroups.get(signature).slots.push(slotCode);
  }
  
  // Build compact URL parts
  const parts = [];
  for (const [signature, group] of configGroups) {
    const slotsStr = group.slots.join('');
    // Omit powerbit if default (35)
    if (group.powerBit === 35) {
      parts.push(`${slotsStr}.${group.mods}`);
    } else {
      parts.push(`${slotsStr}.${group.powerBit}.${group.mods}`);
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
 * Supports both new compact format and old format
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
    const firstSegment = segments[0];
    
    // Check for external buffs (starts with X)
    if (firstSegment === 'X') {
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
    
    // Parse slot codes (can be single like "H" or grouped like "HCPO")
    const slotCodes = parseSlotCodes(firstSegment);
    
    // Determine if second segment is powerbit or modifier
    // If it's a number, it's powerbit; otherwise it's the first modifier
    let powerBit = 35;
    let modStartIndex = 1;
    
    if (segments.length > 1 && /^\d+$/.test(segments[1])) {
      powerBit = parseInt(segments[1], 10);
      modStartIndex = 2;
    }
    
    const modCodes = segments.slice(modStartIndex).filter(code => code);
    const stats = modCodes.map(code => ({ modifier: CODE_TO_MODIFIER[code] || code }));
    
    // Apply to all slots in this group
    for (const slotCode of slotCodes) {
      const slotId = CODE_TO_SLOT[slotCode] || slotCode;
      if (slotId && build.slots[slotId]) {
        build.slots[slotId].powerBit = powerBit;
        build.slots[slotId].stats = [...stats]; // Clone stats array
      }
    }
  }
  
  return build;
}

/**
 * Parse slot codes - handles both single (H) and grouped (HCPO) formats
 */
function parseSlotCodes(str) {
  const codes = [];
  let i = 0;
  
  while (i < str.length) {
    // Check for 2-char codes first (LB, LR, RB, RR)
    const twoChar = str.substring(i, i + 2);
    if (CODE_TO_SLOT[twoChar]) {
      codes.push(twoChar);
      i += 2;
    } else {
      // Single char code
      codes.push(str[i]);
      i += 1;
    }
  }
  
  return codes;
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
