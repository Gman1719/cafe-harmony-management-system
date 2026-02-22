// customer/js/profile.js
// Markan Cafe - Customer Profile Management

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    loadUserProfile();
    loadUserStats();
    loadPreferences();
    loadNotificationSettings();
    setupEventListeners();
});

// Load user profile data
function loadUserProfile() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Set profile information
    document.getElementById('profileName').textContent = user.name || 'Customer';
    document.getElementById('profileEmail').textContent = user.email || '';
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('email').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    
    // Set avatar
    const avatarImg = document.getElementById('profileAvatar');
    if (user.avatar) {
        avatarImg.src = user.avatar;
    } else {
        // Generate avatar from initials
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
        avatarImg.src = `https://via.placeholder.com/150x150/8B4513/FFD700?text=${initials}`;
    }

    // Set member since
    const joinDate = user.createdAt ? new Date(user.createdAt) : new Date();
    document.getElementById('memberSince').textContent = joinDate.getFullYear();
}

// Load user statistics
function loadUserStats() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];

    const userOrders = orders.filter(o => o.customerId == user.id);
    const userReservations = reservations.filter(r => r.customerId == user.id);

    document.getElementById('totalOrders').textContent = userOrders.length;
    document.getElementById('totalReservations').textContent = userReservations.length;
}

// Save personal information
window.savePersonalInfo = function() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const name = document.getElementById('fullName').value;
    const phone = document.getElementById('phone').value;
    const address = document.getElementById('address').value;

    // Validate
    if (!name || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate phone
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number', 'error');
        return;
    }

    // Update user in localStorage
    const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
    const userIndex = users.findIndex(u => u.id == user.id);

    if (userIndex !== -1) {
        users[userIndex].name = name;
        users[userIndex].phone = phone;
        users[userIndex].address = address;
        users[userIndex].updatedAt = new Date().toISOString();

        localStorage.setItem('markanUsers', JSON.stringify(users));

        // Update current user
        const updatedUser = { ...user, name, phone, address };
        localStorage.setItem('markanUser', JSON.stringify(updatedUser));

        showNotification('Profile updated successfully', 'success');
        
        // Update display
        document.getElementById('profileName').textContent = name;
        document.getElementById('userGreeting').textContent = `Hi, ${name.split(' ')[0]}`;
    }
};

// Reset personal form
window.resetPersonalForm = function() {
    loadUserProfile();
    showNotification('Changes discarded', 'info');
};

// Change password
window.changePassword = function() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        showNotification('Password must be at least 8 characters with one special character', 'error');
        return;
    }

    // Verify current password
    const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
    const userIndex = users.findIndex(u => u.id == user.id);

    if (userIndex !== -1) {
        if (users[userIndex].password !== currentPassword) {
            showNotification('Current password is incorrect', 'error');
            return;
        }

        // Update password
        users[userIndex].password = newPassword;
        users[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('markanUsers', JSON.stringify(users));

        showNotification('Password changed successfully', 'success');
        
        // Clear form
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordStrength').style.width = '0';
    }
};

// Load preferences
function loadPreferences() {
    const preferences = JSON.parse(localStorage.getItem('customerPreferences')) || {};
    
    document.getElementById('language').value = preferences.language || 'en';
    document.getElementById('currency').value = preferences.currency || 'ETB';
    document.getElementById('saveAddress').checked = preferences.saveAddress !== false;
    document.getElementById('defaultTakeaway').checked = preferences.defaultTakeaway || false;
}

// Save preferences
window.savePreferences = function() {
    const preferences = {
        language: document.getElementById('language').value,
        currency: document.getElementById('currency').value,
        saveAddress: document.getElementById('saveAddress').checked,
        defaultTakeaway: document.getElementById('defaultTakeaway').checked,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('customerPreferences', JSON.stringify(preferences));
    showNotification('Preferences saved successfully', 'success');
};

// Load notification settings
function loadNotificationSettings() {
    const settings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
    
    document.getElementById('notifyOrders').checked = settings.notifyOrders !== false;
    document.getElementById('notifyReservations').checked = settings.notifyReservations !== false;
    document.getElementById('notifyPromotions').checked = settings.notifyPromotions || false;
    document.getElementById('notifyEmail').checked = settings.notifyEmail !== false;
}

// Save notification settings
window.saveNotificationSettings = function() {
    const settings = {
        notifyOrders: document.getElementById('notifyOrders').checked,
        notifyReservations: document.getElementById('notifyReservations').checked,
        notifyPromotions: document.getElementById('notifyPromotions').checked,
        notifyEmail: document.getElementById('notifyEmail').checked,
        updatedAt: new Date().toISOString()
    };

    localStorage.setItem('notificationSettings', JSON.stringify(settings));
    showNotification('Notification settings saved', 'success');
};

// Set theme (called from theme.js)
window.setTheme = function(theme) {
    // This function is implemented in theme.js
    // We'll call it here for the profile page
    if (typeof window.applyTheme === 'function') {
        window.applyTheme(theme);
    }
    
    // Save preference
    const preferences = JSON.parse(localStorage.getItem('customerPreferences')) || {};
    preferences.theme = theme;
    localStorage.setItem('customerPreferences', JSON.stringify(preferences));
    
    showNotification(`Theme set to ${theme}`, 'success');
};

// Confirm delete account
window.confirmDeleteAccount = function() {
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('All your order history and data will be permanently deleted. Continue?')) {
            deleteAccount();
        }
    }
};

// Delete account
function deleteAccount() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    // Remove user from users list
    const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
    const filteredUsers = users.filter(u => u.id != user.id);
    localStorage.setItem('markanUsers', JSON.stringify(filteredUsers));

    // Clear user's cart
    const cartKey = `cart_${user.id}`;
    localStorage.removeItem(cartKey);

    // Clear user data
    localStorage.removeItem('markanUser');

    // Show message and redirect
    showNotification('Account deleted successfully', 'success');
    
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 2000);
}

// Avatar upload
document.getElementById('avatarInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarUrl = e.target.result;
            
            // Update avatar display
            document.getElementById('profileAvatar').src = avatarUrl;
            
            // Save to user profile
            const user = Auth.getCurrentUser();
            if (user) {
                const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
                const userIndex = users.findIndex(u => u.id == user.id);
                
                if (userIndex !== -1) {
                    users[userIndex].avatar = avatarUrl;
                    localStorage.setItem('markanUsers', JSON.stringify(users));
                    
                    // Update current user
                    user.avatar = avatarUrl;
                    localStorage.setItem('markanUser', JSON.stringify(user));
                    
                    showNotification('Profile picture updated', 'success');
                }
            }
        };
        reader.readAsDataURL(file);
    }
});

// Setup event listeners
function setupEventListeners() {
    // Listen for storage events
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanUsers' || e.key === 'markanUser') {
            loadUserProfile();
        }
    });
}

// Show notification
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
window.savePersonalInfo = savePersonalInfo;
window.resetPersonalForm = resetPersonalForm;
window.changePassword = changePassword;
window.savePreferences = savePreferences;
window.saveNotificationSettings = saveNotificationSettings;
window.setTheme = setTheme;
window.confirmDeleteAccount = confirmDeleteAccount;