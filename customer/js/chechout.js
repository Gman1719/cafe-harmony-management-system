// customer/js/checkout.js
// Markan Cafe - Checkout Process

// Initialize checkout page
document.addEventListener('DOMContentLoaded', function() {
    loadUserData();
    loadOrderSummary();
    setupEventListeners();
    checkCart();
});

// Check if cart has items
function checkCart() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    if (cart.length === 0) {
        showNotification('Your cart is empty', 'error');
        setTimeout(() => {
            window.location.href = 'menu.html';
        }, 2000);
    }
}

// Load user data into form
function loadUserData() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    
    // Load saved address if exists
    if (user.address) {
        document.getElementById('address').value = user.address;
    }
}

// Load order summary
function loadOrderSummary() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];

    const orderItemsContainer = document.getElementById('orderItems');
    
    if (cart.length === 0) {
        orderItemsContainer.innerHTML = '<p class="text-center">No items in cart</p>';
        return;
    }

    let subtotal = 0;
    let itemsHtml = '';

    cart.forEach(item => {
        // Get current price from menu
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        itemsHtml += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-image" style="background-image: url('${item.image || '../../admin/assets/images/menu/default.jpg'}')"></div>
                    <div class="order-item-details">
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity}</p>
                    </div>
                </div>
                <div class="order-item-price">${formatETB(itemTotal)}</div>
            </div>
        `;
    });

    orderItemsContainer.innerHTML = itemsHtml;
    
    // Store subtotal for later use
    window.checkoutSubtotal = subtotal;
    calculateTotals();
}

// Calculate totals
window.calculateTotals = function() {
    const subtotal = window.checkoutSubtotal || 0;
    const tax = subtotal * 0.1;
    
    // Get delivery fee
    const orderType = document.getElementById('orderType')?.value || 'pickup';
    const deliveryFee = orderType === 'delivery' ? 50 : 0;
    
    const total = subtotal + tax + deliveryFee;

    document.getElementById('subtotal').textContent = formatETB(subtotal);
    document.getElementById('tax').textContent = formatETB(tax);
    document.getElementById('total').textContent = formatETB(total);
    
    // Store for order creation
    window.checkoutTax = tax;
    window.checkoutDeliveryFee = deliveryFee;
    window.checkoutTotal = total;
};

// Confirm order
window.confirmOrder = function() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Validate required fields
    const phone = document.getElementById('phone').value;
    const orderType = document.getElementById('orderType').value;
    
    if (orderType === 'delivery') {
        const address = document.getElementById('address').value;
        if (!address) {
            showNotification('Please enter delivery address', 'error');
            return;
        }
    }

    // Validate phone format
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number', 'error');
        return;
    }

    // Get payment method
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    if (paymentMethod === 'telebirr') {
        const telebirrPhone = document.getElementById('phoneNumber').value;
        if (!telebirrPhone) {
            showNotification('Please enter Telebirr phone number', 'error');
            return;
        }
        if (!phoneRegex.test(telebirrPhone)) {
            showNotification('Please enter a valid Telebirr phone number', 'error');
            return;
        }
    }

    // Disable confirm button to prevent double submission
    const confirmBtn = document.getElementById('confirmOrderBtn');
    confirmBtn.disabled = true;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    // Process order
    processOrder();
};

// Process order
function processOrder() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];

    // Final stock check
    let stockValid = true;
    for (let item of cart) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (!menuItem || menuItem.stock < item.quantity) {
            stockValid = false;
            showNotification(`${item.name} is out of stock or quantity exceeds available stock`, 'error');
            break;
        }
    }

    if (!stockValid) {
        document.getElementById('confirmOrderBtn').disabled = false;
        document.getElementById('confirmOrderBtn').innerHTML = '<i class="fas fa-check-circle"></i> Confirm Order';
        return;
    }

    // Reduce stock in menuItems
    for (let item of cart) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (menuItem) {
            menuItem.stock -= item.quantity;
            if (menuItem.stock === 0) {
                menuItem.status = 'out_of_stock';
            }
        }
    }
    localStorage.setItem('markanMenu', JSON.stringify(menuItems));

    // Create order
    const order = createOrder(user, cart);
    
    // Save order
    saveOrder(order);
    
    // Clear cart
    localStorage.removeItem(cartKey);
    
    // Show success message
    showSuccess(order.id);
    
    // Send notification
    sendOrderNotification(order);
}

// Create order object
function createOrder(user, cart) {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const orderType = document.getElementById('orderType').value;
    const instructions = document.getElementById('instructions').value;
    const address = orderType === 'delivery' ? document.getElementById('address').value : '';

    const items = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category
    }));

    const subtotal = window.checkoutSubtotal || 0;
    const tax = window.checkoutTax || 0;
    const deliveryFee = window.checkoutDeliveryFee || 0;
    const total = window.checkoutTotal || 0;

    return {
        id: generateOrderId(),
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        customerEmail: user.email,
        items: items,
        subtotal: subtotal,
        tax: tax,
        deliveryFee: deliveryFee,
        total: total,
        status: 'pending',
        paymentMethod: paymentMethod,
        orderType: orderType,
        deliveryAddress: address,
        specialInstructions: instructions,
        orderDate: new Date().toISOString(),
        estimatedTime: calculateEstimatedTime()
    };
}

// Generate order ID
function generateOrderId() {
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

// Calculate estimated ready time (30 minutes from now)
function calculateEstimatedTime() {
    const estimated = new Date();
    estimated.setMinutes(estimated.getMinutes() + 30);
    return estimated.toISOString();
}

// Save order to localStorage
function saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    orders.push(order);
    localStorage.setItem('markanOrders', JSON.stringify(orders));
}

// Show success message
function showSuccess(orderId) {
    const checkoutContent = document.getElementById('checkoutContent');
    const successMessage = document.getElementById('successMessage');
    const orderIdSpan = document.getElementById('confirmedOrderId');

    checkoutContent.style.display = 'none';
    successMessage.style.display = 'block';
    orderIdSpan.textContent = orderId;

    // Update cart count in navigation
    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = '0';
        cartBadge.style.display = 'none';
    }
}

// Send order notification (simulated)
function sendOrderNotification(order) {
    // In a real app, this would send an email/SMS
    console.log('Order notification sent:', order);
    
    // Show notification to user
    showNotification('Order confirmed! Check your email for details.', 'success');
    
    // Create notification in system
    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    notifications.unshift({
        id: Date.now(),
        type: 'order',
        title: 'Order Confirmed',
        message: `Your order #${order.id} has been confirmed.`,
        time: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('customerNotifications', JSON.stringify(notifications));
}

// Setup event listeners
function setupEventListeners() {
    // Listen for delivery fee changes
    const orderType = document.getElementById('orderType');
    if (orderType) {
        orderType.addEventListener('change', calculateTotals);
    }
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

// Export functions for global use
window.confirmOrder = confirmOrder;
window.calculateTotals = calculateTotals;