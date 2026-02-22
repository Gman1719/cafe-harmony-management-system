// admin/js/orders.js
// Markan Cafe Admin - Orders Management
// Full CRUD operations with localStorage - NO HARDCODED DATA

// ===== GLOBAL VARIABLES =====
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentOrderId = null;
let currentFilter = {
    status: 'all',
    payment: 'all',
    date: 'all'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load orders
    loadOrders();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update admin name
    updateAdminName();
    
    // Check for URL parameters (e.g., status=pending)
    const urlParams = new URLSearchParams(window.location.search);
    const statusParam = urlParams.get('status');
    if (statusParam) {
        filterOrders(statusParam);
        document.getElementById('statusFilter').value = statusParam;
    }
    
    const viewParam = urlParams.get('view');
    if (viewParam) {
        setTimeout(() => viewOrderDetails(viewParam), 500);
    }
});

// ===== LOAD ORDERS =====
function loadOrders() {
    try {
        // Get orders from localStorage
        const stored = localStorage.getItem('markanOrders');
        allOrders = stored ? JSON.parse(stored) : [];
        
        // Sort by date (newest first)
        allOrders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        
        // Apply filters
        applyFilters();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showNotification('Failed to load orders', 'error');
        allOrders = [];
        filteredOrders = [];
        displayOrders([]);
    }
}

// ===== SAVE ORDERS =====
function saveOrders() {
    try {
        localStorage.setItem('markanOrders', JSON.stringify(allOrders));
        
        // Dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'markanOrders',
            newValue: JSON.stringify(allOrders)
        }));
        
    } catch (error) {
        console.error('Error saving orders:', error);
        showNotification('Failed to save orders', 'error');
    }
}

// ===== APPLY FILTERS =====
function applyFilters() {
    filteredOrders = [...allOrders];
    
    // Apply status filter
    if (currentFilter.status !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
            order.status === currentFilter.status
        );
    }
    
    // Apply payment filter
    if (currentFilter.payment !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
            order.paymentMethod === currentFilter.payment
        );
    }
    
    // Apply date filter
    if (currentFilter.date !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        switch(currentFilter.date) {
            case 'today':
                filteredOrders = filteredOrders.filter(order => {
                    const orderDate = new Date(order.orderDate);
                    orderDate.setHours(0, 0, 0, 0);
                    return orderDate.getTime() === today.getTime();
                });
                break;
                
            case 'yesterday':
                filteredOrders = filteredOrders.filter(order => {
                    const orderDate = new Date(order.orderDate);
                    orderDate.setHours(0, 0, 0, 0);
                    return orderDate.getTime() === yesterday.getTime();
                });
                break;
                
            case 'week':
                filteredOrders = filteredOrders.filter(order => {
                    const orderDate = new Date(order.orderDate);
                    return orderDate >= weekAgo;
                });
                break;
                
            case 'month':
                filteredOrders = filteredOrders.filter(order => {
                    const orderDate = new Date(order.orderDate);
                    return orderDate >= monthAgo;
                });
                break;
        }
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update UI
    updateStats();
    displayOrders();
}

// ===== UPDATE STATISTICS =====
function updateStats() {
    document.getElementById('pendingOrders').textContent = 
        allOrders.filter(o => o.status === 'pending').length;
    
    document.getElementById('preparingOrders').textContent = 
        allOrders.filter(o => o.status === 'preparing').length;
    
    document.getElementById('readyOrders').textContent = 
        allOrders.filter(o => o.status === 'ready').length;
    
    document.getElementById('completedOrders').textContent = 
        allOrders.filter(o => o.status === 'completed').length;
    
    document.getElementById('cancelledOrders').textContent = 
        allOrders.filter(o => o.status === 'cancelled').length;
}

// ===== DISPLAY ORDERS =====
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageOrders = filteredOrders.slice(start, end);

    if (pageOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="no-data">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No orders found</p>
                    </div>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageOrders.map(order => `
        <tr onclick="viewOrderDetails('${order.id}')" style="cursor: pointer;">
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName || 'Guest'}</td>
            <td>${order.items?.length || 0} items</td>
            <td>${formatETB(order.total || 0)}</td>
            <td>
                <span class="payment-method">
                    <i class="fas fa-${getPaymentIcon(order.paymentMethod)}"></i>
                    ${formatPaymentMethod(order.paymentMethod)}
                </span>
            </td>
            <td>
                <span class="status-badge ${order.status || 'pending'}">
                    ${formatStatus(order.status || 'pending')}
                </span>
            </td>
            <td>${timeAgo(order.orderDate)}</td>
            <td onclick="event.stopPropagation()">
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewOrderDetails('${order.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="openStatusModal('${order.id}')" title="Update Status">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();
}

// ===== GET PAYMENT ICON =====
function getPaymentIcon(method) {
    const icons = {
        'cash': 'money-bill-wave',
        'card': 'credit-card',
        'online': 'mobile-alt'
    };
    return icons[method] || 'money-bill-wave';
}

// ===== FORMAT PAYMENT METHOD =====
function formatPaymentMethod(method) {
    const methods = {
        'cash': 'Cash',
        'card': 'Card',
        'online': 'Online'
    };
    return methods[method] || method || 'Cash';
}

// ===== FORMAT STATUS =====
function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'preparing': 'Preparing',
        'ready': 'Ready',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

// ===== VIEW ORDER DETAILS =====
window.viewOrderDetails = function(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;

    currentOrderId = orderId;
    
    // Set customer information
    document.getElementById('orderCustomerName').textContent = order.customerName || 'Guest';
    document.getElementById('orderCustomerPhone').textContent = order.customerPhone || 'N/A';
    document.getElementById('orderCustomerEmail').textContent = order.customerEmail || 'N/A';
    
    // Set order information
    document.getElementById('orderDate').textContent = formatDateTime(order.orderDate);
    document.getElementById('orderStatus').textContent = formatStatus(order.status);
    document.getElementById('orderStatus').className = `status-badge ${order.status || 'pending'}`;
    document.getElementById('orderPayment').textContent = formatPaymentMethod(order.paymentMethod);
    
    // Set special instructions
    document.getElementById('orderInstructions').textContent = 
        order.specialInstructions || 'No special instructions';
    
    // Display items
    const itemsList = document.getElementById('orderItemsList');
    if (order.items && order.items.length > 0) {
        itemsList.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatETB(item.price)}</td>
                <td>${formatETB(item.price * item.quantity)}</td>
            </tr>
        `).join('');
    } else {
        itemsList.innerHTML = '<tr><td colspan="4">No items</td></tr>';
    }

    // Calculate totals
    const subtotal = order.subtotal || order.total * 0.9 || 0;
    const tax = order.tax || order.total * 0.1 || 0;
    const total = order.total || subtotal + tax;

    document.getElementById('orderSubtotal').textContent = formatETB(subtotal);
    document.getElementById('orderTax').textContent = formatETB(tax);
    document.getElementById('orderTotal').textContent = formatETB(total);
    
    // Add status action buttons
    addStatusActionButtons(order.status);

    document.getElementById('orderModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== ADD STATUS ACTION BUTTONS =====
function addStatusActionButtons(currentStatus) {
    const container = document.getElementById('statusActions');
    if (!container) return;
    
    const statuses = [
        { value: 'pending', label: 'Pending', icon: 'clock', color: 'pending' },
        { value: 'preparing', label: 'Preparing', icon: 'utensils', color: 'preparing' },
        { value: 'ready', label: 'Ready', icon: 'check-circle', color: 'ready' },
        { value: 'completed', label: 'Completed', icon: 'check-double', color: 'completed' },
        { value: 'cancelled', label: 'Cancelled', icon: 'times-circle', color: 'cancelled' }
    ];
    
    container.innerHTML = statuses.map(status => `
        <button class="btn ${status.value === currentStatus ? 'btn-primary' : 'btn-outline'} ${status.color}" 
                onclick="updateOrderStatus('${status.value}')"
                ${status.value === currentStatus ? 'disabled' : ''}>
            <i class="fas fa-${status.icon}"></i> ${status.label}
        </button>
    `).join('');
}

// ===== CLOSE ORDER MODAL =====
window.closeOrderModal = function() {
    document.getElementById('orderModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== OPEN STATUS MODAL =====
window.openStatusModal = function(orderId) {
    currentOrderId = orderId;
    document.getElementById('statusModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE STATUS MODAL =====
window.closeStatusModal = function() {
    document.getElementById('statusModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== UPDATE ORDER STATUS =====
window.updateOrderStatus = function(newStatus) {
    if (!currentOrderId) return;

    const index = allOrders.findIndex(o => o.id === currentOrderId);
    if (index === -1) return;

    // Update order status
    allOrders[index].status = newStatus;
    
    // Add completed date if status is completed
    if (newStatus === 'completed') {
        allOrders[index].completedDate = new Date().toISOString();
    }
    
    // Save to localStorage
    saveOrders();
    
    // Reload data
    loadOrders();
    
    // Close modals
    closeStatusModal();
    closeOrderModal();
    
    showNotification(`Order status updated to ${formatStatus(newStatus)}`, 'success');
}

// ===== FILTER ORDERS =====
window.filterOrders = function(status) {
    currentFilter.status = status;
    document.getElementById('statusFilter').value = status;
    applyFilters();
}

// ===== SEARCH ORDERS =====
function searchOrders(query) {
    const searchTerm = query.toLowerCase();
    
    filteredOrders = allOrders.filter(order => 
        order.id?.toLowerCase().includes(searchTerm) ||
        order.customerName?.toLowerCase().includes(searchTerm) ||
        order.customerEmail?.toLowerCase().includes(searchTerm) ||
        order.customerPhone?.includes(searchTerm)
    );
    
    // Re-apply other filters
    if (currentFilter.payment !== 'all') {
        filteredOrders = filteredOrders.filter(order => 
            order.paymentMethod === currentFilter.payment
        );
    }
    
    if (currentFilter.date !== 'all') {
        applyDateFilterToFiltered();
    }
    
    currentPage = 1;
    displayOrders();
}

// ===== APPLY DATE FILTER TO FILTERED =====
function applyDateFilterToFiltered() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    switch(currentFilter.date) {
        case 'today':
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === today.getTime();
            });
            break;
            
        case 'yesterday':
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                orderDate.setHours(0, 0, 0, 0);
                return orderDate.getTime() === yesterday.getTime();
            });
            break;
            
        case 'week':
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                return orderDate >= weekAgo;
            });
            break;
            
        case 'month':
            filteredOrders = filteredOrders.filter(order => {
                const orderDate = new Date(order.orderDate);
                return orderDate >= monthAgo;
            });
            break;
    }
}

// ===== EXPORT ORDERS =====
window.exportOrders = function() {
    try {
        const dataStr = JSON.stringify(filteredOrders, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `orders_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Orders exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export orders', 'error');
    }
}

// ===== PRINT ORDERS =====
window.printOrders = function() {
    window.print();
}

// ===== PRINT SINGLE ORDER =====
window.printOrder = function() {
    const order = allOrders.find(o => o.id === currentOrderId);
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Order ${order.id}</title>
                <style>
                    body { 
                        font-family: 'Poppins', Arial, sans-serif; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto;
                    }
                    h1 { color: #8B4513; }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #8B4513;
                        padding-bottom: 20px;
                    }
                    .order-details { margin: 20px 0; }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 20px 0; 
                    }
                    th { 
                        background: #8B4513; 
                        color: white; 
                        padding: 10px; 
                        text-align: left; 
                    }
                    td { 
                        padding: 10px; 
                        border-bottom: 1px solid #ddd; 
                    }
                    .total { 
                        font-weight: bold; 
                        color: #8B4513;
                        font-size: 1.2rem;
                    }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #666;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Order #${order.id}</h1>
                    <div>
                        <p><strong>Date:</strong> ${formatDateTime(order.orderDate)}</p>
                        <p><strong>Status:</strong> ${formatStatus(order.status)}</p>
                    </div>
                </div>
                
                <div class="order-details">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.customerName || 'Guest'}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
                    <p><strong>Payment:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
                </div>
                
                <h3>Order Items</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${formatETB(item.price)}</td>
                                <td>${formatETB(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> ${formatETB(order.subtotal || order.total * 0.9)}</p>
                    <p><strong>Tax (10%):</strong> ${formatETB(order.tax || order.total * 0.1)}</p>
                    <p class="total"><strong>Total:</strong> ${formatETB(order.total)}</p>
                </div>
                
                ${order.specialInstructions ? `
                    <div style="margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px;">
                        <h4>Special Instructions:</h4>
                        <p>${order.specialInstructions}</p>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Thank you for choosing Markan Cafe!</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.disabled = currentPage === 1 || totalPages === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (!pageNumbers) return;

    if (totalPages === 0) {
        pageNumbers.innerHTML = '<span class="page-number active">1</span>';
        return;
    }

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
            <span class="page-number ${i === currentPage ? 'active' : ''}" 
                  onclick="goToPage(${i})">${i}</span>
        `;
    }
    pageNumbers.innerHTML = pagesHtml;
}

// ===== GO TO PAGE =====
window.goToPage = function(page) {
    currentPage = page;
    displayOrders();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search
    document.getElementById('searchOrders')?.addEventListener('input', debounce(function(e) {
        searchOrders(e.target.value);
    }, 500));
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentFilter.status = e.target.value;
        applyFilters();
    });
    
    // Payment filter
    document.getElementById('paymentFilter')?.addEventListener('change', function(e) {
        currentFilter.payment = e.target.value;
        applyFilters();
    });
    
    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        const value = e.target.value;
        
        if (value === 'custom') {
            // Show custom date range picker (simplified for now)
            const startDate = prompt('Enter start date (YYYY-MM-DD):');
            const endDate = prompt('Enter end date (YYYY-MM-DD):');
            
            if (startDate && endDate) {
                filterByCustomRange(startDate, endDate);
            } else {
                document.getElementById('dateFilter').value = currentFilter.date;
            }
        } else {
            currentFilter.date = value;
            applyFilters();
        }
    });
    
    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayOrders();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayOrders();
        }
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanOrders') {
            loadOrders();
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('orderModal').classList.contains('active')) {
                closeOrderModal();
            }
            if (document.getElementById('statusModal').classList.contains('active')) {
                closeStatusModal();
            }
        }
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const orderModal = document.getElementById('orderModal');
        const statusModal = document.getElementById('statusModal');
        
        if (e.target === orderModal) {
            closeOrderModal();
        }
        if (e.target === statusModal) {
            closeStatusModal();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== FILTER BY CUSTOM RANGE =====
function filterByCustomRange(startDate, endDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    filteredOrders = allOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= start && orderDate <= end;
    });
    
    currentPage = 1;
    displayOrders();
}

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

// ===== HELPER: FORMAT DATE TIME =====
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== HELPER: TIME AGO =====
function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// ===== HELPER: DEBOUNCE =====
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

// ===== SHOW NOTIFICATION =====
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

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterOrders = filterOrders;
window.viewOrderDetails = viewOrderDetails;
window.closeOrderModal = closeOrderModal;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.updateOrderStatus = updateOrderStatus;
window.exportOrders = exportOrders;
window.printOrders = printOrders;
window.printOrder = printOrder;
window.goToPage = goToPage;