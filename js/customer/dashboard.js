// js/customer/dashboard.js - Customer Dashboard Logic
// Markan Cafe - Debre Birhan University

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Load dashboard data
    await loadDashboardData();
});

async function loadDashboardData() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        // Get customer stats
        const stats = await API.dashboard.getCustomerStats(user.id);
        
        // Update stats
        updateStats(stats);
        
        // Load recommended items
        await loadRecommendedItems();
        
        // Load recent orders
        await loadRecentOrders();
        
    } catch (error) {
        console.error('Failed to load dashboard:', error);
        showNotification('Failed to load dashboard data', 'error');
    }
}

function updateStats(stats) {
    const elements = {
        pendingOrders: document.getElementById('pendingOrders'),
        completedOrders: document.getElementById('completedOrders'),
        totalSpent: document.getElementById('totalSpent'),
        upcomingReservations: document.getElementById('upcomingReservations')
    };
    
    if (elements.pendingOrders) {
        elements.pendingOrders.textContent = stats.pendingOrders || 0;
    }
    
    if (elements.completedOrders) {
        elements.completedOrders.textContent = stats.completedOrders || 0;
    }
    
    if (elements.totalSpent) {
        elements.totalSpent.textContent = formatCurrency(stats.totalSpent || 0);
    }
    
    if (elements.upcomingReservations) {
        elements.upcomingReservations.textContent = stats.upcomingReservations || 0;
    }
}

async function loadRecommendedItems() {
    const container = document.getElementById('recommendedItems');
    if (!container) return;
    
    try {
        const items = await API.menu.getPopular(4);
        
        if (items.length === 0) {
            container.innerHTML = '<p class="no-items">No recommendations available</p>';
            return;
        }
        
        container.innerHTML = items.map(item => `
            <div class="menu-card" onclick="window.location.href='menu.html?id=${item.id}'">
                <div class="menu-card-image" style="background-image: url('${item.image}')">
                    ${item.popular ? '<span class="menu-card-badge">Popular</span>' : ''}
                </div>
                <div class="menu-card-content">
                    <h3>${item.name}</h3>
                    <p class="menu-card-description">${item.description.substring(0, 50)}...</p>
                    <div class="menu-card-footer">
                        <span class="price">$${item.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-small" onclick="addToCart(${JSON.stringify(item).replace(/"/g, '&quot;')}); event.stopPropagation();">
                            Add to Cart
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load recommendations:', error);
    }
}

async function loadRecentOrders() {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        const orders = await API.orders.getByCustomerId(user.id);
        const recentOrders = orders.slice(0, 5);
        
        if (recentOrders.length === 0) {
            container.innerHTML = '<p class="no-orders">No recent orders</p>';
            return;
        }
        
        container.innerHTML = recentOrders.map(order => `
            <div class="order-item">
                <div class="order-header">
                    <span class="order-id">${order.id}</span>
                    <span class="order-status ${order.status}">${order.status}</span>
                </div>
                <div class="order-date">${formatDate(order.orderDate)}</div>
                <div class="order-total">Total: ${formatCurrency(order.total)}</div>
                <div class="order-actions">
                    <button class="btn btn-outline btn-small" onclick="viewOrder('${order.id}')">
                        View Details
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

window.viewOrder = function(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
};

// Update user name
const userNameElement = document.getElementById('userName');
if (userNameElement) {
    const user = Auth.getCurrentUser();
    if (user) {
        userNameElement.textContent = user.name.split(' ')[0];
    }
}