// customer/js/menu.js
// Markan Cafe - Customer Menu

// Global variables
let allMenuItems = [];
let filteredItems = [];
let currentCategory = 'all';
let minPrice = 0;
let maxPrice = 5000;
let currentSort = 'default';
let currentModalItem = null;

// Initialize menu page
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    setupEventListeners();
    updateCartCount();
    
    // Check for item ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    const offer = urlParams.get('offer');
    
    if (itemId) {
        setTimeout(() => showItemModal(itemId), 500);
    }
    
    if (offer) {
        showNotification(`Special offer: ${offer === 'morning' ? 'Morning Coffee Deal' : 'Family Feast'}`, 'info');
    }
});

// Load menu items from admin's localStorage
function loadMenuItems() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    // Get menu items from localStorage (added by admin)
    const stored = localStorage.getItem('markanMenu');
    
    if (stored) {
        allMenuItems = JSON.parse(stored);
    } else {
        // No items in localStorage - show empty state
        allMenuItems = [];
    }
    
    // Filter only available items with stock > 0
    allMenuItems = allMenuItems.filter(item => 
        item.status === 'available' && item.stock > 0
    );
    
    filteredItems = [...allMenuItems];
    displayMenuItems(filteredItems);
}

// Display menu items
function displayMenuItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-utensils"></i>
                <h3>No items available</h3>
                <p>Please check back later or try adjusting your filters</p>
                <button class="btn-small" onclick="resetFilters()">Reset Filters</button>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => {
        // Determine if item has any special badges
        const badges = [];
        if (item.ethiopian) badges.push('<span class="menu-card-badge ethiopian">🇪🇹 Ethiopian</span>');
        if (item.popular) badges.push('<span class="menu-card-badge popular">⭐ Popular</span>');
        if (item.vegetarian) badges.push('<span class="menu-card-badge vegetarian">🥬 Vegetarian</span>');
        
        const stockStatus = item.stock < 5 ? 'low' : 'normal';
        const stockText = item.stock < 5 ? `Only ${item.stock} left` : `${item.stock} available`;
        
        return `
            <div class="menu-card" onclick="showItemModal('${item.id}')">
                <div class="menu-card-image" style="background-image: url('${item.image || '../../admin/assets/images/menu/default.jpg'}')">
                    ${badges.join('')}
                </div>
                <div class="menu-card-content">
                    <span class="menu-card-category">${item.category || 'Item'}</span>
                    <h3 class="menu-card-title">${item.name}</h3>
                    <p class="menu-card-description">${item.description?.substring(0, 60)}...</p>
                    <div class="menu-card-footer">
                        <span class="menu-card-price">${formatETB(item.price)}</span>
                        <span class="menu-card-stock ${stockStatus}">${stockText}</span>
                    </div>
                    <button class="btn-add" onclick="addToCartFromCard('${item.id}'); event.stopPropagation();">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Show item modal
window.showItemModal = function(itemId) {
    const item = allMenuItems.find(i => i.id == itemId);
    if (!item) return;
    
    const modal = document.getElementById('itemModal');
    const content = document.getElementById('modalContent');
    
    if (!modal || !content) return;
    
    currentModalItem = item;
    
    // Generate badges
    const badges = [];
    if (item.ethiopian) badges.push('<span class="menu-card-badge ethiopian">🇪🇹 Ethiopian</span>');
    if (item.popular) badges.push('<span class="menu-card-badge popular">⭐ Popular</span>');
    if (item.vegetarian) badges.push('<span class="menu-card-badge vegetarian">🥬 Vegetarian</span>');
    
    content.innerHTML = `
        <div class="menu-modal-image" style="background-image: url('${item.image || '../../admin/assets/images/menu/default.jpg'}')">
            ${badges.join('')}
        </div>
        <div class="menu-modal-details">
            <span class="menu-modal-category">${item.category || 'Item'}</span>
            <h2>${item.name}</h2>
            <p class="menu-modal-description">${item.description || 'No description available'}</p>
            
            <div class="menu-modal-price">${formatETB(item.price)}</div>
            
            <div class="stock-info">
                <i class="fas fa-box"></i>
                <span>${item.stock} available</span>
                ${item.stock < 5 ? '<span class="low-stock-warning">Low stock!</span>' : ''}
            </div>
            
            <div class="menu-modal-quantity">
                <span>Quantity:</span>
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="updateModalQuantity(-1)">-</button>
                    <input type="number" class="quantity-input" id="modalQuantity" value="1" min="1" max="${item.stock}">
                    <button class="quantity-btn" onclick="updateModalQuantity(1)">+</button>
                </div>
            </div>
            
            <div class="menu-modal-actions">
                <button class="btn-large" onclick="addToCartFromModal()">
                    <i class="fas fa-cart-plus"></i> Add to Cart
                </button>
                <button class="btn btn-outline" onclick="closeItemModal()">
                    Continue Shopping
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Update modal quantity
window.updateModalQuantity = function(change) {
    const input = document.getElementById('modalQuantity');
    if (!input || !currentModalItem) return;
    
    let newValue = parseInt(input.value) + change;
    newValue = Math.max(1, Math.min(currentModalItem.stock, newValue));
    input.value = newValue;
};

// Add to cart from card
window.addToCartFromCard = function(itemId) {
    const item = allMenuItems.find(i => i.id == itemId);
    if (item) {
        addToCart(item, 1);
    }
};

// Add to cart from modal
window.addToCartFromModal = function() {
    const quantity = parseInt(document.getElementById('modalQuantity')?.value || '1');
    if (currentModalItem) {
        addToCart(currentModalItem, quantity);
        closeItemModal();
    }
};

// Add to cart function
function addToCart(item, quantity) {
    if (!item) return;
    
    // Check stock
    if (quantity > item.stock) {
        showNotification(`Only ${item.stock} available`, 'error');
        return;
    }
    
    // Get current user
    const user = Auth.getCurrentUser();
    if (!user) {
        window.location.href = '../../login.html';
        return;
    }
    
    // Get user's cart
    const cartKey = `cart_${user.id}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    // Check if item already in cart
    const existingItem = cart.find(i => i.id == item.id);
    
    if (existingItem) {
        // Check if adding more would exceed stock
        if (existingItem.quantity + quantity > item.stock) {
            showNotification(`Cannot add more than ${item.stock} items`, 'error');
            return;
        }
        existingItem.quantity += quantity;
        showNotification(`${item.name} quantity updated in cart`, 'success');
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: quantity,
            category: item.category,
            image: item.image,
            maxStock: item.stock
        });
        showNotification(`${item.name} added to cart`, 'success');
    }
    
    // Save cart
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
}

// Filter items
function filterItems() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    
    filteredItems = allMenuItems.filter(item => {
        // Category filter
        if (currentCategory !== 'all' && item.category !== currentCategory) {
            return false;
        }
        
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
            !item.description?.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Price filter
        if (item.price < minPrice || item.price > maxPrice) {
            return false;
        }
        
        return true;
    });
    
    // Apply sorting
    applySorting();
    
    displayMenuItems(filteredItems);
}

// Apply sorting
function applySorting() {
    switch(currentSort) {
        case 'price-low':
            filteredItems.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filteredItems.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            filteredItems.sort((a, b) => a.name.localeCompare(b.name));
            break;
        default:
            // Keep original order
            break;
    }
}

// Reset filters
window.resetFilters = function() {
    document.getElementById('searchInput').value = '';
    document.getElementById('minPrice').value = 0;
    document.getElementById('maxPrice').value = 5000;
    document.getElementById('sortBy').value = 'default';
    
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === 'all') {
            btn.classList.add('active');
        }
    });
    
    minPrice = 0;
    maxPrice = 5000;
    currentCategory = 'all';
    currentSort = 'default';
    
    updatePriceDisplay();
    filterItems();
}

// Update price display
function updatePriceDisplay() {
    document.getElementById('minPriceValue').textContent = formatETB(minPrice);
    document.getElementById('maxPriceValue').textContent = formatETB(maxPrice);
}

// Update cart count
function updateCartCount() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
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
        minPriceInput.addEventListener('input', function() {
            minPrice = parseInt(this.value);
            if (minPrice > maxPrice) {
                minPrice = maxPrice;
                minPriceInput.value = minPrice;
            }
            updatePriceDisplay();
            filterItems();
        });
        
        maxPriceInput.addEventListener('input', function() {
            maxPrice = parseInt(this.value);
            if (maxPrice < minPrice) {
                maxPrice = minPrice;
                maxPriceInput.value = maxPrice;
            }
            updatePriceDisplay();
            filterItems();
        });
    }
    
    // Sort options
    const sortSelect = document.getElementById('sortBy');
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            currentSort = this.value;
            filterItems();
        });
    }
    
    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanMenu') {
            loadMenuItems();
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Helper: Format ETB
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 5000);
}