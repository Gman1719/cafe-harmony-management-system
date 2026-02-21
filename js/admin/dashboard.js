// js/admin/dashboard.js - Admin Dashboard Logic
// Markan Cafe - Debre Birhan University

let salesChart = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load dashboard data
    await loadDashboardData();
    
    // Initialize chart
    initSalesChart();
    
    // Setup refresh button
    setupRefreshButton();
});

async function loadDashboardData() {
    try {
        // Show loading states
        showLoading();
        
        // Get dashboard stats
        const stats = await API.dashboard.getAdminStats();
        
        // Update metrics
        updateMetrics(stats);
        
        // Load recent orders
        await loadRecentOrders();
        
        // Load popular items
        loadPopularItems(stats.popularItems);
        
        // Update date
        updateDate();
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

function updateMetrics(stats) {
    const metrics = {
        todayRevenue: document.getElementById('todayRevenue'),
        totalOrders: document.getElementById('totalOrders'),
        totalCustomers: document.getElementById('totalCustomers'),
        menuItems: document.getElementById('menuItems'),
        pendingOrders: document.getElementById('pendingOrders'),
        todayReservations: document.getElementById('todayReservations')
    };
    
    if (metrics.todayRevenue) {
        metrics.todayRevenue.textContent = formatCurrency(stats.todayRevenue || 0);
    }
    
    if (metrics.totalOrders) {
        metrics.totalOrders.textContent = stats.totalOrders || 0;
    }
    
    if (metrics.totalCustomers) {
        metrics.totalCustomers.textContent = stats.totalUsers || 0;
    }
    
    if (metrics.menuItems) {
        metrics.menuItems.textContent = stats.totalMenuItems || 0;
    }
    
    if (metrics.pendingOrders) {
        metrics.pendingOrders.textContent = stats.pendingOrders || 0;
    }
    
    if (metrics.todayReservations) {
        metrics.todayReservations.textContent = stats.totalReservations || 0;
    }
}

async function loadRecentOrders() {
    const container = document.getElementById('recentOrdersTable');
    if (!container) return;
    
    try {
        const orders = await API.orders.getRecent(5);
        
        container.innerHTML = orders.map(order => `
            <tr>
                <td>${order.id}</td>
                <td>${order.customerName}</td>
                <td>${order.items.length} items</td>
                <td>${formatCurrency(order.total)}</td>
                <td><span class="status-badge ${order.status}">${order.status}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load recent orders:', error);
        container.innerHTML = '<tr><td colspan="6">Failed to load orders</td></tr>';
    }
}

function loadPopularItems(items) {
    const container = document.getElementById('popularItemsList');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '<p class="no-data">No data available</p>';
        return;
    }
    
    container.innerHTML = items.map((item, index) => `
        <div class="popular-item">
            <span class="rank">#${index + 1}</span>
            <div class="item-info">
                <h4>${item.name}</h4>
                <p>${item.count} orders</p>
            </div>
        </div>
    `).join('');
}

function initSalesChart() {
    const ctx = document.getElementById('salesChart')?.getContext('2d');
    if (!ctx) return;
    
    // Generate last 7 days labels
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
        
        // Generate random sales data for demo
        data.push(Math.floor(Math.random() * 500) + 200);
    }
    
    salesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Sales (ETB)',
                data: data,
                borderColor: '#8B4513',
                backgroundColor: 'rgba(139, 69, 19, 0.1)',
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
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return 'ETB ' + value;
                        }
                    }
                }
            }
        }
    });
}

function updateDate() {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

window.viewOrder = function(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
};

async function refreshDashboard() {
    await loadDashboardData();
    
    // Update chart with new random data
    if (salesChart) {
        const newData = [];
        for (let i = 0; i < 7; i++) {
            newData.push(Math.floor(Math.random() * 500) + 200);
        }
        salesChart.data.datasets[0].data = newData;
        salesChart.update();
    }
    
    showNotification('Dashboard refreshed', 'success');
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshDashboard);
    }
}