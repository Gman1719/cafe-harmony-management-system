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
    usersDBReady: false,
    
    async init() {
        console.log('🔐 Auth initializing...');
        
        // Check session FIRST - this is instant
        this.checkSession();
        
        // Update navigation immediately based on session
        this.updateNavigation();
        
        // Then load UsersDB in background
        this.loadUsersDB();
        
        this.setupEventListeners();
        
        console.log('✅ Auth initialized');
    },
    
    async loadUsersDB() {
        // Check if UsersDB is already loaded
        if (typeof UsersDB !== 'undefined') {
            this.usersDBReady = true;
            return;
        }
        
        console.log('⏳ Loading UsersDB in background...');
        
        // Try multiple times
        let attempts = 0;
        const maxAttempts = 30;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (typeof UsersDB !== 'undefined') {
                console.log('✅ UsersDB loaded after', attempts * 100, 'ms');
                this.usersDBReady = true;
                break;
            }
            attempts++;
        }
        
        if (!this.usersDBReady) {
            console.log('Creating fallback UsersDB...');
            this.createFallbackUsersDB();
            this.usersDBReady = true;
        }
        
        // No need to update navigation again unless user changed
        // Navigation already shows correct state from session
    },
    
    createFallbackUsersDB() {
        console.log('🔄 Creating fallback UsersDB...');
        window.UsersDB = {
            users: [
                {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@markan.com',
                    password: 'Admin@123',
                    phone: '+251911234567',
                    role: 'admin',
                    status: 'active'
                },
                {
                    id: 2,
                    name: 'Gman User',
                    email: 'gman1@gmail.com',
                    password: 'Gman@1719#',
                    phone: '+251906902551',
                    role: 'customer',
                    status: 'active'
                }
            ],
            authenticate(email, password) {
                const user = this.users.find(u => 
                    u.email.toLowerCase() === email.toLowerCase() && 
                    u.password === password &&
                    u.status === 'active'
                );
                
                if (user) {
                    const { password, ...safeUser } = user;
                    return safeUser;
                }
                return null;
            },
            create(userData) {
                if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                    return null;
                }
                const newUser = {
                    id: this.users.length + 1,
                    ...userData,
                    status: 'active'
                };
                this.users.push(newUser);
                const { password, ...safeUser } = newUser;
                return safeUser;
            }
        };
        console.log('✅ Fallback UsersDB created');
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
            console.log('🔑 Login attempt:', email);
            
            if (!email || !password) {
                throw new Error('Please fill in all fields');
            }
            
            if (!this.validateEmail(email)) {
                throw new Error('Please enter a valid email');
            }
            
            // Ensure UsersDB is ready
            if (!this.usersDBReady) {
                await this.loadUsersDB();
            }
            
            // Use UsersDB to authenticate
            const user = UsersDB.authenticate(email, password);
            
            if (!user) {
                throw new Error('Invalid email or password');
            }
            
            console.log('✅ Login successful:', user.name);
            
            // Add session data
            user.sessionStart = new Date().toISOString();
            user.lastActivity = new Date().toISOString();
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
            this.currentUser = user;
            
            // Update navigation IMMEDIATELY
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
            console.error('❌ Login error:', error.message);
            this.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        }
    },
    
    async register(userData) {
        try {
            console.log('📝 Registration attempt:', userData.email);
            
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
            
            // Ensure UsersDB is ready
            if (!this.usersDBReady) {
                await this.loadUsersDB();
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
            
            console.log('✅ Registration successful:', newUser.email);
            
            this.showNotification('Registration successful! Please login.', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ Registration error:', error.message);
            this.showNotification(error.message, 'error');
            return { success: false, error: error.message };
        }
    },
    
    logout(showMessage = true) {
        console.log('🚪 Logging out...');
        
        // Clear current user
        this.currentUser = null;
        
        // Remove from storage
        localStorage.removeItem(this.STORAGE_KEY);
        
        // Update UI IMMEDIATELY
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
                // User is logged in - replace with Dashboard/Logout IMMEDIATELY
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
                
                console.log('✅ Navigation updated to logged-in state');
                
            } else {
                // User is logged out - show Login/Sign Up
                originalButtons.innerHTML = `
                    <a href="login.html" class="btn btn-outline">Login</a>
                    <a href="register.html" class="btn btn-primary">Sign Up</a>
                `;
                
                console.log('✅ Navigation updated to logged-out state');
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