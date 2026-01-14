/**
 * FoodPicker Component
 * Searchable dropdown for selecting foods/buffs
 */

import foodsData from '../data/foods.json';

/**
 * Open food picker modal
 * @param {Function} onSelect - Callback when food is selected (food) => void
 */
export function openFoodPicker(onSelect) {
  // Remove existing modal if any
  const existing = document.querySelector('.food-picker-modal');
  if (existing) existing.remove();
  
  // Combine popular and all foods, marking popular ones
  const popularNames = new Set(foodsData.popular.map(f => f.name));
  const allFoods = [
    ...foodsData.popular.map(f => ({ ...f, isPopular: true })),
    ...foodsData.all.filter(f => !popularNames.has(f.name))
  ];
  
  const modal = document.createElement('div');
  modal.className = 'food-picker-modal';
  modal.innerHTML = `
    <div class="food-picker-content">
      <div class="food-picker-header">
        <h3>Select Food/Buff</h3>
        <button class="food-picker-close">×</button>
      </div>
      <div class="food-picker-search">
        <input type="text" class="food-search-input" placeholder="Search foods..." autofocus>
      </div>
      <div class="food-picker-list">
        ${renderFoodList(allFoods, '')}
      </div>
      <div class="food-picker-other">
        <button class="btn btn-secondary food-other-btn">+ Custom (Other)</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const searchInput = modal.querySelector('.food-search-input');
  const listContainer = modal.querySelector('.food-picker-list');
  const closeBtn = modal.querySelector('.food-picker-close');
  const otherBtn = modal.querySelector('.food-other-btn');
  
  // Search filtering
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    listContainer.innerHTML = renderFoodList(allFoods, query);
    attachFoodSelectHandlers(listContainer, onSelect, modal);
  });
  
  // Close modal
  const closeModal = () => modal.remove();
  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  
  // Escape key
  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape') {
      closeModal();
      document.removeEventListener('keydown', escHandler);
    }
  });
  
  // Custom/Other option - opens modifier picker
  otherBtn.addEventListener('click', () => {
    closeModal();
    onSelect({ isCustom: true });
  });
  
  // Attach food selection handlers
  attachFoodSelectHandlers(listContainer, onSelect, modal);
  
  // Focus search
  setTimeout(() => searchInput.focus(), 100);
}

/**
 * Render food list HTML
 */
function renderFoodList(foods, query) {
  const filtered = query 
    ? foods.filter(f => f.name.toLowerCase().includes(query))
    : foods;
  
  if (filtered.length === 0) {
    return '<div class="food-empty">No foods found. Use "Custom" for unlisted items.</div>';
  }
  
  return filtered.map(food => {
    const effectsStr = food.effects
      .map(e => `+${e.value} ${e.modifier}`)
      .join(', ');
    
    return `
      <div class="food-item ${food.isPopular ? 'popular' : ''}" data-food="${encodeURIComponent(JSON.stringify(food))}">
        <div class="food-name">
          ${food.isPopular ? '<span class="popular-badge">★</span>' : ''}
          ${food.name}
        </div>
        <div class="food-effects">${effectsStr}</div>
        <div class="food-meta">
          <span class="food-duration">${food.duration}</span>
          <span class="food-fill">Fill: ${food.fill}</span>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Attach click handlers to food items
 */
function attachFoodSelectHandlers(container, onSelect, modal) {
  container.querySelectorAll('.food-item').forEach(item => {
    item.addEventListener('click', () => {
      const foodData = JSON.parse(decodeURIComponent(item.dataset.food));
      onSelect(foodData);
      modal.remove();
    });
  });
}
