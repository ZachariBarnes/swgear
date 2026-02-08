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
  'Shipwright Assembly': 'SHS',
  'Shipwright Experimentation': 'SHX',
  
  // Weapon specific
  'Carbine Damage': 'CBD',
  'Carbine Critical Chance': 'CBC',
  'Carbine Action Cost': 'CBA',
  'Carbine Accuracy': 'CAC',
  'Carbine Speed': 'CSP',
  
  'Rifle Damage': 'RFD',
  'Rifle Critical Chance': 'RFC',
  'Rifle Action Cost': 'RFA',
  'Rifle Accuracy': 'RAC',
  'Rifle Speed': 'RSP',
  
  'Pistol Damage': 'PTD',
  'Pistol Critical Chance': 'PTC',
  'Pistol Action Cost': 'PTA',
  'Pistol Accuracy': 'PAC',
  'Pistol Speed': 'PSP',
  
  'Heavy Weapon Damage': 'HWD',
  'Heavy Weapon Critical Chance': 'HWC',
  'Heavy Weapon Action Cost': 'HWA',
  'Heavy Weapon Accuracy': 'HAC',
  'Heavy Weapon Speed': 'HSP',
  
  '1-Handed Melee Damage': 'M1D',
  '1-H Critical Chance': 'M1C',
  '1-Handed Weapon Accuracy': 'M1A',
  '1-H Speed': 'M1S',
  
  '2-Handed Melee Damage': 'M2D',
  '2-H Critical Chance': 'M2C',
  '2-Handed Melee Accuracy': 'M2A',
  '2-H Speed': 'M2S',
  
  'Polearm Damage': 'POD',
  'Polearm Critical Chance': 'POC',
  'Polearm Accuracy': 'POA',
  'Polearm Speed': 'POS',

  'Unarmed Accuracy': 'UNA',
  'Unarmed Speed': 'UNS',

  'Thrown Weapon Accuracy': 'TWA',
  'Thrown Weapon Speed': 'TWS',

  'One Handed Lightsaber Accuracy': 'L1A',
  'One Handed Lightsaber Speed': 'L1S',
  
  'Two Handed Lightsaber Accuracy': 'L2A',
  'Two Handed Lightsaber Speed': 'L2S',
  
  'Double Bladed Lightsaber Accuracy': 'DLA',
  'Double Bladed Lightsaber Speed': 'DLS',

  // Medical
  'Medical Heal Speed': 'MHS',
  'Medical Combat Speed': 'MCS',
  
  // Other common
  'Surveying': 'SRV',
  'Foraging': 'FRG',
  'Camouflage': 'CAM',
  
  // State Resists
  'Defense Vs. Blind': 'DVB',
  'Defense Vs. Dizzy': 'DVD',
  'Defense Vs. Intimidate': 'DVI',
  'Defense Vs. Knockdown': 'DVK',
  'Defense Vs. Stun': 'DVS',
  
  // Jedi
  'Lightsaber Assembly': 'LSA',
  'Lightsaber Experimentation': 'LSX',
  'Force Accuracy': 'FAC',
  'Force Power Max': 'FPM',
  'Force Power Regeneration': 'FPR',
  
  // Absorption/Resistance
  'Poison Absorption': 'PAB',
  'Fire Absorption': 'FAB',
  'Disease Absorption': 'DAB',
  'Bleeding Absorption': 'BAB',
  'Poison Resistance': 'PRS',
  'Fire Resistance': 'FRS',
  'Disease Resistance': 'DRS',
  'Bleeding Resistance': 'BRS',
  
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
  
  // Add bake-in stats (format: B.modifier=value or B.slot.modifier=value)
  if (build.bakeInStats && build.bakeInStats.enabled) {
    const bakeInParts = [];
    if (build.bakeInStats.global) {
      const code = MODIFIER_CODES[build.bakeInStats.global.modifier] || 
                   build.bakeInStats.global.modifier.substring(0, 3).toUpperCase();
      bakeInParts.push(`G${code}=${build.bakeInStats.global.value}`);
    }
    if (build.bakeInStats.perSlot) {
      for (const [slotId, slotBake] of Object.entries(build.bakeInStats.perSlot)) {
        if (slotBake && slotBake.modifier) {
          const slotCode = SLOT_CODES[slotId] || slotId;
          const modCode = MODIFIER_CODES[slotBake.modifier] || 
                          slotBake.modifier.substring(0, 3).toUpperCase();
          bakeInParts.push(`${slotCode}${modCode}=${slotBake.value}`);
        }
      }
    }
    if (bakeInParts.length > 0) {
      parts.push(`B.${bakeInParts.join('.')}`);
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
  
  // Add familiar (format: F.familiarId)
  if (build.familiar && build.familiar !== 'none') {
    parts.push(`F.${build.familiar}`);
  }
  
  // Add belt type (format: T.type)
  if (build.beltType && build.beltType !== 'clothing') {
    parts.push(`T.${build.beltType}`);
  }
  
  // Add implants (format: I.stat1:value1,stat2:value2)
  if (build.implants && Object.keys(build.implants).length > 0) {
    const implantParts = Object.entries(build.implants)
      .filter(([_, v]) => v > 0)
      .map(([stat, value]) => {
        // Abbreviate stat names for URL
        const abbr = IMPLANT_STAT_CODES[stat] || stat.substring(0, 3).toUpperCase();
        return `${abbr}${value}`;
      })
      .join('');
    if (implantParts) {
      parts.push(`I.${implantParts}`);
    }
  }
  
  // Add Jedi mode (format: J.cloakId)
  if (build.jediMode && build.jediMode.enabled) {
    const cloakId = build.jediMode.cloakId || 'none';
    parts.push(`J.${cloakId}`);
  }
  
  return parts.join('|');
}

// Implant stat abbreviation codes
const IMPLANT_STAT_CODES = {
  'Defense General': 'DEF',
  'Ranged General': 'RNG',
  'Melee General': 'MEL',
  'Toughness Boost': 'TGH',
  'Endurance Boost': 'END',
  'Opportune Chance': 'OPP'
};

const IMPLANT_CODE_TO_STAT = {
  'DEF': 'Defense General',
  'RNG': 'Ranged General',
  'MEL': 'Melee General',
  'TGH': 'Toughness Boost',
  'END': 'Endurance Boost',
  'OPP': 'Opportune Chance'
};

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
    
    // Check for bake-in stats (starts with B)
    if (firstSegment === 'B') {
      build.bakeInStats = { enabled: true, global: null, perSlot: {} };
      for (let i = 1; i < segments.length; i++) {
        const segment = segments[i];
        const [keyPart, val] = segment.split('=');
        const value = parseInt(val, 10) || 0;
        
        if (keyPart.startsWith('G')) {
          // Global bake-in: GDEF=35
          const modCode = keyPart.substring(1);
          const modifier = CODE_TO_MODIFIER[modCode] || modCode;
          build.bakeInStats.global = { modifier, value };
        } else {
          // Per-slot bake-in: HDEF=35 or LBDEF=35
          // First character(s) are slot code, rest is modifier code
          let slotCode = '';
          let modCode = '';
          
          // Check for 2-char slot codes first
          const twoChar = keyPart.substring(0, 2);
          if (CODE_TO_SLOT[twoChar]) {
            slotCode = twoChar;
            modCode = keyPart.substring(2);
          } else {
            slotCode = keyPart[0];
            modCode = keyPart.substring(1);
          }
          
          const slotId = CODE_TO_SLOT[slotCode] || slotCode;
          const modifier = CODE_TO_MODIFIER[modCode] || modCode;
          
          if (slotId) {
            build.bakeInStats.perSlot[slotId] = { modifier, value };
          }
        }
      }
      continue;
    }
    
    // Parse familiar (F.familiarId)
    if (firstSegment === 'F' && segments.length > 1) {
      build.familiar = segments[1];
      continue;
    }
    
    // Parse belt type (T.type)
    if (firstSegment === 'T' && segments.length > 1) {
      build.beltType = segments[1];
      continue;
    }
    
    // Parse implants (I.DEF10RNG20...)
    if (firstSegment === 'I' && segments.length > 1) {
      build.implants = {};
      const implantStr = segments[1];
      // Parse format: DEF10RNG20TGH10 (3-letter code followed by number)
      const implantRegex = /([A-Z]{3})(\d+)/g;
      let match;
      while ((match = implantRegex.exec(implantStr)) !== null) {
        const code = match[1];
        const value = parseInt(match[2], 10);
        const statName = IMPLANT_CODE_TO_STAT[code];
        if (statName && value > 0) {
          build.implants[statName] = value;
        }
      }
      continue;
    }
    
    // Parse Jedi mode (J.cloakId)
    if (firstSegment === 'J' && segments.length > 1) {
      build.jediMode = { enabled: true, cloakId: segments[1] || 'none' };
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
 * Load build from current URL
 * @returns {Object|null} - Decoded build or null if no build in URL
 */
export function loadFromURL() {
  const url = new URL(window.location.href);
  // Support both 'b' (new short) and 'build' (legacy) params
  const encoded = url.searchParams.get('b') || url.searchParams.get('build');
  
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
    url.searchParams.set('b', encoded); // Use short param
  }
  
  return url.toString();
}

/**
 * Update the URL with the current build state
 * @param {Object} build - Current build
 */
export function updateURL(build) {
  const encoded = encodeBuild(build);
  const url = new URL(window.location.href);
  
  // Remove legacy 'build' param if present
  url.searchParams.delete('build');
  
  if (encoded) {
    url.searchParams.set('b', encoded);
  } else {
    url.searchParams.delete('b');
  }
  
  window.history.replaceState(null, '', url.toString());
}
