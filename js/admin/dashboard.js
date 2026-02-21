// js/admin/dashboard.js - Admin Dashboard Logic
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let revenueChart = null;
let orderChart = null;
let dashboardStats = {};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    updateAdminName();
    setupEventListeners();
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

// Load all dashboard data
async function loadDashboardData() {
    try {
        showLoading();
        
        // Get stats from localStorage or use defaults
        const stats = await getDashboardStats();
        dashboardStats = stats;
        
        // Update stats cards
        updateStatsCards(stats);
        
        // Load recent orders
        loadRecentOrders();
        
        // Initialize charts
        initRevenueChart(stats.revenueData);
        initOrderChart(stats.orderStatus);
        
        hideLoading();
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
        hideLoading();
    }
}

// Get dashboard statistics
async function getDashboardStats() {
    // Try to get from localStorage first
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    // Calculate today's revenue
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.orderDate).toDateString() === today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Calculate order status counts
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    
    // Generate revenue data for last 7 days
    const revenueData = [];
    const labels = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        const dayOrders = orders.filter(o => 
            new Date(o.orderDate).toDateString() === date.toDateString()
        );
        const dayRevenue = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        revenueData.push(dayRevenue);
    }
    
    return {
        todayRevenue: todayRevenue,
        totalOrders: orders.length,
        totalCustomers: users.filter(u => u.role === 'customer').length,
        menuItems: menuItems.length,
        pendingOrders: pendingOrders,
        preparingOrders: preparingOrders,
        completedOrders: completedOrders,
        revenueData: revenueData,
        revenueLabels: labels,
        orderStatus: [completedOrders, preparingOrders, pendingOrders]
    };
}

// Update statistics cards
function updateStatsCards(stats) {
    const elements = {
        todayRevenue: document.getElementById('todayRevenue'),
        totalOrders: document.getElementById('totalOrders'),
        totalCustomers: document.getElementById('totalCustomers'),
        menuItems: document.getElementById('menuItems'),
        pendingOrders: document.getElementById('pendingOrders'),
        todayReservations: document.getElementById('todayReservations')
    };
    
    if (elements.todayRevenue) {
        elements.todayRevenue.textContent = formatCurrency(stats.todayRevenue || 0);
    }
    
    if (elements.totalOrders) {
        elements.totalOrders.textContent = stats.totalOrders || 0;
    }
    
    if (elements.totalCustomers) {
        elements.totalCustomers.textContent = stats.totalCustomers || 0;
    }
    
    if (elements.menuItems) {
        elements.menuItems.textContent = stats.menuItems || 0;
    }
    
    if (elements.pendingOrders) {
        elements.pendingOrders.textContent = stats.pendingOrders || 0;
    }
}

// Load recent orders
function loadRecentOrders() {
    const tbody = document.getElementById('recentOrdersTable');
    if (!tbody) return;
    
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const recentOrders = orders.slice(0, 5);
    
    if (recentOrders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No recent orders</td></tr>';
        return;
    }
    
    tbody.innerHTML = recentOrders.map(order => `
        <tr>
            <td>${order.id || 'N/A'}</td>
            <td>${order.customerName || 'Guest'}</td>
            <td>${order.items ? order.items.length : 0} items</td>
            <td>${formatCurrency(order.total || 0)}</td>
            <td><span class="status-badge ${order.status || 'pending'}">${order.status || 'pending'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Initialize revenue chart
function initRevenueChart(data) {
    const ctx = document.getElementById('revenueChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (revenueChart) {
        revenueChart.destroy();
    }
    
    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Revenue ($)',
                data: data || [450, 520, 480, 610, 590, 720, 680],
                borderColor: '#8B4513',
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
                tension: 0.4,
                fill: true,
                pointBackgroundColor: '#8B4513',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 4
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
                            return `$${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        }
                    }
                }
            }
        }
    });
}

// Initialize order status chart
function initOrderChart(data) {
    const ctx = document.getElementById('orderChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (orderChart) {
        orderChart.destroy();
    }
    
    orderChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Preparing', 'Pending'],
            datasets: [{
                data: data || [65, 25, 10],
                backgroundColor: ['#4CAF50', '#FF9800', '#2196F3'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        pointStyle: 'circle'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} orders (${percentage}%)`;
                        }
                    }
                }
            },
            cutout: '60%'
        }
    });
}

// View order details
window.viewOrder = function(orderId) {
    if (orderId) {
        window.location.href = `orders.html?id=${orderId}`;
    }
};

// Refresh dashboard
window.refreshDashboard = async function() {
    showNotification('Refreshing dashboard...', 'info');
    await loadDashboardData();
    showNotification('Dashboard refreshed', 'success');
};

// Show loading state
function showLoading() {
    const statsCards = document.querySelectorAll('.stat-card h3');
    statsCards.forEach(card => {
        if (card) {
            card.style.opacity = '0.5';
        }
    });
}

// Hide loading state
function hideLoading() {
    const statsCards = document.querySelectorAll('.stat-card h3');
    statsCards.forEach(card => {
        if (card) {
            card.style.opacity = '1';
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }
}

// Export functions for use in HTML
window.loadDashboardData = loadDashboardData;