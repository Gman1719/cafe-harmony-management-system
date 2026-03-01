// admin/js/dashboard.js - Admin Dashboard
// Markan Cafe - Debre Birhan University

// ============================================
// GLOBAL VARIABLES
// ============================================
let revenueChart = null;
let currentDateRange = 'month';
let refreshInterval = null;
let notifications = [];

// Database references (handle different naming conventions)
const DB = {
    orders: typeof OrdersDB !== 'undefined' ? OrdersDB : 
            typeof window.OrdersDB !== 'undefined' ? window.OrdersDB : 
            typeof ordersDB !== 'undefined' ? ordersDB : null,
            
    reservations: typeof ReservationsDB !== 'undefined' ? ReservationsDB : 
                  typeof window.ReservationsDB !== 'undefined' ? window.ReservationsDB : 
                  typeof reservationsDB !== 'undefined' ? reservationsDB : null,
                  
    menu: typeof MenuDB !== 'undefined' ? MenuDB : 
          typeof window.MenuDB !== 'undefined' ? window.MenuDB : 
          typeof menuDB !== 'undefined' ? menuDB : null,
          
    users: typeof UsersDB !== 'undefined' ? UsersDB : 
           typeof window.UsersDB !== 'undefined' ? window.UsersDB : 
           typeof usersDB !== 'undefined' ? usersDB : null
};

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Admin Dashboard initializing...');
    console.log('Database status:', {
        orders: DB.orders ? '✅' : '❌',
        reservations: DB.reservations ? '✅' : '❌',
        menu: DB.menu ? '✅' : '❌',
        users: DB.users ? '✅' : '❌'
    });
    
    // Set admin name
    const user = getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
    
    // Load all dashboard data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Start auto-refresh (every 30 seconds)
    startAutoRefresh();
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

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Date range change
    document.getElementById('dateRange')?.addEventListener('change', function(e) {
        currentDateRange = e.target.value;
        loadRevenueChart();
    });
    
    // Mark all notifications as read
    document.getElementById('markAllRead')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        markAllNotificationsRead();
    });
    
    // Close notifications dropdown when clicking outside
    document.addEventListener('click', function(e) {
        const bell = document.getElementById('notificationBell');
        const dropdown = document.getElementById('notificationsDropdown');
        if (bell && dropdown && !bell.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    // Show notifications dropdown on bell click
    document.getElementById('notificationBell')?.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const dropdown = document.getElementById('notificationsDropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    });
}

// ============================================
// MAIN DASHBOARD DATA LOADER
// ============================================
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    showLoadingStates();
    
    try {
        // Load all dashboard components
        loadStatsCards();
        loadLowStockAlert();
        loadPopularItems();
        loadRecentOrders();
        loadActivityTimeline();
        loadRevenueChart();
        loadNotifications();
        
        console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        showNotification('Failed to load some dashboard data', 'warning');
    }
}

// ============================================
// SHOW LOADING STATES
// ============================================
function showLoadingStates() {
    document.getElementById('pendingOrders').textContent = '...';
    document.getElementById('completedOrders').textContent = '...';
    document.getElementById('todayReservations').textContent = '...';
    document.getElementById('todayRevenue').textContent = '... ETB';
    
    document.getElementById('pendingTrend').textContent = 'Loading...';
    document.getElementById('completedTrend').textContent = 'Loading...';
    document.getElementById('reservationTrend').textContent = 'Loading...';
    document.getElementById('revenueTrend').textContent = 'Loading...';
}

// ============================================
// GET ORDERS FROM STORAGE
// ============================================
function getAllOrders() {
    // Try multiple data sources
    if (DB.orders && typeof DB.orders.getAll === 'function') {
        return DB.orders.getAll() || [];
    }
    
    // Try localStorage directly
    try {
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        return orders;
    } catch (e) {
        return [];
    }
}

// ============================================
// GET RESERVATIONS FROM STORAGE
// ============================================
function getAllReservations() {
    // Try multiple data sources
    if (DB.reservations && typeof DB.reservations.getAll === 'function') {
        return DB.reservations.getAll() || [];
    }
    
    // Try localStorage directly
    try {
        const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        return reservations;
    } catch (e) {
        return [];
    }
}

// ============================================
// GET MENU ITEMS FROM STORAGE
// ============================================
function getAllMenuItems() {
    // Try multiple data sources
    if (DB.menu && typeof DB.menu.getAll === 'function') {
        return DB.menu.getAll() || [];
    }
    
    // Try localStorage directly
    try {
        const menu = JSON.parse(localStorage.getItem('markanMenu')) || [];
        return menu;
    } catch (e) {
        return [];
    }
}

// ============================================
// GET USERS FROM STORAGE
// ============================================
function getAllUsers() {
    // Try multiple data sources
    if (DB.users && typeof DB.users.getAll === 'function') {
        return DB.users.getAll() || [];
    }
    
    // Try localStorage directly
    try {
        const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
        return users;
    } catch (e) {
        return [];
    }
}

// ============================================
// LOAD STATS CARDS
// ============================================
function loadStatsCards() {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Get orders
    const allOrders = getAllOrders();
    
    // Calculate order stats
    const pendingOrders = allOrders.filter(o => o && o.status === 'pending').length;
    const completedOrders = allOrders.filter(o => o && o.status === 'completed').length;
    
    // Today's orders
    const todayOrders = allOrders.filter(o => o && o.orderDate?.startsWith(today));
    const yesterdayOrders = allOrders.filter(o => o && o.orderDate?.startsWith(yesterday));
    
    // Today's revenue
    const todayRevenue = todayOrders
        .filter(o => o && o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    
    const yesterdayRevenue = yesterdayOrders
        .filter(o => o && o.status === 'completed')
        .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
    
    // Calculate trends
    const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue);
    const pendingTrend = calculateTrend(
        pendingOrders, 
        allOrders.filter(o => o && o.orderDate?.startsWith(yesterday) && o.status === 'pending').length
    );
    const completedTrend = calculateTrend(
        completedOrders,
        allOrders.filter(o => o && o.orderDate?.startsWith(yesterday) && o.status === 'completed').length
    );
    
    // Update stats cards
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('todayRevenue').textContent = formatCurrency(todayRevenue);
    
    document.getElementById('pendingTrend').textContent = `${pendingTrend} from yesterday`;
    document.getElementById('completedTrend').textContent = `${completedTrend} from yesterday`;
    document.getElementById('revenueTrend').textContent = revenueTrend;
    
    // Load reservations
    loadReservationStats(today);
}

// ============================================
// LOAD RESERVATION STATS
// ============================================
function loadReservationStats(today) {
    const allReservations = getAllReservations();
    const todayReservations = allReservations.filter(r => r && r.date === today);
    const confirmed = todayReservations.filter(r => r && r.status === 'confirmed').length;
    const pending = todayReservations.filter(r => r && r.status === 'pending').length;
    
    document.getElementById('todayReservations').textContent = todayReservations.length;
    document.getElementById('reservationTrend').textContent = `${confirmed} confirmed, ${pending} pending`;
}

// ============================================
// CALCULATE TREND PERCENTAGE
// ============================================
function calculateTrend(current, previous) {
    if (previous === 0) {
        return current > 0 ? '+100%' : '0%';
    }
    const change = ((current - previous) / previous) * 100;
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(1)}%`;
}

// ============================================
// FORMAT CURRENCY
// ============================================
function formatCurrency(amount) {
    return Math.round(amount).toLocaleString() + ' ETB';
}

// ============================================
// LOAD LOW STOCK ALERT
// ============================================
function loadLowStockAlert() {
    const menuItems = getAllMenuItems();
    const lowStockItems = menuItems.filter(item => item && item.stock < 5 && item.stock > 0);
    const outOfStock = menuItems.filter(item => item && item.stock === 0);
    
    if (lowStockItems.length > 0 || outOfStock.length > 0) {
        const alertDiv = document.getElementById('lowStockAlert');
        const messageEl = document.getElementById('lowStockMessage');
        
        let message = '';
        if (outOfStock.length > 0) {
            message += `${outOfStock.length} item(s) out of stock. `;
        }
        if (lowStockItems.length > 0) {
            message += `${lowStockItems.length} item(s) running low.`;
        }
        
        messageEl.textContent = message;
        alertDiv.style.display = 'flex';
    }
}

// ============================================
// LOAD POPULAR ITEMS
// ============================================
function loadPopularItems() {
    const container = document.getElementById('popularItems');
    
    const orders = getAllOrders().filter(o => o && o.status === 'completed');
    const menuItems = getAllMenuItems();
    
    // Count item occurrences
    const itemCounts = {};
    orders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                if (item && item.id) {
                    const key = item.id;
                    itemCounts[key] = (itemCounts[key] || 0) + (parseInt(item.quantity) || 1);
                }
            });
        }
    });
    
    // Sort and get top 5
    const popular = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
            const menuItem = menuItems.find(m => m && m.id == id);
            return {
                name: menuItem?.name || 'Unknown Item',
                count: count,
                price: parseFloat(menuItem?.price) || 0
            };
        });
    
    if (popular.length === 0) {
        container.innerHTML = '<p class="no-data">No order data yet</p>';
        return;
    }
    
    container.innerHTML = popular.map((item, index) => `
        <div class="popular-item">
            <div class="popular-rank">#${index + 1}</div>
            <div class="popular-details">
                <h4>${item.name}</h4>
                <p>${item.count} orders</p>
            </div>
            <div class="popular-revenue">${formatCurrency(item.price * item.count)}</div>
        </div>
    `).join('');
}

// ============================================
// LOAD RECENT ORDERS - FIXED (No 404 errors)
// ============================================
function loadRecentOrders() {
    const tableBody = document.getElementById('recentOrdersTable');
    
    const orders = getAllOrders()
        .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0))
        .slice(0, 10);
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No orders found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => {
        const itemCount = order.items?.reduce((sum, i) => sum + (parseInt(i.quantity) || 1), 0) || 0;
        const timeAgo = getTimeAgo(new Date(order.orderDate));
        const status = order.status || 'pending';
        
        return `
            <tr onclick="viewOrderDetails('${order.id}')" style="cursor: pointer;">
                <td><span class="order-id">#${order.id}</span></td>
                <td>${order.customerName || 'Guest'}</td>
                <td>${itemCount} items</td>
                <td>${formatCurrency(parseFloat(order.total) || 0)}</td>
                <td><span class="status-badge status-${status}">${status}</span></td>
                <td><span class="time-ago">${timeAgo}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// VIEW ORDER DETAILS - Redirect to orders page
// ============================================
function viewOrderDetails(orderId) {
    // Redirect to orders page with the order ID as a parameter
    window.location.href = `orders.html?order=${orderId}`;
}

// ============================================
// VIEW RESERVATION DETAILS - Redirect to reservations page
// ============================================
function viewReservationDetails(reservationId) {
    window.location.href = `reservations.html?reservation=${reservationId}`;
}

// ============================================
// LOAD ACTIVITY TIMELINE - FIXED (No 404 errors)
// ============================================
function loadActivityTimeline() {
    const timeline = document.getElementById('activityTimeline');
    const activities = [];
    
    // Add recent orders
    const orders = getAllOrders()
        .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0))
        .slice(0, 5);
    
    orders.forEach(order => {
        if (order) {
            activities.push({
                type: 'order',
                id: order.id,
                customer: order.customerName || 'Guest',
                action: 'placed an order',
                status: order.status,
                time: new Date(order.orderDate),
                icon: getStatusIcon(order.status),
                color: getStatusColor(order.status)
            });
        }
    });
    
    // Add recent reservations
    const reservations = getAllReservations()
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);
    
    reservations.forEach(res => {
        if (res) {
            activities.push({
                type: 'reservation',
                id: res.id,
                customer: res.customerName || 'Guest',
                action: `booked for ${res.guests || '?'} guests`,
                time: new Date(res.createdAt),
                icon: 'fa-calendar-check',
                color: '#c49a6c'
            });
        }
    });
    
    // Sort by time (most recent first)
    activities.sort((a, b) => b.time - a.time);
    
    if (activities.length === 0) {
        timeline.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    timeline.innerHTML = activities.slice(0, 10).map(activity => {
        const timeAgo = getTimeAgo(activity.time);
        
        return `
            <div class="timeline-item" onclick="${activity.type === 'order' ? 
                `viewOrderDetails('${activity.id}')` : 
                `viewReservationDetails('${activity.id}')`}" style="cursor: pointer;">
                <div class="timeline-icon" style="background: ${activity.color}20; color: ${activity.color}">
                    <i class="fas ${activity.icon}"></i>
                </div>
                <div class="timeline-content">
                    <h4>${activity.customer} ${activity.action}</h4>
                    <p>${activity.type === 'order' ? `Order #${activity.id}` : `Reservation #${activity.id}`}</p>
                    <span class="time-ago">${timeAgo}</span>
                </div>
                ${activity.status ? `<span class="status-badge status-${activity.status}">${activity.status}</span>` : ''}
            </div>
        `;
    }).join('');
}

// ============================================
// LOAD REVENUE CHART
// ============================================
function loadRevenueChart() {
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;
    
    const range = document.getElementById('dateRange')?.value || 'month';
    const { labels, data } = getChartData(range);
    
    // Destroy existing chart
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    // Create new chart
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Revenue',
                data: data,
                borderColor: '#c49a6c',
                backgroundColor: 'rgba(196, 154, 108, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#4a2c1a',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (context) => `Revenue: ${formatCurrency(context.raw)}`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => formatCurrency(value)
                    }
                }
            }
        }
    });
}

// ============================================
// GET CHART DATA
// ============================================
function getChartData(range) {
    const labels = [];
    const data = [];
    
    const orders = getAllOrders().filter(o => o && o.status === 'completed');
    const today = new Date();
    
    switch(range) {
        case 'today':
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                labels.push(hour);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.getHours() === i && 
                               orderDate.toDateString() === today.toDateString();
                    })
                    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                
                data.push(revenue);
            }
            break;
            
        case 'week':
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.push(weekDays[date.getDay()]);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.toDateString() === date.toDateString();
                    })
                    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                
                data.push(revenue);
            }
            break;
            
        case 'month':
            const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                labels.push(i.toString());
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.getDate() === i &&
                               orderDate.getMonth() === today.getMonth() &&
                               orderDate.getFullYear() === today.getFullYear();
                    })
                    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                
                data.push(revenue);
            }
            break;
            
        case 'year':
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                labels.push(months[i]);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.getMonth() === i &&
                               orderDate.getFullYear() === today.getFullYear();
                    })
                    .reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
                
                data.push(revenue);
            }
            break;
    }
    
    return { labels, data };
}

// ============================================
// LOAD NOTIFICATIONS
// ============================================
function loadNotifications() {
    const notificationsList = document.getElementById('notificationsList');
    const notificationCount = document.getElementById('notificationCount');
    
    notifications = [];
    
    // Check for low stock
    const menuItems = getAllMenuItems();
    const lowStock = menuItems.filter(item => item && item.stock < 5 && item.stock > 0);
    const outOfStock = menuItems.filter(item => item && item.stock === 0);
    
    lowStock.forEach(item => {
        notifications.push({
            id: `stock-${item.id}`,
            type: 'warning',
            message: `${item.name} is running low (${item.stock} left)`,
            time: new Date(),
            link: 'menu-management.html?filter=lowstock',
            read: false
        });
    });
    
    outOfStock.forEach(item => {
        notifications.push({
            id: `out-${item.id}`,
            type: 'danger',
            message: `${item.name} is out of stock`,
            time: new Date(),
            link: 'menu-management.html?filter=outofstock',
            read: false
        });
    });
    
    // Check for pending orders
    const orders = getAllOrders();
    const pendingOrders = orders.filter(o => o && o.status === 'pending');
    if (pendingOrders.length > 0) {
        notifications.push({
            id: 'pending-orders',
            type: 'info',
            message: `${pendingOrders.length} pending order(s) need attention`,
            time: new Date(),
            link: 'orders.html?status=pending',
            read: false
        });
    }
    
    // Check for today's reservations
    const today = new Date().toISOString().split('T')[0];
    const reservations = getAllReservations();
    const todayReservations = reservations.filter(r => r && r.date === today);
    if (todayReservations.length > 0) {
        notifications.push({
            id: 'today-reservations',
            type: 'info',
            message: `${todayReservations.length} reservation(s) for today`,
            time: new Date(),
            link: 'reservations.html',
            read: false
        });
    }
    
    // Sort by time (newest first)
    notifications.sort((a, b) => b.time - a.time);
    
    // Update notification count
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'block' : 'none';
    
    // Render notifications
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-notifications">No new notifications</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications.map(notif => {
        const timeAgo = getTimeAgo(notif.time);
        const notifClass = notif.read ? 'notification-item' : 'notification-item unread';
        
        return `
            <div class="${notifClass} ${notif.type}" onclick="window.location.href='${notif.link}'; markNotificationRead('${notif.id}')">
                <i class="fas ${notif.type === 'warning' ? 'fa-exclamation-triangle' : 
                                 notif.type === 'danger' ? 'fa-times-circle' : 
                                 'fa-info-circle'}"></i>
                <div class="notification-content">
                    <p>${notif.message}</p>
                    <span class="time-ago">${timeAgo}</span>
                </div>
            </div>
        `;
    }).join('');
}

// ============================================
// MARK NOTIFICATION AS READ
// ============================================
function markNotificationRead(id) {
    const notif = notifications.find(n => n.id === id);
    if (notif) {
        notif.read = true;
        updateNotificationCount();
    }
}

// ============================================
// MARK ALL NOTIFICATIONS AS READ
// ============================================
function markAllNotificationsRead() {
    notifications.forEach(n => n.read = true);
    updateNotificationCount();
    loadNotifications(); // Reload to update UI
    
    // Close dropdown
    document.getElementById('notificationsDropdown').style.display = 'none';
    
    showNotification('All notifications marked as read', 'success');
}

// ============================================
// UPDATE NOTIFICATION COUNT
// ============================================
function updateNotificationCount() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    badge.textContent = unreadCount;
    badge.style.display = unreadCount > 0 ? 'block' : 'none';
}

// ============================================
// PERFORM GLOBAL SEARCH
// ============================================
function performGlobalSearch(term) {
    console.log('Searching for:', term);
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
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

function getStatusIcon(status) {
    const icons = {
        'pending': 'fa-clock',
        'preparing': 'fa-utensils',
        'ready': 'fa-check-circle',
        'completed': 'fa-check-double',
        'cancelled': 'fa-times-circle'
    };
    return icons[status] || 'fa-circle';
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
// AUTO-REFRESH
// ============================================
function startAutoRefresh() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    refreshInterval = setInterval(() => {
        if (document.visibilityState === 'visible') {
            console.log('🔄 Auto-refreshing dashboard...');
            loadDashboardData();
        }
    }, 30000);
}

// ============================================
// MAKE FUNCTIONS GLOBALLY AVAILABLE
// ============================================
window.loadDashboardData = loadDashboardData;
window.performGlobalSearch = performGlobalSearch;
window.markNotificationRead = markNotificationRead;
window.markAllNotificationsRead = markAllNotificationsRead;
window.showNotification = showNotification;
window.viewOrderDetails = viewOrderDetails;
window.viewReservationDetails = viewReservationDetails;