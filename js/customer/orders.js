// js/customer/orders.js - Order History Logic
// Markan Cafe - Debre Birhan University

let allOrders = [];
let filteredOrders = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Load orders
    await loadOrders();
    
    // Setup event listeners
    setupEventListeners();
    
    // Check for order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
        showOrderDetails(orderId);
    }
});

async function loadOrders() {
    const container = document.getElementById('ordersGrid');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        container.innerHTML = '<div class="spinner"></div>';
        
        allOrders = await API.orders.getByCustomerId(user.id);
        filteredOrders = [...allOrders];
        
        displayOrders(filteredOrders);
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = '<p class="error">Failed to load orders</p>';
    }
}

function displayOrders(orders) {
    const container = document.getElementById('ordersGrid');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = `
            <div class="no-results">
                <i class="fas fa-clipboard-list"></i>
                <h3>No orders found</h3>
                <p>You haven't placed any orders yet</p>
                <a href="menu.html" class="btn btn-primary">Start Ordering</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-date">${formatDate(order.orderDate)}</div>
            <div class="order-items">
                ${order.items.map(item => `
                    <div class="order-item">
                        <span>${item.quantity}x ${item.name}</span>
                        <span>$${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-total">Total: $${order.total.toFixed(2)}</div>
            <div class="order-actions">
                <button class="btn btn-outline btn-small" onclick="showOrderDetails('${order.id}')">
                    View Details
                </button>
                ${order.status === 'completed' ? `
                    <button class="btn btn-primary btn-small" onclick="reorder('${order.id}')">
                        Reorder
                    </button>
                ` : ''}
                ${order.status === 'pending' ? `
                    <button class="btn btn-danger btn-small" onclick="cancelOrder('${order.id}')">
                        Cancel
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

window.filterOrders = function(filter) {
    currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.status === filter) {
            btn.classList.add('active');
        }
    });
    
    if (filter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === filter);
    }
    
    displayOrders(filteredOrders);
};

window.showOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modalId = 'orderDetailsModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Order Details - ${order.id}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="order-details">
                    <div class="detail-row">
                        <strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span>
                    </div>
                    <div class="detail-row">
                        <strong>Date:</strong> ${formatDate(order.orderDate)}
                    </div>
                    <div class="detail-row">
                        <strong>Payment Method:</strong> ${order.paymentMethod}
                    </div>
                    ${order.completedDate ? `
                        <div class="detail-row">
                            <strong>Completed:</strong> ${formatDate(order.completedDate)}
                        </div>
                    ` : ''}
                    
                    <h4>Items</h4>
                    <table class="details-table">
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
                                <td colspan="3"><strong>Subtotal</strong></td>
                                <td>$${order.subtotal.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3"><strong>Tax</strong></td>
                                <td>$${order.tax.toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3"><strong>Total</strong></td>
                                <td><strong>$${order.total.toFixed(2)}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                    
                    ${order.specialInstructions ? `
                        <div class="special-instructions">
                            <strong>Special Instructions:</strong>
                            <p>${order.specialInstructions}</p>
                        </div>
                    ` : ''}
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-outline" onclick="window.print()">
                    <i class="fas fa-print"></i> Print
                </button>
                ${order.status === 'completed' ? `
                    <button class="btn btn-primary" onclick="reorder('${order.id}')">
                        <i class="fas fa-redo"></i> Reorder
                    </button>
                ` : ''}
                <button class="btn btn-outline" onclick="this.closest('.modal').classList.remove('active')">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Add close button handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
};

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
                quantity: 1
            });
        }
    });
    
    saveCart();
    showNotification('Items added to cart', 'success');
    
    setTimeout(() => {
        window.location.href = 'cart.html';
    }, 1500);
};

window.cancelOrder = async function(orderId) {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
        await API.orders.updateStatus(orderId, 'cancelled');
        showNotification('Order cancelled', 'success');
        await loadOrders(); // Reload orders
    } catch (error) {
        console.error('Failed to cancel order:', error);
        showNotification('Failed to cancel order', 'error');
    }
};

function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterOrders(btn.dataset.status);
        });
    });
}