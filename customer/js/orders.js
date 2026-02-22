// customer/js/orders.js
// Markan Cafe - Customer Orders Management

// Global variables
let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';
let currentOrderId = null;

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
    
    // Check for order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
        setTimeout(() => showOrderDetails(orderId), 500);
    }
});

// Load orders from localStorage
function loadOrders() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    
    // Filter orders for current user
    allOrders = orders
        .filter(order => order.customerId == user.id)
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    filteredOrders = [...allOrders];
    displayOrders(filteredOrders);
}

// Display orders in grid
function displayOrders(orders) {
    const grid = document.getElementById('ordersGrid');
    if (!grid) return;

    if (orders.length === 0) {
        grid.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-shopping-bag"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet</p>
                <a href="menu.html" class="btn-large">
                    <i class="fas fa-utensils"></i> Browse Menu
                </a>
            </div>
        `;
        return;
    }

    grid.innerHTML = orders.map(order => `
        <div class="order-card" onclick="showOrderDetails('${order.id}')">
            <div class="order-header">
                <span class="order-id">Order #${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-date">
                <i class="fas fa-calendar"></i> ${formatDate(order.orderDate)}
                <span class="order-time"><i class="fas fa-clock"></i> ${formatTime(order.orderDate)}</span>
            </div>
            <div class="order-items">
                ${order.items.slice(0, 3).map(item => `
                    <div class="order-item">
                        <span class="order-item-name">${item.name}</span>
                        <span class="order-item-quantity">x${item.quantity}</span>
                        <span class="order-item-price">${formatETB(item.price * item.quantity)}</span>
                    </div>
                `).join('')}
                ${order.items.length > 3 ? 
                    `<div class="order-item">
                        <span class="order-item-name">...and ${order.items.length - 3} more</span>
                    </div>` : ''
                }
            </div>
            <div class="order-footer">
                <div class="order-total">${formatETB(order.total)}</div>
                <div class="order-actions" onclick="event.stopPropagation()">
                    <button class="btn-reorder" onclick="reorder('${order.id}')">
                        <i class="fas fa-redo-alt"></i> Reorder
                    </button>
                    <button class="btn-details" onclick="showOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i> Details
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Show order details in modal
window.showOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderModalContent');
    
    if (!modal || !content) return;

    // Calculate progress steps
    const steps = ['pending', 'preparing', 'ready', 'completed'];
    const currentStepIndex = steps.indexOf(order.status);
    
    const getStepClass = (step, index) => {
        if (index < currentStepIndex) return 'completed';
        if (index === currentStepIndex) return 'active';
        return '';
    };

    content.innerHTML = `
        <div class="order-details-header">
            <span class="order-details-id">Order #${order.id}</span>
            <span class="order-details-status ${order.status}">${order.status}</span>
        </div>

        <div class="order-info-grid">
            <div class="info-item">
                <span class="info-label">Order Date</span>
                <span class="info-value">${formatDateTime(order.orderDate)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${order.paymentMethod || 'Cash'}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Order Type</span>
                <span class="info-value">${order.orderType || 'Pickup'}</span>
            </div>
            ${order.estimatedTime ? `
                <div class="info-item">
                    <span class="info-label">Estimated Ready</span>
                    <span class="info-value">${formatTime(order.estimatedTime)}</span>
                </div>
            ` : ''}
        </div>

        <div class="tracking-progress">
            <h4>Order Status</h4>
            <div class="progress-steps">
                <div class="progress-step">
                    <div class="step-dot ${getStepClass('pending', 0)}"></div>
                    <div class="step-label ${getStepClass('pending', 0)}">Pending</div>
                </div>
                <div class="progress-step">
                    <div class="step-dot ${getStepClass('preparing', 1)}"></div>
                    <div class="step-label ${getStepClass('preparing', 1)}">Preparing</div>
                </div>
                <div class="progress-step">
                    <div class="step-dot ${getStepClass('ready', 2)}"></div>
                    <div class="step-label ${getStepClass('ready', 2)}">Ready</div>
                </div>
                <div class="progress-step">
                    <div class="step-dot ${getStepClass('completed', 3)}"></div>
                    <div class="step-label ${getStepClass('completed', 3)}">Completed</div>
                </div>
            </div>
        </div>

        <div class="order-timeline">
            <h4>Order Timeline</h4>
            <div class="timeline-item">
                <div class="timeline-icon completed">
                    <i class="fas fa-check"></i>
                </div>
                <div class="timeline-content">
                    <div class="timeline-title">Order Placed</div>
                    <div class="timeline-time">${formatDateTime(order.orderDate)}</div>
                </div>
            </div>
            ${order.status !== 'pending' ? `
                <div class="timeline-item">
                    <div class="timeline-icon ${order.status !== 'pending' ? 'completed' : ''}">
                        <i class="fas fa-utensils"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">Preparing</div>
                        <div class="timeline-time">${order.status !== 'pending' ? formatDateTime(order.orderDate) : 'In progress'}</div>
                    </div>
                </div>
            ` : ''}
            ${order.status === 'ready' || order.status === 'completed' ? `
                <div class="timeline-item">
                    <div class="timeline-icon completed">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">Ready for Pickup</div>
                        <div class="timeline-time">${formatDateTime(order.orderDate)}</div>
                    </div>
                </div>
            ` : ''}
            ${order.status === 'completed' ? `
                <div class="timeline-item">
                    <div class="timeline-icon completed">
                        <i class="fas fa-flag-checkered"></i>
                    </div>
                    <div class="timeline-content">
                        <div class="timeline-title">Completed</div>
                        <div class="timeline-time">${order.completedDate ? formatDateTime(order.completedDate) : formatDateTime(order.orderDate)}</div>
                    </div>
                </div>
            ` : ''}
        </div>

        <h4>Order Items</h4>
        <div class="order-items" style="max-height: 200px;">
            ${order.items.map(item => `
                <div class="order-item">
                    <span class="order-item-name">${item.name}</span>
                    <span class="order-item-quantity">x${item.quantity}</span>
                    <span class="order-item-price">${formatETB(item.price * item.quantity)}</span>
                </div>
            `).join('')}
        </div>

        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 2px solid var(--border-color);">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>${formatETB(order.subtotal)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (10%):</span>
                <span>${formatETB(order.tax)}</span>
            </div>
            ${order.deliveryFee ? `
                <div class="summary-row">
                    <span>Delivery Fee:</span>
                    <span>${formatETB(order.deliveryFee)}</span>
                </div>
            ` : ''}
            <div class="summary-row grand-total">
                <span>Total:</span>
                <span>${formatETB(order.total)}</span>
            </div>
        </div>

        ${order.specialInstructions ? `
            <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-warm); border-radius: var(--border-radius-md);">
                <strong>Special Instructions:</strong>
                <p style="margin-top: 0.5rem;">${order.specialInstructions}</p>
            </div>
        ` : ''}

        <div style="display: flex; gap: 1rem; margin-top: 2rem;">
            <button class="btn-reorder" onclick="reorder('${order.id}'); closeOrderModal();">
                <i class="fas fa-redo-alt"></i> Reorder
            </button>
            <button class="btn btn-outline" onclick="closeOrderModal()">
                Close
            </button>
        </div>
    `;

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Filter orders by status
window.filterOrders = function(status) {
    currentFilter = status;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === status) {
            btn.classList.add('active');
        }
    });
    
    // Filter orders
    if (status === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === status);
    }
    
    displayOrders(filteredOrders);
}

// Reorder function
window.reorder = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    const user = Auth.getCurrentUser();
    if (!user) return;

    // Get current menu items to check availability
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    // Get user's current cart
    const cartKey = `cart_${user.id}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    // Add items from order to cart (checking availability)
    let itemsAdded = 0;
    let itemsUnavailable = [];

    order.items.forEach(orderItem => {
        const menuItem = menuItems.find(m => m.id == orderItem.id);
        
        if (menuItem && menuItem.status === 'available' && menuItem.stock > 0) {
            // Check if item already in cart
            const existingItem = cart.find(i => i.id == orderItem.id);
            
            const quantity = Math.min(orderItem.quantity, menuItem.stock);
            
            if (existingItem) {
                existingItem.quantity += quantity;
            } else {
                cart.push({
                    id: menuItem.id,
                    name: menuItem.name,
                    price: menuItem.price,
                    quantity: quantity,
                    category: menuItem.category,
                    image: menuItem.image
                });
            }
            itemsAdded += quantity;
        } else {
            itemsUnavailable.push(orderItem.name);
        }
    });

    // Save cart
    localStorage.setItem(cartKey, JSON.stringify(cart));

    // Show result message
    if (itemsUnavailable.length > 0) {
        showNotification(`${itemsAdded} items added to cart. ${itemsUnavailable.join(', ')} unavailable.`, 'warning');
    } else {
        showNotification(`${itemsAdded} items added to cart`, 'success');
    }

    // Update cart count
    updateCartCount();
}

// Update cart count in navigation
function updateCartCount() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    const cartBadge = document.getElementById('cartCount');
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterOrders(this.dataset.filter);
        });
    });

    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanOrders') {
            loadOrders();
        }
    });

    // Refresh orders every 30 seconds
    setInterval(() => {
        loadOrders();
    }, 30000);
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

// Helper: Format time
function formatTime(dateString) {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString('en-US', options);
}

// Helper: Format date and time
function formatDateTime(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
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
window.showOrderDetails = showOrderDetails;
window.filterOrders = filterOrders;
window.reorder = reorder;