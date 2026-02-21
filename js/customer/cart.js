// js/customer/cart.js - Shopping Cart Logic
// Markan Cafe - Debre Birhan University

// Initialize cart page
document.addEventListener('DOMContentLoaded', function() {
    displayCart();
    loadSavedOrders();
    updateCartCount();
    setupEventListeners();
});

// Display cart items
function displayCart() {
    const cartContainer = document.getElementById('cartItems');
    const cart = AppState.cart || [];
    
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
    
    let html = '';
    cart.forEach(item => {
        const itemTotal = (item.price * (item.quantity || 1));
        html += `
            <div class="cart-item" data-id="${item.id}">
                <div class="cart-item-image" style="background-image: url('${item.image || 'https://via.placeholder.com/100x100/8B4513/FFD700?text=Food'}')"></div>
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-category">${item.category || 'Item'}</span>
                    <span class="cart-item-price">$${item.price.toFixed(2)} each</span>
                </div>
                <div class="cart-item-actions">
                    <div class="cart-item-quantity">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                        <span class="quantity-value">${item.quantity || 1}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                    <button class="remove-item-btn" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    cartContainer.innerHTML = html;
    
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const countElement = document.getElementById('cartItemsCount');
    if (countElement) {
        countElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    }
    
    updateCartSummary();
}

// Update cart summary
function updateCartSummary() {
    const summaryContainer = document.getElementById('cartSummary');
    if (!summaryContainer) return;
    
    const subtotal = getCartSubtotal();
    const tax = getCartTax();
    const total = getCartTotal();
    
    summaryContainer.innerHTML = `
        <div class="summary-row">
            <span>Subtotal:</span>
            <span>$${subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
            <span>Tax (10%):</span>
            <span>$${tax.toFixed(2)}</span>
        </div>
        <div class="summary-row grand-total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
}

// Update quantity
window.updateQuantity = function(itemId, change) {
    const item = AppState.cart.find(i => i.id === itemId);
    if (!item) return;
    
    const newQuantity = (item.quantity || 1) + change;
    
    if (newQuantity <= 0) {
        removeFromCart(itemId);
    } else {
        item.quantity = newQuantity;
        saveCart();
        displayCart();
        showNotification('Cart updated', 'success');
    }
};

// Remove from cart
window.removeFromCart = function(itemId) {
    removeFromCart(itemId);
    displayCart();
    showNotification('Item removed from cart', 'info');
};

// Clear cart
window.clearCart = function() {
    if (AppState.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        clearCart();
        displayCart();
        showNotification('Cart cleared', 'warning');
    }
};

// Apply promo code
window.applyPromoCode = function() {
    const input = document.getElementById('promoCode');
    const code = input?.value.trim().toUpperCase();
    
    if (!code) {
        showNotification('Please enter a promo code', 'warning');
        return;
    }
    
    // Mock promo codes
    const promos = {
        'WELCOME10': 10,
        'COFFEE20': 20,
        'ETHIOPIA15': 15,
        'STUDENT10': 10
    };
    
    if (promos[code]) {
        const discount = promos[code];
        showNotification(`Promo code applied! You saved ${discount}%`, 'success');
        // Apply discount logic here
    } else {
        showNotification('Invalid promo code', 'error');
    }
};

// Proceed to checkout
window.proceedToCheckout = function() {
    if (AppState.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    window.location.href = 'checkout.html';
};

// Save current order
window.saveOrder = async function() {
    if (AppState.cart.length === 0) {
        showNotification('Cannot save empty cart', 'error');
        return;
    }
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const orderData = {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        items: AppState.cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        })),
        subtotal: getCartSubtotal(),
        tax: getCartTax(),
        total: getCartTotal(),
        status: 'saved',
        orderDate: new Date().toISOString()
    };
    
    try {
        // Get existing saved orders
        const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
        savedOrders.push(orderData);
        localStorage.setItem('markanSavedOrders', JSON.stringify(savedOrders));
        
        showNotification('Order saved successfully', 'success');
        loadSavedOrders();
    } catch (error) {
        console.error('Failed to save order:', error);
        showNotification('Failed to save order', 'error');
    }
};

// Load saved orders
function loadSavedOrders() {
    const container = document.getElementById('savedOrders');
    const listContainer = document.getElementById('savedOrdersList');
    
    if (!container || !listContainer) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
    const userSavedOrders = savedOrders.filter(o => o.customerId === user.id);
    
    if (userSavedOrders.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    
    listContainer.innerHTML = userSavedOrders.slice(-5).reverse().map(order => `
        <div class="saved-order-card">
            <div class="saved-order-header">
                <span class="saved-order-id">${order.id || 'Order'}</span>
                <span class="saved-order-date">${new Date(order.orderDate).toLocaleDateString()}</span>
            </div>
            <div class="saved-order-items">
                ${order.items.map(item => `
                    <div class="saved-order-item">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="saved-order-total">Total: $${order.total.toFixed(2)}</div>
            <div class="saved-order-actions">
                <button class="load-order-btn" onclick="loadSavedOrder('${order.id}')">
                    <i class="fas fa-download"></i> Load Order
                </button>
            </div>
        </div>
    `).join('');
}

// Load saved order
window.loadSavedOrder = function(orderId) {
    const savedOrders = JSON.parse(localStorage.getItem('markanSavedOrders')) || [];
    const order = savedOrders.find(o => o.id === orderId);
    
    if (order) {
        // Clear current cart
        AppState.cart = [];
        
        // Add items from saved order
        order.items.forEach(item => {
            for (let i = 0; i < item.quantity; i++) {
                AppState.cart.push({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: 1,
                    category: item.category
                });
            }
        });
        
        saveCart();
        displayCart();
        showNotification('Saved order loaded', 'success');
    }
};

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
    
    const applyPromoBtn = document.getElementById('applyPromo');
    if (applyPromoBtn) {
        applyPromoBtn.addEventListener('click', applyPromoCode);
    }
    
    const saveOrderBtn = document.getElementById('saveOrderBtn');
    if (saveOrderBtn) {
        saveOrderBtn.addEventListener('click', saveOrder);
    }
}