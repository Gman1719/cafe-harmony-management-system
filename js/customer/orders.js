// js/customer/orders.js - Order History Logic
// Markan Cafe - Debre Birhan University

let allOrders = [];
let currentOrderId = null;

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    loadOrders();
    setupEventListeners();
    
    // Check for order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
        showOrderDetails(orderId);
    }
});

// Load orders
function loadOrders() {
    const container = document.getElementById('ordersGrid');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Get orders from localStorage
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    allOrders = orders.filter(o => o.customerId === user.id)
                      .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    
    displayOrders(allOrders);
}

// Display orders
function displayOrders(orders) {
    const container = document.getElementById('ordersGrid');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="no-orders">
                <i class="fas fa-clipboard-list"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet</p>
                <a href="menu.html" class="btn-large">Start Ordering</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card" onclick="showOrderDetails('${order.id}')">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-date">
                <i class="fas fa-calendar"></i> ${new Date(order.orderDate).toLocaleDateString()}
            </div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: $${order.total.toFixed(2)}</div>
            <div class="order-actions" onclick="event.stopPropagation()">
                <button class="btn-view" onclick="viewOrderDetails('${order.id}')">
                    <i class="fas fa-eye"></i> View
                </button>
                ${order.status === 'completed' ? `
                    <button class="btn-reorder" onclick="reorder('${order.id}')">
                        <i class="fas fa-redo"></i> Reorder
                    </button>
                ` : ''}
                ${order.status === 'pending' ? `
                    <button class="btn-cancel" onclick="cancelOrder('${order.id}')">
                        <i class="fas fa-times"></i> Cancel
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Show order details
window.showOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderId = orderId;
    
    const modal = document.getElementById('orderModal');
    const details = document.getElementById('orderDetails');
    
    if (!modal || !details) return;
    
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');
    
    details.innerHTML = `
        <div class="detail-section">
            <h4>Order Information</h4>
            <div class="detail-row">
                <span>Order ID:</span>
                <span><strong>${order.id}</strong></span>
            </div>
            <div class="detail-row">
                <span>Date:</span>
                <span>${new Date(order.orderDate).toLocaleString()}</span>
            </div>
            <div class="detail-row">
                <span>Status:</span>
                <span><span class="order-status ${order.status}">${order.status}</span></span>
            </div>
            <div class="detail-row">
                <span>Payment Method:</span>
                <span>${order.paymentMethod || 'N/A'}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Items</h4>
            <table class="detail-table">
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
                        <td colspan="3" style="text-align: right;"><strong>Subtotal:</strong></td>
                        <td>$${order.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Tax (10%):</strong></td>
                        <td>$${order.tax.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                        <td><strong>$${order.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        ${order.specialInstructions ? `
            <div class="detail-section">
                <h4>Special Instructions</h4>
                <p>${order.specialInstructions}</p>
            </div>
        ` : ''}
    `;
    
    modal.classList.add('active');
};

// Close order modal
window.closeOrderModal = function() {
    const modal = document.getElementById('orderModal');
    if (modal) {
        modal.classList.remove('active');
    }
};

// View order details (alias for showOrderDetails)
window.viewOrderDetails = function(orderId) {
    showOrderDetails(orderId);
};

// Reorder
window.reorder = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Clear current cart
    AppState.cart = [];
    
    // Add items from order
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
    showNotification('Items added to cart', 'success');
    
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
};

// Cancel order
window.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    const orderIndex = allOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        allOrders[orderIndex].status = 'cancelled';
        
        // Update in localStorage
        const allStoredOrders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        const storedIndex = allStoredOrders.findIndex(o => o.id === orderId);
        if (storedIndex !== -1) {
            allStoredOrders[storedIndex].status = 'cancelled';
            localStorage.setItem('markanOrders', JSON.stringify(allStoredOrders));
        }
        
        displayOrders(allOrders);
        showNotification('Order cancelled', 'success');
    }
};

// Filter orders by status
window.filterOrders = function(status) {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const userOrders = orders.filter(o => o.customerId === user.id);
    
    let filtered = userOrders;
    if (status !== 'all') {
        filtered = userOrders.filter(o => o.status === status);
    }
    
    allOrders = filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    displayOrders(allOrders);
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === status) {
            btn.classList.add('active');
        }
    });
};

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterOrders(this.dataset.status);
        });
    });
    
    // Modal close button
    const modalClose = document.querySelector('#orderModal .modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeOrderModal);
    }
    
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('orderModal');
        if (e.target === modal) {
            closeOrderModal();
        }
    });
}