/**
 * Analytics - Google Sheets logging for shared builds
 * Logs share events to a Google Sheet via Apps Script webhook
 */

// Google Apps Script webhook URL
const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwxKmIe9xzWM8Ftt7bAPq8DS1zQj11thp6G519AaW_2rdIfL23oQ5JiJHqLgepmFRTX4A/exec';

/**
 * Log a share event to Google Sheets
 * @param {string} buildUrl - The full sharing URL
 * @param {object} buildSummary - Optional summary of the build
 */
export async function logShareEvent(buildUrl, buildSummary = {}) {
  if (!SHEETS_WEBHOOK_URL) {
    console.log('[Analytics] Webhook not configured, skipping log');
    return;
  }

  try {
    const payload = {
      timestamp: new Date().toISOString(),
      url: buildUrl,
      userAgent: navigator.userAgent,
      referrer: document.referrer || 'direct',
      ...buildSummary
    };

    // Send to Google Sheets (fire and forget)
    fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script doesn't support CORS
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    }).catch(err => {
      console.warn('[Analytics] Failed to log share:', err);
    });

    console.log('[Analytics] Share logged successfully');
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
