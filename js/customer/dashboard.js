// customer/js/dashboard.js - Customer Dashboard Logic
// Markan Cafe - Debre Birhan University

document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    updateCartCount();
});

// Load dashboard data
function loadDashboardData() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Get orders from localStorage
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const userOrders = orders.filter(o => o.customerId === user.id);

    // Calculate stats
    const pendingOrders = userOrders.filter(o => o.status === 'pending').length;
    const completedOrders = userOrders.filter(o => o.status === 'completed').length;
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Update stats
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('completedOrders').textContent = completedOrders;
    document.getElementById('totalSpent').textContent = formatCurrency(totalSpent);

    // Load recommended items
    loadRecommendedItems();
    
    // Load recent orders
    loadRecentOrders(userOrders);
}

// Load recommended items
function loadRecommendedItems() {
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    const recommended = menuItems.filter(item => item.popular).slice(0, 4);
    
    const container = document.getElementById('recommendedItems');
    if (!container) return;

    if (recommended.length === 0) {
        container.innerHTML = '<p class="no-items">No recommendations available</p>';
        return;
    }

    container.innerHTML = recommended.map(item => `
        <div class="menu-card" onclick="window.location.href='menu.html?id=${item.id}'">
            <div class="menu-card-image" style="background-image: url('${item.image || 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Food'}')">
                <span class="menu-card-badge">Popular</span>
            </div>
            <div class="menu-card-content">
                <h3 class="menu-card-title">${item.name}</h3>
                <p class="menu-card-description">${item.description.substring(0, 60)}...</p>
                <div class="menu-card-footer">
                    <span class="menu-card-price">$${item.price.toFixed(2)}</span>
                    <button class="btn-small" onclick="addToCartFromCard(${item.id}); event.stopPropagation();">
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Load recent orders
function loadRecentOrders(orders) {
    const container = document.getElementById('recentOrdersList');
    if (!container) return;

    const recent = orders.slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = '<p class="no-orders">No recent orders</p>';
        return;
    }

    container.innerHTML = recent.map(order => `
        <div class="order-item" onclick="viewOrder('${order.id}')">
            <div class="order-header">
                <span class="order-id">${order.id}</span>
                <span class="order-status ${order.status}">${order.status}</span>
            </div>
            <div class="order-date">${new Date(order.orderDate).toLocaleDateString()}</div>
            <div class="order-total">Total: $${(order.total || 0).toFixed(2)}</div>
        </div>
    `).join('');
}

// Add to cart from card
window.addToCartFromCard = function(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    const item = menuItems.find(i => i.id === itemId);
    if (item) {
        addToCart(item, 1);
    }
};

// View order
window.viewOrder = function(orderId) {
    window.location.href = `orders.html?id=${orderId}`;
};

// Update cart count
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('markanCart')) || [];
    const count = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badge = document.getElementById('cartCount');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}