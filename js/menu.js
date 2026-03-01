// js/menu.js - Customer Menu Page
// Markan Cafe - Debre Birhan University
// Displays menu items from admin panel with cart functionality

// ===== GLOBAL VARIABLES =====
let allMenuItems = [];
let filteredItems = [];
let currentView = 'grid';
let cart = [];
let currentUser = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🍽️ Menu page initializing...');
    
    // Check login status
    checkLoginStatus();
    
    // Load menu items from MenuDB
    loadMenuItems();
    
    // Load cart from localStorage
    loadCart();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update cart count
    updateCartCount();
    
    // Add cart icon to navbar
    addCartIcon();
});

// ===== CHECK LOGIN STATUS =====
function checkLoginStatus() {
    const userStr = localStorage.getItem('markanUser');
    if (userStr) {
        try {
            currentUser = JSON.parse(userStr);
            console.log('✅ User logged in:', currentUser.email);
        } catch (e) {
            console.error('Error parsing user:', e);
        }
    }
}

// ===== LOAD MENU ITEMS =====
function loadMenuItems() {
    if (typeof MenuDB !== 'undefined') {
        allMenuItems = MenuDB.getAvailable() || [];
        console.log('📊 Loaded', allMenuItems.length, 'menu items');
        
        // Format prices to ETB
        allMenuItems = allMenuItems.map(item => ({
            ...item,
            price: item.price || 0
        }));
        
        filteredItems = [...allMenuItems];
        displayMenuItems(filteredItems);
        updatePriceRangeDisplay();
    } else {
        console.error('MenuDB not available');
        showNotification('Menu system unavailable', 'error');
    }
}

// ===== LOAD CART =====
function loadCart() {
    if (currentUser) {
        const cartKey = `cart_${currentUser.id}`;
        const savedCart = localStorage.getItem(cartKey);
        cart = savedCart ? JSON.parse(savedCart) : [];
    } else {
        // For guests, use generic cart (will be cleared on login)
        const savedCart = localStorage.getItem('guestCart');
        cart = savedCart ? JSON.parse(savedCart) : [];
    }
}

// ===== SAVE CART =====
function saveCart() {
    if (currentUser) {
        const cartKey = `cart_${currentUser.id}`;
        localStorage.setItem(cartKey, JSON.stringify(cart));
    } else {
        localStorage.setItem('guestCart', JSON.stringify(cart));
    }
    updateCartCount();
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    // Update cart icon badge
    const cartIcon = document.getElementById('cartIcon');
    if (cartIcon) {
        let badge = cartIcon.querySelector('.cart-badge');
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'cart-badge';
            cartIcon.appendChild(badge);
        }
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'flex' : 'none';
    }
    
    // Also update any other cart count elements
    const cartCounts = document.querySelectorAll('.cart-count');
    cartCounts.forEach(el => {
        el.textContent = totalItems;
        el.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

// ===== ADD CART ICON TO NAVBAR =====
function addCartIcon() {
    const navbarButtons = document.querySelector('.navbar-buttons');
    if (!navbarButtons) return;
    
    // Check if cart icon already exists
    if (document.getElementById('cartIcon')) return;
    
    const cartIcon = document.createElement('a');
    cartIcon.id = 'cartIcon';
    cartIcon.href = 'customer/html/cart.html';
    cartIcon.className = 'cart-icon';
    cartIcon.innerHTML = `
        <i class="fas fa-shopping-cart"></i>
        <span class="cart-badge">0</span>
    `;
    
    // Add to navbar before login/signup buttons
    navbarButtons.parentNode.insertBefore(cartIcon, navbarButtons);
    
    // Add CSS for cart icon
    const style = document.createElement('style');
    style.textContent = `
        .cart-icon {
            position: relative;
            margin-right: 15px;
            color: #8B4513;
            font-size: 1.3rem;
        }
        .cart-badge {
            position: absolute;
            top: -8px;
            right: -8px;
            background: #c49a6c;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            font-size: 0.7rem;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
        }
        .navbar-transparent .cart-icon {
            color: white;
        }
        @media (max-width: 768px) {
            .cart-icon {
                margin-right: 10px;
            }
        }
    `;
    document.head.appendChild(style);
}

// ===== DISPLAY MENU ITEMS =====
function displayMenuItems(items) {
    const grid = document.getElementById('menuGrid');
    if (!grid) return;
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No items found</h3>
                <p>Try adjusting your filters or search term</p>
            </div>
        `;
        return;
    }
    
    if (currentView === 'grid') {
        displayGridView(items);
    } else {
        displayListView(items);
    }
}

// ===== DISPLAY GRID VIEW =====
function displayGridView(items) {
    const grid = document.getElementById('menuGrid');
    
    grid.innerHTML = items.map(item => {
        const imageUrl = item.image || 'assets/images/placeholders/placeholder-food.jpg';
        const inStock = item.stock > 0;
        const priceETB = Math.round(item.price); // Convert to ETB (remove decimals)
        
        return `
            <div class="menu-item" onclick="showItemModal('${item.id}')">
                <div class="menu-item-image" style="background-image: url('${imageUrl}')">
                    ${item.popular ? '<span class="menu-item-badge popular">Popular</span>' : ''}
                    ${item.ethiopian ? '<span class="menu-item-badge ethiopian">Ethiopian</span>' : ''}
                    ${!inStock ? '<span class="menu-item-badge out-of-stock">Out of Stock</span>' : ''}
                </div>
                <div class="menu-item-content">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <p class="menu-item-description">${(item.description || '').substring(0, 60)}...</p>
                    <div class="menu-item-footer">
                        <span class="menu-item-price">${priceETB} ETB</span>
                        ${inStock ? `
                            <button class="add-to-cart-btn" onclick="addToCartFromCard('${item.id}'); event.stopPropagation();">
                                <i class="fas fa-cart-plus"></i> Add
                            </button>
                        ` : `
                            <button class="add-to-cart-btn disabled" disabled>
                                <i class="fas fa-times-circle"></i> Unavailable
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== DISPLAY LIST VIEW =====
function displayListView(items) {
    const grid = document.getElementById('menuGrid');
    grid.classList.add('list-view');
    
    grid.innerHTML = items.map(item => {
        const imageUrl = item.image || 'assets/images/placeholders/placeholder-food.jpg';
        const inStock = item.stock > 0;
        const priceETB = Math.round(item.price);
        
        return `
            <div class="menu-item" onclick="showItemModal('${item.id}')">
                <div class="menu-item-image" style="background-image: url('${imageUrl}')">
                    ${item.popular ? '<span class="menu-item-badge popular">Popular</span>' : ''}
                    ${item.ethiopian ? '<span class="menu-item-badge ethiopian">Ethiopian</span>' : ''}
                </div>
                <div class="menu-item-content">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <p class="menu-item-category">${item.category}</p>
                    <p class="menu-item-description">${item.description || 'No description available'}</p>
                    <div class="menu-item-footer">
                        <span class="menu-item-price">${priceETB} ETB</span>
                        ${inStock ? `
                            <button class="add-to-cart-btn" onclick="addToCartFromCard('${item.id}'); event.stopPropagation();">
                                <i class="fas fa-cart-plus"></i> Add to Cart
                            </button>
                        ` : `
                            <span class="out-of-stock-text">Out of Stock</span>
                        `}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== ADD TO CART FROM CARD =====
window.addToCartFromCard = function(itemId) {
    if (!currentUser) {
        showNotification('Please login to add items to cart', 'warning');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    const item = allMenuItems.find(i => i.id == itemId);
    if (!item) return;
    
    if (item.stock <= 0) {
        showNotification('This item is out of stock', 'error');
        return;
    }
    
    addToCart(item, 1);
    showNotification(`${item.name} added to cart`, 'success');
};

// ===== ADD TO CART FUNCTION =====
function addToCart(item, quantity = 1) {
    const existingItem = cart.find(i => i.id == item.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
        // Check if we have enough stock
        if (existingItem.quantity > item.stock) {
            existingItem.quantity = item.stock;
            showNotification(`Only ${item.stock} available`, 'warning');
        }
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            quantity: Math.min(quantity, item.stock)
        });
    }
    
    saveCart();
}

// ===== SHOW ITEM MODAL =====
window.showItemModal = function(itemId) {
    const item = allMenuItems.find(i => i.id == itemId);
    if (!item) return;
    
    const modal = document.getElementById('itemModal');
    const content = document.getElementById('modalContent');
    const inStock = item.stock > 0;
    const priceETB = Math.round(item.price);
    
    content.innerHTML = `
        <div class="menu-modal-image" style="background-image: url('${item.image || 'assets/images/placeholders/placeholder-food.jpg'}')"></div>
        <div class="menu-modal-details">
            <h2>${item.name}</h2>
            <span class="menu-modal-category">${item.category}</span>
            ${item.popular ? '<span class="menu-modal-badge popular">Popular</span>' : ''}
            ${item.ethiopian ? '<span class="menu-modal-badge ethiopian">Ethiopian</span>' : ''}
            <p class="menu-modal-description">${item.description || 'No description available'}</p>
            <div class="menu-modal-price">${priceETB} ETB</div>
            ${inStock ? `
                <div class="menu-modal-stock">${item.stock} available</div>
                <div class="menu-modal-quantity">
                    <span>Quantity:</span>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="updateModalQuantity(-1)">-</button>
                        <input type="number" class="quantity-input" id="modalQuantity" value="1" min="1" max="${item.stock}">
                        <button class="quantity-btn" onclick="updateModalQuantity(1)">+</button>
                    </div>
                </div>
                <div class="menu-modal-actions">
                    <button class="btn btn-primary" onclick="addToCartFromModal('${item.id}')">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="btn btn-outline" onclick="closeModal()">Continue Shopping</button>
                </div>
            ` : `
                <div class="menu-modal-stock out">Out of Stock</div>
                <div class="menu-modal-actions">
                    <button class="btn btn-outline" onclick="closeModal()">Continue Shopping</button>
                </div>
            `}
        </div>
    `;
    
    modal.classList.add('active');
    window.currentModalItem = item;
};

// ===== UPDATE MODAL QUANTITY =====
window.updateModalQuantity = function(change) {
    const input = document.getElementById('modalQuantity');
    if (!input) return;
    
    const item = window.currentModalItem;
    if (!item) return;
    
    let newValue = parseInt(input.value) + change;
    newValue = Math.max(1, Math.min(item.stock, newValue));
    input.value = newValue;
};

// ===== ADD TO CART FROM MODAL =====
window.addToCartFromModal = function(itemId) {
    if (!currentUser) {
        showNotification('Please login to add items to cart', 'warning');
        closeModal();
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
        return;
    }
    
    const quantity = parseInt(document.getElementById('modalQuantity')?.value || '1');
    const item = window.currentModalItem;
    
    if (item && item.stock >= quantity) {
        addToCart(item, quantity);
        showNotification(`${quantity} x ${item.name} added to cart`, 'success');
        closeModal();
    } else {
        showNotification('Not enough stock available', 'error');
    }
};

// ===== CLOSE MODAL =====
window.closeModal = function() {
    document.getElementById('itemModal').classList.remove('active');
};

// ===== FILTER ITEMS =====
function filterItems() {
    const category = document.querySelector('.category-nav-item.active')?.dataset.category || 'all';
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const minPrice = parseFloat(document.getElementById('minPrice')?.value || 0);
    const maxPrice = parseFloat(document.getElementById('maxPrice')?.value || 500);
    
    filteredItems = allMenuItems.filter(item => {
        // Category filter
        if (category !== 'all' && item.category !== category) return false;
        
        // Search filter
        if (searchTerm && !item.name.toLowerCase().includes(searchTerm) && 
            !(item.description && item.description.toLowerCase().includes(searchTerm))) {
            return false;
        }
        
        // Price filter
        if (item.price < minPrice || item.price > maxPrice) return false;
        
        return true;
    });
    
    displayMenuItems(filteredItems);
    document.getElementById('priceRangeValue').textContent = `${minPrice} - ${maxPrice} ETB`;
}

// ===== UPDATE PRICE RANGE DISPLAY =====
function updatePriceRangeDisplay() {
    if (allMenuItems.length === 0) return;
    
    const prices = allMenuItems.map(item => item.price);
    const maxPrice = Math.max(...prices, 500);
    
    const minSlider = document.getElementById('minPrice');
    const maxSlider = document.getElementById('maxPrice');
    
    if (minSlider && maxSlider) {
        minSlider.max = maxPrice;
        maxSlider.max = maxPrice;
        maxSlider.value = maxPrice;
        
        document.getElementById('priceRangeValue').textContent = `0 - ${maxPrice} ETB`;
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Category filter
    document.querySelectorAll('.category-nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-nav-item').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterItems();
        });
    });
    
    // Search input
    document.getElementById('searchInput')?.addEventListener('input', debounce(filterItems, 300));
    
    // Price range sliders
    document.getElementById('minPrice')?.addEventListener('input', function() {
        const min = parseInt(this.value);
        const max = parseInt(document.getElementById('maxPrice').value);
        if (min > max) {
            document.getElementById('maxPrice').value = min;
        }
        filterItems();
    });
    
    document.getElementById('maxPrice')?.addEventListener('input', function() {
        const max = parseInt(this.value);
        const min = parseInt(document.getElementById('minPrice').value);
        if (max < min) {
            document.getElementById('minPrice').value = max;
        }
        filterItems();
    });
    
    // View options
    document.querySelectorAll('.view-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.view-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const grid = document.getElementById('menuGrid');
            currentView = btn.dataset.view;
            
            if (currentView === 'grid') {
                grid.classList.remove('list-view');
            } else {
                grid.classList.add('list-view');
            }
            
            displayMenuItems(filteredItems);
        });
    });
    
    // Modal close
    document.querySelector('#itemModal .modal-close')?.addEventListener('click', closeModal);
    document.getElementById('itemModal')?.addEventListener('click', (e) => {
        if (e.target === document.getElementById('itemModal')) closeModal();
    });
}

// ===== DEBOUNCE FUNCTION =====
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

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterItems = filterItems;
window.showItemModal = showItemModal;
window.closeModal = closeModal;
window.updateModalQuantity = updateModalQuantity;
window.addToCartFromModal = addToCartFromModal;
window.addToCartFromCard = addToCartFromCard;
window.showNotification = showNotification;