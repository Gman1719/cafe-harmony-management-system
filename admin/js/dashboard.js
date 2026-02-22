// admin/js/dashboard.js
// Markan Cafe Admin - Dashboard
// All data is loaded dynamically from localStorage - NO HARDCODED VALUES

// ===== GLOBAL VARIABLES =====
let updateInterval;
let revenueChart;
let allOrders = [];
let allReservations = [];
let allMenu = [];
let notifications = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load all data
    loadDashboardData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize charts
    initializeCharts();
    
    // Start real-time updates
    startRealTimeUpdates();
    
    // Update admin name
    updateAdminName();
});

// ===== LOAD ALL DASHBOARD DATA =====
function loadDashboardData() {
    try {
        // Load data from localStorage
        allOrders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        allReservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        allMenu = JSON.parse(localStorage.getItem('markanMenu')) || [];
        
        // Update all dashboard sections
        updateStats();
        checkLowStock();
        loadPopularItems();
        loadRecentOrders();
        loadActivityTimeline();
        loadNotifications();
        updateCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

// ===== UPDATE STATISTICS CARDS =====
function updateStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate pending orders
    const pendingOrders = allOrders.filter(o => o.status === 'pending').length;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    
    // Calculate completed orders
    const completedOrders = allOrders.filter(o => o.status === 'completed').length;
    document.getElementById('completedOrders').textContent = completedOrders;
    
    // Calculate today's reservations
    const todayReservations = allReservations.filter(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime() && r.status !== 'cancelled';
    }).length;
    document.getElementById('todayReservations').textContent = todayReservations;
    
    // Calculate today's revenue
    const todayRevenue = allOrders
        .filter(o => {
            if (o.status !== 'completed') return false;
            const orderDate = new Date(o.completedDate || o.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('todayRevenue').textContent = formatETB(todayRevenue);
    
    // Update trends
    updateTrends();
}

// ===== UPDATE TRENDS =====
function updateTrends() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Calculate yesterday's completed orders
    const yesterdayCompleted = allOrders.filter(o => {
        if (o.status !== 'completed') return false;
        const orderDate = new Date(o.completedDate || o.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === yesterday.getTime();
    }).length;
    
    // Calculate today's completed orders
    const todayCompleted = allOrders.filter(o => {
        if (o.status !== 'completed') return false;
        const orderDate = new Date(o.completedDate || o.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === today.getTime();
    }).length;
    
    // Calculate completed trend
    const completedDiff = todayCompleted - yesterdayCompleted;
    const completedTrend = document.getElementById('completedTrend');
    if (completedDiff > 0) {
        completedTrend.textContent = `+${completedDiff} from yesterday`;
        completedTrend.className = 'stat-trend positive';
    } else if (completedDiff < 0) {
        completedTrend.textContent = `${completedDiff} from yesterday`;
        completedTrend.className = 'stat-trend negative';
    } else {
        completedTrend.textContent = 'Same as yesterday';
        completedTrend.className = 'stat-trend';
    }
    
    // Calculate yesterday's revenue
    const yesterdayRevenue = allOrders
        .filter(o => {
            if (o.status !== 'completed') return false;
            const orderDate = new Date(o.completedDate || o.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === yesterday.getTime();
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate today's revenue
    const todayRevenue = allOrders
        .filter(o => {
            if (o.status !== 'completed') return false;
            const orderDate = new Date(o.completedDate || o.orderDate);
            orderDate.setHours(0, 0, 0, 0);
            return orderDate.getTime() === today.getTime();
        })
        .reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate revenue trend
    const revenueDiff = todayRevenue - yesterdayRevenue;
    const revenueTrend = document.getElementById('revenueTrend');
    if (revenueDiff > 0) {
        revenueTrend.textContent = `+${formatETB(revenueDiff)} from yesterday`;
        revenueTrend.className = 'stat-trend positive';
    } else if (revenueDiff < 0) {
        revenueTrend.textContent = `${formatETB(revenueDiff)} from yesterday`;
        revenueTrend.className = 'stat-trend negative';
    } else {
        revenueTrend.textContent = 'Same as yesterday';
        revenueTrend.className = 'stat-trend';
    }
    
    // Update pending trend (based on change in pending orders from yesterday)
    const yesterdayPending = allOrders.filter(o => {
        if (o.status !== 'pending') return false;
        const orderDate = new Date(o.orderDate);
        orderDate.setHours(0, 0, 0, 0);
        return orderDate.getTime() === yesterday.getTime() || orderDate.getTime() === today.getTime();
    }).length;
    
    const todayPending = allOrders.filter(o => o.status === 'pending').length;
    const pendingDiff = todayPending - yesterdayPending;
    const pendingTrend = document.getElementById('pendingTrend');
    
    if (pendingDiff > 0) {
        pendingTrend.textContent = `+${pendingDiff} from yesterday`;
        pendingTrend.className = 'stat-trend negative'; // More pending is negative
    } else if (pendingDiff < 0) {
        pendingTrend.textContent = `${pendingDiff} from yesterday`;
        pendingTrend.className = 'stat-trend positive'; // Less pending is positive
    } else {
        pendingTrend.textContent = 'Same as yesterday';
        pendingTrend.className = 'stat-trend';
    }
    
    // Update reservation trend
    const yesterdayReservations = allReservations.filter(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === yesterday.getTime() && r.status !== 'cancelled';
    }).length;
    
    const todayReservations = allReservations.filter(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime() && r.status !== 'cancelled';
    }).length;
    
    const reservationStatus = document.getElementById('reservationTrend');
    const confirmedToday = allReservations.filter(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime() && r.status === 'confirmed';
    }).length;
    
    const pendingToday = allReservations.filter(r => {
        const resDate = new Date(r.date);
        resDate.setHours(0, 0, 0, 0);
        return resDate.getTime() === today.getTime() && r.status === 'pending';
    }).length;
    
    reservationStatus.textContent = `${confirmedToday} confirmed, ${pendingToday} pending`;
}

// ===== CHECK LOW STOCK =====
function checkLowStock() {
    const lowStockItems = allMenu.filter(item => 
        item.stock < 5 && 
        item.stock > 0 && 
        item.status === 'available'
    );
    
    const alertDiv = document.getElementById('lowStockAlert');
    const messageSpan = document.getElementById('lowStockMessage');
    
    if (lowStockItems.length > 0) {
        alertDiv.style.display = 'flex';
        messageSpan.textContent = `${lowStockItems.length} item${lowStockItems.length > 1 ? 's are' : ' is'} running low on stock`;
        
        // Create tooltip with item names
        const itemList = lowStockItems.map(i => `${i.name} (${i.stock} left)`).join('\n');
        alertDiv.title = itemList;
    } else {
        alertDiv.style.display = 'none';
    }
}

// ===== LOAD POPULAR ITEMS =====
function loadPopularItems() {
    const itemCounts = {};
    
    // Count item occurrences in completed orders
    allOrders
        .filter(o => o.status === 'completed')
        .forEach(order => {
            order.items?.forEach(item => {
                const key = item.id || item.name;
                if (itemCounts[key]) {
                    itemCounts[key].count += item.quantity;
                    itemCounts[key].revenue += (item.price * item.quantity);
                } else {
                    itemCounts[key] = {
                        name: item.name,
                        count: item.quantity,
                        revenue: item.price * item.quantity,
                        category: item.category || 'Item'
                    };
                }
            });
        });
    
    // Get top 5 items
    const popularItems = Object.values(itemCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    
    const container = document.getElementById('popularItems');
    
    if (popularItems.length === 0) {
        container.innerHTML = '<p class="no-data">No sales data available</p>';
        return;
    }
    
    container.innerHTML = popularItems.map(item => {
        const totalCount = Object.values(itemCounts).reduce((sum, i) => sum + i.count, 0);
        const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
        
        return `
            <div class="popular-item">
                <div class="popular-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.category}</p>
                </div>
                <div class="popular-item-stats">
                    <span class="count">${item.count} sold</span>
                    <span class="percentage">${percentage}%</span>
                </div>
            </div>
        `;
    }).join('');
}

// ===== LOAD RECENT ORDERS =====
function loadRecentOrders() {
    const recentOrders = allOrders
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 5);
    
    const tbody = document.getElementById('recentOrdersTable');
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center">
                    <div class="no-data">
                        <i class="fas fa-clipboard-list"></i>
                        <p>No orders yet</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => `
        <tr onclick="window.location.href='orders.html?view=${order.id}'" style="cursor: pointer;">
            <td><strong>${order.id}</strong></td>
            <td>${order.customerName || 'Guest'}</td>
            <td>${order.items?.length || 0} items</td>
            <td>${formatETB(order.total || 0)}</td>
            <td>
                <span class="status-badge ${order.status || 'pending'}">
                    ${order.status || 'pending'}
                </span>
            </td>
            <td>${timeAgo(order.orderDate)}</td>
        </tr>
    `).join('');
}

// ===== LOAD ACTIVITY TIMELINE =====
function loadActivityTimeline() {
    // Create activities from orders and reservations
    const activities = [
        ...allOrders.map(o => ({
            type: 'order',
            action: 'New order placed',
            description: `Order ${o.id} by ${o.customerName || 'Guest'}`,
            time: o.orderDate,
            icon: 'shopping-cart',
            color: '#8B4513'
        })),
        ...allReservations.map(r => ({
            type: 'reservation',
            action: 'New reservation',
            description: `Table for ${r.guests} by ${r.customerName}`,
            time: r.createdAt || r.orderDate,
            icon: 'calendar-check',
            color: '#2E7D32'
        }))
    ];
    
    // Sort by time and get recent 10
    const recentActivities = activities
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10);
    
    const container = document.getElementById('activityTimeline');
    
    if (recentActivities.length === 0) {
        container.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recentActivities.map(activity => `
        <div class="timeline-item">
            <div class="timeline-icon ${activity.type}" style="background: ${activity.color}20; color: ${activity.color};">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="timeline-content">
                <p><strong>${activity.action}</strong></p>
                <p>${activity.description}</p>
                <small>${timeAgo(activity.time)}</small>
            </div>
        </div>
    `).join('');
}

// ===== LOAD NOTIFICATIONS =====
function loadNotifications() {
    notifications = [];
    
    // Check for low stock
    const lowStockItems = allMenu.filter(item => 
        item.stock < 5 && 
        item.stock > 0 && 
        item.status === 'available'
    );
    
    lowStockItems.forEach(item => {
        notifications.push({
            type: 'warning',
            title: 'Low Stock Alert',
            message: `${item.name} is low on stock (${item.stock} left)`,
            time: new Date().toISOString(),
            read: false
        });
    });
    
    // Check for pending orders
    const pendingOrders = allOrders.filter(o => o.status === 'pending');
    if (pendingOrders.length > 0) {
        notifications.push({
            type: 'info',
            title: 'Pending Orders',
            message: `You have ${pendingOrders.length} pending order${pendingOrders.length > 1 ? 's' : ''}`,
            time: new Date().toISOString(),
            read: false
        });
    }
    
    // Check for pending reservations
    const pendingReservations = allReservations.filter(r => r.status === 'pending');
    if (pendingReservations.length > 0) {
        notifications.push({
            type: 'info',
            title: 'Pending Reservations',
            message: `${pendingReservations.length} reservation${pendingReservations.length > 1 ? 's' : ''} pending approval`,
            time: new Date().toISOString(),
            read: false
        });
    }
    
    // Update notification badge
    updateNotificationBadge();
    
    // Display notifications in dropdown
    displayNotifications();
}

// ===== UPDATE NOTIFICATION BADGE =====
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// ===== DISPLAY NOTIFICATIONS =====
function displayNotifications() {
    const list = document.getElementById('notificationsList');
    if (!list) return;
    
    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="no-data" style="padding: 20px;">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }
    
    list.innerHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}" 
             onclick="markNotificationRead(${notifications.indexOf(notification)})">
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <small>${timeAgo(notification.time)}</small>
            </div>
            ${!notification.read ? '<span class="unread-dot"></span>' : ''}
        </div>
    `).join('');
}

// ===== MARK NOTIFICATION AS READ =====
window.markNotificationRead = function(index) {
    if (notifications[index]) {
        notifications[index].read = true;
        updateNotificationBadge();
        displayNotifications();
    }
}

// ===== MARK ALL NOTIFICATIONS AS READ =====
document.getElementById('markAllRead')?.addEventListener('click', function() {
    notifications.forEach(n => n.read = true);
    updateNotificationBadge();
    displayNotifications();
    showNotification('All notifications marked as read', 'success');
});

// ===== INITIALIZE CHARTS =====
function initializeCharts() {
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (!revenueCtx) return;
    
    revenueChart = new Chart(revenueCtx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Revenue (ETB)',
                data: [],
                borderColor: '#8B4513',
                backgroundColor: 'rgba(139,69,19,0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#FFD700',
                pointBorderColor: '#8B4513',
                pointBorderWidth: 2,
                pointRadius: 5,
                pointHoverRadius: 7,
                tension: 0.4,
                fill: true
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
                            return formatETB(context.raw);
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return formatETB(value);
                        }
                    },
                    grid: {
                        color: 'rgba(255,255,255,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// ===== UPDATE CHARTS =====
function updateCharts() {
    if (!revenueChart) return;
    
    // Get date range from selector
    const range = document.getElementById('dateRange')?.value || 'month';
    
    let labels = [];
    let revenueData = [];
    
    switch(range) {
        case 'today':
            // Show hourly data for today
            labels = getHoursArray();
            revenueData = labels.map(hour => {
                const start = new Date();
                start.setHours(hour, 0, 0, 0);
                const end = new Date();
                end.setHours(hour, 59, 59, 999);
                
                return allOrders
                    .filter(o => {
                        if (o.status !== 'completed') return false;
                        const orderDate = new Date(o.completedDate || o.orderDate);
                        return orderDate >= start && orderDate <= end;
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
            });
            break;
            
        case 'week':
            // Show daily data for last 7 days
            labels = getLast7Days().map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
            revenueData = getLast7Days().map(day => {
                return allOrders
                    .filter(o => {
                        if (o.status !== 'completed') return false;
                        const orderDate = new Date(o.completedDate || o.orderDate);
                        return orderDate.toDateString() === day.toDateString();
                    })
                    .reduce((sum, o) => sum + (o.total || 0), 0);
            });
            break;
            
        case 'month':
            // Show weekly data for last 4 weeks
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            revenueData = [0, 0, 0, 0];
            
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            
            allOrders
                .filter(o => o.status === 'completed')
                .forEach(o => {
                    const orderDate = new Date(o.completedDate || o.orderDate);
                    if (orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear()) {
                        const weekIndex = Math.floor((orderDate.getDate() - 1) / 7);
                        if (weekIndex >= 0 && weekIndex < 4) {
                            revenueData[weekIndex] += o.total || 0;
                        }
                    }
                });
            break;
            
        case 'year':
            // Show monthly data for last 12 months
            labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenueData = new Array(12).fill(0);
            
            const currentYear = new Date().getFullYear();
            
            allOrders
                .filter(o => o.status === 'completed')
                .forEach(o => {
                    const orderDate = new Date(o.completedDate || o.orderDate);
                    if (orderDate.getFullYear() === currentYear) {
                        revenueData[orderDate.getMonth()] += o.total || 0;
                    }
                });
            break;
    }
    
    revenueChart.data.labels = labels;
    revenueChart.data.datasets[0].data = revenueData;
    revenueChart.update();
}

// ===== HELPER: GET HOURS ARRAY =====
function getHoursArray() {
    const hours = [];
    for (let i = 0; i < 24; i++) {
        hours.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return hours;
}

// ===== HELPER: GET LAST 7 DAYS =====
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        days.push(day);
    }
    return days;
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Date range change
    document.getElementById('dateRange')?.addEventListener('change', function(e) {
        updateCharts();
        showNotification(`Showing data for: ${e.target.value}`, 'info');
    });
    
    // Global search
    document.getElementById('globalSearch')?.addEventListener('input', debounce(function(e) {
        const query = e.target.value.toLowerCase();
        if (query.length < 2) return;
        
        // Search in orders
        const orderResults = allOrders.filter(o => 
            o.id?.toLowerCase().includes(query) ||
            o.customerName?.toLowerCase().includes(query) ||
            o.customerEmail?.toLowerCase().includes(query)
        );
        
        if (orderResults.length > 0) {
            showNotification(`Found ${orderResults.length} matching orders`, 'success');
        }
    }, 500));
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanOrders' || e.key === 'markanReservations' || e.key === 'markanMenu') {
            loadDashboardData();
        }
    });
}

// ===== REAL-TIME UPDATES =====
function startRealTimeUpdates() {
    // Update every 30 seconds
    updateInterval = setInterval(() => {
        loadDashboardData();
    }, 30000);
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
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

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}