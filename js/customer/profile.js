// js/customer/profile.js - Customer Profile Logic
// Markan Cafe - Debre Birhan University

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
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
    document.getElementById('profilePhone').textContent = user.phone || 'Not provided';
    document.getElementById('profileRole').textContent = user.role === 'admin' ? 'Administrator' : 'Customer';
    
    // Update form fields
    document.getElementById('fullName').value = user.name || '';
    document.getElementById('displayEmail').value = user.email || '';
    document.getElementById('phone').value = user.phone || '';
    document.getElementById('address').value = user.address || '';
    
    // Load stats
    loadProfileStats();
}

async function loadProfileStats() {
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        const stats = await API.dashboard.getCustomerStats(user.id);
        
        document.getElementById('profileOrders').textContent = stats.totalOrders || 0;
        document.getElementById('profileSpent').textContent = formatCurrency(stats.totalSpent || 0);
        document.getElementById('profilePoints').textContent = stats.rewardsPoints || 0;
        
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
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value
            };
            
            // Validate phone if provided
            if (updates.phone && !validateEthiopianPhone(updates.phone)) {
                showNotification('Please enter a valid Ethiopian phone number', 'error');
                return;
            }
            
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
            }
        });
    }
    
    // Preferences toggles
    const darkModeToggle = document.getElementById('darkMode');
    if (darkModeToggle) {
        // Load saved preference
        const savedTheme = localStorage.getItem('theme') === 'dark';
        darkModeToggle.checked = savedTheme;
        
        darkModeToggle.addEventListener('change', (e) => {
            document.body.classList.toggle('dark-theme', e.target.checked);
            localStorage.setItem('theme', e.target.checked ? 'dark' : 'light');
        });
    }
    
    const emailNotifications = document.getElementById('emailNotifications');
    if (emailNotifications) {
        emailNotifications.addEventListener('change', (e) => {
            showNotification(`Email notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    const smsNotifications = document.getElementById('smsNotifications');
    if (smsNotifications) {
        smsNotifications.addEventListener('change', (e) => {
            showNotification(`SMS notifications ${e.target.checked ? 'enabled' : 'disabled'}`, 'info');
        });
    }
    
    // Change avatar button
    const changeAvatarBtn = document.getElementById('changeAvatar');
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', () => {
            showNotification('Avatar change feature coming soon', 'info');
        });
    }
}