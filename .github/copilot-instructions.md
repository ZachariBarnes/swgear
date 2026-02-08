# Copilot Instructions for SWGear (SEA Builder)

## Project Overview

SWGear is a **Star Wars Galaxies Restoration** build planner for planning armor SEA (Skill Enhancing Attachment) loadouts. It's a pure client-side web app built with **vanilla JavaScript** (ES modules), **HTML**, and **CSS**, bundled with **Vite**. Deployed to GitHub Pages at `zacharibarnes.github.io/swgear/`.

## Tech Stack

- **Framework**: None — vanilla JS with ES modules, no React/Vue/Angular
- **Bundler**: Vite 7.x (`vite.config.js`)
- **Styling**: Plain CSS with CSS custom properties (variables), no preprocessor
- **Data**: Static JSON files in `src/data/` — modifiers, combinations, jewelry, foods, backpacks
- **Deployment**: GitHub Pages via `gh-pages` package
- **Package type**: ES modules (`"type": "module"` in package.json)

## Architecture & Code Organization

### File Structure
```
index.html          — Single page app shell, all views defined in HTML
src/
  main.js           — App entry point, state management, event wiring
  components/       — UI components (render functions, not classes/framework components)
  data/             — JSON data files + preset definitions
  styles/index.css  — All styles in one file (3800+ lines)
  utils/            — Calculator, URL state, export, analytics helpers
scripts/            — Data extraction/processing scripts (dev only)
```

### Component Pattern
Components are **render functions** that take a container element and data, then set `innerHTML`. They are NOT framework components. Pattern:
```js
export function renderComponentName(container, data, onUpdate) {
  container.innerHTML = `<div>...</div>`;
  // Attach event listeners to container.querySelector(...)
}
```

### State Management
- **Single `currentBuild` object** in `main.js` holds all state
- `onBuildChanged()` triggers URL update + full re-render
- URL state persisted via `utils/urlState.js` (query params for sharing)
- No external state library

## Layout Architecture (Critical — Read Before Modifying)

### Builder Tab — Three-Zone Layout
The Build tab uses a **no-scroll, viewport-filling layout**:

1. **Header** — App title, tab nav, action buttons (flex-shrink: 0)
2. **Main content** — CSS Grid with 3 columns filling remaining vertical space:
   - **Left**: Armor visual (480×480px absolute-positioned slots on silhouette)
   - **Center**: Slot editor panel (shown when a slot is clicked)
   - **Right**: Stat totals summary (compact, single scrollable area)
3. **Bottom bar** — Bracelet picker + gear source sections (backpack, jewelry, familiar, implants) displayed horizontally, max-height 160px
4. **External buffs** — Accessed via "+ Buffs" button in stat totals header, opens a modal dialog

### ⚠️ Key Layout Constraints
- **No page-level scrolling** on the Builder tab — everything must fit in viewport
- **No scrollbars at all** on the Builder tab — redesign components to fit rather than scroll
- The `body` and `#app` are `height: 100vh; overflow: hidden`
- The stats panel has a **single scroll container** (`stat-summary`) — do NOT add nested scroll containers
- The bottom bar sections are **compact inline widgets** with overflow hidden — detailed configuration lives in the Jewelry tab
- External buffs are in a **modal** triggered by the "+ Buffs" button — NOT inline on the builder tab
- The bracelet picker is **outside** the editor section so clicking armor slots doesn't destroy it
- The armor visual uses `position: absolute` slot wrappers — changing dimensions requires updating both the `.armor-visual` size AND all `.slot-wrapper[data-slot-id]` positions

### Jewelry Tab
Full-detail configuration for jewelry, bracelets, backpacks, familiars, implants, and buffs. This is where users go for granular editing.

### Crafter Tab
Junk loot combination explorer and shopping list generator.

## Game Data Reference

### Core Stats (always shown, have thresholds)
| Stat | Target Range | Per Point |
|------|-------------|-----------|
| Ranged General | 350–400 | +0.33 Speed, +0.25 Defense/Accuracy |
| Melee General | 350–400 | +0.33 Speed, +0.25 Defense/Accuracy |
| Defense General | 300–350 | +0.33 Defense, +0.5 Heal Efficiency |
| Toughness Boost | 200–250 | +2 Health |
| Endurance Boost | 250–300 | +1 Action/Mind, +0.1% Regen |
| Opportune Chance | 300–350 | +0.33 Accuracy/Med Speed, +1% Crit/100 |

### Slot Types
- **Core slots** (9): helmet, lbicep, rbicep, lbracer, rbracer, gloves, belt, pants, boots — only core stats
- **Exotic slots** (3): chest, shirt, weapon — can accept ANY modifier type
- Each slot has 3 stat slots + a power bit value (30–35)

### Stat Sources
- SEA attachments (armor slots)
- Backpacks (Kashykian Bandolier, etc.)
- Heroic jewelry sets (rings, necklace, earrings)
- Treasure map bracelets (left + right wrist)
- Familiars (one active at a time)
- Veteran implants (+40 distributed in +5 increments)
- External buffs (food, class abilities, etc.)
- Bake-in stats (optional core stats added per armor piece)

## Key External References

- **SWG Restoration Wiki**: https://swgr.org/wiki/
- **Stat Details**: https://swgr.org/wiki/ranged_general/, melee_general/, Defense_General, toughness/, endurance/, opportune_chance/
- **Skill Calculator**: https://swgr.org/skill-calculator/
- **GitHub Pages Site**: https://zacharibarnes.github.io/swgear/

## Coding Conventions

- Use `const`/`let`, never `var`
- Template literals for HTML generation
- Event delegation where possible, otherwise attach listeners after innerHTML
- Prefer `Number.parseInt()` over `parseInt()`
- Prefer `structuredClone()` over `JSON.parse(JSON.stringify())`
- Prefer optional chaining (`?.`) for safe property access
- All data imports use JSON with Vite's built-in JSON support
- CSS uses BEM-ish naming: `.component-name`, `.component-element`, `.component--modifier`

## Common Pitfalls

1. **Don't add scrolling to the Builder tab** — redesign to fit instead
2. **Don't nest scroll containers** — one scroll area per panel maximum
3. **Don't modify `editor-section.innerHTML` in a way that destroys sibling elements** — bracelet picker is now a sibling, not a child
4. **Armor slot positions are absolute** — any visual resize requires recalculating ALL slot coordinates
5. **Armor visual is 400×400px** — all 12 slot positions must fit, with legs/boots visible at the bottom
5. **CSS file is large** — use search to find sections before editing; styles are organized by component with comment headers
6. **State is centralized** — always modify `currentBuild` then call `onBuildChanged()`, don't manage parallel state
7. **JSON data is authoritative** — modifier ratios, combination recipes, and jewelry stats come from data files, not hardcoded
