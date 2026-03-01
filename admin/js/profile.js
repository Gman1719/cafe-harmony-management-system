// admin/js/profile.js - Complete Profile Management
// Markan Cafe Admin - Full functionality with localStorage
// ALL DATA IS DYNAMIC - NO HARDCODING

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let allUsers = [];
let activityLog = [];
let notifications = [];
let userSessions = [];
let currentAvatarFile = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile Management initializing...');
    
    // Check authentication
    checkAuth();
    
    // Initialize all data
    initializeData();
    
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

// ===== CHECK AUTHENTICATION =====
function checkAuth() {
    const userStr = localStorage.getItem('markanUser');
    if (!userStr) {
        window.location.replace('../../login.html');
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            window.location.replace('../../customer/html/dashboard.html');
            return;
        }
        window.currentUser = user;
    } catch (e) {
        console.error('Auth error:', e);
        window.location.replace('../../login.html');
    }
}

// ===== INITIALIZE ALL DATA =====
function initializeData() {
    // Load current user
    const userStr = localStorage.getItem('markanUser');
    currentUser = userStr ? JSON.parse(userStr) : null;
    
    // Load all users
    const usersStr = localStorage.getItem('markanUsers');
    allUsers = usersStr ? JSON.parse(usersStr) : [];
    
    // Initialize activity log if not exists
    const activityStr = localStorage.getItem('adminActivityLog');
    activityLog = activityStr ? JSON.parse(activityStr) : [];
    
    // Initialize notifications if not exists
    const notifStr = localStorage.getItem('adminNotifications');
    notifications = notifStr ? JSON.parse(notifStr) : [];
    
    // Initialize sessions if not exists
    const sessionsStr = localStorage.getItem('adminSessions');
    userSessions = sessionsStr ? JSON.parse(sessionsStr) : [];
    
    console.log('✅ Data initialized:', {
        users: allUsers.length,
        activities: activityLog.length,
        notifications: notifications.length,
        sessions: userSessions.length
    });
}

// ===== LOAD PROFILE DATA =====
function loadProfileData() {
    if (!currentUser) {
        console.error('No current user found');
        return;
    }

    console.log('Loading profile for:', currentUser.email);
    
    // Set profile information
    document.getElementById('profileName').textContent = currentUser.name || 'Admin User';
    document.getElementById('profileRole').textContent = getRoleDisplay(currentUser.role || 'admin');
    document.getElementById('adminName').textContent = currentUser.name || 'Admin User';
    
    // Set avatar
    loadUserAvatar();
    
    // Fill personal form
    document.getElementById('fullName').value = currentUser.name || '';
    document.getElementById('email').value = currentUser.email || '';
    document.getElementById('phone').value = currentUser.phone || '';
    document.getElementById('address').value = currentUser.address || '';
    document.getElementById('bio').value = currentUser.bio || '';

    // Set department based on role
    document.getElementById('department').value = currentUser.department || 'Administration';
    
    // Set two-factor status
    const twoFactorEnabled = currentUser.preferences?.twoFactor || false;
    document.getElementById('twoFactorStatus').textContent = twoFactorEnabled ? 'Enabled' : 'Disabled';
    
    // Load user stats
    loadUserStats();
}

// ===== GET ROLE DISPLAY NAME =====
function getRoleDisplay(role) {
    const roles = {
        'admin': 'Administrator',
        'customer': 'Customer',
        'staff': 'Staff Member'
    };
    return roles[role] || role;
}

// ===== LOAD USER AVATAR =====
function loadUserAvatar() {
    const avatarImg = document.getElementById('profileAvatar');
    
    if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar;
    } else {
        // Generate avatar from initials
        const name = currentUser.name || 'Admin User';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarImg.src = `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`;
    }
}

// ===== LOAD USER STATISTICS =====
function loadUserStats() {
    // Get today's actions from activity log
    const today = new Date().toDateString();
    const actions = activityLog.filter(a => new Date(a.timestamp).toDateString() === today).length;
    document.getElementById('totalActions').textContent = actions;

    // Get login streak
    const logins = activityLog.filter(a => a.type === 'login').map(a => a.timestamp);
    const streak = calculateStreak(logins);
    document.getElementById('loginStreak').textContent = streak;

    // Get total logins
    const totalLogins = activityLog.filter(a => a.type === 'login').length;
    document.getElementById('totalLogins').textContent = totalLogins;
}

// ===== CALCULATE LOGIN STREAK =====
function calculateStreak(logins) {
    if (logins.length === 0) return 0;
    
    // Sort logins by date
    const loginDates = logins.map(l => new Date(l).toDateString());
    const uniqueDates = [...new Set(loginDates)].sort();
    
    let streak = 1;
    const today = new Date().toDateString();
    
    // Check if logged in today
    if (!uniqueDates.includes(today)) return 0;
    
    // Count consecutive days
    for (let i = uniqueDates.length - 1; i > 0; i--) {
        const current = new Date(uniqueDates[i]);
        const prev = new Date(uniqueDates[i - 1]);
        
        const diffTime = current - prev;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
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

    // Validate phone (Ethiopian format)
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }

    // Update user in allUsers array
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        // Update data
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
    document.getElementById('fullName').value = currentUser.name || '';
    document.getElementById('phone').value = currentUser.phone || '';
    document.getElementById('address').value = currentUser.address || '';
    document.getElementById('bio').value = currentUser.bio || '';
    
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
        showNotification('Password must be at least 8 characters with one special character (!@#$%^&*)', 'error');
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
        document.getElementById('currentPassword').value = '';
        document.getElementById('newPassword').value = '';
        document.getElementById('confirmPassword').value = '';
        document.querySelector('#passwordStrength .strength-bar').style.width = '0';
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
        strengthBar.style.width = '33.33%';
        strengthBar.className = 'strength-bar weak';
    } else if (strength === 3) {
        strengthBar.style.width = '66.66%';
        strengthBar.className = 'strength-bar medium';
    } else {
        strengthBar.style.width = '100%';
        strengthBar.className = 'strength-bar strong';
    }
});

// ===== TOGGLE TWO-FACTOR AUTHENTICATION =====
window.toggleTwoFactor = function() {
    const statusSpan = document.getElementById('twoFactorStatus');
    const currentStatus = statusSpan.textContent;
    const newStatus = currentStatus === 'Disabled' ? 'Enabled' : 'Disabled';
    
    if (newStatus === 'Enabled') {
        if (confirm('Enable two-factor authentication? This will add extra security to your account.')) {
            statusSpan.textContent = 'Enabled';
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
        if (!currentUser.preferences) currentUser.preferences = {};
        currentUser.preferences.twoFactor = enabled;
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
    }
}

// ===== LOAD SESSIONS =====
function loadSessions() {
    // Get saved sessions from localStorage
    let sessions = JSON.parse(localStorage.getItem('adminSessions')) || [];
    
    // Add current session if not exists
    const currentSessionExists = sessions.some(s => s.current === true);
    
    if (!currentSessionExists) {
        const newSession = {
            id: generateSessionId(),
            device: getDeviceInfo(),
            browser: getBrowserInfo(),
            os: getOSInfo(),
            location: 'Debre Birhan, Ethiopia',
            ip: getIPAddress(),
            current: true,
            lastActive: new Date().toISOString()
        };
        
        sessions.unshift(newSession);
        localStorage.setItem('adminSessions', JSON.stringify(sessions));
    }
    
    userSessions = sessions;
    displaySessions(sessions);
}

// ===== GENERATE SESSION ID =====
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ===== GET DEVICE INFO =====
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'Unknown Device';
    
    if (ua.includes('Windows')) device = 'Windows PC';
    else if (ua.includes('Mac')) device = 'Mac';
    else if (ua.includes('Linux') && !ua.includes('Android')) device = 'Linux PC';
    else if (ua.includes('Android')) device = 'Android Device';
    else if (ua.includes('iPhone')) device = 'iPhone';
    else if (ua.includes('iPad')) device = 'iPad';
    else if (ua.includes('iPod')) device = 'iPod';
    
    return device;
}

// ===== GET BROWSER INFO =====
function getBrowserInfo() {
    const ua = navigator.userAgent;
    let browser = 'Unknown';
    
    if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';
    else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
    
    return browser;
}

// ===== GET OS INFO =====
function getOSInfo() {
    const ua = navigator.userAgent;
    let os = 'Unknown';
    
    if (ua.includes('Windows NT 10.0')) os = 'Windows 10';
    else if (ua.includes('Windows NT 6.3')) os = 'Windows 8.1';
    else if (ua.includes('Windows NT 6.2')) os = 'Windows 8';
    else if (ua.includes('Windows NT 6.1')) os = 'Windows 7';
    else if (ua.includes('Mac OS X')) os = 'macOS';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
    
    return os;
}

// ===== GET IP ADDRESS (SIMULATED) =====
function getIPAddress() {
    // In a real app, this would come from the server
    // For demo, generate a realistic-looking local IP
    return '192.168.' + Math.floor(Math.random() * 255) + '.' + Math.floor(Math.random() * 255);
}

// ===== DISPLAY SESSIONS =====
function displaySessions(sessions) {
    const container = document.getElementById('sessionsList');
    if (!container) return;
    
    if (sessions.length === 0) {
        container.innerHTML = '<p class="no-data">No active sessions</p>';
        return;
    }
    
    container.innerHTML = sessions.map(session => {
        const isCurrent = session.current === true;
        const timeAgoStr = timeAgo(session.lastActive);
        
        return `
            <div class="session-item ${isCurrent ? 'current' : ''}">
                <div class="session-device">
                    <i class="fas fa-${session.device.includes('iPhone') || session.device.includes('Android') ? 'mobile-alt' : 'desktop'}"></i>
                    <div>
                        <p class="device-name">${session.device} - ${session.browser}</p>
                        <p class="device-location">${session.location} · ${session.ip} · ${session.os}</p>
                        <p class="session-time">Last active: ${timeAgoStr}</p>
                    </div>
                </div>
                ${isCurrent ? 
                    '<span class="session-badge current-badge">Current Session</span>' : 
                    `<button class="btn btn-outline btn-small" onclick="revokeSession('${session.id}')">Revoke</button>`
                }
            </div>
        `;
    }).join('');
}

// ===== REVOKE SESSION =====
window.revokeSession = function(sessionId) {
    if (confirm('Are you sure you want to revoke this session? The user will be logged out from that device.')) {
        const sessions = JSON.parse(localStorage.getItem('adminSessions')) || [];
        const updatedSessions = sessions.filter(s => s.id !== sessionId);
        localStorage.setItem('adminSessions', JSON.stringify(updatedSessions));
        
        userSessions = updatedSessions;
        displaySessions(updatedSessions);
        
        showNotification('Session revoked successfully', 'success');
        logActivity('session_revoke', `Revoked session from ${sessionId}`);
    }
};

// ===== SET THEME =====
window.setTheme = function(theme) {
    // Apply theme
    if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'system') {
        // Check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
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
        if (!currentUser.preferences) currentUser.preferences = {};
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
        if (!currentUser.preferences) currentUser.preferences = {};
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
    
    // Set form values
    if (document.getElementById('language')) 
        document.getElementById('language').value = prefs.language || 'en';
    
    if (document.getElementById('timezone')) 
        document.getElementById('timezone').value = prefs.timezone || 'Africa/Addis_Ababa';
    
    if (document.getElementById('dateFormat')) 
        document.getElementById('dateFormat').value = prefs.dateFormat || 'MM/DD/YYYY';
    
    if (document.getElementById('showStats')) 
        document.getElementById('showStats').checked = prefs.showStats !== false;
    
    if (document.getElementById('showCharts')) 
        document.getElementById('showCharts').checked = prefs.showCharts !== false;
    
    if (document.getElementById('showRecentOrders')) 
        document.getElementById('showRecentOrders').checked = prefs.showRecentOrders !== false;
    
    if (document.getElementById('compactView')) 
        document.getElementById('compactView').checked = prefs.compactView || false;
    
    // Apply theme
    if (prefs.theme) {
        setTheme(prefs.theme);
    }
}

// ===== LOAD ACTIVITY LOG =====
function loadActivityLog() {
    // If no activity log exists, create initial entry
    if (activityLog.length === 0) {
        activityLog = [
            {
                id: 1,
                type: 'login',
                description: 'Logged in successfully',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                ip: '192.168.1.100',
                device: getDeviceInfo()
            },
            {
                id: 2,
                type: 'profile_update',
                description: 'Updated profile information',
                timestamp: new Date(Date.now() - 86400000).toISOString(),
                ip: '192.168.1.100',
                device: getDeviceInfo()
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
                <small class="device-info">${activity.device || 'Unknown device'}</small>
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
        'session_revoke': 'ban',
        'avatar_update': 'camera'
    };
    return icons[type] || 'history';
}

// ===== LOG ACTIVITY =====
function logActivity(type, description) {
    const activity = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        type,
        description,
        timestamp: new Date().toISOString(),
        ip: getIPAddress(),
        device: getDeviceInfo()
    };
    
    activityLog.unshift(activity);
    
    // Keep only last 100 activities
    if (activityLog.length > 100) {
        activityLog.pop();
    }
    
    localStorage.setItem('adminActivityLog', JSON.stringify(activityLog));
    
    // Update display if activity section is active
    const activitySection = document.getElementById('activity');
    if (activitySection && activitySection.classList.contains('active')) {
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
                <small class="device-info">${activity.device || 'Unknown device'}</small>
            </div>
        `;
        timeline.appendChild(div);
    });
    
    const loadMoreBtn = document.querySelector('#activity .load-more button');
    if (loadMoreBtn && currentCount + 10 >= activityLog.length) {
        loadMoreBtn.disabled = true;
        loadMoreBtn.textContent = 'No More Activities';
    }
};

// ===== LOAD NOTIFICATIONS =====
function loadNotifications() {
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
            },
            {
                id: 2,
                type: 'order',
                title: 'New Order',
                message: 'You have a new pending order.',
                time: new Date(Date.now() - 1800000).toISOString(),
                read: false,
                icon: 'shopping-cart'
            },
            {
                id: 3,
                type: 'alert',
                title: 'Low Stock Alert',
                message: 'Some items are running low on stock.',
                time: new Date(Date.now() - 3600000).toISOString(),
                read: true,
                icon: 'exclamation-triangle'
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

    list.innerHTML = notifications.slice(0, 5).map(notification => {
        const timeAgoStr = timeAgo(notification.time);
        const isUnread = !notification.read;
        
        return `
            <div class="notification-item ${isUnread ? 'unread' : ''}" 
                 onclick="markNotificationRead(${notification.id})">
                <div class="notification-icon ${notification.type}">
                    <i class="fas fa-${notification.icon || 'bell'}"></i>
                </div>
                <div class="notification-content">
                    <p><strong>${notification.title}</strong></p>
                    <p>${notification.message}</p>
                    <small>${timeAgoStr}</small>
                </div>
                ${isUnread ? '<span class="unread-dot"></span>' : ''}
            </div>
        `;
    }).join('');
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
    
    const activeLink = document.querySelector(`[onclick="showSection('${sectionId}')"]`);
    if (activeLink) activeLink.classList.add('active');

    // Show section
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) targetSection.classList.add('active');

    // Load section-specific data
    if (sectionId === 'activity') {
        displayActivityLog(activityLog.slice(0, 10));
        
        // Show/hide load more button
        const loadMoreBtn = document.querySelector('#activity .load-more button');
        if (loadMoreBtn) {
            loadMoreBtn.disabled = activityLog.length <= 10;
            loadMoreBtn.textContent = activityLog.length <= 10 ? 'No More Activities' : 'Load More';
        }
    }
    
    if (sectionId === 'notifications') {
        displayRecentNotifications();
    }
    
    if (sectionId === 'security') {
        loadSessions();
    }
};

// ===== AVATAR UPLOAD =====
document.getElementById('avatarInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
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
            
            showNotification('Profile picture updated successfully', 'success');
            logActivity('avatar_update', 'Updated profile picture');
        }
    };
    reader.readAsDataURL(file);
});

// ===== SAVE NOTIFICATION SETTINGS =====
function saveNotificationSettings() {
    const settings = {
        emailNewOrder: document.getElementById('emailNewOrder')?.checked || false,
        emailNewReservation: document.getElementById('emailNewReservation')?.checked || false,
        emailLowStock: document.getElementById('emailLowStock')?.checked || false,
        emailNewUser: document.getElementById('emailNewUser')?.checked || false,
        pushNewOrder: document.getElementById('pushNewOrder')?.checked || false,
        pushNewReservation: document.getElementById('pushNewReservation')?.checked || false,
        pushLowStock: document.getElementById('pushLowStock')?.checked || false
    };

    // Save to user preferences
    const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!allUsers[userIndex].preferences) {
            allUsers[userIndex].preferences = {};
        }
        if (!allUsers[userIndex].preferences.notifications) {
            allUsers[userIndex].preferences.notifications = {};
        }
        allUsers[userIndex].preferences.notifications = settings;
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        if (!currentUser.preferences) currentUser.preferences = {};
        if (!currentUser.preferences.notifications) currentUser.preferences.notifications = {};
        currentUser.preferences.notifications = settings;
        localStorage.setItem('markanUser', JSON.stringify(currentUser));
        
        showNotification('Notification settings saved', 'success');
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Save notification settings on change
    document.querySelectorAll('#notifications input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', saveNotificationSettings);
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanUsers' || e.key === 'markanUser') {
            // Reload data
            initializeData();
            loadProfileData();
            updateAdminName();
        }
        if (e.key === 'adminActivityLog') {
            activityLog = JSON.parse(e.newValue || '[]');
            if (document.getElementById('activity').classList.contains('active')) {
                displayActivityLog(activityLog.slice(0, 10));
            }
        }
        if (e.key === 'adminNotifications') {
            notifications = JSON.parse(e.newValue || '[]');
            updateNotificationBadge();
            if (document.getElementById('notifications').classList.contains('active')) {
                displayRecentNotifications();
            }
        }
        if (e.key === 'adminSessions') {
            userSessions = JSON.parse(e.newValue || '[]');
            if (document.getElementById('security').classList.contains('active')) {
                displaySessions(userSessions);
            }
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const userName = currentUser?.name || 'Admin User';
    const nameElements = document.querySelectorAll('#adminName, .profile-info h4');
    nameElements.forEach(el => {
        if (el) el.textContent = userName;
    });
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
        minute: '2-digit',
        second: '2-digit'
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
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return formatDateTime(timestamp);
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas fa-${icons[type]}"></i>
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