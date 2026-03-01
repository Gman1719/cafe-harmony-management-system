// js/auth.js - Professional Authentication System
// Markan Cafe - Debre Birhan University

const Auth = {
    STORAGE_KEY: 'markanUser',
    
    ROLES: {
        ADMIN: 'admin',
        CUSTOMER: 'customer',
        STAFF: 'staff'
    },
    
    currentUser: null,
    
    async init() {
        console.log('🔐 Auth initializing...');
        
        // Check if UsersDB is already loaded
        if (typeof UsersDB === 'undefined') {
            console.log('⏳ Waiting for UsersDB to load...');
            
            // Try multiple times with increasing delays
            let attempts = 0;
            const maxAttempts = 20;
            
            while (attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 100));
                if (typeof UsersDB !== 'undefined') {
                    console.log('✅ UsersDB loaded after', attempts * 100, 'ms');
                    break;
                }
                attempts++;
            }
            
            if (typeof UsersDB === 'undefined') {
                console.error('❌ UsersDB failed to load after', maxAttempts * 100, 'ms');
                this.showNotification('System error: Database not loaded', 'error');
                return;
            }
        }
        
        this.checkSession();
        this.setupEventListeners();
        
        // Update navigation after DOM is ready
        setTimeout(() => {
            this.updateNavigation();
        }, 200);
        
        console.log('✅ Auth initialized');
    },
    
    checkSession() {
        const savedUser = localStorage.getItem(this.STORAGE_KEY);
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                console.log('✅ Session restored:', this.currentUser.email);
                return true;
            } catch (e) {
                console.error('❌ Failed to parse user data');
                this.logout(false);
            }
        }
        return false;
    },
    
    async login(email, password, remember = false) {
        try {
            if (!email || !password) {
                throw new Error('Please fill in all fields');
            }
            
            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email');
            }
            
            // Use UsersDB to authenticate
            const user = UsersDB.authenticate(email, password);
            
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            // Add session data
            user.sessionStart = new Date().toISOString();
            user.lastActivity = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            this.currentUser = user;
            
            this.updateNavigation();
            
            this.showNotification(`Welcome back, ${user.name}!`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin/html/dashboard.html';
                } else if (user.role === 'staff') {
                    window.location.href = 'staff/html/dashboard.html';
                } else {
                    window.location.href = 'customer/html/dashboard.html';
                }
            }, 500);
            
            return { success: true, user };
            
        } catch (error) {
            this.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        }
    },
    
    async register(userData) {
        try {
            if (!userData.name || !userData.email || !userData.password || !userData.phone) {
                throw new Error('Please fill in all fields');
            }
            
            if (!this.validateEmail(userData.email)) {
                throw new Error('Please enter a valid email');
            }
            
            if (!this.validatePhone(userData.phone)) {
                throw new Error('Please enter a valid Ethiopian phone number');
            }
            
            if (!this.validatePassword(userData.password)) {
                throw new Error('Password must be at least 8 characters with one special character');
            }
            
            // Use UsersDB to create user
            const newUser = UsersDB.create({
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role || 'customer'
            });
            
            if (!newUser) {
                throw new Error('Email already registered');
            }
            
            this.showNotification('Registration successful! Please login.', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
            return { success: true };
            
        } catch (error) {
            this.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        }
    },
    
    logout(showMessage = true) {
        // Clear current user
        this.currentUser = null;
        
        // Remove from storage
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Update UI immediately
        this.updateNavigation();
        
        // Show message
        if (showMessage) {
            this.showNotification('Logged out successfully', 'success');
        }
        
        // Get current path to determine correct redirect
        const currentPath = window.location.pathname;
        
        // Determine how many levels up to go
        let redirectPath = 'index.html';
        
        if (currentPath.includes('/admin/')) {
            redirectPath = '../../index.html';
        } else if (currentPath.includes('/customer/')) {
            redirectPath = '../../index.html';
        } else if (currentPath.includes('/staff/')) {
            redirectPath = '../../index.html';
        } else {
            redirectPath = 'index.html';
        }
        
        // Redirect to home
        setTimeout(() => {
            window.location.href = redirectPath;
        }, 500);
    },
    
    updateNavigation() {
        // Don't update navigation on admin/customer pages
        const path = window.location.pathname;
        if (path.includes('/admin/') || path.includes('/customer/') || path.includes('/staff/')) {
            return;
        }
        
        const navMenus = document.querySelectorAll('.navbar-menu');
        
        navMenus.forEach(menu => {
            if (!menu) return;
            
            // Find the original navbar buttons
            const originalButtons = menu.querySelector('.navbar-buttons');
            
            if (!originalButtons) return;
            
            if (this.isAuthenticated()) {
                // User is logged in - replace with Dashboard/Logout
                // Clear the container
                originalButtons.innerHTML = '';
                
                // Add Dashboard link
                const dashboardLink = document.createElement('a');
                dashboardLink.href = this.currentUser.role === 'admin' 
                    ? 'admin/html/dashboard.html' 
                    : this.currentUser.role === 'staff'
                    ? 'staff/html/dashboard.html'
                    : 'customer/html/dashboard.html';
                dashboardLink.className = 'btn btn-primary';
                dashboardLink.innerHTML = `<i class="fas ${
                    this.currentUser.role === 'admin' ? 'fa-cog' : 
                    this.currentUser.role === 'staff' ? 'fa-users' : 
                    'fa-tachometer-alt'
                }"></i> ${
                    this.currentUser.role === 'admin' ? 'Admin' : 
                    this.currentUser.role === 'staff' ? 'Staff' : 
                    'Dashboard'
                }`;
                
                // Add Logout button
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn btn-outline';
                logoutBtn.id = 'logoutBtn';
                logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.logout();
                });
                
                originalButtons.appendChild(dashboardLink);
                originalButtons.appendChild(logoutBtn);
                
            } else {
                // User is logged out - show Login/Sign Up
                originalButtons.innerHTML = `
                    <a href="login.html" class="btn btn-outline">Login</a>
                    <a href="register.html" class="btn btn-primary">Sign Up</a>
                `;
            }
        });
    },
    
    isAuthenticated() {
        return !!this.currentUser;
    },
    
    isAdmin() {
        return this.currentUser?.role === 'admin';
    },
    
    isCustomer() {
        return this.currentUser?.role === 'customer';
    },
    
    isStaff() {
        return this.currentUser?.role === 'staff';
    },
    
    getCurrentUser() {
        return this.currentUser;
    },
    
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    validatePhone(phone) {
        return /^(09|\+2519)\d{8}$/.test(phone);
    },
    
    validatePassword(password) {
        return /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
    },
    
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) {
            alert(message);
            return;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    },
    
    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    },
    
    setupEventListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY) {
                if (e.newValue) {
                    this.currentUser = JSON.parse(e.newValue);
                } else {
                    this.currentUser = null;
                }
                this.updateNavigation();
            }
        });
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

window.Auth = Auth;