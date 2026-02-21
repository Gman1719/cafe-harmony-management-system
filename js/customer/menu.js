// js/customer/menu.js - Customer Menu Logic
// Markan Cafe - Debre Birhan University

let allMenuItems = [];
let filteredItems = [];
let currentCategory = 'all';
let minPrice = 0;
let maxPrice = 50;
let currentDietaryFilters = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Load categories
    loadCategories();
    
    // Load menu items
    await loadMenuItems();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for item ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if (itemId) {
        setTimeout(() => showItemModal(parseInt(itemId)), 500);
    }
});

function loadCategories() {
    const container = document.getElementById('categoryNav');
    if (!container) return;
    
    const categories = [
        { id: 'all', name: 'All Items', icon: 'fa-utensils' },
        { id: 'beverages', name: 'Beverages', icon: 'fa-coffee' },
        { id: 'meals', name: 'Meals', icon: 'fa-utensils' },
        { id: 'snacks', name: 'Snacks', icon: 'fa-cookie-bite' },
        { id: 'desserts', name: 'Desserts', icon: 'fa-cake-candles' }
    ];
    
    container.innerHTML = categories.map(cat => `
        <button class="category-nav-item ${cat.id === 'all' ? 'active' : ''}" data-category="${cat.id}">
            <i class="fas ${cat.icon}"></i>
            ${cat.name}
        </button>
    `).join('');
}

async function loadMenuItems() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    try {
        grid.innerHTML = '<div class="spinner"></div>';
        
        allMenuItems = await API.menu.getAll();
        filteredItems = [...allMenuItems];
        
        displayMenuItems(filteredItems);
        
    } catch (error) {
        console.error('Failed to load menu:', error);
        grid.innerHTML = '<p class="error">Failed to load menu items</p>';
    }
}

function displayMenuItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="menu-item" onclick="showItemModal(${item.id})">
            <div class="menu-item-image" style="background-image: url('${item.image}')">
                ${item.popular ? '<span class="menu-item-badge popular">Popular</span>' : ''}
                ${item.ethiopian ? '<span class="menu-item-badge ethiopian">Ethiopian</span>' : ''}
                ${item.vegetarian ? '<span class="menu-item-badge vegetarian">Veg</span>' : ''}
            </div>
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <span class="menu-item-category">${item.category}</span>
                </div>
                <p class="menu-item-description">${item.description.substring(0, 60)}...</p>
                <div class="menu-item-footer">
                    <span class="menu-item-price">$${item.price.toFixed(2)}</span>
                    <div class="menu-item-rating">
                        ${generateStars(item.rating)} <span>(${item.rating})</span>
                    </div>
                </div>
                <button class="add-to-cart-btn" onclick="addToCartFromCard(${item.id}); event.stopPropagation();">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalf) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

window.addToCartFromCard = function(itemId) {
    const item = allMenuItems.find(i => i.id === itemId);
    if (item) {
        addToCart(item, 1);
    }
};

window.showItemModal = function(itemId) {
    const item = allMenuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('itemModal');
    const content = document.getElementById('modalContent');
    
    content.innerHTML = `
        <div class="menu-modal-image" style="background-image: url('${item.image}')"></div>
        <div class="menu-modal-details">
            <h2>${item.name}</h2>
            <span class="menu-modal-category">${item.category}</span>
            <p class="menu-modal-description">${item.description}</p>
            <div class="menu-modal-price">$${item.price.toFixed(2)}</div>
            <div class="menu-modal-rating">
                <div class="menu-modal-stars">${generateStars(item.rating)}</div>
                <span>${item.rating} out of 5</span>
            </div>
            
            <div class="menu-modal-quantity">
                <span>Quantity:</span>
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="updateModalQuantity(-1)">-</button>
                    <input type="number" class="quantity-input" id="modalQuantity" value="1" min="1" max="10">
                    <button class="quantity-btn" onclick="updateModalQuantity(1)">+</button>
                </div>
            </div>
            
            <div class="menu-modal-actions">
                <button class="btn btn-primary" onclick="addToCartFromModal(${item.id})">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn btn-outline" onclick="closeModal()">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    window.currentModalItem = item;
};

window.updateModalQuantity = function(change) {
    const input = document.getElementById('modalQuantity');
    if (!input) return;
    let newValue = parseInt(input.value) + change;
    newValue = Math.max(1, Math.min(10, newValue));
    input.value = newValue;
};

window.addToCartFromModal = function(itemId) {
    const quantity = parseInt(document.getElementById('modalQuantity')?.value || '1');
    const item = window.currentModalItem;
    if (item) {
        addToCart(item, quantity);
        closeModal();
    }
};

window.closeModal = function() {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
};

function filterItems() {
    const category = document.querySelector('.category-nav-item.active')?.dataset.category || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    minPrice = parseInt(document.getElementById('minPrice')?.value || '0');
    maxPrice = parseInt(document.getElementById('maxPrice')?.value || '50');
    
    const activeDietBtns = document.querySelectorAll('.dietary-tag.active');
    currentDietaryFilters = Array.from(activeDietBtns).map(btn => btn.dataset.diet);
    
    filteredItems = allMenuItems.filter(item => {
        // Category filter
        if (category !== 'all' && item.category !== category) return false;
        
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
            !item.description.toLowerCase().includes(searchTerm)) return false;
        
        // Price filter
        if (item.price < minPrice || item.price > maxPrice) return false;
        
        // Dietary filters
        if (currentDietaryFilters.length > 0) {
            if (currentDietaryFilters.includes('ethiopian') && !item.ethiopian) return false;
            if (currentDietaryFilters.includes('vegetarian') && !item.vegetarian && !item.vegan) return false;
            if (currentDietaryFilters.includes('vegan') && !item.vegan) return false;
        }
        
        return true;
    });
    
    displayMenuItems(filteredItems);
    
    // Update price display
    const priceValue = document.getElementById('priceRangeValue');
    if (priceValue) {
        priceValue.textContent = `$${minPrice} - $${maxPrice}`;
    }
}

function setupEventListeners() {
    // Category filter
    document.querySelectorAll('.category-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            filterItems();
        });
    });
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterItems, 300));
    }
    
    // Price range
    const minPriceInput = document.getElementById('minPrice');
    const maxPriceInput = document.getElementById('maxPrice');
    
    if (minPriceInput && maxPriceInput) {
        minPriceInput.addEventListener('input', (e) => {
            minPrice = parseInt(e.target.value);
            if (minPrice > maxPrice) {
                minPrice = maxPrice;
                minPriceInput.value = minPrice;
            }
            filterItems();
        });
        
        maxPriceInput.addEventListener('input', (e) => {
            maxPrice = parseInt(e.target.value);
            if (maxPrice < minPrice) {
                maxPrice = minPrice;
                maxPriceInput.value = maxPrice;
            }
            filterItems();
        });
    }
    
    // Dietary filters
    document.querySelectorAll('.dietary-tag').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            filterItems();
        });
    });
    
    // View options
    document.querySelectorAll('.view-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const view = btn.dataset.view;
            document.getElementById('menuGrid').className = `menu-grid ${view}-view`;
        });
    });
    
    // Modal close
    const modal = document.getElementById('itemModal');
    const closeBtn = modal?.querySelector('.modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
}