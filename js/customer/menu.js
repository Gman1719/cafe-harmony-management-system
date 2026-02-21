// js/customer/menu.js - Customer Menu Logic
// Markan Cafe - Debre Birhan University

let allMenuItems = [];
let filteredItems = [];
let currentCategory = 'all';
let minPrice = 0;
let maxPrice = 50;
let currentDietaryFilters = [];

// Initialize menu page
document.addEventListener('DOMContentLoaded', function() {
    loadMenuItems();
    setupEventListeners();
    updateCartCount();
    
    // Check for item ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    if (itemId) {
        setTimeout(() => showItemModal(parseInt(itemId)), 500);
    }
});

// Load menu items
function loadMenuItems() {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    // Get menu items from localStorage
    const stored = localStorage.getItem('markanMenu');
    if (stored) {
        allMenuItems = JSON.parse(stored);
    } else {
        // Default menu items if none exist
        allMenuItems = [
            { id: 1, name: 'Ethiopian Coffee', description: 'Traditional Ethiopian coffee ceremony style, served with popcorn', price: 4.50, category: 'beverages', image: 'assets/images/menu/beverages/ethiopian-coffee.jpg', rating: 4.9, popular: true, ethiopian: true, inStock: true },
            { id: 2, name: 'Macchiato', description: 'Espresso with a dash of steamed milk', price: 3.75, category: 'beverages', image: 'assets/images/menu/beverages/macchiato.jpg', rating: 4.7, popular: true, ethiopian: false, inStock: true },
            { id: 3, name: 'Spiced Tea', description: 'Traditional Ethiopian spiced tea with cinnamon and cardamom', price: 3.25, category: 'beverages', image: 'assets/images/menu/beverages/spiced-tea.jpg', rating: 4.6, popular: true, ethiopian: true, inStock: true },
            { id: 4, name: 'Doro Wat', description: 'Spicy Ethiopian chicken stew with hard-boiled eggs', price: 12.99, category: 'meals', image: 'assets/images/menu/meals/doro-wat.jpg', rating: 4.9, popular: true, ethiopian: true, inStock: true },
            { id: 5, name: 'Kitfo', description: 'Minced raw beef seasoned with mitmita and niter kibbeh', price: 14.50, category: 'meals', image: 'assets/images/menu/meals/kitfo.jpg', rating: 4.8, popular: true, ethiopian: true, inStock: true },
            { id: 6, name: 'Tibs', description: 'Sautéed meat with onions, peppers, and traditional spices', price: 13.50, category: 'meals', image: 'assets/images/menu/meals/tibs.jpg', rating: 4.7, popular: true, ethiopian: true, inStock: true },
            { id: 7, name: 'Sambusa', description: 'Fried pastry filled with lentils or meat', price: 3.50, category: 'snacks', image: 'assets/images/menu/snacks/sambusa.jpg', rating: 4.7, popular: true, ethiopian: true, inStock: true },
            { id: 8, name: 'Honey Bread', description: 'Traditional sweet bread made with honey and spices', price: 4.99, category: 'desserts', image: 'assets/images/menu/desserts/honey-bread.jpg', rating: 4.6, popular: true, ethiopian: true, inStock: true }
        ];
        localStorage.setItem('markanMenu', JSON.stringify(allMenuItems));
    }
    
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
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="menu-card" onclick="showItemModal(${item.id})">
            <div class="menu-card-image" style="background-image: url('${item.image || 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Food'}')">
                ${item.popular ? '<span class="menu-card-badge">Popular</span>' : ''}
                ${!item.inStock ? '<span class="menu-card-badge" style="background: #dc3545;">Out of Stock</span>' : ''}
            </div>
            <div class="menu-card-content">
                <h3 class="menu-card-title">${item.name}</h3>
                <p class="menu-card-description">${item.description.substring(0, 60)}...</p>
                <div class="menu-card-footer">
                    <span class="menu-card-price">$${item.price.toFixed(2)}</span>
                    <button class="btn-small" onclick="addToCartFromCard(${item.id}); event.stopPropagation();" ${!item.inStock ? 'disabled' : ''}>
                        ${item.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Add to cart from card
window.addToCartFromCard = function(itemId) {
    const item = allMenuItems.find(i => i.id === itemId);
    if (item && item.inStock) {
        addToCart(item, 1);
        showNotification(`${item.name} added to cart`, 'success');
    } else if (!item.inStock) {
        showNotification('Item is out of stock', 'error');
    }
};

// Show item modal
window.showItemModal = function(itemId) {
    const item = allMenuItems.find(i => i.id === itemId);
    if (!item) return;
    
    const modal = document.getElementById('itemModal');
    const content = document.getElementById('modalContent');
    
    if (!modal || !content) return;
    
    // Generate stars for rating
    const stars = generateStars(item.rating || 4.5);
    
    content.innerHTML = `
        <div class="menu-modal-image" style="background-image: url('${item.image || 'https://via.placeholder.com/400x400/8B4513/FFD700?text=Food'}')"></div>
        <div class="menu-modal-details">
            <h2>${item.name}</h2>
            <span class="menu-modal-category">${item.category}</span>
            <p class="menu-modal-description">${item.description}</p>
            <div class="menu-modal-price">$${item.price.toFixed(2)}</div>
            <div class="menu-modal-rating">
                <div class="menu-modal-stars">${stars}</div>
                <span>${item.rating || 4.5} out of 5</span>
            </div>
            
            <div class="menu-modal-quantity">
                <span>Quantity:</span>
                <div class="quantity-selector">
                    <button class="quantity-btn" onclick="updateModalQuantity(-1)" ${!item.inStock ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" id="modalQuantity" value="1" min="1" max="10" ${!item.inStock ? 'disabled' : ''}>
                    <button class="quantity-btn" onclick="updateModalQuantity(1)" ${!item.inStock ? 'disabled' : ''}>+</button>
                </div>
            </div>
            
            <div class="menu-modal-actions">
                <button class="btn-large" onclick="addToCartFromModal(${item.id})" ${!item.inStock ? 'disabled' : ''}>
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

// Generate star rating
function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalf) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
}

// Update modal quantity
window.updateModalQuantity = function(change) {
    const input = document.getElementById('modalQuantity');
    if (!input) return;
    let newValue = parseInt(input.value) + change;
    newValue = Math.max(1, Math.min(10, newValue));
    input.value = newValue;
};

// Add to cart from modal
window.addToCartFromModal = function(itemId) {
    const quantity = parseInt(document.getElementById('modalQuantity')?.value || '1');
    const item = window.currentModalItem;
    if (item && item.inStock) {
        addToCart(item, quantity);
        showNotification(`${item.name} added to cart`, 'success');
        closeModal();
    }
};

// Close modal
window.closeModal = function() {
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// Filter items
function filterItems() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    minPrice = parseInt(document.getElementById('minPrice')?.value || '0');
    maxPrice = parseInt(document.getElementById('maxPrice')?.value || '50');
    
    const activeDietBtns = document.querySelectorAll('.diet-tag.active');
    currentDietaryFilters = Array.from(activeDietBtns).map(btn => btn.dataset.diet);
    
    filteredItems = allMenuItems.filter(item => {
        // Category filter
        if (currentCategory !== 'all' && item.category !== currentCategory) {
            return false;
        }
        
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
            !item.description.toLowerCase().includes(searchTerm)) {
            return false;
        }
        
        // Price filter
        if (item.price < minPrice || item.price > maxPrice) {
            return false;
        }
        
        // Dietary filters
        if (currentDietaryFilters.length > 0) {
            if (currentDietaryFilters.includes('ethiopian') && !item.ethiopian) return false;
            if (currentDietaryFilters.includes('vegetarian') && !item.vegetarian && !item.vegan) return false;
            if (currentDietaryFilters.includes('vegan') && !item.vegan) return false;
            if (currentDietaryFilters.includes('popular') && !item.popular) return false;
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
            filterItems();
        });
        
        maxPriceInput.addEventListener('input', function() {
            maxPrice = parseInt(this.value);
            if (maxPrice < minPrice) {
                maxPrice = minPrice;
                maxPriceInput.value = maxPrice;
            }
            filterItems();
        });
    }
    
    // Dietary tags
    document.querySelectorAll('.diet-tag').forEach(tag => {
        tag.addEventListener('click', function() {
            this.classList.toggle('active');
            filterItems();
        });
    });
    
    // Modal close
    const modalClose = document.querySelector('#itemModal .modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeModal);
    }
    
    const modal = document.getElementById('itemModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal();
            }
        });
    }
}

// Update cart count
function updateCartCount() {
    const cart = AppState.cart || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-count, #cartCount');
    badges.forEach(badge => {
        if (badge) {
            badge.textContent = totalItems;
            badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
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