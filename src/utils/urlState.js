/**
 * URL State Management
 * Encode/decode builds to shareable URL parameters
 */

import { SLOT_CONFIG } from '../components/SlotBuilder.js';

/**
 * Encode a build to a URL-safe string
 * Format: slot:power:mod1,mod2,mod3|slot:power:mod1,mod2,mod3|...|buffs:mod=val,mod=val
 * @param {Object} build - Build object
 * @returns {string} - Encoded string
 */
export function encodeBuild(build) {
  const parts = [];
  
  for (const [slotId, slot] of Object.entries(build.slots)) {
    if (!slot.stats || slot.stats.length === 0) continue;
    
    const mods = slot.stats
      .filter(s => s.modifier)
      .map(s => encodeURIComponent(s.modifier))
      .join(',');
    
    if (mods) {
      parts.push(`${slotId}:${slot.powerBit || 35}:${mods}`);
    }
  }
  
  // Add external buffs (format: modifier=value:source)
  if (build.externalBuffs && build.externalBuffs.length > 0) {
    const buffsStr = build.externalBuffs
      .map(b => `${encodeURIComponent(b.modifier)}=${b.value}:${b.source || 'unknown'}`)
      .join(',');
    parts.push(`buffs:${buffsStr}`);
  }
  
  return parts.join('|');
}

/**
 * Decode a URL string back to a build object
 * @param {string} encoded - Encoded build string
 * @returns {Object} - Reconstructed build object
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
  
  const parts = encoded.split('|');
  
  for (const part of parts) {
    // Check for buffs part
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
    
    // Safety check for valid slot
    if (slotId && build.slots[slotId]) {
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
