# SWGear

Build planner for Star Wars Galaxies Restoration - plan your armor, SEAs, buffs, and stat loadouts.

## Features
- Visual armor slot builder
- Stat optimization with diminishing returns warnings
- Crafter combination explorer
- External buffs (food, jewelry, abilities)
- Shareable build URLs

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

## Deploy to GitHub Pages

1. **Create GitHub repo** named `SEABuilder`

2. **Update package.json** - Change `homepage` to your GitHub username:
   ```json
   "homepage": "https://YOURUSERNAME.github.io/SEABuilder/"
   ```

3. **Install dependencies and deploy:**
   ```bash
   npm install
   npm run deploy
   ```

4. **Enable GitHub Pages** in repo Settings → Pages → Source: `gh-pages` branch

Your site will be live at `https://YOURUSERNAME.github.io/SEABuilder/`

---

## Analytics Setup (Google Sheets)

To track shared builds, set up a Google Sheets webhook:

### Step 1: Create Google Sheet
1. Create a new Google Sheet
2. Add headers in row 1: `timestamp | url | userAgent | referrer | statCount | exoticSlots | topStats`

### Step 2: Create Apps Script
1. In Google Sheets, go to **Extensions → Apps Script**
2. Replace the code with:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.url || '',
      data.userAgent || '',
      data.referrer || '',
      data.statCount || 0,
      data.exoticSlots || 0,
      data.topStats || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({error: error.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput('SEA Builder Analytics Webhook');
}
```

### Step 3: Deploy
1. Click **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Click **Deploy** and copy the URL

### Step 4: Configure SEA Builder
1. Open `src/utils/analytics.js`
2. Replace `SHEETS_WEBHOOK_URL` with your webhook URL:
   ```javascript
   const SHEETS_WEBHOOK_URL = 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
   ```
3. Rebuild and redeploy

---

## License
ISC
