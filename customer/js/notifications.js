// customer/js/notifications.js
// Markan Cafe - Customer Notifications System

// Initialize notifications
document.addEventListener('DOMContentLoaded', function() {
    loadNotifications();
    setupNotificationListener();
    updateNotificationBadge();
    
    // Check for new notifications every 30 seconds
    setInterval(checkForNewNotifications, 30000);
});

// Load notifications from localStorage
function loadNotifications() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    const userNotifications = notifications.filter(n => n.userId === user.id);
    
    displayNotifications(userNotifications);
    updateNotificationBadge(userNotifications);
}

// Display notifications in dropdown
function displayNotifications(notifications) {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }

    container.innerHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'}" 
             onclick="markAsRead('${notification.id}')">
            <div class="notification-icon ${notification.type}">
                <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.message}</p>
                <span class="notification-time">${formatTimeAgo(notification.timestamp)}</span>
            </div>
            ${!notification.read ? '<span class="unread-dot"></span>' : ''}
        </div>
    `).join('');

    if (notifications.length > 5) {
        container.innerHTML += `
            <div class="view-all">
                <button onclick="viewAllNotifications()">View All (${notifications.length - 5} more)</button>
            </div>
        `;
    }
}

// Get notification icon based on type
function getNotificationIcon(type) {
    const icons = {
        'order': 'shopping-bag',
        'reservation': 'calendar-check',
        'promo': 'gift',
        'system': 'info-circle',
        'warning': 'exclamation-triangle',
        'success': 'check-circle'
    };
    return icons[type] || 'bell';
}

// Create a new notification
function createNotification(notification) {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    
    const newNotification = {
        id: generateNotificationId(),
        userId: user.id,
        ...notification,
        timestamp: new Date().toISOString(),
        read: false
    };

    notifications.unshift(newNotification);
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
        notifications.pop();
    }

    localStorage.setItem('customerNotifications', JSON.stringify(notifications));
    
    // Show popup notification
    showPopupNotification(newNotification);
    
    // Update display
    loadNotifications();
    
    // Play sound if enabled
    playNotificationSound();
}

// Generate notification ID
function generateNotificationId() {
    return 'NOTIF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

// Show popup notification
function showPopupNotification(notification) {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const popup = document.createElement('div');
    popup.className = `notification-popup ${notification.type}`;
    popup.innerHTML = `
        <div class="popup-icon">
            <i class="fas fa-${getNotificationIcon(notification.type)}"></i>
        </div>
        <div class="popup-content">
            <h4>${notification.title}</h4>
            <p>${notification.message}</p>
        </div>
        <button class="popup-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(popup);

    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
        }
    }, 5000);
}

// Mark notification as read
window.markAsRead = function(notificationId) {
    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem('customerNotifications', JSON.stringify(notifications));
        loadNotifications();
    }
};

// Mark all notifications as read
window.markAllAsRead = function() {
    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    notifications.forEach(n => n.read = true);
    localStorage.setItem('customerNotifications', JSON.stringify(notifications));
    loadNotifications();
    showNotification('All notifications marked as read', 'success');
};

// Clear all notifications
window.clearAllNotifications = function() {
    if (confirm('Are you sure you want to clear all notifications?')) {
        const user = Auth.getCurrentUser();
        if (!user) return;

        const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
        const filtered = notifications.filter(n => n.userId !== user.id);
        localStorage.setItem('customerNotifications', JSON.stringify(filtered));
        loadNotifications();
        showNotification('All notifications cleared', 'success');
    }
};

// Update notification badge
function updateNotificationBadge(notifications) {
    const unreadCount = notifications ? 
        notifications.filter(n => !n.read).length : 
        getUnreadCount();

    const badge = document.getElementById('notificationBadge');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// Get unread count
function getUnreadCount() {
    const user = Auth.getCurrentUser();
    if (!user) return 0;

    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    return notifications.filter(n => n.userId === user.id && !n.read).length;
}

// Check for new notifications (simulated)
function checkForNewNotifications() {
    // In a real app, this would check a server
    // For now, we'll simulate occasional notifications
    if (Math.random() < 0.1) { // 10% chance every 30 seconds
        simulateRandomNotification();
    }
}

// Simulate random notification
function simulateRandomNotification() {
    const types = [
        {
            type: 'promo',
            title: 'Special Offer!',
            message: 'Get 20% off on your next order'
        },
        {
            type: 'system',
            title: 'Order Update',
            message: 'Your order is being prepared'
        },
        {
            type: 'promo',
            title: 'Happy Hour!',
            message: 'Buy one coffee, get one free'
        }
    ];

    const random = types[Math.floor(Math.random() * types.length)];
    createNotification(random);
}

// Play notification sound (if enabled)
function playNotificationSound() {
    const settings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
    if (settings.soundEnabled !== false) {
        // Create and play a simple beep sound
        const audio = new Audio();
        audio.src = 'data:audio/wav;base64,UklGRlwAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YVAAAAABAAIA//8AAP//AAAAAAAAAAAA';
        audio.play().catch(e => console.log('Audio playback failed:', e));
    }
}

// View all notifications
window.viewAllNotifications = function() {
    // Could open a full notifications page
    showNotification('Opening all notifications...', 'info');
};

// Setup notification listener
function setupNotificationListener() {
    // Listen for storage events (updates from other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'customerNotifications') {
            loadNotifications();
        }
    });

    // Listen for order updates
    window.addEventListener('orderUpdated', function(e) {
        const { orderId, status } = e.detail;
        createNotification({
            type: 'order',
            title: 'Order Update',
            message: `Order #${orderId} is now ${status}`
        });
    });

    // Listen for reservation updates
    window.addEventListener('reservationUpdated', function(e) {
        const { reservationId, status } = e.detail;
        createNotification({
            type: 'reservation',
            title: 'Reservation Update',
            message: `Reservation #${reservationId} is ${status}`
        });
    });
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

// Show notification (for backward compatibility)
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

// Export functions for global use
window.createNotification = createNotification;
window.markAsRead = markAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllNotifications = clearAllNotifications;
window.viewAllNotifications = viewAllNotifications;