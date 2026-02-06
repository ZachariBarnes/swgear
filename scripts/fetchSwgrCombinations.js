/**
 * Fetch SWGR-only combinations from swgjunkyard.com
 * and convert to SEABuilder format
 * 
 * Usage: node scripts/fetchSwgrCombinations.js
 */

import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://www.swgjunkyard.com/loot/combinations';
const OUTPUT_FILE = path.join(__dirname, '..', 'src', 'data', 'combinations.json');

// Fetch a page and extract combinations data from the embedded JSON
async function fetchPage(pageNum) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}?page=${pageNum}`;
    
    https.get(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 SEABuilder Data Fetcher',
        'Accept': 'text/html'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Extract the data-page attribute which contains JSON
          const match = data.match(/data-page="([^"]+)"/);
          if (!match) {
            console.error(`No data found on page ${pageNum}`);
            resolve([]);
            return;
          }
          
          // Decode HTML entities and parse JSON
          const jsonStr = match[1]
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&#039;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          
          const pageData = JSON.parse(jsonStr);
          const combinations = pageData.props?.combinations?.data || [];
          
          resolve(combinations);
        } catch (err) {
          console.error(`Error parsing page ${pageNum}:`, err.message);
          resolve([]);
        }
      });
    }).on('error', reject);
  });
}

// Convert junkyard format to SEABuilder format
function convertToSeaBuilderFormat(combinations) {
  const result = {};
  
  for (const combo of combinations) {
    const item1 = combo.Loot1;
    const item2 = combo.Loot2;
    const modifierName = combo.ModifierName;
    const ratio = combo.Ratio;
    
    if (!result[item1]) {
      result[item1] = {};
    }
    
    result[item1][item2] = {
      name: modifierName,
      ratio: ratio
    };
  }
  
  return result;
}

// Merge two combination objects
function mergeCombinations(base, addition) {
  for (const [item1, combos] of Object.entries(addition)) {
    if (!base[item1]) {
      base[item1] = {};
    }
    Object.assign(base[item1], combos);
  }
  return base;
}

async function main() {
  console.log('Fetching SWGR combinations from swgjunkyard.com...');
  
  // First, get page 1 to find total pages
  const firstPageData = await fetchPage(1);
  console.log(`Page 1: Found ${firstPageData.length} combinations`);
  
  // The total is 711 pages based on data, but let's fetch them all
  const TOTAL_PAGES = 711;
  const allCombinations = [...firstPageData];
  
  // Fetch remaining pages with delay to be nice to the server
  for (let page = 2; page <= TOTAL_PAGES; page++) {
    if (page % 50 === 0) {
      console.log(`Fetching page ${page}/${TOTAL_PAGES}...`);
    }
    
    const pageCombos = await fetchPage(page);
    allCombinations.push(...pageCombos);
    
    // Small delay to avoid hammering the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  console.log(`\nTotal combinations fetched: ${allCombinations.length}`);
  
  // Convert to SEABuilder format
  const seaBuilderFormat = convertToSeaBuilderFormat(allCombinations);
  
  // Count unique first items
  const item1Count = Object.keys(seaBuilderFormat).length;
  let totalCombos = 0;
  for (const combos of Object.values(seaBuilderFormat)) {
    totalCombos += Object.keys(combos).length;
  }
  
  console.log(`Converted to SEABuilder format:`);
  console.log(`  - ${item1Count} primary items`);
  console.log(`  - ${totalCombos} total combinations`);
  
  // Write output
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(seaBuilderFormat, null, 2));
  console.log(`\nWritten to ${OUTPUT_FILE}`);
}

main().catch(console.error);
