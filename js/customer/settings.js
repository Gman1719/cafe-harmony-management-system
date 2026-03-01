// js/customer/profile.js - Customer Profile Logic
// Markan Cafe - Debre Birhan University

// Initialize profile page
document.addEventListener('DOMContentLoaded', function() {
    loadProfileData();
    setupEventListeners();
});

// Load profile data
function loadProfileData() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Update profile sidebar
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const profilePhone = document.getElementById('profilePhone');
    const profileRole = document.getElementById('profileRole');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (profilePhone) profilePhone.textContent = user.phone || '+251912345678';
    if (profileRole) profileRole.textContent = user.role === 'admin' ? 'Administrator' : 'Customer';
    
    // Update form fields
    const fullName = document.getElementById('fullName');
    const displayEmail = document.getElementById('displayEmail');
    const displayPhone = document.getElementById('displayPhone');
    const address = document.getElementById('address');
    
    if (fullName) fullName.value = user.name || '';
    if (displayEmail) displayEmail.value = user.email || '';
    if (displayPhone) displayPhone.value = user.phone || '+251912345678';
    if (address) address.value = user.address || 'Debre Birhan University';
    
    // Load stats
    loadProfileStats(user);
}

// Load profile statistics
function loadProfileStats(user) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const userOrders = orders.filter(o => o.customerId === user.id);
    
    const totalOrders = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalPoints = Math.floor(totalSpent * 10); // 10 points per dollar
    
    const ordersElement = document.getElementById('profileOrders');
    const spentElement = document.getElementById('profileSpent');
    const pointsElement = document.getElementById('profilePoints');
    
    if (ordersElement) ordersElement.textContent = totalOrders;
    if (spentElement) spentElement.textContent = formatCurrency(totalSpent);
    if (pointsElement) pointsElement.textContent = totalPoints;
}

// Update profile info
function updateProfileInfo() {
    const fullName = document.getElementById('fullName')?.value;
    const phone = document.getElementById('displayPhone')?.value;
    const address = document.getElementById('address')?.value;

    if (!fullName) {
        showNotification('Name cannot be empty', 'error');
        return;
    }

    // Validate phone if provided
    if (phone) {
        const phoneRegex = /^(09|\+2519)\d{8}$/;
        if (!phoneRegex.test(phone)) {
            showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
            return;
        }
    }

    const updates = {
        name: fullName,
        phone: phone,
        address: address
    };

    // Update via Auth
    Auth.updateProfile(updates);
    
    // Update display
    const profileName = document.getElementById('profileName');
    const profilePhone = document.getElementById('profilePhone');
    
    if (profileName) profileName.textContent = fullName;
    if (profilePhone) profilePhone.textContent = phone || '+251912345678';
    
    showNotification('Profile updated successfully', 'success');
}

// Change password
function changePassword() {
    const currentPassword = document.getElementById('currentPassword')?.value;
    const newPassword = document.getElementById('newPassword')?.value;
    const confirmPassword = document.getElementById('confirmNewPassword')?.value;

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
}

// Save preferences
function savePreferences() {
    const preferences = {
        emailNotifications: document.getElementById('emailNotifications')?.checked || false,
        smsNotifications: document.getElementById('smsNotifications')?.checked || false,
        darkMode: document.getElementById('darkMode')?.checked || false
    };

    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    
    // Apply dark mode if selected
    if (preferences.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    showNotification('Preferences saved successfully', 'success');
}

// Load saved preferences
function loadPreferences() {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
        const prefs = JSON.parse(saved);
        
        const emailNotif = document.getElementById('emailNotifications');
        const smsNotif = document.getElementById('smsNotifications');
        const darkMode = document.getElementById('darkMode');
        
        if (emailNotif) emailNotif.checked = prefs.emailNotifications || false;
        if (smsNotif) smsNotif.checked = prefs.smsNotifications || false;
        if (darkMode) darkMode.checked = prefs.darkMode || false;
        
        // Apply dark mode
        if (prefs.darkMode) {
            document.body.classList.add('dark-mode');
        }
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
    const savePrefsBtn = document.querySelector('#preferencesTab .btn-save');
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

    // Load preferences when switching to preferences tab
    const prefsTab = document.querySelector('[data-tab="preferences"]');
    if (prefsTab) {
        prefsTab.addEventListener('click', loadPreferences);
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