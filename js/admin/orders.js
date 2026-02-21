// js/admin/orders.js - Admin Order Management
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let allOrders = [];
let filteredOrders = [];
let currentOrderId = null;

// Initialize orders page
document.addEventListener('DOMContentLoaded', function() {
    updateAdminName();
    loadOrders();
    setupEventListeners();
    
    // Check for order ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('id');
    if (orderId) {
        viewOrderDetails(orderId);
    }
});

// Update admin name in header
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        const adminNameElements = document.querySelectorAll('#adminName');
        adminNameElements.forEach(el => {
            if (el) el.textContent = user.name;
        });
    }
}

// Load orders from localStorage
function loadOrders() {
    const stored = localStorage.getItem('markanOrders');
    if (stored) {
        allOrders = JSON.parse(stored);
    } else {
        // Default orders if none exist
        allOrders = [
            { 
                id: 'ORD-1001', 
                customerName: 'John Customer', 
                customerPhone: '+251922345678',
                orderDate: '2025-02-20T10:30:00Z',
                items: [
                    { name: 'Ethiopian Coffee', quantity: 2, price: 4.50 },
                    { name: 'Sambusa', quantity: 1, price: 3.50 }
                ],
                subtotal: 12.50,
                tax: 1.25,
                total: 13.75,
                status: 'completed',
                paymentMethod: 'cash'
            },
            { 
                id: 'ORD-1002', 
                customerName: 'Sarah Wilson', 
                customerPhone: '+251933456789',
                orderDate: '2025-02-20T09:15:00Z',
                items: [
                    { name: 'Doro Wat', quantity: 1, price: 12.99 },
                    { name: 'Injera', quantity: 2, price: 2.50 }
                ],
                subtotal: 17.99,
                tax: 1.80,
                total: 19.79,
                status: 'preparing',
                paymentMethod: 'card'
            },
            { 
                id: 'ORD-1003', 
                customerName: 'Mike Johnson', 
                customerPhone: '+251944567890',
                orderDate: '2025-02-19T14:20:00Z',
                items: [
                    { name: 'Kitfo', quantity: 1, price: 14.50 }
                ],
                subtotal: 14.50,
                tax: 1.45,
                total: 15.95,
                status: 'pending',
                paymentMethod: 'online'
            }
        ];
        localStorage.setItem('markanOrders', JSON.stringify(allOrders));
    }
    
    filteredOrders = [...allOrders];
    displayOrders(filteredOrders);
}

// Display orders in table
function displayOrders(orders) {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No orders found</td></tr>';
        return;
    }
    
    tbody.innerHTML = orders.map(order => `
        <tr>
            <td>${order.id || 'N/A'}</td>
            <td>${order.customerName || 'Guest'}</td>
            <td>${new Date(order.orderDate).toLocaleDateString()}</td>
            <td>${order.items ? order.items.length : 0} items</td>
            <td>$${(order.total || 0).toFixed(2)}</td>
            <td>
                <select class="status-select ${order.status || 'pending'}" 
                        onchange="updateOrderStatus('${order.id}', this.value)"
                        style="padding: 5px; border-radius: 20px; border: 1px solid #ddd;">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="preparing" ${order.status === 'preparing' ? 'selected' : ''}>Preparing</option>
                    <option value="completed" ${order.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${order.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewOrderDetails('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editOrder('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update order status
window.updateOrderStatus = function(orderId, newStatus) {
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        if (newStatus === 'completed') {
            order.completedDate = new Date().toISOString();
        }
        localStorage.setItem('markanOrders', JSON.stringify(allOrders));
        showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        applyFilters();
    }
};

// View order details
window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    currentOrderId = orderId;
    
    const itemsHtml = order.items ? order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('') : '<tr><td colspan="4">No items</td></tr>';
    
    const modalContent = document.getElementById('orderDetails');
    if (modalContent) {
        modalContent.innerHTML = `
            <div style="margin-bottom: 20px;">
                <h4>Order Information</h4>
                <p><strong>Order ID:</strong> ${order.id}</p>
                <p><strong>Customer:</strong> ${order.customerName || 'Guest'}</p>
                <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                <p><strong>Date:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
                <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p>
                <p><strong>Status:</strong> <span class="status-badge ${order.status || 'pending'}">${order.status || 'pending'}</span></p>
            </div>
            
            <h4>Order Items</h4>
            <table class="admin-table">
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
                        <td>$${(order.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Tax (10%):</strong></td>
                        <td>$${(order.tax || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="text-align: right;"><strong>Total:</strong></td>
                        <td><strong>$${(order.total || 0).toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        `;
    }
    
    document.getElementById('orderModal').classList.add('active');
};

// Edit order
window.editOrder = function(orderId) {
    viewOrderDetails(orderId);
    // You can add edit functionality here
};

// Close order modal
window.closeOrderModal = function() {
    document.getElementById('orderModal').classList.remove('active');
    currentOrderId = null;
};

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchOrder')?.value.toLowerCase() || '';

    filteredOrders = allOrders.filter(order => {
        // Status filter
        if (statusFilter !== 'all' && order.status !== statusFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            const orderDate = new Date(order.orderDate);
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            
            switch(dateFilter) {
                case 'today':
                    if (orderDate.toDateString() !== today.toDateString()) return false;
                    break;
                case 'week':
                    if (orderDate < weekAgo) return false;
                    break;
                case 'month':
                    if (orderDate < monthAgo) return false;
                    break;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const matchesId = order.id?.toLowerCase().includes(searchTerm);
            const matchesCustomer = order.customerName?.toLowerCase().includes(searchTerm);
            if (!matchesId && !matchesCustomer) return false;
        }
        
        return true;
    });
    
    displayOrders(filteredOrders);
}

// Refresh orders
window.refreshOrders = function() {
    loadOrders();
    showNotification('Orders refreshed', 'success');
};

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchOrder');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshOrders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshOrders);
    }
    
    // Modal close button
    const modalClose = document.querySelector('#orderModal .modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeOrderModal);
    }
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions
window.applyFilters = applyFilters;