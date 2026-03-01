// customer/js/profile.js - Customer Profile Management
// Markan Cafe - Debre Birhan University
// COMPLETE FIXED VERSION - All buttons working with localStorage

// ===== GLOBAL VARIABLES =====
let currentUser = null;
let allUsers = [];
let userOrders = [];
let userReservations = [];

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Profile page initializing...');
    
    // Get current user
    currentUser = getCurrentUser();
    if (!currentUser) {
        alert('Please login to access your profile');
        window.location.replace('../../login.html');
        return;
    }
    
    console.log('✅ Current user loaded:', currentUser.name);
    
    // Set user name in greeting (with null checks)
    setUserName();
    
    // Load all users for reference
    loadAllUsers();
    
    // Load user profile data
    loadUserProfile();
    
    // Load user statistics
    loadUserStats();
    
    // Load user preferences
    loadPreferences();
    
    // Load notification settings
    loadNotificationSettings();
    
    // Load user orders and reservations
    loadUserOrdersAndReservations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update sidebar badges
    updateSidebarBadges();
    
    console.log('✅ Profile page initialized');
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        if (!userStr) {
            console.log('❌ No user found in localStorage');
            return null;
        }
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Error getting user:', e);
        return null;
    }
}

// ===== SET USER NAME =====
function setUserName() {
    if (!currentUser) return;
    
    const firstName = currentUser.name ? currentUser.name.split(' ')[0] : 'Customer';
    
    const userNameEl = document.getElementById('userName');
    const userGreeting = document.getElementById('userGreeting');
    const adminNameEl = document.getElementById('adminName');
    
    if (userNameEl) userNameEl.textContent = firstName;
    if (userGreeting) userGreeting.innerHTML = `Hi, ${firstName}`;
    if (adminNameEl) adminNameEl.textContent = currentUser.name || 'Customer';
}

// ===== LOAD ALL USERS =====
function loadAllUsers() {
    try {
        const usersStr = localStorage.getItem('markanUsers');
        allUsers = usersStr ? JSON.parse(usersStr) : [];
        console.log('📋 Loaded', allUsers.length, 'users from database');
    } catch (e) {
        console.error('Error loading users:', e);
        allUsers = [];
    }
}

// ===== LOAD USER PROFILE =====
function loadUserProfile() {
    if (!currentUser) return;
    
    console.log('📋 Loading profile for:', currentUser.email);
    
    // Set profile information in sidebar
    const profileNameEl = document.getElementById('profileName');
    const profileEmailEl = document.getElementById('profileEmail');
    
    if (profileNameEl) profileNameEl.textContent = currentUser.name || 'Customer';
    if (profileEmailEl) profileEmailEl.textContent = currentUser.email || '';
    
    // Set form fields
    const fullNameEl = document.getElementById('fullName');
    const emailEl = document.getElementById('email');
    const phoneEl = document.getElementById('phone');
    const addressEl = document.getElementById('address');
    const bioEl = document.getElementById('bio');
    
    if (fullNameEl) fullNameEl.value = currentUser.name || '';
    if (emailEl) emailEl.value = currentUser.email || '';
    if (phoneEl) phoneEl.value = currentUser.phone || '';
    if (addressEl) addressEl.value = currentUser.address || '';
    if (bioEl) bioEl.value = currentUser.bio || '';
    
    // Set avatar
    loadUserAvatar();
    
    // Set member since
    setMemberSince();
}

// ===== LOAD USER AVATAR =====
function loadUserAvatar() {
    const avatarImg = document.getElementById('profileAvatar');
    if (!avatarImg) return;
    
    if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar;
    } else {
        // Generate avatar from initials
        const name = currentUser.name || 'Customer';
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        avatarImg.src = `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`;
    }
}

// ===== SET MEMBER SINCE =====
function setMemberSince() {
    const memberSinceEl = document.getElementById('memberSince');
    if (!memberSinceEl) return;
    
    if (currentUser.createdAt) {
        const joinDate = new Date(currentUser.createdAt);
        memberSinceEl.textContent = joinDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        memberSinceEl.textContent = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

// ===== LOAD USER STATISTICS =====
function loadUserStats() {
    if (!currentUser) return;
    
    try {
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        userOrders = orders.filter(o => o.customerId == currentUser.id);
        
        // Get reservations from localStorage
        const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        userReservations = reservations.filter(r => r.customerId == currentUser.id);
        
        // Update display
        const totalOrdersEl = document.getElementById('totalOrders');
        const totalReservationsEl = document.getElementById('totalReservations');
        const totalSpentEl = document.getElementById('totalSpent');
        const rewardPointsEl = document.getElementById('rewardPoints');
        
        if (totalOrdersEl) totalOrdersEl.textContent = userOrders.length;
        if (totalReservationsEl) totalReservationsEl.textContent = userReservations.length;
        
        // Calculate total spent
        const totalSpent = userOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
        if (totalSpentEl) totalSpentEl.textContent = formatETB(totalSpent);
        
        // Get reward points from user stats
        const points = (currentUser.stats && currentUser.stats.points) || 0;
        if (rewardPointsEl) rewardPointsEl.textContent = points;
        
        console.log('📊 Stats loaded:', {
            orders: userOrders.length,
            reservations: userReservations.length,
            spent: totalSpent,
            points: points
        });
        
    } catch (e) {
        console.error('Error loading stats:', e);
    }
}

// ===== LOAD USER ORDERS AND RESERVATIONS =====
function loadUserOrdersAndReservations() {
    if (!currentUser) return;
    
    try {
        // Load recent orders
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        userOrders = orders.filter(o => o.customerId == currentUser.id)
            .sort((a, b) => new Date(b.orderDate || 0) - new Date(a.orderDate || 0))
            .slice(0, 5);
        
        // Load recent reservations
        const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        userReservations = reservations.filter(r => r.customerId == currentUser.id)
            .sort((a, b) => new Date(b.date + 'T' + b.time || 0) - new Date(a.date + 'T' + a.time || 0))
            .slice(0, 5);
        
        // Display recent activity
        displayRecentActivity();
        
    } catch (e) {
        console.error('Error loading orders/reservations:', e);
    }
}

// ===== DISPLAY RECENT ACTIVITY =====
function displayRecentActivity() {
    const container = document.getElementById('recentActivity');
    if (!container) return;
    
    const activities = [];
    
    // Add orders to activities
    userOrders.forEach(order => {
        activities.push({
            type: 'order',
            id: order.id,
            description: `Order #${order.id} - ${order.status || 'pending'}`,
            date: order.orderDate || new Date().toISOString(),
            icon: 'fa-shopping-bag',
            color: '#c49a6c'
        });
    });
    
    // Add reservations to activities
    userReservations.forEach(res => {
        activities.push({
            type: 'reservation',
            id: res.id,
            description: `Reservation for ${formatDate(res.date)} at ${res.time || '--:--'}`,
            date: res.createdAt || res.date || new Date().toISOString(),
            icon: 'fa-calendar-check',
            color: '#4a2c1a'
        });
    });
    
    // Sort by date (newest first)
    activities.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (activities.length === 0) {
        container.innerHTML = '<p class="no-data" style="text-align: center; padding: 20px; color: #8b6f50;">No recent activity</p>';
        return;
    }
    
    container.innerHTML = activities.slice(0, 5).map(activity => `
        <div class="activity-item" style="display: flex; align-items: center; gap: 15px; padding: 10px; border-bottom: 1px solid #f5e6d3;">
            <div class="activity-icon" style="width: 40px; height: 40px; background: ${activity.color}20; color: ${activity.color}; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content" style="flex: 1;">
                <p style="margin: 0; color: #4a2c1a;">${activity.description}</p>
                <small style="color: #8b6f50;">${formatDate(activity.date)}</small>
            </div>
        </div>
    `).join('');
}

// ===== SAVE PERSONAL INFORMATION =====
window.savePersonalInfo = function() {
    console.log('🔘 Save Personal Info clicked');
    
    if (!currentUser) {
        alert('You must be logged in to update your profile');
        return;
    }
    
    // Get form values
    const name = document.getElementById('fullName')?.value?.trim();
    const phone = document.getElementById('phone')?.value?.trim();
    const address = document.getElementById('address')?.value?.trim();
    const bio = document.getElementById('bio')?.value?.trim();
    
    // Validate
    if (!name) {
        alert('❌ Full name is required');
        return;
    }
    
    if (!phone) {
        alert('❌ Phone number is required');
        return;
    }
    
    // Validate Ethiopian phone number
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        alert('❌ Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)');
        return;
    }
    
    // Find user in allUsers array
    const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
    
    if (userIndex !== -1) {
        // Update data
        allUsers[userIndex].name = name;
        allUsers[userIndex].phone = phone;
        allUsers[userIndex].address = address || '';
        allUsers[userIndex].bio = bio || '';
        allUsers[userIndex].updatedAt = new Date().toISOString();
        
        // Save to localStorage
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Update current user
        const updatedUser = { 
            ...currentUser, 
            name: name, 
            phone: phone, 
            address: address || '',
            bio: bio || '',
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('markanUser', JSON.stringify(updatedUser));
        currentUser = updatedUser;
        
        // Update UI (with null checks)
        const profileNameEl = document.getElementById('profileName');
        const userGreeting = document.getElementById('userGreeting');
        const userNameEl = document.getElementById('userName');
        
        if (profileNameEl) profileNameEl.textContent = name;
        if (userGreeting) userGreeting.innerHTML = `Hi, ${name.split(' ')[0]}`;
        if (userNameEl) userNameEl.textContent = name.split(' ')[0];
        
        alert('✅ Profile updated successfully!');
        
        // Log activity
        logActivity('profile_update', 'Updated personal information');
    } else {
        alert('❌ Error: User not found in database');
    }
};

// ===== RESET PERSONAL FORM =====
window.resetPersonalForm = function() {
    console.log('🔘 Reset Form clicked');
    
    if (!currentUser) return;
    
    const fullNameEl = document.getElementById('fullName');
    const phoneEl = document.getElementById('phone');
    const addressEl = document.getElementById('address');
    const bioEl = document.getElementById('bio');
    
    if (fullNameEl) fullNameEl.value = currentUser.name || '';
    if (phoneEl) phoneEl.value = currentUser.phone || '';
    if (addressEl) addressEl.value = currentUser.address || '';
    if (bioEl) bioEl.value = currentUser.bio || '';
    
    alert('📝 Changes discarded');
};

// ===== CHANGE PASSWORD =====
window.changePassword = function() {
    console.log('🔘 Change Password clicked');
    
    if (!currentUser) return;
    
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validate
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('❌ Please fill in all password fields');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        alert('❌ New passwords do not match');
        return;
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        alert('❌ Password must be at least 8 characters with one special character (!@#$%^&*)');
        return;
    }
    
    // Find user in allUsers array
    const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
    
    if (userIndex !== -1) {
        // Verify current password
        if (allUsers[userIndex].password !== currentPassword) {
            alert('❌ Current password is incorrect');
            return;
        }
        
        // Update password
        allUsers[userIndex].password = newPassword;
        allUsers[userIndex].updatedAt = new Date().toISOString();
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        alert('✅ Password changed successfully!');
        
        // Clear form
        const currentPassEl = document.getElementById('currentPassword');
        const newPassEl = document.getElementById('newPassword');
        const confirmPassEl = document.getElementById('confirmPassword');
        
        if (currentPassEl) currentPassEl.value = '';
        if (newPassEl) newPassEl.value = '';
        if (confirmPassEl) confirmPassEl.value = '';
        
        // Reset strength bar
        const strengthBar = document.querySelector('#passwordStrength .strength-bar');
        if (strengthBar) {
            strengthBar.style.width = '0';
            strengthBar.className = 'strength-bar';
        }
        
        // Log activity
        logActivity('password_change', 'Changed password');
    } else {
        alert('❌ Error: User not found in database');
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

// ===== LOAD PREFERENCES =====
function loadPreferences() {
    try {
        const preferences = JSON.parse(localStorage.getItem('customerPreferences')) || {};
        
        const languageEl = document.getElementById('language');
        const currencyEl = document.getElementById('currency');
        const saveAddressEl = document.getElementById('saveAddress');
        const defaultTakeawayEl = document.getElementById('defaultTakeaway');
        
        if (languageEl) languageEl.value = preferences.language || 'en';
        if (currencyEl) currencyEl.value = preferences.currency || 'ETB';
        if (saveAddressEl) saveAddressEl.checked = preferences.saveAddress !== false;
        if (defaultTakeawayEl) defaultTakeawayEl.checked = preferences.defaultTakeaway || false;
        
        console.log('📋 Preferences loaded:', preferences);
        
    } catch (e) {
        console.error('Error loading preferences:', e);
    }
}

// ===== SAVE PREFERENCES =====
window.savePreferences = function() {
    console.log('🔘 Save Preferences clicked');
    
    try {
        const preferences = {
            language: document.getElementById('language')?.value || 'en',
            currency: document.getElementById('currency')?.value || 'ETB',
            saveAddress: document.getElementById('saveAddress')?.checked || false,
            defaultTakeaway: document.getElementById('defaultTakeaway')?.checked || false,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('customerPreferences', JSON.stringify(preferences));
        alert('✅ Preferences saved successfully!');
        
        console.log('💾 Preferences saved:', preferences);
        
        // Log activity
        logActivity('preferences_save', 'Saved preferences');
        
    } catch (e) {
        console.error('Error saving preferences:', e);
        alert('❌ Error saving preferences');
    }
};

// ===== LOAD NOTIFICATION SETTINGS =====
function loadNotificationSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('notificationSettings')) || {};
        
        const notifyOrdersEl = document.getElementById('notifyOrders');
        const notifyReservationsEl = document.getElementById('notifyReservations');
        const notifyPromotionsEl = document.getElementById('notifyPromotions');
        const notifyEmailEl = document.getElementById('notifyEmail');
        
        if (notifyOrdersEl) notifyOrdersEl.checked = settings.notifyOrders !== false;
        if (notifyReservationsEl) notifyReservationsEl.checked = settings.notifyReservations !== false;
        if (notifyPromotionsEl) notifyPromotionsEl.checked = settings.notifyPromotions || false;
        if (notifyEmailEl) notifyEmailEl.checked = settings.notifyEmail !== false;
        
        console.log('📋 Notification settings loaded:', settings);
        
    } catch (e) {
        console.error('Error loading notification settings:', e);
    }
}

// ===== SAVE NOTIFICATION SETTINGS =====
window.saveNotificationSettings = function() {
    console.log('🔘 Save Notification Settings clicked');
    
    try {
        const settings = {
            notifyOrders: document.getElementById('notifyOrders')?.checked || false,
            notifyReservations: document.getElementById('notifyReservations')?.checked || false,
            notifyPromotions: document.getElementById('notifyPromotions')?.checked || false,
            notifyEmail: document.getElementById('notifyEmail')?.checked || false,
            updatedAt: new Date().toISOString()
        };
        
        localStorage.setItem('notificationSettings', JSON.stringify(settings));
        alert('✅ Notification settings saved!');
        
        console.log('💾 Notification settings saved:', settings);
        
        // Log activity
        logActivity('notifications_update', 'Updated notification settings');
        
    } catch (e) {
        console.error('Error saving notification settings:', e);
        alert('❌ Error saving settings');
    }
};

// ===== SET THEME =====
window.setTheme = function(theme) {
    console.log('🎨 Set theme:', theme);
    
    // Apply theme to body
    document.body.classList.remove('theme-light', 'theme-dark', 'theme-system');
    document.body.classList.add(`theme-${theme}`);
    
    // Save preference
    try {
        const preferences = JSON.parse(localStorage.getItem('customerPreferences')) || {};
        preferences.theme = theme;
        localStorage.setItem('customerPreferences', JSON.stringify(preferences));
        alert(`✅ Theme set to ${theme}`);
    } catch (e) {
        console.error('Error saving theme:', e);
    }
};

// ===== CONFIRM DELETE ACCOUNT =====
window.confirmDeleteAccount = function() {
    console.log('🔘 Delete Account clicked');
    
    if (!currentUser) return;
    
    const firstConfirm = confirm('⚠️ Are you absolutely sure you want to delete your account? This action CANNOT be undone.');
    
    if (firstConfirm) {
        const secondConfirm = confirm('⚠️ All your order history, reservations, and personal data will be permanently deleted. Continue?');
        
        if (secondConfirm) {
            deleteAccount();
        }
    }
};

// ===== DELETE ACCOUNT =====
function deleteAccount() {
    if (!currentUser) return;
    
    // Remove user from users list
    const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
    if (userIndex !== -1) {
        allUsers.splice(userIndex, 1);
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
    }
    
    // Clear user's cart
    const cartKey = `cart_${currentUser.id}`;
    localStorage.removeItem(cartKey);
    
    // Clear user's saved orders
    const savedKey = `saved_orders_${currentUser.id}`;
    localStorage.removeItem(savedKey);
    
    // Clear user data
    localStorage.removeItem('markanUser');
    
    alert('✅ Account deleted successfully. We\'re sorry to see you go!');
    
    setTimeout(() => {
        window.location.href = '../../index.html';
    }, 2000);
}

// ===== AVATAR UPLOAD =====
document.getElementById('avatarInput')?.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    console.log('📸 Avatar file selected:', file.name);
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('❌ Please select an image file');
        this.value = '';
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('❌ Image size should be less than 2MB');
        this.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarUrl = e.target.result;
        
        // Update avatar display
        const avatarImg = document.getElementById('profileAvatar');
        if (avatarImg) avatarImg.src = avatarUrl;
        
        // Save to user profile
        if (currentUser) {
            const userIndex = allUsers.findIndex(u => u.id == currentUser.id);
            
            if (userIndex !== -1) {
                allUsers[userIndex].avatar = avatarUrl;
                localStorage.setItem('markanUsers', JSON.stringify(allUsers));
                
                // Update current user
                currentUser.avatar = avatarUrl;
                localStorage.setItem('markanUser', JSON.stringify(currentUser));
                
                alert('✅ Profile picture updated successfully!');
                
                // Log activity
                logActivity('avatar_update', 'Updated profile picture');
            }
        }
    };
    reader.readAsDataURL(file);
});

// ===== SHOW SECTION =====
window.showSection = function(sectionId) {
    console.log('📱 Showing section:', sectionId);
    
    // Update active menu item
    document.querySelectorAll('.profile-menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Find and activate the correct menu item
    const activeItem = document.querySelector(`[onclick*="showSection('${sectionId}')"]`);
    if (activeItem) activeItem.classList.add('active');
    
    // Show selected section
    document.querySelectorAll('.profile-section').forEach(section => {
        section.classList.remove('active');
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
};

// ===== LOG ACTIVITY =====
function logActivity(type, description) {
    try {
        const activities = JSON.parse(localStorage.getItem('userActivities')) || [];
        
        activities.unshift({
            id: Date.now(),
            userId: currentUser ? currentUser.id : null,
            type: type,
            description: description,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 activities
        if (activities.length > 50) {
            activities.pop();
        }
        
        localStorage.setItem('userActivities', JSON.stringify(activities));
        
    } catch (e) {
        console.error('Error logging activity:', e);
    }
}

// ===== UPDATE SIDEBAR BADGES =====
function updateSidebarBadges() {
    if (!currentUser) return;
    
    try {
        // Update orders badge
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        const pendingOrders = orders.filter(o => o.customerId == currentUser.id && o.status === 'pending').length;
        
        const ordersBadge = document.getElementById('sidebarOrdersBadge');
        if (ordersBadge) {
            ordersBadge.textContent = pendingOrders;
            ordersBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
        }
    } catch (e) {
        console.error('Error updating orders badge:', e);
    }
    
    // Update cart badge
    updateCartCount();
    
    // Update reservation badge
    try {
        const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        const upcomingReservations = reservations.filter(r => 
            r.customerId == currentUser.id && 
            (r.status === 'pending' || r.status === 'confirmed')
        ).length;
        
        const resBadge = document.getElementById('sidebarReservationBadge');
        if (resBadge) {
            resBadge.textContent = upcomingReservations;
            resBadge.style.display = upcomingReservations > 0 ? 'inline-block' : 'none';
        }
    } catch (e) {
        console.error('Error updating reservation badge:', e);
    }
    
    // Update points and tier
    if (currentUser.stats) {
        const pointsEl = document.getElementById('userPoints');
        const tierEl = document.getElementById('userTier');
        if (pointsEl) pointsEl.textContent = (currentUser.stats.points || 0) + ' pts';
        if (tierEl) tierEl.textContent = (currentUser.stats.tier || 'bronze').charAt(0).toUpperCase() + 
            (currentUser.stats.tier || 'bronze').slice(1);
    }
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    if (!currentUser) return;
    
    const cartKey = `cart_${currentUser.id}`;
    try {
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const cartBadges = document.querySelectorAll('#cartCount, #sidebarCartBadge');
        cartBadges.forEach(badge => {
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
            }
        });
    } catch (e) {
        console.error('Error updating cart count:', e);
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    console.log('🔧 Setting up event listeners...');
    
    // Tab switching for profile sections
    document.querySelectorAll('.profile-menu-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get section id from href
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const sectionId = href.substring(1);
                showSection(sectionId);
            }
        });
    });
    
    // Save button listeners
    const savePersonalBtn = document.querySelector('button[onclick="savePersonalInfo()"]');
    if (savePersonalBtn) {
        savePersonalBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePersonalInfo();
        });
    }
    
    const changePasswordBtn = document.querySelector('button[onclick="changePassword()"]');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    const savePrefsBtn = document.querySelector('button[onclick="savePreferences()"]');
    if (savePrefsBtn) {
        savePrefsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            savePreferences();
        });
    }
    
    const saveNotifBtn = document.querySelector('button[onclick="saveNotificationSettings()"]');
    if (saveNotifBtn) {
        saveNotifBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveNotificationSettings();
        });
    }
    
    // Listen for storage events (updates from other tabs)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanUsers' || e.key === 'markanUser') {
            console.log('🔄 User data updated in another tab, reloading...');
            // Reload user data
            currentUser = getCurrentUser();
            loadUserProfile();
            loadUserStats();
        }
    });
    
    console.log('✅ Event listeners set up');
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return Math.round(amount).toLocaleString() + ' ETB';
}

// ===== HELPER: FORMAT DATE =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateString;
    }
}

// ===== EXPORT FUNCTIONS FOR GLOBAL USE =====
window.savePersonalInfo = savePersonalInfo;
window.resetPersonalForm = resetPersonalForm;
window.changePassword = changePassword;
window.savePreferences = savePreferences;
window.saveNotificationSettings = saveNotificationSettings;
window.setTheme = setTheme;
window.confirmDeleteAccount = confirmDeleteAccount;
window.showSection = showSection;

console.log('✅ Profile.js fully loaded with all functions');