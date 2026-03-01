// js/auth.js - Professional Authentication System
// Markan Cafe - Debre Birhan University

const Auth = {
    STORAGE_KEY: 'markanUser',
    
    ROLES: {
        ADMIN: 'admin',
        CUSTOMER: 'customer'
    },
    
    currentUser: null,
    users: [],
    
    async init() {
        await this.loadUsersFromJSON();
        this.checkSession();
        this.setupEventListeners();
        setTimeout(() => {
            this.updateNavigation();
        }, 100);
    },
    
    async loadUsersFromJSON() {
        try {
            // Try to load from localStorage first (cached)
            const cached = localStorage.getItem('markanUsersCache');
            if (cached) {
                this.users = JSON.parse(cached);
                console.log('✅ Users loaded from cache');
                return;
            }
            
            // Fetch from JSON file
            const response = await fetch('data/json/users.json');
            if (!response.ok) {
                throw new Error('Failed to load users.json');
            }
            
            const jsonData = await response.json();
            this.users = jsonData.users || [];
            
            // Cache in localStorage
            localStorage.setItem('markanUsersCache', JSON.stringify(this.users));
            
            // Also save to legacy format for backward compatibility
            localStorage.setItem('markanUsers', JSON.stringify(this.users));
            
            console.log('✅ Users loaded from JSON file');
            
        } catch (error) {
            console.error('Error loading users:', error);
            
            // Fallback to legacy localStorage
            const legacy = localStorage.getItem('markanUsers');
            if (legacy) {
                try {
                    this.users = JSON.parse(legacy);
                    console.log('✅ Users loaded from legacy storage');
                } catch (e) {
                    this.createDefaultUsers();
                }
            } else {
                this.createDefaultUsers();
            }
        }
    },
    
    createDefaultUsers() {
        this.users = [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@markan.com',
                password: 'Admin@123',
                phone: '+251911234567',
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=8B4513&color=fff&size=150',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: 'Debre Birhan University, Staff Quarters',
                bio: 'Cafe administrator',
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light',
                    twoFactor: false
                },
                rewards: {
                    points: 0,
                    tier: 'bronze'
                }
            }
        ];
        
        localStorage.setItem('markanUsers', JSON.stringify(this.users));
        localStorage.setItem('markanUsersCache', JSON.stringify(this.users));
        console.log('✅ Default admin account created');
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
            
            // Make sure users are loaded
            if (this.users.length === 0) {
                await this.loadUsersFromJSON();
            }
            
            const user = this.users.find(u => 
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
            this.updateGreetings();
            
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
            
            // Make sure users are loaded
            if (this.users.length === 0) {
                await this.loadUsersFromJSON();
            }
            
            if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                throw new Error('Email already registered');
            }
            
            const newUser = {
                id: this.generateUserId(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role || 'customer',
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
            
            this.users.push(newUser);
            
            // Save to localStorage (legacy)
            localStorage.setItem('markanUsers', JSON.stringify(this.users));
            
            // Save to cache
            localStorage.setItem('markanUsersCache', JSON.stringify(this.users));
            
            // For demo: Create downloadable JSON
            const blob = new Blob([JSON.stringify({ users: this.users }, null, 2)], { type: 'application/json' });
            console.log('📁 Updated users.json ready for export:', URL.createObjectURL(blob));
            
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
        this.updateGreetings();
        
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
        if (path.includes('/admin/') || path.includes('/customer/')) {
            return;
        }
        
        const navMenus = document.querySelectorAll('.navbar-menu');
        
        navMenus.forEach(menu => {
            if (!menu) return;
            
            // Remove existing dynamic buttons
            const existingDynamic = menu.querySelectorAll('.dynamic-btn, .navbar-buttons:not(.static)');
            existingDynamic.forEach(el => el.remove());
            
            // Find the original navbar buttons (if any)
            const originalButtons = menu.querySelector('.navbar-buttons.static');
            
            if (this.isAuthenticated()) {
                // Hide original buttons if they exist
                if (originalButtons) {
                    originalButtons.style.display = 'none';
                }
                this.addAuthenticatedNav(menu);
            } else {
                // Show original buttons if they exist
                if (originalButtons) {
                    originalButtons.style.display = 'flex';
                }
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
    
    updateGreetings() {
        const greetings = document.querySelectorAll('.user-greeting');
        greetings.forEach(el => {
            if (this.currentUser) {
                const firstName = this.currentUser.name.split(' ')[0];
                el.textContent = `Hi, ${firstName}`;
                el.style.display = 'inline';
            } else {
                el.style.display = 'none';
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
                this.updateGreetings();
            }
        });
    },
    
    updateLastLogin(userId) {
        const index = this.users.findIndex(u => u.id === userId);
        if (index !== -1) {
            this.users[index].lastLogin = new Date().toISOString();
            localStorage.setItem('markanUsers', JSON.stringify(this.users));
            localStorage.setItem('markanUsersCache', JSON.stringify(this.users));
        }
    },
    
    generateUserId() {
        return this.users.length > 0 ? Math.max(...this.users.map(u => u.id)) + 1 : 1;
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

window.Auth = Auth;