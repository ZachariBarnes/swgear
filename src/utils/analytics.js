/**
 * Analytics - Google Sheets logging for shared builds
 * Logs share events to a Google Sheet via Apps Script webhook
 */

// Google Apps Script webhook URL
const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbxMxo-nLW6Xkqntm6VBywJtDWvYD1MEBgHQNLs3jlgbY67JAX7ewU7Bx0evgPCdGdV0MA/exec';

/**
 * Log a share event to Google Sheets
 * Uses GET request approach to avoid CORS issues with Google Apps Script
 */
export async function logShareEvent(buildUrl, buildSummary = {}) {
  if (!SHEETS_WEBHOOK_URL) {
    console.log('[Analytics] Webhook not configured, skipping log');
    return;
  }

  try {
    const params = new URLSearchParams({
      timestamp: new Date().toISOString(),
      url: buildUrl,
      userAgent: navigator.userAgent.substring(0, 200), // Truncate for URL length
      referrer: document.referrer || 'direct',
      statCount: buildSummary.statCount || 0,
      exoticSlots: buildSummary.exoticSlots || 0,
      topStats: buildSummary.topStats || ''
    });

    // Use Image beacon approach - works with Google Apps Script
    const img = new Image();
    img.src = `${SHEETS_WEBHOOK_URL}?${params.toString()}`;
    
    console.log('[Analytics] Share logged via beacon');
  } catch (error) {
    console.warn('[Analytics] Error logging share:', error);
  }
}

/**
 * Generate a summary of the current build for logging
 * @param {object} build - The build object
 * @returns {object} Summary object
 */
export function getBuildSummary(build) {
  const slots = build.slots || {};
  const stats = {};
  let exoticCount = 0;

  Object.values(slots).forEach(slot => {
    if (slot.stats) {
      slot.stats.forEach(stat => {
        if (stat.modifier) {
          stats[stat.modifier] = (stats[stat.modifier] || 0) + 1;
        }
      });
    }
    if (slot.isExotic) {
      exoticCount++;
    }
  });

  return {
    statCount: Object.keys(stats).length,
    exoticSlots: exoticCount,
    topStats: Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => `${name}:${count}`)
      .join(',')
  };
}
