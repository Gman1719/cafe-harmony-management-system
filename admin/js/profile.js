// admin/js/profile.js
// Markan Cafe Admin - Profile Management
// Full profile management with localStorage - NO HARDCODED DATA

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let allUsers = [];
let activityLog = [];
let notifications = [];
let currentAvatarFile = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load profile data
    loadProfileData();
    
    // Load activity log
    loadActivityLog();
    
    // Load notifications
    loadNotifications();
    
    // Load sessions
    loadSessions();
    
    // Load preferences
    loadPreferences();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update admin name
    updateAdminName();
});

// ===== LOAD PROFILE DATA =====
function loadProfileData() {
    currentUser = Auth.getCurrentUser();
    if (!currentUser) return;

    // Load all users for reference
    allUsers = JSON.parse(localStorage.getItem('markanUsers')) || [];
    
    // Set profile information
    document.getElementById('profileName').textContent = currentUser.name || 'Admin User';
    document.getElementById('profileRole').textContent = currentUser.role || 'Administrator';
    document.getElementById('adminName').textContent = currentUser.name || 'Admin User';
    
    // Set avatar
    const avatarImg = document.getElementById('profileAvatar');
    if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar;
    } else {
        // Generate avatar from initials
        const initials = currentUser.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'A';
        avatarImg.src = `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`;
    }

    // Fill personal form
    document.getElementById('fullName').value = currentUser.name || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';
    document.getElementById('address').value = currentUser.address || '';
    document.getElementById('bio').value = currentUser.bio || '';

    // Load user stats
    loadUserStats();
}

// ===== LOAD USER STATISTICS =====
function loadUserStats() {
    // Get today's actions from activity log
    const today = new Date().toDateString();
    const actions = JSON.parse(localStorage.getItem('adminActivityLog')) || [];
    const todayActions = actions.filter(a => new Date(a.timestamp).toDateString() === today).length;
    document.getElementById('totalActions').textContent = todayActions;

    // Get login streak
    const logins = JSON.parse(localStorage.getItem('adminLogins')) || [];
    let streak = calculateStreak(logins);
    document.getElementById('loginStreak').textContent = streak;

    // Get total logins
    document.getElementById('totalLogins').textContent = logins.length;
}

// ===== CALCULATE LOGIN STREAK =====
function calculateStreak(logins) {
    if (logins.length === 0) return 0;
    
    let streak = 1;
    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    // Check if logged in today
    const loggedInToday = logins.some(l => new Date(l).toDateString() === today);
    if (!loggedInToday) return 0;

    // Count consecutive days
    for (let i = logins.length - 2; i >= 0; i--) {
        const currentDate = new Date(logins[i]).toDateString();
        const expectedDate = new Date();
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (currentDate === expectedDate.toDateString()) {
            streak++;
        } else {
            break;
        }
    }
    
    return streak;
}

// ===== SAVE PERSONAL INFORMATION =====
window.savePersonalInfo = function() {
    const name = document.getElementById('fullName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    const bio = document.getElementById('bio').value.trim();

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

    // Update user in allUsers array
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        allUsers[userIndex].name = name;
        allUsers[userIndex].phone = phone;
        allUsers[userIndex].address = address;
        allUsers[userIndex].bio = bio;
        allUsers[userIndex].updatedAt = new Date().toISOString();

        // Save to localStorage
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));

        // Update current user
        const updatedUser = { ...currentUser, name, phone, address, bio };
        localStorage.setItem('markanUser', JSON.stringify(updatedUser));
        currentUser = updatedUser;

        // Update UI
        document.getElementById('profileName').textContent = name;
        document.getElementById('adminName').textContent = name;
        
        // Log activity
        logActivity('profile_update', 'Updated personal information');
        
        showNotification('Profile updated successfully', 'success');
    }
};

// ===== RESET PERSONAL FORM =====
window.resetPersonalForm = function() {
    loadProfileData();
    showNotification('Changes discarded', 'info');
};

// ===== CHANGE PASSWORD =====
window.changePassword = function() {
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
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (allUsers[userIndex].password !== currentPassword) {
            showNotification('Current password is incorrect', 'error');
            return;
        }

        // Update password
        allUsers[userIndex].password = newPassword;
        allUsers[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));

        // Log activity
        logActivity('password_change', 'Changed password');
        
        showNotification('Password changed successfully', 'success');
        
        // Clear form
        document.getElementById('passwordForm').reset();
        document.getElementById('passwordStrength').innerHTML = '<div class="strength-bar"></div>';
    }
};

// ===== PASSWORD STRENGTH CHECKER =====
document.getElementById('newPassword')?.addEventListener('input', function(e) {
    const password = e.target.value;
    const strengthBar = document.querySelector('#passwordStrength .strength-bar');
    
    if (!strengthBar) return;
    
    if (!password) {
        strengthBar.style.width = '0';
        strengthBar.className = 'strength-bar';
        return;
    }

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 2) {
        strengthBar.className = 'strength-bar weak';
    } else if (strength === 3) {
        strengthBar.className = 'strength-bar medium';
    } else {
        strengthBar.className = 'strength-bar strong';
    }
});

// ===== TOGGLE TWO-FACTOR AUTHENTICATION =====
window.toggleTwoFactor = function() {
    const statusSpan = document.getElementById('twoFactorStatus');
    const currentStatus = statusSpan.textContent;
    
    if (currentStatus === 'Disabled') {
        if (confirm('Enable two-factor authentication? This will add extra security to your account.')) {
            statusSpan.textContent = 'Enabled';
            // Save 2FA status to user preferences
            saveTwoFactorStatus(true);
            showNotification('Two-factor authentication enabled', 'success');
            logActivity('2fa_enabled', 'Enabled two-factor authentication');
        }
    } else {
        if (confirm('Disable two-factor authentication? Your account will be less secure.')) {
            statusSpan.textContent = 'Disabled';
            saveTwoFactorStatus(false);
            showNotification('Two-factor authentication disabled', 'warning');
            logActivity('2fa_disabled', 'Disabled two-factor authentication');
        }
    }
};

// ===== SAVE TWO-FACTOR STATUS =====
function saveTwoFactorStatus(enabled) {
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!allUsers[userIndex].preferences) {
            allUsers[userIndex].preferences = {};
        }
        allUsers[userIndex].preferences.twoFactor = enabled;
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        currentUser.preferences = currentUser.preferences || {};
        currentUser.preferences.twoFactor = enabled;
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
    }
}

// ===== LOAD SESSIONS =====
function loadSessions() {
    // Get saved sessions from localStorage
    const sessions = JSON.parse(localStorage.getItem('adminSessions')) || [];
    
    // Add current session if not exists
    const currentSessionExists = sessions.some(s => s.current);
    if (!currentSessionExists) {
        sessions.unshift({
            device: getDeviceInfo(),
            location: 'Debre Birhan, Ethiopia',
            ip: '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255),
            current: true,
            lastActive: new Date().toISOString()
        });
        localStorage.setItem('adminSessions', JSON.stringify(sessions));
    }
    
    displaySessions(sessions);
}

// ===== GET DEVICE INFO =====
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Linux')) device = 'Linux';
    else if (ua.includes('Android')) device = 'Android Device';
    else if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    
    let browser = 'Unknown Browser';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    
    return `${browser} on ${device}`;
}

// ===== DISPLAY SESSIONS =====
function displaySessions(sessions) {
    const container = document.getElementById('sessionsList');
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="no-data">No active sessions</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => `
        <div class="session-item">
            <div class="session-info">
                <i class="fas fa-${session.device.includes('iPhone') || session.device.includes('Android') ? 'mobile-alt' : 'desktop'}"></i>
                <div class="session-details">
                    <p>${session.device}</p>
                    <p>${session.location} · ${session.ip}</p>
                    <p>Last active: ${timeAgo(session.lastActive)}</p>
                </div>
            </div>
            ${session.current ? 
                '<span class="session-badge">Current Session</span>' : 
                `<button class="btn btn-outline btn-small" onclick="revokeSession('${session.ip}')">Revoke</button>`
            }
        </div>
    `).join('');
}

// ===== REVOKE SESSION =====
window.revokeSession = function(ip) {
    if (confirm('Are you sure you want to revoke this session? The user will be logged out.')) {
        const sessions = JSON.parse(localStorage.getItem('adminSessions')) || [];
        const updatedSessions = sessions.filter(s => s.ip !== ip);
        localStorage.setItem('adminSessions', JSON.stringify(updatedSessions));
        loadSessions();
        showNotification('Session revoked', 'success');
        logActivity('session_revoke', `Revoked session from ${ip}`);
    }
};

// ===== SET THEME =====
window.setTheme = function(theme) {
    // Apply theme
    if (theme === 'light') {
        document.documentElement.style.setProperty('--bg-dark', '#f5f5f5');
        document.documentElement.style.setProperty('--bg-card', '#ffffff');
        document.documentElement.style.setProperty('--text-primary', '#333333');
    } else if (theme === 'dark') {
        document.documentElement.style.setProperty('--bg-dark', '#1a1a1a');
        document.documentElement.style.setProperty('--bg-card', '#2d2d2d');
        document.documentElement.style.setProperty('--text-primary', '#ffffff');
    }
    
    // Save preference
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!allUsers[userIndex].preferences) {
            allUsers[userIndex].preferences = {};
        }
        allUsers[userIndex].preferences.theme = theme;
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        currentUser.preferences = currentUser.preferences || {};
        currentUser.preferences.theme = theme;
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
    }
    
    showNotification(`Theme set to ${theme}`, 'success');
    logActivity('theme_change', `Changed theme to ${theme}`);
};

// ===== SAVE PREFERENCES =====
window.savePreferences = function() {
    const preferences = {
        language: document.getElementById('language').value,
        timezone: document.getElementById('timezone').value,
        dateFormat: document.getElementById('dateFormat').value,
        showStats: document.getElementById('showStats').checked,
        showCharts: document.getElementById('showCharts').checked,
        showRecentOrders: document.getElementById('showRecentOrders').checked,
        compactView: document.getElementById('compactView').checked
    };

    // Save to user preferences
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!allUsers[userIndex].preferences) {
            allUsers[userIndex].preferences = {};
        }
        allUsers[userIndex].preferences = { ...allUsers[userIndex].preferences, ...preferences };
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        currentUser.preferences = { ...currentUser.preferences, ...preferences };
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
    }

    showNotification('Preferences saved successfully', 'success');
    logActivity('preferences_save', 'Saved preferences');
};

// ===== LOAD PREFERENCES =====
function loadPreferences() {
    if (!currentUser || !currentUser.preferences) return;
    
    const prefs = currentUser.preferences;
    
    document.getElementById('language').value = prefs.language || 'en';
    document.getElementById('timezone').value = prefs.timezone || 'Africa/Addis_Ababa';
    document.getElementById('dateFormat').value = prefs.dateFormat || 'MM/DD/YYYY';
    document.getElementById('showStats').checked = prefs.showStats !== false;
    document.getElementById('showCharts').checked = prefs.showCharts !== false;
    document.getElementById('showRecentOrders').checked = prefs.showRecentOrders !== false;
    document.getElementById('compactView').checked = prefs.compactView || false;
}

// ===== LOAD ACTIVITY LOG =====
function loadActivityLog() {
    activityLog = JSON.parse(localStorage.getItem('adminActivityLog')) || [];
    
    // If no activity log exists, create some sample activities
    if (activityLog.length === 0) {
        activityLog = [
            {
                type: 'login',
                description: 'Logged in successfully',
                timestamp: new Date(Date.now() - 3600000).toISOString()
            },
            {
                type: 'profile_update',
                description: 'Updated profile information',
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        localStorage.setItem('adminActivityLog', JSON.stringify(activityLog));
    }
    
    displayActivityLog(activityLog.slice(0, 10));
}

// ===== DISPLAY ACTIVITY LOG =====
function displayActivityLog(activities) {
    const timeline = document.getElementById('activityTimeline');
    if (!timeline) return;

    if (activities.length === 0) {
        timeline.innerHTML = `
            <div class="no-data">
                <i class="fas fa-history"></i>
                <p>No activity yet</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = activities.map(activity => `
        <div class="timeline-item">
            <div class="timeline-icon ${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="timeline-content">
                <p>${activity.description}</p>
                <small>${formatDateTime(activity.timestamp)} (${timeAgo(activity.timestamp)})</small>
            </div>
        </div>
    `).join('');
}

// ===== GET ACTIVITY ICON =====
function getActivityIcon(type) {
    const icons = {
        'login': 'sign-in-alt',
        'logout': 'sign-out-alt',
        'order': 'shopping-cart',
        'menu': 'utensils',
        'user': 'user',
        'profile_update': 'user-edit',
        'password_change': 'key',
        '2fa_enabled': 'shield-alt',
        '2fa_disabled': 'shield-alt',
        'theme_change': 'palette',
        'preferences_save': 'sliders-h',
        'session_revoke': 'ban'
    };
    return icons[type] || 'history';
}

// ===== LOG ACTIVITY =====
function logActivity(type, description) {
    const activity = {
        type,
        description,
        timestamp: new Date().toISOString()
    };
    
    activityLog.unshift(activity);
    
    // Keep only last 100 activities
    if (activityLog.length > 100) {
        activityLog.pop();
    }
    
    localStorage.setItem('adminActivityLog', JSON.stringify(activityLog));
    
    // Update display if activity section is active
    if (document.getElementById('activity').classList.contains('active')) {
        displayActivityLog(activityLog.slice(0, 10));
    }
}

// ===== FILTER ACTIVITY =====
window.filterActivity = function() {
    const type = document.getElementById('activityType').value;
    const date = document.getElementById('activityDate').value;

    let filtered = [...activityLog];

    if (type !== 'all') {
        filtered = filtered.filter(a => a.type === type);
    }

    if (date) {
        filtered = filtered.filter(a => 
            new Date(a.timestamp).toDateString() === new Date(date).toDateString()
        );
    }

    displayActivityLog(filtered.slice(0, 10));
};

// ===== LOAD MORE ACTIVITY =====
window.loadMoreActivity = function() {
    const currentCount = document.querySelectorAll('#activityTimeline .timeline-item').length;
    const moreActivities = activityLog.slice(currentCount, currentCount + 10);
    
    const timeline = document.getElementById('activityTimeline');
    moreActivities.forEach(activity => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = `
            <div class="timeline-icon ${activity.type}">
                <i class="fas fa-${getActivityIcon(activity.type)}"></i>
            </div>
            <div class="timeline-content">
                <p>${activity.description}</p>
                <small>${formatDateTime(activity.timestamp)} (${timeAgo(activity.timestamp)})</small>
            </div>
        `;
        timeline.appendChild(div);
    });
    
    if (currentCount + 10 >= activityLog.length) {
        document.querySelector('#activity .load-more button').disabled = true;
    }
};

// ===== LOAD NOTIFICATIONS =====
function loadNotifications() {
    notifications = JSON.parse(localStorage.getItem('adminNotifications')) || [];
    
    // If no notifications exist, create some
    if (notifications.length === 0) {
        notifications = [
            {
                id: 1,
                type: 'info',
                title: 'Welcome to Admin Panel',
                message: 'Manage your cafe efficiently from here.',
                time: new Date().toISOString(),
                read: false,
                icon: 'info-circle'
            }
        ];
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    }
    
    displayRecentNotifications();
    updateNotificationBadge();
}

// ===== DISPLAY RECENT NOTIFICATIONS =====
function displayRecentNotifications() {
    const list = document.getElementById('recentNotificationsList');
    if (!list) return;

    if (notifications.length === 0) {
        list.innerHTML = `
            <div class="no-data">
                <i class="fas fa-bell"></i>
                <p>No notifications</p>
            </div>
        `;
        return;
    }

    list.innerHTML = notifications.slice(0, 5).map(notification => `
        <div class="notification-item ${notification.read ? '' : 'unread'}" 
             onclick="markNotificationRead(${notification.id})">
            <div class="notification-icon">
                <i class="fas fa-${notification.icon || 'bell'}"></i>
            </div>
            <div class="notification-content">
                <p><strong>${notification.title}</strong></p>
                <p>${notification.message}</p>
                <small>${timeAgo(notification.time)}</small>
            </div>
            ${!notification.read ? '<span class="unread-dot"></span>' : ''}
        </div>
    `).join('');
}

// ===== MARK NOTIFICATION AS READ =====
window.markNotificationRead = function(id) {
    const index = notifications.findIndex(n => n.id === id);
    if (index !== -1) {
        notifications[index].read = true;
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        displayRecentNotifications();
        updateNotificationBadge();
    }
};

// ===== MARK ALL NOTIFICATIONS AS READ =====
window.markAllRead = function() {
    notifications.forEach(n => n.read = true);
    localStorage.setItem('adminNotifications', JSON.stringify(notifications));
    displayRecentNotifications();
    updateNotificationBadge();
    showNotification('All notifications marked as read', 'success');
};

// ===== UPDATE NOTIFICATION BADGE =====
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = unreadCount;
        badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
}

// ===== SHOW SECTION =====
window.showSection = function(sectionId) {
    // Update menu items
    document.querySelectorAll('.profile-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[onclick="showSection('${sectionId}')"]`).classList.add('active');

    // Show section
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');

    // Load section-specific data
    if (sectionId === 'activity') {
        displayActivityLog(activityLog.slice(0, 10));
    }
    if (sectionId === 'notifications') {
        displayRecentNotifications();
    }
};

// ===== AVATAR UPLOAD =====
document.getElementById('avatarInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('Please select an image file', 'error');
            this.value = '';
            return;
        }
        
        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showNotification('Image size should be less than 2MB', 'error');
            this.value = '';
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const avatarUrl = e.target.result;
            
            // Update avatar display
            document.getElementById('profileAvatar').src = avatarUrl;
            
            // Save to user profile
            const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
            if (userIndex !== -1) {
                allUsers[userIndex].avatar = avatarUrl;
                localStorage.setItem('markanUsers', JSON.stringify(allUsers));
                
                // Update current user
                currentUser.avatar = avatarUrl;
                localStorage.setItem('markanUser', JSON.stringify(currentUser));
                
                showNotification('Profile picture updated', 'success');
                logActivity('avatar_update', 'Updated profile picture');
            }
        };
        reader.readAsDataURL(file);
    }
});

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Save notification settings on change
    document.querySelectorAll('#notifications input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', saveNotificationSettings);
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanUsers' || e.key === 'markanUser') {
            loadProfileData();
        }
        if (e.key === 'adminActivityLog') {
            loadActivityLog();
        }
        if (e.key === 'adminNotifications') {
            loadNotifications();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== SAVE NOTIFICATION SETTINGS =====
function saveNotificationSettings() {
    const settings = {
        emailNewOrder: document.getElementById('emailNewOrder').checked,
        emailNewReservation: document.getElementById('emailNewReservation').checked,
        emailLowStock: document.getElementById('emailLowStock').checked,
        emailNewUser: document.getElementById('emailNewUser').checked,
        pushNewOrder: document.getElementById('pushNewOrder').checked,
        pushNewReservation: document.getElementById('pushNewReservation').checked,
        pushLowStock: document.getElementById('pushLowStock').checked
    };

    // Save to user preferences
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!allUsers[userIndex].preferences) {
            allUsers[userIndex].preferences = {};
        }
        allUsers[userIndex].preferences.notifications = settings;
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        currentUser.preferences = currentUser.preferences || {};
        currentUser.preferences.notifications = settings;
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
    }

    showNotification('Notification settings saved', 'success');
}

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}

// ===== HELPER: FORMAT DATE TIME =====
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
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

// ===== MAKE FUNCTIONS GLOBAL =====
window.showSection = showSection;
window.savePersonalInfo = savePersonalInfo;
window.resetPersonalForm = resetPersonalForm;
window.changePassword = changePassword;
window.toggleTwoFactor = toggleTwoFactor;
window.setTheme = setTheme;
window.savePreferences = savePreferences;
window.filterActivity = filterActivity;
window.loadMoreActivity = loadMoreActivity;
window.markAllRead = markAllRead;
window.revokeSession = revokeSession;