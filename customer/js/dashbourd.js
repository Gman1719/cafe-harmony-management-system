// customer/js/dashboard.js
// Markan Cafe - Customer Dashboard

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    loadDashboardData();
    loadRecentActivity();
    checkQuickReorder();
    updateCartCount();
    setupEventListeners();
});

// Load all dashboard data
function loadDashboardData() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Set user info
    document.getElementById('userName').textContent = user.name.split(' ')[0];
    document.getElementById('userGreeting').textContent = `Hi, ${user.name.split(' ')[0]}`;
    
    // Format join date
    const joinDate = user.createdAt ? new Date(user.createdAt) : new Date();
    document.getElementById('memberSince').textContent = joinDate.getFullYear();
    
    // Set loyalty tier based on order count
    setLoyaltyTier(user.id);
    
    // Load stats
    loadUserStats(user.id);
}

// Set loyalty tier
function setLoyaltyTier(userId) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const userOrders = orders.filter(o => o.customerId == userId && o.status === 'completed');
    const orderCount = userOrders.length;
    
    let tier = 'Bronze';
    let icon = '🥉';
    
    if (orderCount >= 20) {
        tier = 'Gold';
        icon = '🥇';
    } else if (orderCount >= 10) {
        tier = 'Silver';
        icon = '🥈';
    } else if (orderCount >= 5) {
        tier = 'Bronze';
        icon = '🥉';
    }
    
    document.getElementById('loyaltyTier').innerHTML = `${icon} ${tier} Tier (${orderCount} orders)`;
}

// Load user statistics
function loadUserStats(userId) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    
    // Filter orders for this user
    const userOrders = orders.filter(o => o.customerId == userId);
    const userReservations = reservations.filter(r => r.customerId == userId);
    
    // Calculate stats
    const totalOrders = userOrders.length;
    const pendingOrders = userOrders.filter(o => o.status === 'pending' || o.status === 'preparing').length;
    const totalReservations = userReservations.length;
    
    // Get upcoming reservations (future dates)
    const now = new Date();
    const upcomingReservations = userReservations.filter(r => {
        if (r.status === 'cancelled') return false;
        const resDate = new Date(r.date + 'T' + r.time);
        return resDate > now;
    }).length;
    
    // Update UI
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('pendingOrders').textContent = pendingOrders;
    document.getElementById('totalReservations').textContent = totalReservations;
    document.getElementById('upcomingReservations').textContent = upcomingReservations;
}

// Load recent activity
function loadRecentActivity() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Load recent orders
    loadRecentOrders(user.id);
    
    // Load recent reservations
    loadRecentReservations(user.id);
}

// Load recent orders
function loadRecentOrders(userId) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const userOrders = orders
        .filter(o => o.customerId == userId)
        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
        .slice(0, 3);
    
    const container = document.getElementById('recentOrdersTab');
    
    if (userOrders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-shopping-bag"></i>
                <h3>No orders yet</h3>
                <p>Start by ordering our delicious Ethiopian coffee!</p>
                <a href="menu.html" class="btn-small">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userOrders.map(order => `
        <div class="activity-item order" onclick="window.location.href='orders.html?id=${order.id}'">
            <i class="fas fa-shopping-bag"></i>
            <div class="activity-details">
                <h4>Order #${order.id}</h4>
                <p>${order.items?.length || 0} items • ${formatETB(order.total || 0)}</p>
            </div>
            <span class="activity-status ${order.status || 'pending'}">${order.status || 'pending'}</span>
            <span class="activity-time">${formatTimeAgo(order.orderDate)}</span>
        </div>
    `).join('');
}

// Load recent reservations
function loadRecentReservations(userId) {
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    const userReservations = reservations
        .filter(r => r.customerId == userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 3);
    
    const container = document.getElementById('recentReservationsTab');
    
    if (userReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No reservations yet</h3>
                <p>Book a table for your next visit!</p>
                <a href="reservations.html" class="btn-small">Make Reservation</a>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userReservations.map(res => `
        <div class="activity-item reservation" onclick="window.location.href='reservations.html?id=${res.id}'">
            <i class="fas fa-calendar-check"></i>
            <div class="activity-details">
                <h4>Reservation for ${res.guests}</h4>
                <p>${formatDate(res.date)} at ${res.time}</p>
            </div>
            <span class="activity-status ${res.status || 'pending'}">${res.status || 'pending'}</span>
            <span class="activity-time">${formatTimeAgo(res.createdAt)}</span>
        </div>
    `).join('');
}

// Check for quick reorder (frequently ordered items)
function checkQuickReorder() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    
    // Get user's completed orders
    const userOrders = orders.filter(o => o.customerId == user.id && o.status === 'completed');
    
    if (userOrders.length === 0) {
        return;
    }
    
    // Count item frequencies
    const itemCounts = {};
    userOrders.forEach(order => {
        order.items?.forEach(item => {
            itemCounts[item.id] = (itemCounts[item.id] || 0) + item.quantity;
        });
    });
    
    // Get top 3 items
    const topItems = Object.entries(itemCounts)
        .map(([id, count]) => {
            const menuItem = menuItems.find(m => m.id == id);
            return { ...menuItem, count };
        })
        .filter(item => item && item.status === 'available' && item.stock > 0)
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    
    if (topItems.length === 0) return;
    
    // Show quick reorder section
    const reorderSection = document.getElementById('quickReorder');
    const reorderGrid = document.getElementById('reorderItems');
    
    reorderSection.style.display = 'block';
    
    reorderGrid.innerHTML = topItems.map(item => `
        <div class="action-card" onclick="addToCartFromReorder(${item.id})">
            <div style="background-image: url('${item.image || '../../admin/assets/images/menu/default.jpg'}'); 
                        width: 100%; 
                        height: 120px; 
                        background-size: cover; 
                        background-position: center;
                        border-radius: var(--border-radius-md);
                        margin-bottom: 1rem;">
            </div>
            <h4 style="margin: 0.5rem 0;">${item.name}</h4>
            <p style="color: var(--coffee-medium); font-weight: 600;">${formatETB(item.price)}</p>
            <small style="color: var(--text-muted);">Ordered ${item.count} times</small>
            <button class="btn-small" style="margin-top: 0.5rem; width: 100%;">
                <i class="fas fa-cart-plus"></i> Reorder
            </button>
        </div>
    `).join('');
}

// Add to cart from reorder
window.addToCartFromReorder = function(itemId) {
    const menuItems = JSON.parse(localStorage.getItem('markanMenu')) || [];
    const item = menuItems.find(i => i.id == itemId);
    
    if (!item) {
        showNotification('Item not found', 'error');
        return;
    }
    
    if (item.status !== 'available' || item.stock <= 0) {
        showNotification('Item is out of stock', 'error');
        return;
    }
    
    // Get current cart
    const user = Auth.getCurrentUser();
    const cartKey = `cart_${user.id}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    
    // Check if item already in cart
    const existingItem = cart.find(i => i.id == itemId);
    
    if (existingItem) {
        if (existingItem.quantity < item.stock) {
            existingItem.quantity += 1;
            showNotification(`${item.name} quantity increased`, 'success');
        } else {
            showNotification(`Only ${item.stock} available`, 'error');
            return;
        }
    } else {
        cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: 1,
            category: item.category,
            image: item.image,
            maxStock: item.stock
        });
        showNotification(`${item.name} added to cart`, 'success');
    }
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartCount();
};

// Update cart count in navigation
function updateCartCount() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const cartKey = `cart_${user.id}`;
    const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
    const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    
    const cartBadge = document.getElementById('cartCount');
    const cartSummary = document.getElementById('cartSummary');
    
    if (cartBadge) {
        cartBadge.textContent = totalItems;
        cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
    
    if (cartSummary) {
        cartSummary.textContent = totalItems === 1 ? '1 item' : `${totalItems} items`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Listen for storage events (updates from other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanOrders' || e.key === 'markanReservations') {
            const user = Auth.getCurrentUser();
            if (user) {
                loadUserStats(user.id);
                loadRecentOrders(user.id);
                loadRecentReservations(user.id);
            }
        }
    });
    
    // Refresh data every 30 seconds
    setInterval(() => {
        const user = Auth.getCurrentUser();
        if (user) {
            loadUserStats(user.id);
        }
    }, 30000);
}

// Helper: Format ETB
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

// Helper: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Helper: Format time ago
function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// Show notification
function showNotification(message, type = 'info') {
    // Use your existing notification system
    console.log(`${type}: ${message}`);
    
    // You can implement a toast notification here
    // For now, we'll use alert for demonstration
    // alert(message);
    
    // Create a simple toast if notification container exists
    const container = document.getElementById('notificationContainer');
    if (container) {
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
}

// Export functions for global use
window.addToCartFromReorder = addToCartFromReorder;