// js/admin/profile.js - Admin Profile Logic
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
    setupTabs();
    setupEventListeners();
});

// Load profile data
function loadProfileData() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Update header
    const adminNameElements = document.querySelectorAll('#adminName');
    adminNameElements.forEach(el => {
        if (el) el.textContent = user.name;
    });
    
    // Update profile sidebar
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileRole = document.getElementById('profileRole');
    const profileJoined = document.getElementById('profileJoined');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profilePhone) profilePhone.textContent = user.phone || '+251911234567';
    if (profileRole) profileRole.textContent = 'Administrator';
    if (profileJoined) {
        const joinedDate = user.createdAt ? new Date(user.createdAt) : new Date('2025-01-01');
        profileJoined.textContent = joinedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    
    // Update form fields
    const fullName = document.getElementById('fullName');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const department = document.getElementById('department');
    const bio = document.getElementById('bio');
    
    if (fullName) fullName.value = user.name || '';
    if (displayEmail) displayEmail.value = user.email || '';
    if (displayPhone) displayPhone.value = user.phone || '+251911234567';
    if (department) department.value = 'Management';
    if (bio) bio.value = 'Experienced restaurant manager with expertise in Ethiopian cuisine and hospitality.';
    
    // Load stats
    loadProfileStats();
}

// Load profile statistics
function loadProfileStats() {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    const profileOrders = document.getElementById('profileOrders');
    const profileRevenue = document.getElementById('profileRevenue');
    
    if (profileOrders) profileOrders.textContent = orders.length;
    if (profileRevenue) profileRevenue.textContent = formatCurrency(totalRevenue);
}

// Setup tabs
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.style.display = 'none');
            
            tab.classList.add('active');
            const content = document.getElementById(`${tabId}Tab`);
            if (content) content.style.display = 'block';
        });
    });
}

// Update profile info
function updateProfileInfo() {
    const fullName = document.getElementById('fullName')?.value;
    const phone = document.getElementById('displayPhone')?.value;
    const department = document.getElementById('department')?.value;
    const bio = document.getElementById('bio')?.value;

    if (!fullName) {
        showNotification('Name cannot be empty', 'error');
        return;
    }

    // Validate phone if provided
    if (phone) {
        const phoneRegex = /^(09|\+2519)\d{8}$/;
        if (!phoneRegex.test(phone)) {
            showNotification('Please enter a valid Ethiopian phone number', 'error');
            return;
        }
    }

    const updates = {
        name: fullName,
        phone: phone
    };

    // Update via Auth
    Auth.updateProfile(updates);
    
    // Update display
    document.getElementById('profileName').textContent = fullName;
    document.getElementById('profilePhone').textContent = phone || '+251911234567';
    
    showNotification('Profile updated successfully', 'success');
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Please fill in all password fields', 'error');
        return;
    }

    if (newPassword !== confirmPassword) {
        showNotification('New passwords do not match', 'error');
        return;
    }

    const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        showNotification('Password must be at least 8 characters with one special character', 'error');
        return;
    }

    // Change password via Auth
    Auth.changePassword(currentPassword, newPassword);
    
    // Clear form
    document.getElementById('passwordForm').reset();
}

// Save notification preferences
function savePreferences() {
    const preferences = {
        orderAlerts: document.getElementById('orderAlerts')?.checked || false,
        reservationAlerts: document.getElementById('reservationAlerts')?.checked || false,
        paymentAlerts: document.getElementById('paymentAlerts')?.checked || false,
        stockAlerts: document.getElementById('stockAlerts')?.checked || false,
        emailNotifications: document.getElementById('emailNotifications')?.checked || false
    };

    // Save to localStorage
    localStorage.setItem('adminPreferences', JSON.stringify(preferences));
    showNotification('Preferences saved successfully', 'success');
}

// Load saved preferences
function loadPreferences() {
    const saved = localStorage.getItem('adminPreferences');
    if (saved) {
        const prefs = JSON.parse(saved);
        
        const orderAlerts = document.getElementById('orderAlerts');
        const reservationAlerts = document.getElementById('reservationAlerts');
        const paymentAlerts = document.getElementById('paymentAlerts');
        const stockAlerts = document.getElementById('stockAlerts');
        const emailNotifications = document.getElementById('emailNotifications');
        
        if (orderAlerts) orderAlerts.checked = prefs.orderAlerts || false;
        if (reservationAlerts) reservationAlerts.checked = prefs.reservationAlerts || false;
        if (paymentAlerts) paymentAlerts.checked = prefs.paymentAlerts || false;
        if (stockAlerts) stockAlerts.checked = prefs.stockAlerts || false;
        if (emailNotifications) emailNotifications.checked = prefs.emailNotifications || false;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Profile info form
    const infoForm = document.getElementById('profileInfoForm');
    if (infoForm) {
        infoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            updateProfileInfo();
        });
    }

    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', (e) => {
            e.preventDefault();
            changePassword();
        });
    }

    // Save preferences button
    const savePrefsBtn = document.querySelector('#notificationsTab .btn-primary');
    if (savePrefsBtn) {
        savePrefsBtn.addEventListener('click', savePreferences);
    }

    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatarBtn');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            showNotification('Avatar change feature coming soon', 'info');
        });
    }

    // Enable 2FA button
    const enable2FABtn = document.querySelector('#securityTab .btn-outline');
    if (enable2FABtn) {
        enable2FABtn.addEventListener('click', () => {
            showNotification('2FA setup coming soon', 'info');
        });
    }

    // Load preferences when notifications tab is shown
    const notificationsTab = document.querySelector('[data-tab="notifications"]');
    if (notificationsTab) {
        notificationsTab.addEventListener('click', loadPreferences);
    }
}

// Format currency helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions
window.updateProfileInfo = updateProfileInfo;
window.changePassword = changePassword;
window.savePreferences = savePreferences;