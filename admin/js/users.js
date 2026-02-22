// js/auth.js - Professional Authentication System
// Markan Cafe - Debre Birhan University

const Auth = {
    STORAGE_KEY: 'markanUser',
    
    ROLES: {
        ADMIN: 'admin',
        CUSTOMER: 'customer'
    },
    
    currentUser: null,
    
    init() {
        this.checkSession();
        this.setupEventListeners();
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            this.updateNavigation();
        }, 100);
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
            
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            
            const user = users.find(u => 
                u.email.toLowerCase() === email.toLowerCase() && 
                u.password === password
            );
            
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            if (user.status === 'inactive') {
                throw new Error('Your account is inactive. Please contact admin.');
            }
            
            const { password: pwd, ...safeUser } = user;
            
            safeUser.sessionStart = new Date().toISOString();
            safeUser.lastActivity = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(safeUser));
            
            this.currentUser = safeUser;
            
            this.updateLastLogin(user.id);
            
            this.updateNavigation();
            
            this.showNotification(`Welcome back, ${user.name}!`, 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin/html/dashboard.html';
                } else {
                    window.location.href = 'customer/html/dashboard.html';
                }
            }, 500);
            
            return { success: true, user: safeUser };
            
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
            
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            
            if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                throw new Error('Email already registered');
            }
            
            const newUser = {
                id: this.generateUserId(users),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: 'customer',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=8B4513&color=fff&size=150`,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: '',
                preferences: {
                    notifications: true,
                    theme: 'light',
                    language: 'en'
                },
                stats: {
                    orders: 0,
                    reservations: 0,
                    points: 0
                }
            };
            
            users.push(newUser);
            localStorage.setItem('markanUsers', JSON.stringify(users));
            
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
        this.currentUser = null;
        localStorage.removeItem(this.STORAGE_KEY);
        
        if (showMessage) {
            this.showNotification('Logged out successfully', 'success');
        }
        
        // Redirect to home
        window.location.href = 'index.html';
    },
    
    updateNavigation() {
        // Don't update navigation on admin/customer pages
        const path = window.location.pathname;
        if (path.includes('/admin/') || path.includes('/customer/')) {
            return;
        }
        
        const navMenus = document.querySelectorAll('.navbar-menu');
        
        navMenus.forEach(menu => {
            if (!menu) return;
            
            const existingDynamic = menu.querySelectorAll('.dynamic-btn, .navbar-buttons:not(.static)');
            existingDynamic.forEach(el => el.remove());
            
            if (this.isAuthenticated()) {
                this.addAuthenticatedNav(menu);
            }
        });
    },
    
    addAuthenticatedNav(menu) {
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'navbar-buttons dynamic-btn';
        
        const dashboardLink = document.createElement('a');
        dashboardLink.href = this.currentUser.role === 'admin' 
            ? 'admin/html/dashboard.html' 
            : 'customer/html/dashboard.html';
        dashboardLink.className = 'btn btn-outline';
        dashboardLink.innerHTML = `<i class="fas ${this.currentUser.role === 'admin' ? 'fa-cog' : 'fa-tachometer-alt'}"></i> ${this.currentUser.role === 'admin' ? 'Admin' : 'Dashboard'}`;
        
        const logoutBtn = document.createElement('button');
        logoutBtn.id = 'logoutBtn';
        logoutBtn.className = 'btn btn-primary';
        logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.logout();
        });
        
        buttonContainer.appendChild(dashboardLink);
        buttonContainer.appendChild(logoutBtn);
        menu.appendChild(buttonContainer);
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
        if (!container) return;
        
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
    },
    
    updateLastLogin(userId) {
        const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index].lastLogin = new Date().toISOString();
            localStorage.setItem('markanUsers', JSON.stringify(users));
        }
    },
    
    generateUserId(users) {
        return users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

window.Auth = Auth;