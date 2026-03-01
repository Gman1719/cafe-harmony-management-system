// customer/js/cart.js - Shopping Cart Management
// Markan Cafe - Debre Birhan University
// Fully dynamic with database integration

// ===== GLOBAL VARIABLES =====
let cart = [];
let menuItems = [];
let savedOrders = [];
let currentUser = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🛒 Cart page initializing...');
    
    // Get current user
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.replace('../../login.html');
        return;
    }
    
    // Set user name in greeting
    const firstName = currentUser.name.split(' ')[0];
    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.textContent = firstName;
    
    // Load menu items from MenuDB
    await loadMenuItems();
    
    // Load cart from localStorage
    loadCart();
    
    // Load saved orders
    loadSavedOrders();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update sidebar badges
    updateSidebarBadges();
    
    // Display cart items
    displayCart();
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

// ===== LOAD MENU ITEMS FROM DATABASE =====
async function loadMenuItems() {
    // Check if MenuDB exists
    if (typeof MenuDB !== 'undefined') {
        menuItems = MenuDB.getAll() || [];
        console.log('📦 Loaded', menuItems.length, 'menu items from MenuDB');
    } else {
        // Fallback to localStorage
        try {
            const savedMenu = localStorage.getItem('markanMenu');
            menuItems = savedMenu ? JSON.parse(savedMenu) : [];
            console.log('📦 Loaded', menuItems.length, 'menu items from localStorage');
        } catch (e) {
            console.error('Error loading menu items:', e);
            menuItems = [];
        }
    }
}

// ===== LOAD CART FROM LOCALSTORAGE =====
function loadCart() {
    const cartKey = `cart_${currentUser.id}`;
    try {
        const savedCart = localStorage.getItem(cartKey);
        cart = savedCart ? JSON.parse(savedCart) : [];
        console.log('📦 Loaded cart:', cart.length, 'items');
    } catch (e) {
        console.error('Error loading cart:', e);
        cart = [];
    }
}

// ===== SAVE CART TO LOCALSTORAGE =====
function saveCart() {
    const cartKey = `cart_${currentUser.id}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Update sidebar badges
    updateSidebarBadges();
    
    // Dispatch custom event for other components
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { cart } }));
}

// ===== DISPLAY CART ITEMS =====
function displayCart() {
    const cartContainer = document.getElementById('cartItems');
    if (!cartContainer) return;
    
    // Validate cart items against current menu
    validateCartItems();
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any Ethiopian dishes yet</p>
                <a href="menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        updateCartSummary();
        return;
    }
    
    let html = '';
    cart.forEach((item, index) => {
        // Get current menu item for stock and price
        const menuItem = menuItems.find(m => m.id == item.id);
        const currentStock = menuItem ? menuItem.stock : 0;
        const currentPrice = menuItem ? menuItem.price : item.price;
        const isLowStock = currentStock < 5 && currentStock > 0;
        const isOutOfStock = currentStock === 0;
        
        const itemTotal = currentPrice * item.quantity;
        
        html += `
            <div class="cart-item" data-id="${item.id}" data-index="${index}">
                <div class="cart-item-image" style="background-image: url('${item.image || '../../assets/images/placeholder-food.jpg'}')"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-category">${item.category || 'Item'}</span>
                    <span class="cart-item-price">${formatETB(currentPrice)} each</span>
                    ${isOutOfStock ? 
                        '<div class="cart-item-stock out">Out of stock - please remove</div>' : 
                        isLowStock ? 
                        `<div class="cart-item-stock low">Only ${currentStock} left in stock</div>` : 
                        `<div class="cart-item-stock">${currentStock} available</div>`
                    }
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)" 
                                ${item.quantity <= 1 || isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)" 
                                ${item.quantity >= currentStock || isOutOfStock ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="cart-item-total">${formatETB(itemTotal)}</div>
                    <button class="remove-item-btn" onclick="removeFromCart('${item.id}')" title="Remove item">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartContainer.innerHTML = html;
    
    // Update cart summary
    updateCartSummary();
}

// ===== VALIDATE CART ITEMS AGAINST CURRENT MENU =====
function validateCartItems() {
    let changed = false;
    
    for (let i = cart.length - 1; i >= 0; i--) {
        const item = cart[i];
        const menuItem = menuItems.find(m => m.id == item.id);
        
        // Remove if item no longer exists in menu
        if (!menuItem) {
            cart.splice(i, 1);
            changed = true;
            showNotification(`${item.name} is no longer available and has been removed`, 'warning');
            continue;
        }
        
        // Update price if changed
        if (menuItem.price !== item.price) {
            item.price = menuItem.price;
            changed = true;
        }
        
        // Adjust quantity if exceeds stock
        if (item.quantity > menuItem.stock) {
            item.quantity = menuItem.stock;
            changed = true;
            if (menuItem.stock === 0) {
                showNotification(`${item.name} is out of stock and has been removed`, 'warning');
                cart.splice(i, 1);
            } else {
                showNotification(`${item.name} quantity adjusted to available stock (${menuItem.stock})`, 'warning');
            }
        }
    }
    
    if (changed) {
        saveCart();
    }
}

// ===== UPDATE CART SUMMARY =====
function updateCartSummary() {
    let subtotal = 0;
    
    cart.forEach(item => {
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        subtotal += price * item.quantity;
    });
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (subtotalEl) subtotalEl.textContent = formatETB(subtotal);
    if (taxEl) taxEl.textContent = formatETB(tax);
    if (totalEl) totalEl.textContent = formatETB(total);
    
    // Update checkout button state
    if (checkoutBtn) {
        const hasOutOfStock = cart.some(item => {
            const menuItem = menuItems.find(m => m.id == item.id);
            return !menuItem || menuItem.stock === 0;
        });
        checkoutBtn.disabled = cart.length === 0 || hasOutOfStock;
    }
}

// ===== UPDATE QUANTITY =====
window.updateQuantity = function(itemId, change) {
    const itemIndex = cart.findIndex(i => i.id == itemId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    const menuItem = menuItems.find(m => m.id == itemId);
    
    if (!menuItem) {
        showNotification('Item not found in menu', 'error');
        cart.splice(itemIndex, 1);
        saveCart();
        displayCart();
        return;
    }
    
    const newQuantity = item.quantity + change;
    
    // Validate quantity
    if (newQuantity <= 0) {
        // Remove item
        cart.splice(itemIndex, 1);
        showNotification(`${item.name} removed from cart`, 'info');
    } else if (newQuantity > menuItem.stock) {
        showNotification(`Only ${menuItem.stock} available`, 'error');
        return;
    } else {
        cart[itemIndex].quantity = newQuantity;
        showNotification('Cart updated', 'success');
    }
    
    // Save cart
    saveCart();
    
    // Refresh display
    displayCart();
};

// ===== REMOVE FROM CART =====
window.removeFromCart = function(itemId) {
    const itemIndex = cart.findIndex(i => i.id == itemId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    cart.splice(itemIndex, 1);
    saveCart();
    displayCart();
    showNotification(`${item.name} removed from cart`, 'info');
};

// ===== CLEAR ENTIRE CART =====
window.clearCart = function() {
    if (cart.length === 0) {
        showNotification('Cart is already empty', 'info');
        return;
    }
    
    if (confirm('Are you sure you want to clear your entire cart?')) {
        cart = [];
        saveCart();
        displayCart();
        showNotification('Cart cleared', 'success');
    }
};

// ===== APPLY PROMO CODE =====
window.applyPromoCode = function() {
    const input = document.getElementById('promoCode');
    const messageEl = document.getElementById('promoMessage');
    
    if (!input || !messageEl) return;
    
    const code = input.value.trim().toUpperCase();
    
    if (!code) {
        messageEl.textContent = 'Please enter a promo code';
        messageEl.style.color = '#ed6c02';
        return;
    }
    
    // Valid promo codes from localStorage (could be managed by admin)
    let promos = {};
    try {
        const savedPromos = localStorage.getItem('markanPromoCodes');
        promos = savedPromos ? JSON.parse(savedPromos) : {
            'WELCOME10': 10,
            'COFFEE20': 20,
            'ETHIOPIA15': 15,
            'STUDENT10': 10,
            'MARKAN5': 5
        };
    } catch (e) {
        console.error('Error loading promos:', e);
        promos = {
            'WELCOME10': 10,
            'COFFEE20': 20,
            'ETHIOPIA15': 15,
            'STUDENT10': 10,
            'MARKAN5': 5
        };
    }
    
    if (promos[code]) {
        const discount = promos[code];
        messageEl.textContent = `${discount}% discount applied!`;
        messageEl.style.color = '#2e7d32';
        
        // Store active promo in session
        sessionStorage.setItem('activePromo', JSON.stringify({
            code: code,
            discount: discount
        }));
        
        showNotification(`Promo code applied! You saved ${discount}%`, 'success');
    } else {
        messageEl.textContent = 'Invalid promo code';
        messageEl.style.color = '#d32f2f';
        showNotification('Invalid promo code', 'error');
    }
};

// ===== PROCEED TO CHECKOUT =====
window.proceedToCheckout = function() {
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    // Check for out of stock items
    for (let item of cart) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (!menuItem || menuItem.stock === 0) {
            showNotification(`${item.name} is out of stock. Please remove it.`, 'error');
            return;
        }
        if (item.quantity > menuItem.stock) {
            showNotification(`${item.name} quantity exceeds available stock (${menuItem.stock})`, 'error');
            return;
        }
    }
    
    window.location.href = 'checkout.html';
};

// ===== SAVE CURRENT ORDER =====
window.saveOrder = function() {
    if (cart.length === 0) {
        showNotification('Cannot save empty cart', 'error');
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    cart.forEach(item => {
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        subtotal += price * item.quantity;
    });
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const orderData = {
        id: 'SAVED-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        customerId: currentUser.id,
        customerName: currentUser.name,
        items: cart.map(item => {
            const menuItem = menuItems.find(m => m.id == item.id);
            return {
                id: item.id,
                name: item.name,
                price: menuItem ? menuItem.price : item.price,
                quantity: item.quantity,
                category: item.category,
                image: item.image
            };
        }),
        subtotal: subtotal,
        tax: tax,
        total: total,
        savedDate: new Date().toISOString()
    };
    
    // Get existing saved orders
    try {
        const allSavedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
        allSavedOrders.push(orderData);
        
        // Keep only last 20 saved orders
        if (allSavedOrders.length > 20) {
            allSavedOrders.shift();
        }
        
        localStorage.setItem('markanSavedOrders', JSON.stringify(allSavedOrders));
        showNotification('Order saved successfully', 'success');
        loadSavedOrders();
    } catch (e) {
        console.error('Error saving order:', e);
        showNotification('Failed to save order', 'error');
    }
};

// ===== LOAD SAVED ORDERS =====
function loadSavedOrders() {
    const container = document.getElementById('savedOrders');
    const listContainer = document.getElementById('savedOrdersList');
    
    if (!container || !listContainer) return;
    
    try {
        const allSavedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
        const userSavedOrders = allSavedOrders
            .filter(o => o.customerId === currentUser.id)
            .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));
        
        if (userSavedOrders.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        
        listContainer.innerHTML = userSavedOrders.slice(0, 5).map(order => `
            <div class="saved-order-card">
                <div class="saved-order-header">
                    <span class="saved-order-id">${order.id}</span>
                    <span class="saved-order-date">${formatDate(order.savedDate)}</span>
                </div>
                <div class="saved-order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="saved-order-item">
                            <span>${item.quantity}x ${item.name}</span>
                            <span>${formatETB(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<div class="saved-order-item">...and ${order.items.length - 3} more</div>` : ''}
                </div>
                <div class="saved-order-total">Total: ${formatETB(order.total)}</div>
                <button class="load-order-btn" onclick="loadSavedOrder('${order.id}')">
                    <i class="fas fa-download"></i> Load Order
                </button>
            </div>
        `).join('');
    } catch (e) {
        console.error('Error loading saved orders:', e);
        container.style.display = 'none';
    }
}

// ===== LOAD SAVED ORDER =====
window.loadSavedOrder = function(orderId) {
    try {
        const allSavedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
        const order = allSavedOrders.find(o => o.id === orderId);
        
        if (!order) {
            showNotification('Order not found', 'error');
            return;
        }
        
        // Check if items are still available
        let canLoad = true;
        let updatedItems = [];
        
        for (let savedItem of order.items) {
            const menuItem = menuItems.find(m => m.id == savedItem.id);
            
            if (!menuItem) {
                canLoad = false;
                showNotification(`${savedItem.name} is no longer available`, 'error');
            } else if (menuItem.status !== 'available') {
                canLoad = false;
                showNotification(`${savedItem.name} is not available`, 'error');
            } else if (menuItem.stock < savedItem.quantity) {
                if (menuItem.stock === 0) {
                    canLoad = false;
                    showNotification(`${savedItem.name} is out of stock`, 'error');
                } else {
                    // Adjust quantity to available stock
                    updatedItems.push({
                        id: savedItem.id,
                        name: savedItem.name,
                        price: menuItem.price,
                        quantity: menuItem.stock,
                        category: savedItem.category,
                        image: savedItem.image
                    });
                    showNotification(`${savedItem.name} quantity adjusted to ${menuItem.stock}`, 'warning');
                }
            } else {
                // Item is available
                updatedItems.push({
                    id: savedItem.id,
                    name: savedItem.name,
                    price: menuItem.price,
                    quantity: savedItem.quantity,
                    category: savedItem.category,
                    image: savedItem.image
                });
            }
        }
        
        if (!canLoad && updatedItems.length === 0) return;
        
        // Ask user if they want to load available items
        if (updatedItems.length > 0 && updatedItems.length < order.items.length) {
            if (!confirm('Some items are not available. Load available items instead?')) {
                return;
            }
        }
        
        // Clear current cart if user confirms
        if (cart.length > 0) {
            if (!confirm('Loading this order will replace your current cart. Continue?')) {
                return;
            }
        }
        
        // Load items
        cart = updatedItems;
        saveCart();
        displayCart();
        showNotification('Saved order loaded into cart', 'success');
        
    } catch (e) {
        console.error('Error loading saved order:', e);
        showNotification('Failed to load saved order', 'error');
    }
};

// ===== UPDATE CART COUNT IN NAVIGATION =====
function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    // Also update sidebar badge
    const sidebarBadge = document.getElementById('sidebarCartBadge');
    if (sidebarBadge) {
        sidebarBadge.textContent = totalItems;
        sidebarBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// ===== UPDATE SIDEBAR BADGES =====
function updateSidebarBadges() {
    // Update cart badge
    updateCartCount();
    
    // Update orders badge
    if (window.OrdersDB && currentUser) {
        try {
            const orders = OrdersDB.getByCustomerId ? OrdersDB.getByCustomerId(currentUser.id) : [];
            const pendingOrders = orders.filter(o => o && o.status === 'pending').length;
            const ordersBadge = document.getElementById('sidebarOrdersBadge');
            if (ordersBadge) {
                ordersBadge.textContent = pendingOrders;
                ordersBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
            }
        } catch (e) {
            console.error('Error loading orders:', e);
        }
    }
    
    // Update reservation badge
    if (window.ReservationsDB && currentUser) {
        try {
            const reservations = ReservationsDB.getByCustomerId ? ReservationsDB.getByCustomerId(currentUser.id) : [];
            const upcomingReservations = reservations.filter(r => r && (r.status === 'pending' || r.status === 'confirmed')).length;
            const resBadge = document.getElementById('sidebarReservationBadge');
            if (resBadge) {
                resBadge.textContent = upcomingReservations;
                resBadge.style.display = upcomingReservations > 0 ? 'inline-block' : 'none';
            }
        } catch (e) {
            console.error('Error loading reservations:', e);
        }
    }
    
    // Update points and tier
    if (currentUser && currentUser.stats) {
        const pointsEl = document.getElementById('userPoints');
        const tierEl = document.getElementById('userTier');
        if (pointsEl) pointsEl.textContent = (currentUser.stats.points || 0) + ' pts';
        if (tierEl) tierEl.textContent = (currentUser.stats.tier || 'bronze').charAt(0).toUpperCase() + 
            (currentUser.stats.tier || 'bronze').slice(1);
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    const clearCartBtn = document.getElementById('clearCartBtn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', clearCart);
    }
    
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', proceedToCheckout);
    }
    
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveOrder);
    }
    
    const applyPromoBtn = document.querySelector('.promo-input button');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', applyPromoCode);
    }
    
    const promoInput = document.getElementById('promoCode');
    if (promoInput) {
        promoInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                applyPromoCode();
            }
        });
    }
    
    // Continue shopping link
    const continueLink = document.querySelector('.continue-shopping');
    if (continueLink) {
        continueLink.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = 'menu.html';
        });
    }
    
    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanMenu') {
            // Reload menu items
            loadMenuItems().then(() => {
                // Validate cart against new menu
                validateCartItems();
                displayCart();
            });
        }
    });
    
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', function() {
        displayCart();
        updateCartCount();
    });
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return Math.round(amount).toLocaleString() + ' ETB';
}

// ===== HELPER: FORMAT DATE =====
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'notificationContainer';
        document.body.appendChild(newContainer);
    }
    
    const notifContainer = document.getElementById('notificationContainer');
    if (!notifContainer) return;
    
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
    
    notifContainer.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.applyPromoCode = applyPromoCode;
window.proceedToCheckout = proceedToCheckout;
window.saveOrder = saveOrder;
window.loadSavedOrder = loadSavedOrder;
window.showNotification = showNotification;