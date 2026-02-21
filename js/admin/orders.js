// js/admin/orders.js - Admin Order Management
// Markan Cafe - Debre Birhan University

let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
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
    const container = document.getElementById('ordersTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<tr><td colspan="7"><div class="spinner"></div></td></tr>';
        
        allOrders = await API.orders.getAll();
        filteredOrders = [...allOrders];
        
        applyFilters();
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = '<tr><td colspan="7">Failed to load orders</td></tr>';
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchOrder')?.value.toLowerCase() || '';
    
    // Start with all orders
    let filtered = [...allOrders];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        filtered = filtered.filter(order => {
            const orderDate = new Date(order.orderDate);
            
            switch(dateFilter) {
                case 'today':
                    return orderDate.toDateString() === today.toDateString();
                case 'week':
                    return orderDate >= weekAgo;
                case 'month':
                    return orderDate >= monthAgo;
                default:
                    return true;
            }
        });
    }
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(order => 
            order.id.toLowerCase().includes(searchTerm) ||
            order.customerName.toLowerCase().includes(searchTerm) ||
            order.customerPhone.includes(searchTerm)
        );
    }
    
    filteredOrders = filtered;
    
    // Calculate pagination
    totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    
    displayOrders();
    updatePagination();
}

function displayOrders() {
    const container = document.getElementById('ordersTable');
    if (!container) return;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageOrders = filteredOrders.slice(start, end);
    
    if (pageOrders.length === 0) {
        container.innerHTML = '<tr><td colspan="7">No orders found</td></tr>';
        return;
    }
    
    container.innerHTML = pageOrders.map(order => `
        <tr>
            <td>${order.id}</td>
            <td>${order.customerName}</td>
            <td>${formatDate(order.orderDate)}</td>
            <td>${order.items.length} items</td>
            <td>${formatCurrency(order.total)}</td>
            <td>
                <select class="status-select ${order.status}" onchange="updateOrderStatus('${order.id}', this.value)">
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
                </div>
            </td>
        </tr>
    `).join('');
}

window.updateOrderStatus = async function(orderId, newStatus) {
    try {
        await API.orders.updateStatus(orderId, newStatus);
        showNotification(`Order ${orderId} status updated to ${newStatus}`, 'success');
        await loadOrders(); // Reload orders
    } catch (error) {
        console.error('Failed to update order status:', error);
        showNotification('Failed to update order status', 'error');
    }
};

window.viewOrderDetails = function(orderId) {
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
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3>Order Details - ${order.id}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="order-info-grid">
                    <div class="info-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${order.customerName}</p>
                        <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                    </div>
                    <div class="info-section">
                        <h4>Order Information</h4>
                        <p><strong>Date:</strong> ${formatDate(order.orderDate)}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${order.status}">${order.status}</span></p>
                        <p><strong>Payment:</strong> ${order.paymentMethod}</p>
                    </div>
                </div>
                
                <h4>Order Items</h4>
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
                        <h4>Special Instructions</h4>
                        <p>${order.specialInstructions}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Print
                </button>
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

function updatePagination() {
    const container = document.getElementById('pagination');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // Previous button
    html += `<button class="page-btn" onclick="changePage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>
        <i class="fas fa-chevron-left"></i>
    </button>`;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
            html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 3 || i === currentPage + 3) {
            html += `<span class="page-dots">...</span>`;
        }
    }
    
    // Next button
    html += `<button class="page-btn" onclick="changePage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>
        <i class="fas fa-chevron-right"></i>
    </button>`;
    
    html += '</div>';
    
    container.innerHTML = html;
}

window.changePage = function(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayOrders();
    updatePagination();
};

window.refreshOrders = async function() {
    await loadOrders();
    showNotification('Orders refreshed', 'success');
};

function setupEventListeners() {
    // Filter changes
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchOrder');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', () => {
            currentPage = 1;
            applyFilters();
        });
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentPage = 1;
            applyFilters();
        }, 300));
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshOrders');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshOrders);
    }
}