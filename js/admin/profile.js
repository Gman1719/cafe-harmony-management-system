// js/admin/profile.js - Admin Profile Logic
// Markan Cafe - Debre Birhan University

document.addEventListener('DOMContentLoaded', () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load profile data
    loadProfileData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup tabs
    setupTabs();
});

function loadProfileData() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Update profile sidebar
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profilePhone').textContent = user.phone || '+251 912 345 678';
    document.getElementById('profileRole').textContent = 'Administrator';
    document.getElementById('profileDepartment').textContent = 'Management';
    
    // Update form fields
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('displayEmail').value = user.email || '';
    document.getElementById('phone').value = user.phone || '+251 912 345 678';
    document.getElementById('department').value = 'Management';
    
    // Load stats
    loadProfileStats();
}

async function loadProfileStats() {
    try {
        const stats = await API.dashboard.getAdminStats();
        
        document.getElementById('profileOrders').textContent = stats.totalOrders || 0;
        document.getElementById('profileRevenue').textContent = formatCurrency(stats.totalRevenue || 0);
        
        // Calculate days active
        const user = Auth.getCurrentUser();
        const createdDate = user.createdAt ? new Date(user.createdAt) : new Date('2025-01-01');
        const today = new Date();
        const daysActive = Math.floor((today - createdDate) / (1000 * 60 * 60 * 24));
        document.getElementById('profileDays').textContent = daysActive || 30;
        
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Update active button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update active content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}Tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function setupEventListeners() {
    // Profile info form
    const infoForm = document.getElementById('profileInfoForm');
    if (infoForm) {
        infoForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const updates = {
                name: document.getElementById('fullName').value,
                phone: document.getElementById('phone').value
            };
            
            try {
                await Auth.updateProfile(updates);
                loadProfileData(); // Reload data
                showNotification('Profile updated successfully', 'success');
            } catch (error) {
                console.error('Failed to update profile:', error);
            }
        });
    }
    
    // Password form
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmNewPassword').value;
            
            // Validate
            if (!currentPassword || !newPassword || !confirmPassword) {
                showNotification('Please fill in all password fields', 'error');
                return;
            }
            
            if (newPassword !== confirmPassword) {
                showNotification('New passwords do not match', 'error');
                return;
            }
            
            if (!validatePassword(newPassword)) {
                showNotification('Password must be at least 8 characters with one special character', 'error');
                return;
            }
            
            try {
                await Auth.changePassword(currentPassword, newPassword);
                passwordForm.reset();
                showNotification('Password changed successfully', 'success');
            } catch (error) {
                console.error('Failed to change password:', error);
                showNotification(error.message || 'Failed to change password', 'error');
            }
        });
    }
    
    // Notification toggles
    const newOrderAlert = document.getElementById('newOrderAlert');
    if (newOrderAlert) {
        newOrderAlert.addEventListener('change', (e) => {
            showNotification(`New order alerts ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    const paymentAlert = document.getElementById('paymentAlert');
    if (paymentAlert) {
        paymentAlert.addEventListener('change', (e) => {
            showNotification(`Payment notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    const lowStockAlert = document.getElementById('lowStockAlert');
    if (lowStockAlert) {
        lowStockAlert.addEventListener('change', (e) => {
            showNotification(`Low stock alerts ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    const dailyReport = document.getElementById('dailyReport');
    if (dailyReport) {
        dailyReport.addEventListener('change', (e) => {
            showNotification(`Daily reports ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    // Dark mode toggle
    const darkMode = document.getElementById('darkMode');
    if (darkMode) {
        const savedTheme = localStorage.getItem('theme') === 'dark';
        darkMode.checked = savedTheme;
        
        darkMode.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-theme', e.target.checked);
            localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
        });
    }
    
    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatar');
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
    
    // Save preferences button
    const savePrefsBtn = document.querySelector('#notificationsTab .btn-primary');
    if (savePrefsBtn) {
        savePrefsBtn.addEventListener('click', () => {
            showNotification('Preferences saved successfully', 'success');
        });
    }
}