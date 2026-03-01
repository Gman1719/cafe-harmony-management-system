// customer/js/checkout.js - Checkout Process
// Markan Cafe - Debre Birhan University
// COMPLETELY REWRITTEN WITH DEBUGGING

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let cartItems = [];
let menuItems = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 CHECKOUT PAGE LOADED');
    console.log('========================');
    
    // Step 1: Get current user
    console.log('📋 STEP 1: Getting current user...');
    currentUser = getCurrentUser();
    if (!currentUser) {
        console.error('❌ No user logged in');
        window.location.replace('../../login.html');
        return;
    }
    console.log('✅ User found:', currentUser.name, currentUser.email);
    
    // Step 2: Set user name in UI
    setUserName();
    
    // Step 3: Load cart items
    console.log('📋 STEP 2: Loading cart items...');
    loadCartItems();
    
    // Step 4: Load menu items
    console.log('📋 STEP 3: Loading menu items...');
    loadMenuItems();
    
    // Step 5: Load user profile
    loadUserProfile();
    
    // Step 6: Setup event listeners
    setupEventListeners();
    
    // Step 7: Update sidebar badges
    updateSidebarBadges();
    
    console.log('========================');
    console.log('✅ Checkout initialization complete');
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        if (!userStr) {
            console.log('❌ No markanUser in localStorage');
            return null;
        }
        return JSON.parse(userStr);
    } catch (e) {
        console.error('❌ Error parsing user:', e);
        return null;
    }
}

// ===== SET USER NAME =====
function setUserName() {
    if (!currentUser) return;
    
    const firstName = currentUser.name.split(' ')[0];
    const userNameEl = document.getElementById('userName');
    const userGreeting = document.getElementById('userGreeting');
    
    if (userNameEl) {
        userNameEl.textContent = firstName;
        console.log('✅ User name set in navbar');
    }
    if (userGreeting) {
        userGreeting.innerHTML = `Hi, ${firstName}`;
    }
}

// ===== LOAD USER PROFILE =====
function loadUserProfile() {
    if (!currentUser) return;
    
    console.log('📋 Loading user profile data...');
    
    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const addressEl = document.getElementById('address');
    const phoneNumberEl = document.getElementById('phoneNumber');
    
    if (fullNameEl) {
        fullNameEl.value = currentUser.name || '';
        console.log('✅ Full name set:', currentUser.name);
    }
    if (emailEl) {
        emailEl.value = currentUser.email || '';
        console.log('✅ Email set:', currentUser.email);
    }
    if (phoneEl) {
        phoneEl.value = currentUser.phone || '';
        console.log('✅ Phone set:', currentUser.phone);
    }
    if (addressEl) {
        addressEl.value = currentUser.address || '';
    }
    if (phoneNumberEl) {
        phoneNumberEl.value = currentUser.phone || '';
    }
}

// ===== LOAD CART ITEMS =====
function loadCartItems() {
    if (!currentUser) return;
    
    const cartKey = `cart_${currentUser.id}`;
    console.log('🔍 Looking for cart with key:', cartKey);
    
    try {
        const savedCart = localStorage.getItem(cartKey);
        console.log('📦 Raw cart data from localStorage:', savedCart);
        
        if (!savedCart) {
            console.warn('⚠️ No cart found in localStorage');
            cartItems = [];
            showEmptyCartMessage();
            return;
        }
        
        cartItems = JSON.parse(savedCart);
        console.log('✅ Cart loaded:', cartItems.length, 'items');
        
        if (cartItems.length === 0) {
            console.warn('⚠️ Cart is empty');
            showEmptyCartMessage();
            return;
        }
        
        // Log each item in cart
        cartItems.forEach((item, index) => {
            console.log(`   Item ${index + 1}:`, item.name, 'x', item.quantity, '@', item.price, 'ETB');
        });
        
        // Display items and calculate totals
        displayOrderItems();
        calculateAndDisplayTotals();
        
    } catch (e) {
        console.error('❌ Error loading cart:', e);
        cartItems = [];
        showNotification('Error loading cart', 'error');
    }
}

// ===== SHOW EMPTY CART MESSAGE =====
function showEmptyCartMessage() {
    const container = document.getElementById('orderItems');
    if (container) {
        container.innerHTML = `
            <div class="empty-cart-message" style="text-align: center; padding: 2rem;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #c49a6c; opacity: 0.5;"></i>
                <h3>Your cart is empty</h3>
                <p>Add items from the menu before checkout</p>
                <a href="menu.html" class="btn btn-primary" style="margin-top: 1rem;">Browse Menu</a>
            </div>
        `;
    }
    
    // Reset all totals to 0
    document.getElementById('subtotal').textContent = '0 ETB';
    document.getElementById('tax').textContent = '0 ETB';
    document.getElementById('deliveryFee').textContent = '0 ETB';
    document.getElementById('total').textContent = '0 ETB';
}

// ===== LOAD MENU ITEMS =====
function loadMenuItems() {
    // Check if MenuDB exists
    if (typeof MenuDB !== 'undefined' && MenuDB.getAll) {
        menuItems = MenuDB.getAll() || [];
        console.log('✅ Loaded', menuItems.length, 'menu items from MenuDB');
    } else {
        // Fallback to localStorage
        try {
            const savedMenu = localStorage.getItem('markanMenu');
            menuItems = savedMenu ? JSON.parse(savedMenu) : [];
            console.log('✅ Loaded', menuItems.length, 'menu items from localStorage');
        } catch (e) {
            console.error('❌ Error loading menu items:', e);
            menuItems = [];
        }
    }
}

// ===== DISPLAY ORDER ITEMS =====
function displayOrderItems() {
    const container = document.getElementById('orderItems');
    if (!container) {
        console.error('❌ Order items container not found');
        return;
    }
    
    if (cartItems.length === 0) {
        showEmptyCartMessage();
        return;
    }
    
    console.log('📋 Displaying', cartItems.length, 'order items');
    
    let html = '';
    cartItems.forEach(item => {
        const menuItem = menuItems.find(m => m.id == item.id) || item;
        const imageUrl = menuItem.image || '../../assets/images/placeholder-food.jpg';
        const itemTotal = item.price * item.quantity;
        
        html += `
            <div class="order-item">
                <div class="order-item-info">
                    <div class="order-item-image" style="background-image: url('${imageUrl}')"></div>
                    <div class="order-item-details">
                        <h4>${item.name}</h4>
                        <p>Qty: ${item.quantity} x ${formatETB(item.price)}</p>
                    </div>
                </div>
                <div class="order-item-price">${formatETB(itemTotal)}</div>
            </div>
        `;
    });
    
    container.innerHTML = html;
    console.log('✅ Order items displayed');
}

// ===== CALCULATE AND DISPLAY TOTALS =====
function calculateAndDisplayTotals() {
    console.log('🧮 CALCULATING TOTALS');
    console.log('Cart items count:', cartItems.length);
    
    if (cartItems.length === 0) {
        console.log('⚠️ Cart empty, setting totals to 0');
        document.getElementById('subtotal').textContent = '0 ETB';
        document.getElementById('tax').textContent = '0 ETB';
        document.getElementById('deliveryFee').textContent = '0 ETB';
        document.getElementById('total').textContent = '0 ETB';
        return;
    }
    
    // Calculate subtotal from cart items
    let subtotal = 0;
    cartItems.forEach(item => {
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;
        console.log(`   ${item.name}: ${item.quantity} x ${price} = ${itemTotal} ETB`);
    });
    
    console.log('📊 SUBTOTAL:', subtotal, 'ETB');
    
    // Calculate tax (10%)
    const tax = subtotal * 0.1;
    console.log('📊 TAX (10%):', tax, 'ETB');
    
    // Get delivery fee based on order type
    const orderTypeSelect = document.getElementById('orderType');
    const orderType = orderTypeSelect ? orderTypeSelect.value : 'pickup';
    const deliveryFee = orderType === 'delivery' ? 50 : 0;
    console.log('📊 DELIVERY FEE:', deliveryFee, 'ETB');
    
    // Calculate total
    const total = subtotal + tax + deliveryFee;
    console.log('📊 TOTAL:', total, 'ETB');
    
    // Update display
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const deliveryFeeEl = document.getElementById('deliveryFee');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) {
        subtotalEl.textContent = formatETB(subtotal);
        console.log('✅ Subtotal updated in UI');
    }
    if (taxEl) {
        taxEl.textContent = formatETB(tax);
    }
    if (deliveryFeeEl) {
        deliveryFeeEl.textContent = deliveryFee + ' ETB';
    }
    if (totalEl) {
        totalEl.textContent = formatETB(total);
        console.log('✅ Total updated in UI');
    }
    
    // Store totals for order confirmation
    window.checkoutTotals = {
        subtotal: subtotal,
        tax: tax,
        deliveryFee: deliveryFee,
        total: total
    };
}

// ===== HANDLE ORDER TYPE CHANGE =====
window.handleOrderTypeChange = function() {
    console.log('🔄 Order type changed');
    const orderTypeSelect = document.getElementById('orderType');
    const deliveryAddress = document.getElementById('deliveryAddress');
    
    if (deliveryAddress) {
        deliveryAddress.style.display = orderTypeSelect && orderTypeSelect.value === 'delivery' ? 'block' : 'none';
        console.log('Delivery address display:', deliveryAddress.style.display);
    }
    
    // Recalculate totals with new delivery fee
    calculateAndDisplayTotals();
};

// ===== HANDLE PAYMENT METHOD CHANGE =====
window.handlePaymentChange = function() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const telebirrDetails = document.getElementById('telebirrDetails');
    
    if (telebirrDetails) {
        telebirrDetails.classList.toggle('active', paymentMethod === 'telebirr');
        console.log('Payment method changed to:', paymentMethod);
    }
};

// ===== VALIDATE FORM =====
function validateForm() {
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const orderTypeSelect = document.getElementById('orderType');
    const orderType = orderTypeSelect ? orderTypeSelect.value : 'pickup';
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    
    console.log('🔍 Validating form...');
    
    // Validate required fields
    if (!fullName) {
        showNotification('Please enter your full name', 'error');
        document.getElementById('fullName')?.focus();
        return false;
    }
    
    if (!email) {
        showNotification('Please enter your email', 'error');
        document.getElementById('email')?.focus();
        return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        document.getElementById('email')?.focus();
        return false;
    }
    
    if (!phone) {
        showNotification('Please enter your phone number', 'error');
        document.getElementById('phone')?.focus();
        return false;
    }
    
    // Validate Ethiopian phone number
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        document.getElementById('phone')?.focus();
        return false;
    }
    
    // Validate delivery address if delivery selected
    if (orderType === 'delivery') {
        const address = document.getElementById('address')?.value.trim();
        if (!address) {
            showNotification('Please enter your delivery address', 'error');
            document.getElementById('address')?.focus();
            return false;
        }
    }
    
    // Validate Telebirr number if Telebirr selected
    if (paymentMethod === 'telebirr') {
        const telebirrPhone = document.getElementById('phoneNumber')?.value.trim();
        if (!telebirrPhone) {
            showNotification('Please enter your Telebirr phone number', 'error');
            document.getElementById('phoneNumber')?.focus();
            return false;
        }
        if (!phoneRegex.test(telebirrPhone)) {
            showNotification('Please enter a valid Telebirr phone number', 'error');
            document.getElementById('phoneNumber')?.focus();
            return false;
        }
    }
    
    console.log('✅ Form validation passed');
    return true;
}

// ===== CONFIRM ORDER =====
window.confirmOrder = function() {
    console.log('🔘 CONFIRM ORDER CLICKED');
    
    // Validate cart
    if (cartItems.length === 0) {
        console.error('❌ Cart is empty');
        showNotification('Your cart is empty', 'error');
        return;
    }
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Validate stock availability
    for (let item of cartItems) {
        const menuItem = menuItems.find(m => m.id == item.id);
        if (!menuItem) {
            console.error(`❌ Item not found in menu: ${item.name}`);
            showNotification(`${item.name} is no longer available`, 'error');
            return;
        }
        if (menuItem.stock < item.quantity) {
            console.error(`❌ Insufficient stock for ${item.name}: requested ${item.quantity}, available ${menuItem.stock}`);
            showNotification(`${item.name} only has ${menuItem.stock} left in stock`, 'error');
            return;
        }
    }
    
    // Get form values
    const fullName = document.getElementById('fullName')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const phone = document.getElementById('phone')?.value.trim();
    const orderTypeSelect = document.getElementById('orderType');
    const orderType = orderTypeSelect ? orderTypeSelect.value : 'pickup';
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value;
    const instructions = document.getElementById('instructions')?.value.trim();
    const deliveryAddress = orderType === 'delivery' ? document.getElementById('address')?.value.trim() : '';
    const telebirrPhone = paymentMethod === 'telebirr' ? document.getElementById('phoneNumber')?.value.trim() : '';
    
    // Calculate totals
    let subtotal = 0;
    cartItems.forEach(item => {
        const menuItem = menuItems.find(m => m.id == item.id);
        const price = menuItem ? menuItem.price : item.price;
        subtotal += price * item.quantity;
    });
    
    const tax = subtotal * 0.1;
    const deliveryFee = orderType === 'delivery' ? 50 : 0;
    const total = subtotal + tax + deliveryFee;
    
    // Prepare order data
    const orderData = {
        id: 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase(),
        customerId: currentUser.id,
        customerName: fullName,
        customerPhone: phone,
        customerEmail: email,
        items: cartItems.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            category: item.category
        })),
        subtotal: subtotal,
        tax: tax,
        deliveryFee: deliveryFee,
        total: total,
        paymentMethod: paymentMethod,
        orderType: orderType,
        deliveryAddress: deliveryAddress,
        telebirrPhone: telebirrPhone,
        specialInstructions: instructions || '',
        status: 'pending',
        orderDate: new Date().toISOString()
    };
    
    console.log('📦 Order data prepared:', orderData);
    
    // Show loading state
    const confirmBtn = document.getElementById('confirmOrderBtn');
    const originalText = confirmBtn.innerHTML;
    confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    confirmBtn.disabled = true;
    
    try {
        // Save order to localStorage
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        orders.push(orderData);
        localStorage.setItem('markanOrders', JSON.stringify(orders));
        console.log('✅ Order saved to localStorage');
        
        // Clear cart
        const cartKey = `cart_${currentUser.id}`;
        localStorage.removeItem(cartKey);
        console.log('✅ Cart cleared');
        
        // Show success message
        document.getElementById('checkoutContent').style.display = 'none';
        document.getElementById('successMessage').style.display = 'block';
        document.getElementById('confirmedOrderId').textContent = orderData.id;
        
        showNotification('Order confirmed successfully!', 'success');
        console.log('🎉 Order completed successfully');
        
    } catch (error) {
        console.error('❌ Order error:', error);
        showNotification('Error placing order. Please try again.', 'error');
        
        // Reset button
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
};

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    console.log('📋 Setting up event listeners...');
    
    // Order type change
    const orderTypeSelect = document.getElementById('orderType');
    if (orderTypeSelect) {
        orderTypeSelect.addEventListener('change', handleOrderTypeChange);
        console.log('✅ Order type change listener attached');
    }
    
    // Payment method change
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', handlePaymentChange);
    });
    console.log('✅ Payment method listeners attached');
}

// ===== UPDATE SIDEBAR BADGES =====
function updateSidebarBadges() {
    if (!currentUser) return;
    
    // Update cart badge
    const cartKey = `cart_${currentUser.id}`;
    try {
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const cartBadges = document.querySelectorAll('#cartCount, #sidebarCartBadge');
        cartBadges.forEach(badge => {
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
            }
        });
    } catch (e) {
        console.error('Error updating cart count:', e);
    }
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return Math.round(amount).toLocaleString() + ' ETB';
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    console.log(`🔔 Notification [${type}]: ${message}`);
    
    const container = document.getElementById('notificationContainer');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'notificationContainer';
        newContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        document.body.appendChild(newContainer);
    }
    
    const notifContainer = document.getElementById('notificationContainer');
    if (!notifContainer) return;
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        background: white;
        border-radius: 8px;
        padding: 12px 20px;
        margin-bottom: 10px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 300px;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#2e7d32' : type === 'error' ? '#d32f2f' : type === 'warning' ? '#ed6c02' : '#0288d1'};
    `;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}" style="font-size: 1.5rem; color: ${type === 'success' ? '#2e7d32' : type === 'error' ? '#d32f2f' : type === 'warning' ? '#ed6c02' : '#0288d1'};"></i>
        <span style="flex: 1; color: #333;">${message}</span>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notifContainer.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.handleOrderTypeChange = handleOrderTypeChange;
window.handlePaymentChange = handlePaymentChange;
window.confirmOrder = confirmOrder;
window.showNotification = showNotification;
window.formatETB = formatETB;