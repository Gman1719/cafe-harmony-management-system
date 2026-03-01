// customer/js/orders.js - Customer Order Management
// Markan Cafe - Debre Birhan University
// Complete order history and management for customers

// ===== GLOBAL VARIABLES =====
let allOrders = [];
let filteredOrders = [];
let currentUser = null;
let currentFilter = 'all';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Orders page initializing...');
    
    // Get current user
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.replace('../../login.html');
        return;
    }
    
    // Set user name
    setUserName();
    
    // Load orders
    loadOrders();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update sidebar badges
    updateSidebarBadges();
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error getting user:', e);
        return null;
    }
}

// ===== SET USER NAME =====
function setUserName() {
    if (!currentUser) return;
    
    const firstName = currentUser.name.split(' ')[0];
    const userNameEl = document.getElementById('userName');
    const userGreeting = document.getElementById('userGreeting');
    
    if (userNameEl) userNameEl.textContent = firstName;
    if (userGreeting) userGreeting.innerHTML = `Hi, ${firstName}`;
}

// ===== LOAD ORDERS =====
function loadOrders() {
    // Get orders from OrdersDB or localStorage
    if (typeof OrdersDB !== 'undefined' && OrdersDB.getByCustomerId) {
        allOrders = OrdersDB.getByCustomerId(currentUser.id) || [];
        console.log('✅ Loaded', allOrders.length, 'orders from OrdersDB');
    } else {
        // Fallback to localStorage
        try {
            const allStoredOrders = JSON.parse(localStorage.getItem('markanOrders')) || [];
            allOrders = allStoredOrders.filter(order => order.customerId === currentUser.id);
            console.log('✅ Loaded', allOrders.length, 'orders from localStorage');
        } catch (e) {
            console.error('Error loading orders:', e);
            allOrders = [];
        }
    }
    
    // Sort orders by date (newest first)
    allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    // Display orders
    filterOrders('all');
    
    // Update pending badge
    updatePendingBadge();
}

// ===== FILTER ORDERS =====
function filterOrders(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });
    
    // Filter orders
    if (filter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === filter);
    }
    
    displayOrders();
}

// ===== DISPLAY ORDERS =====
function displayOrders() {
    const container = document.getElementById('ordersGrid');
    if (!container) return;
    
    if (filteredOrders.length === 0) {
        container.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-box-open"></i>
                <h3>No Orders Found</h3>
                <p>${allOrders.length === 0 ? 'You haven\'t placed any orders yet' : 'No orders match the selected filter'}</p>
                <a href="../menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredOrders.map(order => {
        const orderDate = new Date(order.orderDate).toLocaleDateString();
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
        
        return `
            <div class="order-card" onclick="showOrderDetails('${order.id}')">
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-date">${orderDate}</div>
                <div class="order-items">
                    ${order.items.slice(0, 3).map(item => `
                        <div class="order-item">
                            <span class="order-item-name">${item.name}</span>
                            <span class="order-item-quantity">x${item.quantity}</span>
                            <span class="order-item-price">${formatETB(item.price * item.quantity)}</span>
                        </div>
                    `).join('')}
                    ${order.items.length > 3 ? `<div class="order-item">...and ${order.items.length - 3} more items</div>` : ''}
                </div>
                <div class="order-footer">
                    <span class="order-total">Total: ${formatETB(order.total)}</span>
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
        `;
    }).join('');
}

// ===== SHOW ORDER DETAILS =====
window.showOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const content = document.getElementById('orderModalContent');
    const orderDate = new Date(order.orderDate).toLocaleString();
    
    // Generate items HTML
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>${formatETB(item.price)}</td>
            <td>${formatETB(item.price * item.quantity)}</td>
        </tr>
    `).join('');
    
    content.innerHTML = `
        <div class="order-details">
            <div class="order-details-header">
                <h4>Order #${order.id}</h4>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            
            <div class="order-info-grid">
                <div class="info-item">
                    <label>Order Date</label>
                    <p>${orderDate}</p>
                </div>
                <div class="info-item">
                    <label>Payment Method</label>
                    <p>${order.paymentMethod || 'Cash'}</p>
                </div>
                <div class="info-item">
                    <label>Order Type</label>
                    <p>${order.orderType || 'Pickup'}</p>
                </div>
                ${order.deliveryAddress ? `
                <div class="info-item">
                    <label>Delivery Address</label>
                    <p>${order.deliveryAddress}</p>
                </div>
                ` : ''}
            </div>
            
            <h4>Order Items</h4>
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Subtotal:</strong></td>
                        <td>${formatETB(order.subtotal)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" class="text-right"><strong>Tax (10%):</strong></td>
                        <td>${formatETB(order.tax)}</td>
                    </tr>
                    ${order.deliveryFee ? `
                    <tr>
                        <td colspan="3" class="text-right"><strong>Delivery Fee:</strong></td>
                        <td>${formatETB(order.deliveryFee)}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td colspan="3" class="text-right"><strong>Total:</strong></td>
                        <td class="total-price">${formatETB(order.total)}</td>
                    </tr>
                </tfoot>
            </table>
            
            ${order.specialInstructions ? `
            <div class="special-instructions">
                <h4>Special Instructions</h4>
                <p>${order.specialInstructions}</p>
            </div>
            ` : ''}
            
            <div class="order-timeline">
                <h4>Order Timeline</h4>
                <div class="timeline">
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Order Placed</strong>
                            <span>${orderDate}</span>
                        </div>
                    </div>
                    ${order.status !== 'pending' ? `
                    <div class="timeline-item">
                        <div class="timeline-dot"></div>
                        <div class="timeline-content">
                            <strong>Status Updated</strong>
                            <span>${new Date(order.updatedAt || order.orderDate).toLocaleString()}</span>
                            <span class="status-badge ${order.status}">${order.status}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// ===== CLOSE ORDER MODAL =====
window.closeOrderModal = function() {
    document.getElementById('orderModal').classList.remove('active');
    document.body.style.overflow = '';
};

// ===== REORDER =====
window.reorder = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Get current cart
    const cartKey = `cart_${currentUser.id}`;
    let cart = [];
    try {
        cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    } catch (e) {
        cart = [];
    }
    
    // Add items from order to cart
    order.items.forEach(orderItem => {
        const existingItem = cart.find(item => item.id === orderItem.id);
        if (existingItem) {
            existingItem.quantity += orderItem.quantity;
        } else {
            cart.push({
                id: orderItem.id,
                name: orderItem.name,
                price: orderItem.price,
                quantity: orderItem.quantity,
                category: orderItem.category,
                image: orderItem.image
            });
        }
    });
    
    // Save cart
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Show notification
    showNotification('Items added to cart', 'success');
    
    // Update cart badge
    updateCartCount();
    
    // Redirect to cart after short delay
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
};

// ===== UPDATE PENDING BADGE =====
function updatePendingBadge() {
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('sidebarOrdersBadge');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'inline-block' : 'none';
    }
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    if (!currentUser) return;
    
    const cartKey = `cart_${currentUser.id}`;
    try {
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
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

// ===== UPDATE SIDEBAR BADGES =====
function updateSidebarBadges() {
    if (!currentUser) return;
    
    // Update orders badge
    updatePendingBadge();
    
    // Update cart badge
    updateCartCount();
    
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
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterOrders(this.dataset.filter);
        });
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('orderModal');
        if (e.target === modal) {
            closeOrderModal();
        }
    });
    
    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanOrders') {
            // Reload orders
            loadOrders();
        }
    });
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return Math.round(amount).toLocaleString() + ' ETB';
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
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
    notification.className = `notification ${type}`;
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
    
    .order-details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid #f5e6d3;
    }
    
    .order-info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f9f5f0;
        border-radius: 8px;
    }
    
    .info-item label {
        display: block;
        font-size: 0.8rem;
        color: #8b6f50;
        margin-bottom: 0.2rem;
    }
    
    .info-item p {
        margin: 0;
        font-weight: 500;
        color: #4a2c1a;
    }
    
    .items-table {
        width: 100%;
        border-collapse: collapse;
        margin: 1rem 0;
    }
    
    .items-table th {
        text-align: left;
        padding: 0.5rem;
        background: #f5e6d3;
        color: #4a2c1a;
        font-size: 0.9rem;
    }
    
    .items-table td {
        padding: 0.5rem;
        border-bottom: 1px solid #f5e6d3;
        color: #736b66;
    }
    
    .items-table .text-right {
        text-align: right;
    }
    
    .items-table .total-price {
        font-weight: 700;
        color: #c49a6c;
        font-size: 1.1rem;
    }
    
    .special-instructions {
        margin: 1.5rem 0;
        padding: 1rem;
        background: #f9f5f0;
        border-left: 4px solid #c49a6c;
        border-radius: 4px;
    }
    
    .special-instructions p {
        margin: 0.5rem 0 0;
        color: #736b66;
        font-style: italic;
    }
    
    .order-timeline {
        margin-top: 1.5rem;
    }
    
    .timeline {
        position: relative;
        padding-left: 2rem;
    }
    
    .timeline::before {
        content: '';
        position: absolute;
        left: 7px;
        top: 0;
        bottom: 0;
        width: 2px;
        background: #c49a6c;
    }
    
    .timeline-item {
        position: relative;
        margin-bottom: 1.5rem;
    }
    
    .timeline-dot {
        position: absolute;
        left: -2rem;
        top: 0;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #c49a6c;
        border: 3px solid white;
    }
    
    .timeline-content {
        background: #f9f5f0;
        padding: 0.8rem 1rem;
        border-radius: 8px;
    }
    
    .timeline-content strong {
        display: block;
        color: #4a2c1a;
        margin-bottom: 0.3rem;
    }
    
    .timeline-content span {
        display: block;
        font-size: 0.85rem;
        color: #736b66;
    }
`;
document.head.appendChild(style);

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.filterOrders = filterOrders;
window.showOrderDetails = showOrderDetails;
window.closeOrderModal = closeOrderModal;
window.reorder = reorder;
window.showNotification = showNotification;