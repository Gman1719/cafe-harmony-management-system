// admin/js/dashboard.js - Dynamic Admin Dashboard
// Markan Cafe - Debre Birhan University

// Global variables
let revenueChart = null;
let currentDateRange = 'month';

// ============================================
// MAIN DASHBOARD DATA LOADER
// ============================================
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    // Show loading states
    showLoadingStates();
    
    try {
        // Wait for all databases to be ready
        await Promise.all([
            waitForDatabase('UsersDB'),
            waitForDatabase('OrdersDB'),
            waitForDatabase('ReservationsDB'),
            waitForDatabase('MenuDB')
        ]);
        
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
        showErrorMessage('Failed to load dashboard data. Please refresh the page.');
    }
}

// ============================================
// WAIT FOR DATABASE
// ============================================
function waitForDatabase(dbName) {
    return new Promise((resolve) => {
        if (typeof window[dbName] !== 'undefined') {
            resolve();
            return;
        }
        
        let attempts = 0;
        const maxAttempts = 30;
        
        const interval = setInterval(() => {
            attempts++;
            if (typeof window[dbName] !== 'undefined') {
                clearInterval(interval);
                resolve();
            } else if (attempts >= maxAttempts) {
                clearInterval(interval);
                console.warn(`⚠️ ${dbName} not loaded after ${maxAttempts} attempts`);
                resolve(); // Resolve anyway to not block
            }
        }, 100);
    });
}

// ============================================
// SHOW LOADING STATES
// ============================================
function showLoadingStates() {
    // Stats cards
    document.getElementById('pendingOrders').textContent = '...';
    document.getElementById('completedOrders').textContent = '...';
    document.getElementById('todayReservations').textContent = '...';
    document.getElementById('todayRevenue').textContent = '... ETB';
    
    // Trends
    document.getElementById('pendingTrend').textContent = 'Loading...';
    document.getElementById('completedTrend').textContent = 'Loading...';
    document.getElementById('reservationTrend').textContent = 'Loading...';
    document.getElementById('revenueTrend').textContent = 'Loading...';
}

// ============================================
// LOAD STATS CARDS
// ============================================
function loadStatsCards() {
    // Get today's date range
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    // Get all orders
    let allOrders = [];
    if (window.OrdersDB) {
        allOrders = OrdersDB.getAll();
    }
    
    // Calculate stats
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    const completedOrders = allOrders.filter(o => o.status === 'completed').length;
    
    // Today's orders
    const todayOrders = allOrders.filter(o => o.date === today);
    const yesterdayOrders = allOrders.filter(o => o.date === yesterday);
    
    // Today's revenue
    const todayRevenue = todayOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Yesterday's revenue for trend
    const yesterdayRevenue = yesterdayOrders
        .filter(o => o.status === 'completed')
        .reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate trends
    const revenueTrend = calculateTrend(todayRevenue, yesterdayRevenue);
    const orderTrend = calculateTrend(pendingOrders, allOrders.filter(o => o.date === yesterday && o.status === 'pending').length);
    
    // Update stats cards
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('todayRevenue').textContent = formatCurrency(todayRevenue);
    
    // Update trends
    document.getElementById('pendingTrend').textContent = `${orderTrend} from yesterday`;
    document.getElementById('completedTrend').textContent = `${calculateTrend(completedOrders, yesterdayOrders.filter(o => o.status === 'completed').length)} from yesterday`;
    document.getElementById('revenueTrend').textContent = revenueTrend;
    
    // Load reservations
    loadReservationStats();
}

// ============================================
// LOAD RESERVATION STATS
// ============================================
function loadReservationStats() {
    const today = new Date().toISOString().split('T')[0];
    
    if (window.ReservationsDB) {
        const todayReservations = ReservationsDB.getByDate(today);
        const confirmed = todayReservations.filter(r => r.status === 'confirmed').length;
        const pending = todayReservations.filter(r => r.status === 'pending').length;
        
        document.getElementById('todayReservations').textContent = todayReservations.length;
        document.getElementById('reservationTrend').textContent = `${confirmed} confirmed, ${pending} pending`;
    } else {
        document.getElementById('todayReservations').textContent = '0';
        document.getElementById('reservationTrend').textContent = 'No reservations';
    }
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
// LOAD LOW STOCK ALERT
// ============================================
function loadLowStockAlert() {
    if (!window.MenuDB) return;
    
    const menuItems = MenuDB.getAll();
    const lowStockItems = menuItems.filter(item => item.stock < 5 && item.stock > 0);
    const outOfStock = menuItems.filter(item => item.stock === 0);
    
    if (lowStockItems.length > 0 || outOfStock.length > 0) {
        const alertDiv = document.getElementById('lowStockAlert');
        const messageEl = document.getElementById('lowStockMessage');
        
        let message = '';
        if (outOfStock.length > 0) {
            message += `${outOfStock.length} items out of stock. `;
        }
        if (lowStockItems.length > 0) {
            message += `${lowStockItems.length} items running low.`;
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
    
    if (!window.OrdersDB || !window.MenuDB) {
        container.innerHTML = '<p class="no-data">Order data not available</p>';
        return;
    }
    
    // Get all completed orders
    const orders = OrdersDB.getAll().filter(o => o.status === 'completed');
    
    // Count item occurrences
    const itemCounts = {};
    orders.forEach(order => {
        order.items?.forEach(item => {
            const key = item.id || item.name;
            itemCounts[key] = (itemCounts[key] || 0) + (item.quantity || 1);
        });
    });
    
    // Get menu items for names
    const menuItems = MenuDB.getAll();
    
    // Sort and get top 5
    const popular = Object.entries(itemCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => {
            const menuItem = menuItems.find(m => m.id == id || m.name === id);
            return {
                name: menuItem?.name || id,
                count: count,
                price: menuItem?.price || 0
            };
        });
    
    if (popular.length === 0) {
        container.innerHTML = '<p class="no-data">No order data yet</p>';
        return;
    }
    
    // Render popular items
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
// LOAD RECENT ORDERS
// ============================================
function loadRecentOrders() {
    const tableBody = document.getElementById('recentOrdersTable');
    
    if (!window.OrdersDB) {
        tableBody.innerHTML = '<tr><td colspan="6" class="error-message">Orders database not available</td></tr>';
        return;
    }
    
    const orders = OrdersDB.getAll()
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 10);
    
    if (orders.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="no-data">No orders found</td></tr>';
        return;
    }
    
    tableBody.innerHTML = orders.map(order => {
        const itemCount = order.items?.reduce((sum, i) => sum + (i.quantity || 1), 0) || 0;
        const timeAgo = getTimeAgo(new Date(order.orderDate));
        
        return `
            <tr onclick="window.location.href='order-details.html?id=${order.id}'">
                <td><span class="order-id">#${order.id}</span></td>
                <td>${order.customerName || 'Guest'}</td>
                <td>${itemCount} items</td>
                <td>${formatCurrency(order.total || 0)}</td>
                <td><span class="status-badge status-${order.status}">${order.status}</span></td>
                <td><span class="time-ago">${timeAgo}</span></td>
            </tr>
        `;
    }).join('');
}

// ============================================
// LOAD ACTIVITY TIMELINE
// ============================================
function loadActivityTimeline() {
    const timeline = document.getElementById('activityTimeline');
    
    // Collect recent activities from all sources
    const activities = [];
    
    // Add orders
    if (window.OrdersDB) {
        const orders = OrdersDB.getAll()
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, 5);
        
        orders.forEach(order => {
            activities.push({
                type: 'order',
                id: order.id,
                customer: order.customerName,
                status: order.status,
                time: new Date(order.orderDate),
                icon: getStatusIcon(order.status),
                color: getStatusColor(order.status)
            });
        });
    }
    
    // Add reservations
    if (window.ReservationsDB) {
        const reservations = ReservationsDB.getAll()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
        
        reservations.forEach(res => {
            activities.push({
                type: 'reservation',
                id: res.id,
                customer: res.customerName,
                guests: res.guests,
                time: new Date(res.createdAt),
                icon: 'fa-calendar-check',
                color: '#c49a6c'
            });
        });
    }
    
    // Sort by time (most recent first)
    activities.sort((a, b) => b.time - a.time);
    
    if (activities.length === 0) {
        timeline.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    // Render activities
    timeline.innerHTML = activities.slice(0, 10).map(activity => {
        const timeAgo = getTimeAgo(activity.time);
        
        if (activity.type === 'order') {
            return `
                <div class="timeline-item" onclick="window.location.href='order-details.html?id=${activity.id}'">
                    <div class="timeline-icon" style="background: ${activity.color}20; color: ${activity.color}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <h4>New Order #${activity.id}</h4>
                        <p>${activity.customer} placed an order</p>
                        <span class="time-ago">${timeAgo}</span>
                    </div>
                    <span class="status-badge status-${activity.status}">${activity.status}</span>
                </div>
            `;
        } else {
            return `
                <div class="timeline-item" onclick="window.location.href='reservation-details.html?id=${activity.id}'">
                    <div class="timeline-icon" style="background: ${activity.color}20; color: ${activity.color}">
                        <i class="fas ${activity.icon}"></i>
                    </div>
                    <div class="timeline-content">
                        <h4>New Reservation</h4>
                        <p>${activity.customer} booked for ${activity.guests} guests</p>
                        <span class="time-ago">${timeAgo}</span>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// ============================================
// LOAD REVENUE CHART
// ============================================
function loadRevenueChart() {
    const ctx = document.getElementById('revenueChart').getContext('2d');
    
    // Get date range from selector
    const range = document.getElementById('dateRange').value;
    currentDateRange = range;
    
    // Generate labels and data based on range
    const { labels, data } = getChartData(range);
    
    // Destroy existing chart if it exists
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
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ${formatCurrency(context.raw)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatCurrency(value);
                        }
                    }
                }
            }
        }
    });
    
    // Add event listener for date range change
    document.getElementById('dateRange').addEventListener('change', function(e) {
        loadRevenueChart();
    });
}

// ============================================
// GET CHART DATA BASED ON RANGE
// ============================================
function getChartData(range) {
    const labels = [];
    const data = [];
    
    if (!window.OrdersDB) {
        return { labels: ['No Data'], data: [0] };
    }
    
    const orders = OrdersDB.getAll().filter(o => o.status === 'completed');
    const today = new Date();
    
    switch(range) {
        case 'today':
            // Hourly data for today
            for (let i = 0; i < 24; i++) {
                const hour = i.toString().padStart(2, '0') + ':00';
                labels.push(hour);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.getHours() === i && 
                               orderDate.toDateString() === today.toDateString();
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
                data.push(revenue);
            }
            break;
            
        case 'week':
            // Daily data for this week
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            for (let i = 0; i < 7; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);
                labels.unshift(weekDays[date.getDay()]);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.toDateString() === date.toDateString();
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
                data.unshift(revenue);
            }
            break;
            
        case 'month':
            // Daily data for this month
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
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
                data.push(revenue);
            }
            break;
            
        case 'year':
            // Monthly data for this year
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            for (let i = 0; i < 12; i++) {
                labels.push(months[i]);
                
                const revenue = orders
                    .filter(o => {
                        const orderDate = new Date(o.orderDate);
                        return orderDate.getMonth() === i &&
                               orderDate.getFullYear() === today.getFullYear();
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
                
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
    
    const notifications = [];
    
    // Check for low stock
    if (window.MenuDB) {
        const lowStock = MenuDB.getLowStock?.() || [];
        lowStock.forEach(item => {
            notifications.push({
                type: 'warning',
                message: `${item.name} is running low (${item.stock} left)`,
                time: new Date(),
                link: 'menu-management.html?filter=lowstock'
            });
        });
    }
    
    // Check for pending orders
    if (window.OrdersDB) {
        const pendingOrders = OrdersDB.getByStatus?.('pending') || [];
        if (pendingOrders.length > 0) {
            notifications.push({
                type: 'info',
                message: `${pendingOrders.length} pending orders need attention`,
                time: new Date(),
                link: 'orders.html?status=pending'
            });
        }
    }
    
    // Check for today's reservations
    if (window.ReservationsDB) {
        const today = new Date().toISOString().split('T')[0];
        const todayReservations = ReservationsDB.getByDate?.(today) || [];
        if (todayReservations.length > 0) {
            notifications.push({
                type: 'info',
                message: `${todayReservations.length} reservations for today`,
                time: new Date(),
                link: 'reservations.html'
            });
        }
    }
    
    // Update notification count
    notificationCount.textContent = notifications.length;
    notificationCount.style.display = notifications.length > 0 ? 'block' : 'none';
    
    // Render notifications
    if (notifications.length === 0) {
        notificationsList.innerHTML = '<p class="no-notifications">No new notifications</p>';
        return;
    }
    
    notificationsList.innerHTML = notifications
        .sort((a, b) => b.time - a.time)
        .map(notif => `
            <div class="notification-item ${notif.type}" onclick="window.location.href='${notif.link}'">
                <i class="fas ${notif.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}"></i>
                <div class="notification-content">
                    <p>${notif.message}</p>
                    <span class="time-ago">${getTimeAgo(notif.time)}</span>
                </div>
            </div>
        `).join('');
}

// ============================================
// PERFORM GLOBAL SEARCH
// ============================================
function performGlobalSearch(term) {
    const results = [];
    
    // Search orders
    if (window.OrdersDB) {
        const orders = OrdersDB.getAll();
        orders.forEach(order => {
            if (order.id?.toLowerCase().includes(term) ||
                order.customerName?.toLowerCase().includes(term)) {
                results.push({
                    type: 'order',
                    id: order.id,
                    name: `Order #${order.id}`,
                    customer: order.customerName,
                    link: `order-details.html?id=${order.id}`
                });
            }
        });
    }
    
    // Search users
    if (window.UsersDB) {
        const users = UsersDB.getAll();
        users.forEach(user => {
            if (user.name?.toLowerCase().includes(term) ||
                user.email?.toLowerCase().includes(term)) {
                results.push({
                    type: 'user',
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    link: `user-details.html?id=${user.id}`
                });
            }
        });
    }
    
    // Search menu items
    if (window.MenuDB) {
        const items = MenuDB.getAll();
        items.forEach(item => {
            if (item.name?.toLowerCase().includes(term)) {
                results.push({
                    type: 'menu',
                    id: item.id,
                    name: item.name,
                    link: `menu-management.html?edit=${item.id}`
                });
            }
        });
    }
    
    // Display results (you can implement a dropdown here)
    console.log('Search results:', results);
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
    }).format(amount).replace('ETB', '') + ' ETB';
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
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
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
        'completed': '#2e7d32',
        'cancelled': '#d32f2f'
    };
    return colors[status] || '#757575';
}

function showErrorMessage(message) {
    const container = document.getElementById('notificationContainer');
    if (container && typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        alert(message);
    }
}

// ============================================
// AUTO-REFRESH (every 30 seconds)
// ============================================
setInterval(() => {
    if (document.visibilityState === 'visible') {
        console.log('🔄 Auto-refreshing dashboard data...');
        loadDashboardData();
    }
}, 30000);

// Make functions globally available
window.loadDashboardData = loadDashboardData;