// customer/js/cart.js
// Markan Cafe - Shopping Cart Logic (Complete Rewrite)

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    displayCart();
    loadSavedOrders();
    updateCartCount();
    setupEventListeners();
});

// Get current user's cart
function getUserCart() {
    const user = Auth.getCurrentUser();
    if (!user) return [];
    
    const cartKey = `cart_${user.id}`;
    return JSON.parse(localStorage.getItem(cartKey)) || [];
}

// Save user's cart
function saveUserCart(cart) {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const cartKey = `cart_${user.id}`;
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Update cart count in navigation
    updateCartCount();
}

// Display cart items
function displayCart() {
    const cartContainer = document.getElementById('cartItems');
    const cart = getUserCart();
    
    if (!cartContainer) return;
    
    if (cart.length === 0) {
        cartContainer.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any Ethiopian dishes yet</p>
                <a href="menu.html" class="btn-large">Browse Menu</a>
            </div>
        `;
        updateCartSummary();
        return;
    }
    
    // Get current menu items to check stock
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    let html = '';
    cart.forEach(item => {
        // Check current stock from menu
        const menuItem = menuItems.find(m => m.id == item.id);
        const currentStock = menuItem ? menuItem.stock : 0;
        const isLowStock = currentStock < 5 && currentStock > 0;
        const isOutOfStock = currentStock === 0;
        
        const itemTotal = item.price * item.quantity;
        
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="background-image: url('${item.image || '../../admin/assets/images/menu/default.jpg'}')"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-category">${item.category || 'Item'}</span>
                    <span class="cart-item-price">${formatETB(item.price)} each</span>
                    ${isOutOfStock ? 
                        '<div class="cart-item-stock warning">Out of stock - please remove</div>' : 
                        isLowStock ? 
                        `<div class="cart-item-stock warning">Only ${currentStock} left in stock</div>` : 
                        `<div class="cart-item-stock">${currentStock} available</div>`
                    }
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', -1)" 
                                ${item.quantity <= 1 || isOutOfStock ? 'disabled' : ''}>-</button>
                        <span class="quantity-value">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity('${item.id}', 1)" 
                                ${item.quantity >= currentStock || isOutOfStock ? 'disabled' : ''}>+</button>
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

// Update cart summary
function updateCartSummary() {
    const cart = getUserCart();
    
    // Get current menu items for price validation
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    // Calculate totals
    let subtotal = 0;
    cart.forEach(item => {
        // Use current price from menu if available
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        subtotal += price * item.quantity;
    });
    
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    // Update summary display
    document.getElementById('subtotal').textContent = formatETB(subtotal);
    document.getElementById('tax').textContent = formatETB(tax);
    document.getElementById('total').textContent = formatETB(total);
    
    // Update checkout button state
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        const hasOutOfStock = checkForOutOfStock();
        checkoutBtn.disabled = cart.length === 0 || hasOutOfStock;
    }
}

// Check if any items are out of stock
function checkForOutOfStock() {
    const cart = getUserCart();
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    for (let item of cart) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (!menuItem || menuItem.stock === 0) {
            return true;
        }
    }
    return false;
}

// Update quantity
window.updateQuantity = function(itemId, change) {
    const cart = getUserCart();
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    const itemIndex = cart.findIndex(i => i.id == itemId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    const menuItem = menuItems.find(m => m.id == itemId);
    
    if (!menuItem) {
        showNotification('Item not found in menu', 'error');
        return;
    }
    
    const newQuantity = item.quantity + change;
    
    // Validate quantity
    if (newQuantity <= 0) {
        // Remove item
        cart.splice(itemIndex, 1);
        showNotification('Item removed from cart', 'info');
    } else if (newQuantity > menuItem.stock) {
        showNotification(`Only ${menuItem.stock} available`, 'error');
        return;
    } else {
        cart[itemIndex].quantity = newQuantity;
        showNotification('Cart updated', 'success');
    }
    
    // Save cart
    saveUserCart(cart);
    
    // Refresh display
    displayCart();
    updateCartCount();
};

// Remove from cart
window.removeFromCart = function(itemId) {
    let cart = getUserCart();
    cart = cart.filter(i => i.id != itemId);
    saveUserCart(cart);
    displayCart();
    updateCartCount();
    showNotification('Item removed from cart', 'info');
};

// Clear entire cart
window.clearCart = function() {
    const cart = getUserCart();
    if (cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your entire cart?')) {
        saveUserCart([]);
        displayCart();
        updateCartCount();
        showNotification('Cart cleared', 'warning');
    }
};

// Apply promo code
window.applyPromoCode = function() {
    const input = document.getElementById('promoCode');
    const messageEl = document.getElementById('promoMessage');
    const code = input?.value.trim().toUpperCase();
    
    if (!code) {
        messageEl.textContent = 'Please enter a promo code';
        messageEl.style.color = 'var(--warning-orange)';
        return;
    }
    
    // Valid promo codes (could be stored in localStorage)
    const promos = {
        'WELCOME10': 10,
        'COFFEE20': 20,
        'ETHIOPIA15': 15,
        'STUDENT10': 10,
        'MARKAN5': 5
    };
    
    if (promos[code]) {
        const discount = promos[code];
        messageEl.textContent = `${discount}% discount applied!`;
        messageEl.style.color = 'var(--success-green)';
        
        // Store active promo in session
        sessionStorage.setItem('activePromo', JSON.stringify({
            code: code,
            discount: discount
        }));
        
        showNotification(`Promo code applied! You saved ${discount}%`, 'success');
    } else {
        messageEl.textContent = 'Invalid promo code';
        messageEl.style.color = 'var(--danger-red)';
        showNotification('Invalid promo code', 'error');
    }
};

// Proceed to checkout
window.proceedToCheckout = function() {
    const cart = getUserCart();
    
    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    // Check for out of stock items
    const hasOutOfStock = checkForOutOfStock();
    if (hasOutOfStock) {
        showNotification('Some items in your cart are out of stock. Please remove them.', 'error');
        return;
    }
    
    // Check stock quantities
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    for (let item of cart) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (menuItem && item.quantity > menuItem.stock) {
            showNotification(`${item.name} quantity exceeds available stock`, 'error');
            return;
        }
    }
    
    window.location.href = 'checkout.html';
};

// Save current order
window.saveOrder = function() {
    const cart = getUserCart();
    
    if (cart.length === 0) {
        showNotification('Cannot save empty cart', 'error');
        return;
    }
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Calculate totals
    let subtotal = 0;
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
    });
    const tax = subtotal * 0.1;
    const total = subtotal + tax;
    
    const orderData = {
        id: 'SAVED-' + Date.now().toString().slice(-6),
        customerId: user.id,
        customerName: user.name,
        items: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
        })),
        subtotal: subtotal,
        tax: tax,
        total: total,
        savedDate: new Date().toISOString()
    };
    
    // Get existing saved orders
    const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
    savedOrders.push(orderData);
    localStorage.setItem('markanSavedOrders', JSON.stringify(savedOrders));
    
    showNotification('Order saved successfully', 'success');
    loadSavedOrders();
};

// Load saved orders
function loadSavedOrders() {
    const container = document.getElementById('savedOrders');
    const listContainer = document.getElementById('savedOrdersList');
    
    if (!container || !listContainer) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
    const userSavedOrders = savedOrders
        .filter(o => o.customerId === user.id)
        .sort((a, b) => new Date(b.savedDate) - new Date(a.savedDate));
    
    if (userSavedOrders.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    listContainer.innerHTML = userSavedOrders.slice(0, 3).map(order => `
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
}

// Load saved order
window.loadSavedOrder = function(orderId) {
    const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
    const order = savedOrders.find(o => o.id === orderId);
    
    if (!order) return;
    
    // Check if items are still available
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    let canLoad = true;
    
    for (let savedItem of order.items) {
        const menuItem = menuItems.find(m => m.id == savedItem.id);
        if (!menuItem || menuItem.status !== 'available' || menuItem.stock < savedItem.quantity) {
            canLoad = false;
            showNotification(`${savedItem.name} is no longer available in requested quantity`, 'error');
        }
    }
    
    if (!canLoad) return;
    
    // Clear current cart
    saveUserCart([]);
    
    // Add items from saved order
    const newCart = order.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        image: item.image
    }));
    
    saveUserCart(newCart);
    
    // Refresh display
    displayCart();
    updateCartCount();
    showNotification('Saved order loaded into cart', 'success');
};

// Update cart count in navigation
function updateCartCount() {
    const cart = getUserCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Setup event listeners
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
    
    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanMenu') {
            // Refresh cart display to show updated stock
            displayCart();
        }
    });
    
    // Listen for custom cart update events
    window.addEventListener('cartUpdated', function() {
        displayCart();
        updateCartCount();
    });
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

// Helper: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
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

// Export functions for global use
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.clearCart = clearCart;
window.applyPromoCode = applyPromoCode;
window.proceedToCheckout = proceedToCheckout;
window.saveOrder = saveOrder;
window.loadSavedOrder = loadSavedOrder;