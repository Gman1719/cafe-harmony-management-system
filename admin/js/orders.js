// admin/js/orders.js - Orders Management
// Markan Cafe - Debre Birhan University
// Complete order management with CRUD, filtering, and status updates

// ============================================
// GLOBAL VARIABLES
// ============================================
let allOrders = [];
let filteredOrders = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentStatusFilter = 'all';
let currentDateFilter = 'today';
let currentSearchTerm = '';
let customDateStart = '';
let customDateEnd = '';
let selectedOrderId = null;

// ============================================
// INITIALIZATION
//============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Orders Management initializing...');
    
    // Check authentication
    checkAuth();
    
    // Set admin name
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
    
    // Initialize orders database if needed
    initializeOrdersDB();
    
    // Load orders
    loadOrders();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load notification count
    loadNotificationCount();
});

// ============================================
// CHECK AUTHENTICATION
// ============================================
function checkAuth() {
    const userStr = localStorage.getItem('markanUser');
    if (!userStr) {
        window.location.replace('../../login.html');
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            window.location.replace('../../customer/html/dashboard.html');
            return;
        }
    } catch (e) {
        console.error('Auth error:', e);
        window.location.replace('../../login.html');
    }
}

// ============================================
// INITIALIZE ORDERS DATABASE
// ============================================
function initializeOrdersDB() {
    // Check if OrdersDB exists
    if (typeof OrdersDB === 'undefined') {
        console.log('Creating OrdersDB...');
        
        // Create OrdersDB if it doesn't exist
        window.OrdersDB = {
            orders: [],
            
            getAll() {
                return this.orders;
            },
            
            getById(id) {
                return this.orders.find(order => order.id === id);
            },
            
            getByStatus(status) {
                if (status === 'all') return this.orders;
                return this.orders.filter(order => order.status === status);
            },
            
            getByDate(date) {
                return this.orders.filter(order => {
                    const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
                    return orderDate === date;
                });
            },
            
            getByDateRange(startDate, endDate) {
                const start = new Date(startDate).setHours(0, 0, 0, 0);
                const end = new Date(endDate).setHours(23, 59, 59, 999);
                
                return this.orders.filter(order => {
                    const orderTime = new Date(order.orderDate).getTime();
                    return orderTime >= start && orderTime <= end;
                });
            },
            
            getByCustomerId(customerId) {
                return this.orders.filter(order => order.customerId == customerId);
            },
            
            getToday() {
                const today = new Date().toISOString().split('T')[0];
                return this.getByDate(today);
            },
            
            getRecent(limit) {
                return this.orders
                    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                    .slice(0, limit);
            },
            
            add(order) {
                order.id = this.generateId();
                order.orderDate = order.orderDate || new Date().toISOString();
                this.orders.push(order);
                this.saveToStorage();
                return order;
            },
            
            update(id, updates) {
                const index = this.orders.findIndex(order => order.id === id);
                if (index !== -1) {
                    this.orders[index] = { ...this.orders[index], ...updates };
                    this.saveToStorage();
                    return this.orders[index];
                }
                return null;
            },
            
            updateStatus(id, status) {
                return this.update(id, { status });
            },
            
            delete(id) {
                const index = this.orders.findIndex(order => order.id === id);
                if (index !== -1) {
                    this.orders.splice(index, 1);
                    this.saveToStorage();
                    return true;
                }
                return false;
            },
            
            generateId() {
                return 'ORD-' + Date.now().toString().slice(-6) + 
                       Math.random().toString(36).substr(2, 3).toUpperCase();
            },
            
            getStats() {
                return {
                    pending: this.orders.filter(o => o.status === 'pending').length,
                    preparing: this.orders.filter(o => o.status === 'preparing').length,
                    ready: this.orders.filter(o => o.status === 'ready').length,
                    completed: this.orders.filter(o => o.status === 'completed').length,
                    cancelled: this.orders.filter(o => o.status === 'cancelled').length,
                    total: this.orders.length
                };
            },
            
            saveToStorage() {
                localStorage.setItem('markanOrders', JSON.stringify(this.orders));
                console.log('💾 Orders saved to localStorage');
            },
            
            loadFromStorage() {
                const saved = localStorage.getItem('markanOrders');
                if (saved) {
                    try {
                        this.orders = JSON.parse(saved);
                        console.log('✅ Orders loaded from localStorage:', this.orders.length, 'orders');
                    } catch (e) {
                        console.error('Error loading orders:', e);
                        this.orders = [];
                    }
                } else {
                    // Create sample orders if no data exists
                    this.createSampleOrders();
                }
            },
            
            createSampleOrders() {
                const now = new Date();
                const yesterday = new Date(now);
                yesterday.setDate(yesterday.getDate() - 1);
                const lastWeek = new Date(now);
                lastWeek.setDate(lastWeek.getDate() - 7);
                
                this.orders = [
                    {
                        id: 'ORD-123456-ABC',
                        customerId: 2,
                        customerName: 'John Doe',
                        customerPhone: '0912345678',
                        customerEmail: 'john@example.com',
                        items: [
                            { id: 1, name: 'Ethiopian Coffee', price: 50, quantity: 2 },
                            { id: 3, name: 'Sambusa', price: 25, quantity: 3 }
                        ],
                        subtotal: 175,
                        tax: 17.5,
                        deliveryFee: 0,
                        total: 192.5,
                        status: 'pending',
                        paymentMethod: 'cash',
                        orderType: 'pickup',
                        specialInstructions: 'Extra spicy please',
                        orderDate: now.toISOString()
                    },
                    {
                        id: 'ORD-123457-DEF',
                        customerId: 3,
                        customerName: 'Sarah Smith',
                        customerPhone: '0923456789',
                        customerEmail: 'sarah@example.com',
                        items: [
                            { id: 2, name: 'Doro Wat', price: 180, quantity: 1 },
                            { id: 4, name: 'Injera', price: 30, quantity: 2 }
                        ],
                        subtotal: 240,
                        tax: 24,
                        deliveryFee: 50,
                        total: 314,
                        status: 'preparing',
                        paymentMethod: 'card',
                        orderType: 'delivery',
                        deliveryAddress: 'Debre Birhan University, Student Dorm',
                        orderDate: yesterday.toISOString()
                    },
                    {
                        id: 'ORD-123458-GHI',
                        customerId: 4,
                        customerName: 'Mike Johnson',
                        customerPhone: '0934567890',
                        customerEmail: 'mike@example.com',
                        items: [
                            { id: 1, name: 'Ethiopian Coffee', price: 50, quantity: 3 },
                            { id: 3, name: 'Sambusa', price: 25, quantity: 2 }
                        ],
                        subtotal: 200,
                        tax: 20,
                        deliveryFee: 0,
                        total: 220,
                        status: 'ready',
                        paymentMethod: 'cash',
                        orderType: 'pickup',
                        orderDate: yesterday.toISOString()
                    },
                    {
                        id: 'ORD-123459-JKL',
                        customerId: 5,
                        customerName: 'Anna Williams',
                        customerPhone: '0945678901',
                        customerEmail: 'anna@example.com',
                        items: [
                            { id: 2, name: 'Doro Wat', price: 180, quantity: 2 }
                        ],
                        subtotal: 360,
                        tax: 36,
                        deliveryFee: 0,
                        total: 396,
                        status: 'completed',
                        paymentMethod: 'card',
                        orderType: 'pickup',
                        orderDate: lastWeek.toISOString()
                    }
                ];
                this.saveToStorage();
                console.log('✅ Sample orders created');
            }
        };
        
        // Load data from localStorage
        OrdersDB.loadFromStorage();
    }
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Search input
    document.getElementById('searchOrders')?.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.toLowerCase();
        currentPage = 1;
        filterOrders();
    });
    
    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        currentDateFilter = e.target.value;
        currentPage = 1;
        
        // Show custom date inputs if custom is selected
        if (currentDateFilter === 'custom') {
            showCustomDateInputs();
        } else {
            filterOrders();
        }
    });
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentStatusFilter = e.target.value;
        currentPage = 1;
        filterOrders();
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
    
    // Pagination buttons
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayOrders();
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayOrders();
        }
    });
}

// ============================================
// SHOW CUSTOM DATE INPUTS
// ============================================
function showCustomDateInputs() {
    const filterSection = document.querySelector('.filters-section');
    
    // Remove existing custom inputs if any
    const existingCustom = document.getElementById('customDateRange');
    if (existingCustom) existingCustom.remove();
    
    // Create custom date range inputs
    const customDiv = document.createElement('div');
    customDiv.id = 'customDateRange';
    customDiv.className = 'custom-date-range';
    customDiv.innerHTML = `
        <input type="date" id="customStartDate" class="form-control" placeholder="Start Date">
        <span>to</span>
        <input type="date" id="customEndDate" class="form-control" placeholder="End Date">
        <button class="btn btn-primary" onclick="applyCustomDate()">Apply</button>
    `;
    
    filterSection.appendChild(customDiv);
}

// ============================================
// APPLY CUSTOM DATE FILTER
// ============================================
function applyCustomDate() {
    customDateStart = document.getElementById('customStartDate')?.value;
    customDateEnd = document.getElementById('customEndDate')?.value;
    
    if (!customDateStart || !customDateEnd) {
        showNotification('Please select both start and end dates', 'error');
        return;
    }
    
    filterOrders();
}

// ============================================
// LOAD ORDERS
// ============================================
function loadOrders() {
    if (typeof OrdersDB !== 'undefined') {
        allOrders = OrdersDB.getAll() || [];
        console.log('📊 Loaded', allOrders.length, 'orders');
    } else {
        allOrders = [];
    }
    
    updateStats();
    filterOrders();
}

// ============================================
// UPDATE STATS CARDS
// ============================================
function updateStats() {
    const stats = {
        pending: allOrders.filter(o => o.status === 'pending').length,
        preparing: allOrders.filter(o => o.status === 'preparing').length,
        ready: allOrders.filter(o => o.status === 'ready').length,
        completed: allOrders.filter(o => o.status === 'completed').length,
        cancelled: allOrders.filter(o => o.status === 'cancelled').length
    };
    
    document.getElementById('pendingOrders').textContent = stats.pending;
    document.getElementById('preparingOrders').textContent = stats.preparing;
    document.getElementById('readyOrders').textContent = stats.ready;
    document.getElementById('completedOrders').textContent = stats.completed;
    document.getElementById('cancelledOrders').textContent = stats.cancelled;
}

// ============================================
// FILTER ORDERS
// ============================================
function filterOrders(status) {
    if (status) {
        currentStatusFilter = status;
        document.getElementById('statusFilter').value = status;
    }
    
    let filtered = [...allOrders];
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filtered = filtered.filter(o => o.status === currentStatusFilter);
    }
    
    // Apply date filter
    filtered = filterByDate(filtered);
    
    // Apply search
    if (currentSearchTerm) {
        filtered = filtered.filter(o => 
            o.id?.toLowerCase().includes(currentSearchTerm) ||
            o.customerName?.toLowerCase().includes(currentSearchTerm) ||
            o.customerPhone?.includes(currentSearchTerm)
        );
    }
    
    filteredOrders = filtered;
    currentPage = 1;
    displayOrders();
    updatePagination();
}

// ============================================
// FILTER BY DATE
// ============================================
function filterByDate(orders) {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const monthStart = startOfMonth.toISOString().split('T')[0];
    
    switch(currentDateFilter) {
        case 'today':
            return orders.filter(o => {
                const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
                return orderDate === today;
            });
            
        case 'yesterday':
            return orders.filter(o => {
                const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
                return orderDate === yesterday;
            });
            
        case 'week':
            return orders.filter(o => {
                const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
                return orderDate >= weekStart;
            });
            
        case 'month':
            return orders.filter(o => {
                const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
                return orderDate >= monthStart;
            });
            
        case 'custom':
            if (customDateStart && customDateEnd) {
                return orders.filter(o => {
                    const orderDate = new Date(o.orderDate).toISOString().split('T')[0];
                    return orderDate >= customDateStart && orderDate <= customDateEnd;
                });
            }
            return orders;
            
        default:
            return orders;
    }
}

// ============================================
// DISPLAY ORDERS IN TABLE
// ============================================
function displayOrders() {
    const tbody = document.getElementById('ordersTableBody');
    
    if (filteredOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No Orders Found</h3>
                    <p>${allOrders.length === 0 ? 'No orders have been placed yet' : 'No orders match your filters'}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageOrders = filteredOrders.slice(start, end);
    
    tbody.innerHTML = pageOrders.map(order => {
        const itemCount = order.items?.reduce((sum, i) => sum + (parseInt(i.quantity) || 1), 0) || 0;
        const timeAgo = getTimeAgo(new Date(order.orderDate));
        const paymentIcon = getPaymentIcon(order.paymentMethod);
        
        return `
            <tr onclick="openOrderModal('${order.id}')">
                <td><span class="order-id">#${order.id}</span></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-name">${order.customerName || 'Guest'}</span>
                        <span class="customer-phone">${order.customerPhone || ''}</span>
                    </div>
                </td>
                <td><span class="items-count"><i class="fas fa-box"></i> ${itemCount}</span></td>
                <td>${formatCurrency(order.total || 0)}</td>
                <td><span class="payment-method"><i class="fas ${paymentIcon}"></i> ${order.paymentMethod || 'cash'}</span></td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td><span class="time-ago"><i class="far fa-clock"></i> ${timeAgo}</span></td>
                <td>
                    <div class="action-buttons" onclick="event.stopPropagation()">
                        <button class="action-btn view-btn" onclick="openOrderModal('${order.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn status-btn" onclick="openStatusModal('${order.id}')" title="Update Status">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn print-btn" onclick="printOrder('${order.id}')" title="Print">
                            <i class="fas fa-print"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ============================================
// UPDATE PAGINATION
// ============================================
function updatePagination() {
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
    
    // Generate page numbers
    let pageHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
    }
    
    pageNumbers.innerHTML = pageHtml;
}

// ============================================
// GO TO SPECIFIC PAGE
// ============================================
function goToPage(page) {
    currentPage = page;
    displayOrders();
    updatePagination();
}

// ============================================
// OPEN ORDER DETAILS MODAL
// ============================================
function openOrderModal(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    selectedOrderId = orderId;
    
    document.getElementById('modalOrderId').textContent = `#${order.id}`;
    document.getElementById('orderCustomerName').textContent = order.customerName || 'Guest';
    document.getElementById('orderCustomerPhone').textContent = order.customerPhone || 'N/A';
    document.getElementById('orderCustomerEmail').textContent = order.customerEmail || 'N/A';
    
    const orderDate = new Date(order.orderDate).toLocaleString();
    document.getElementById('orderDate').textContent = orderDate;
    document.getElementById('orderStatus').textContent = order.status;
    document.getElementById('orderStatus').className = `status-badge status-${order.status}`;
    document.getElementById('orderPayment').textContent = order.paymentMethod || 'cash';
    document.getElementById('orderInstructions').textContent = order.specialInstructions || 'No special instructions';
    
    // Display order items
    const itemsList = document.getElementById('orderItemsList');
    if (order.items && order.items.length > 0) {
        itemsList.innerHTML = order.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatCurrency(item.price)}</td>
                <td>${formatCurrency(item.price * item.quantity)}</td>
            </tr>
        `).join('');
    } else {
        itemsList.innerHTML = '<tr><td colspan="4" class="text-center">No items</td></tr>';
    }
    
    document.getElementById('orderTotal').textContent = formatCurrency(order.total || 0);
    
    // Add status action buttons
    const statusActions = document.getElementById('statusActions');
    statusActions.innerHTML = `
        ${order.status !== 'pending' ? '<button class="status-action-btn pending" onclick="updateOrderStatus(\'pending\')">Pending</button>' : ''}
        ${order.status !== 'preparing' ? '<button class="status-action-btn preparing" onclick="updateOrderStatus(\'preparing\')">Preparing</button>' : ''}
        ${order.status !== 'ready' ? '<button class="status-action-btn ready" onclick="updateOrderStatus(\'ready\')">Ready</button>' : ''}
        ${order.status !== 'completed' ? '<button class="status-action-btn completed" onclick="updateOrderStatus(\'completed\')">Completed</button>' : ''}
        ${order.status !== 'cancelled' ? '<button class="status-action-btn cancelled" onclick="updateOrderStatus(\'cancelled\')">Cancelled</button>' : ''}
    `;
    
    document.getElementById('orderModal').classList.add('active');
}

function closeOrderModal() {
    document.getElementById('orderModal').classList.remove('active');
}

// ============================================
// OPEN STATUS UPDATE MODAL
// ============================================
function openStatusModal(orderId) {
    selectedOrderId = orderId;
    document.getElementById('statusModal').classList.add('active');
}

function closeStatusModal() {
    document.getElementById('statusModal').classList.remove('active');
}

// ============================================
// UPDATE ORDER STATUS
// ============================================
function updateOrderStatus(newStatus) {
    if (!selectedOrderId) return;
    
    const updated = OrdersDB.updateStatus(selectedOrderId, newStatus);
    if (updated) {
        showNotification(`Order status updated to ${newStatus}`, 'success');
        
        // Reload orders
        allOrders = OrdersDB.getAll();
        updateStats();
        filterOrders();
        
        // Close modals
        closeStatusModal();
        closeOrderModal();
        
        // Update notification count
        loadNotificationCount();
    } else {
        showNotification('Failed to update order status', 'error');
    }
}

// ============================================
// EXPORT ORDERS TO CSV
// ============================================
function exportOrders() {
    if (filteredOrders.length === 0) {
        showNotification('No orders to export', 'error');
        return;
    }
    
    // Create CSV content
    const headers = ['Order ID', 'Customer', 'Phone', 'Email', 'Items', 'Total', 'Status', 'Payment', 'Date'];
    const csvRows = [];
    
    csvRows.push(headers.join(','));
    
    filteredOrders.forEach(order => {
        const items = order.items?.map(i => `${i.name}(${i.quantity})`).join('; ') || '';
        const row = [
            order.id,
            `"${order.customerName || 'Guest'}"`,
            order.customerPhone || '',
            order.customerEmail || '',
            `"${items}"`,
            order.total || 0,
            order.status,
            order.paymentMethod || 'cash',
            new Date(order.orderDate).toLocaleString()
        ];
        csvRows.push(row.join(','));
    });
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showNotification('Orders exported successfully', 'success');
}

// ============================================
// PRINT ORDERS
// ============================================
function printOrders() {
    const printWindow = window.open('', '_blank');
    
    const styles = Array.from(document.styleSheets)
        .map(sheet => {
            try {
                return Array.from(sheet.cssRules || [])
                    .map(rule => rule.cssText)
                    .join('');
            } catch (e) {
                return '';
            }
        })
        .join('');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Orders Report - Markan Cafe</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #4a2c1a; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #f5e6d3; padding: 10px; text-align: left; }
                    td { padding: 8px; border-bottom: 1px solid #e6d5b8; }
                    .status-badge { 
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 12px;
                        font-size: 0.8rem;
                    }
                    .status-pending { background: #fff3e0; color: #ed6c02; }
                    .status-preparing { background: #e1f5fe; color: #0288d1; }
                    .status-ready { background: #e8f5e9; color: #2e7d32; }
                    .status-completed { background: #f3e5f5; color: #7b1fa2; }
                    .status-cancelled { background: #ffebee; color: #d32f2f; }
                    .footer { margin-top: 20px; text-align: center; color: #666; }
                </style>
            </head>
            <body>
                <h1>Orders Report - ${new Date().toLocaleDateString()}</h1>
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredOrders.map(order => {
                            const items = order.items?.map(i => `${i.name} x${i.quantity}`).join('<br>') || '';
                            return `
                                <tr>
                                    <td>${order.id}</td>
                                    <td>${order.customerName || 'Guest'}</td>
                                    <td>${items}</td>
                                    <td>${formatCurrency(order.total || 0)}</td>
                                    <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                                    <td>${new Date(order.orderDate).toLocaleString()}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="footer">
                    <p>Total Orders: ${filteredOrders.length}</p>
                    <p>Generated by Markan Cafe Admin</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// PRINT SINGLE ORDER
// ============================================
function printOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Order #${order.id} - Markan Cafe</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #4a2c1a; padding: 20px; }
                    .header h1 { color: #4a2c1a; margin: 0; }
                    .header p { color: #666; margin: 5px 0; }
                    .section { margin: 20px 0; padding: 15px; border: 1px solid #e6d5b8; border-radius: 8px; }
                    .section h3 { color: #4a2c1a; margin-top: 0; border-bottom: 1px solid #e6d5b8; padding-bottom: 5px; }
                    table { width: 100%; border-collapse: collapse; }
                    th { background: #f5e6d3; padding: 8px; text-align: left; }
                    td { padding: 6px; border-bottom: 1px solid #e6d5b8; }
                    .total { font-size: 1.2em; font-weight: bold; color: #4a2c1a; text-align: right; margin-top: 10px; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Markan Cafe</h1>
                    <p>Debre Birhan University</p>
                    <h2>Order #${order.id}</h2>
                    <p>Date: ${new Date(order.orderDate).toLocaleString()}</p>
                </div>
                
                <div class="section">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${order.customerName || 'Guest'}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone || 'N/A'}</p>
                    <p><strong>Email:</strong> ${order.customerEmail || 'N/A'}</p>
                </div>
                
                <div class="section">
                    <h3>Order Details</h3>
                    <p><strong>Status:</strong> <span style="color: ${getStatusColor(order.status)}">${order.status}</span></p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod || 'cash'}</p>
                    <p><strong>Order Type:</strong> ${order.orderType || 'pickup'}</p>
                    ${order.deliveryAddress ? `<p><strong>Delivery Address:</strong> ${order.deliveryAddress}</p>` : ''}
                </div>
                
                <div class="section">
                    <h3>Order Items</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${order.items?.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${formatCurrency(item.price)}</td>
                                    <td>${formatCurrency(item.price * item.quantity)}</td>
                                </tr>
                            `).join('') || ''}
                        </tbody>
                    </table>
                    <div class="total">
                        Total: ${formatCurrency(order.total || 0)}
                    </div>
                </div>
                
                ${order.specialInstructions ? `
                <div class="section">
                    <h3>Special Instructions</h3>
                    <p>${order.specialInstructions}</p>
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>Thank you for choosing Markan Cafe!</p>
                    <p>Generated on ${new Date().toLocaleString()}</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// LOAD NOTIFICATION COUNT
// ============================================
function loadNotificationCount() {
    const pendingCount = allOrders.filter(o => o.status === 'pending').length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = pendingCount;
        badge.style.display = pendingCount > 0 ? 'block' : 'none';
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '').trim() + ' ETB';
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

function getPaymentIcon(method) {
    const icons = {
        'cash': 'fa-money-bill-wave',
        'card': 'fa-credit-card',
        'online': 'fa-mobile-alt'
    };
    return icons[method] || 'fa-money-bill-wave';
}

function getStatusColor(status) {
    const colors = {
        'pending': '#ed6c02',
        'preparing': '#0288d1',
        'ready': '#2e7d32',
        'completed': '#7b1fa2',
        'cancelled': '#d32f2f'
    };
    return colors[status] || '#757575';
}

function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.filterOrders = filterOrders;
window.openOrderModal = openOrderModal;
window.closeOrderModal = closeOrderModal;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.updateOrderStatus = updateOrderStatus;
window.exportOrders = exportOrders;
window.printOrders = printOrders;
window.printOrder = printOrder;
window.goToPage = goToPage;
window.applyCustomDate = applyCustomDate;
window.showNotification = showNotification;