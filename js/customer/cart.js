// js/customer/cart.js - Shopping Cart Logic
// Markan Cafe - Debre Birhan University

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Display cart items
    displayCart();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load saved orders
    loadSavedOrders();
});

function displayCart() {
    const container = document.getElementById('cartItems');
    const countElement = document.getElementById('cartItemsCount');
    
    if (!container) return;
    
    if (AppState.cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Looks like you haven't added any Ethiopian dishes yet</p>
                <a href="menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        
        if (countElement) countElement.textContent = '0 items';
        updateCartSummary();
        return;
    }
    
    let html = '';
    AppState.cart.forEach(item => {
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
    
    container.innerHTML = html;
    
    const totalItems = AppState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    if (countElement) countElement.textContent = `${totalItems} item${totalItems !== 1 ? 's' : ''}`;
    
    updateCartSummary();
}

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
        <div class="summary-row total">
            <span>Total:</span>
            <span>$${total.toFixed(2)}</span>
        </div>
    `;
}

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
    }
};

window.removeFromCart = function(itemId) {
    const index = AppState.cart.findIndex(i => i.id === itemId);
    if (index !== -1) {
        const item = AppState.cart[index];
        AppState.cart.splice(index, 1);
        saveCart();
        displayCart();
        showNotification(`${item.name} removed from cart`, 'info');
    }
};

window.clearCart = function() {
    if (AppState.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        AppState.cart = [];
        saveCart();
        displayCart();
        showNotification('Cart cleared', 'warning');
    }
};

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
        showNotification(`Promo code applied! You saved ${promos[code]}%`, 'success');
        // Apply discount logic here
    } else {
        showNotification('Invalid promo code', 'error');
    }
};

window.proceedToCheckout = function() {
    if (AppState.cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    window.location.href = 'checkout.html';
};

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
        status: 'saved'
    };
    
    try {
        await API.orders.create(orderData);
        showNotification('Order saved successfully', 'success');
        loadSavedOrders();
    } catch (error) {
        console.error('Failed to save order:', error);
        showNotification('Failed to save order', 'error');
    }
};

async function loadSavedOrders() {
    const container = document.getElementById('savedOrders');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        const orders = await API.orders.getByCustomerId(user.id);
        const savedOrders = orders.filter(o => o.status === 'saved');
        
        if (savedOrders.length === 0) {
            container.style.display = 'none';
            return;
        }
        
        container.style.display = 'block';
        container.innerHTML = `
            <h2>Saved Orders</h2>
            <div class="saved-orders-grid">
                ${savedOrders.map(order => `
                    <div class="saved-order-card">
                        <div class="saved-order-header">
                            <span class="saved-order-id">${order.id}</span>
                            <span class="saved-order-date">${formatDate(order.orderDate)}</span>
                        </div>
                        <div class="saved-order-total">Total: ${formatCurrency(order.total)}</div>
                        <div class="saved-order-actions">
                            <button class="btn btn-primary btn-small" onclick="loadSavedOrder('${order.id}')">
                                Load Order
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
    } catch (error) {
        console.error('Failed to load saved orders:', error);
    }
}

window.loadSavedOrder = async function(orderId) {
    try {
        const order = await API.orders.getById(orderId);
        if (order) {
            AppState.cart = [];
            order.items.forEach(item => {
                for (let i = 0; i < item.quantity; i++) {
                    AppState.cart.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: 1
                    });
                }
            });
            saveCart();
            displayCart();
            showNotification('Saved order loaded', 'success');
        }
    } catch (error) {
        console.error('Failed to load saved order:', error);
        showNotification('Failed to load saved order', 'error');
    }
};

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