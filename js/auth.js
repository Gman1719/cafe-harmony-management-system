// js/auth.js - Authentication Module
// Markan Cafe - Debre Birhan University

// Authentication object
const Auth = {
    currentUser: null,
    
    // Initialize auth
    init() {
        this.checkSession();
        this.setupEventListeners();
    },
    
    // Check if user is logged in
    checkSession() {
        const savedUser = localStorage.getItem('markanUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                this.updateUI();
                console.log('User session restored:', this.currentUser);
            } catch (e) {
                console.error('Failed to parse user data');
                this.logout();
            }
        }
    },
    
    // Login user
    async login(email, password, remember = false) {
        // Validation
        if (!email || !password) {
            showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        if (!validateEmail(email)) {
            showNotification('Please enter a valid email', 'error');
            return false;
        }
        
        try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            console.log('Users found:', users.length);
            
            // Find user with matching email and password
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                console.log('User found:', user.name, 'Role:', user.role);
                
                // Check if user is active
                if (user.status === 'inactive') {
                    showNotification('Your account is inactive. Please contact admin.', 'error');
                    return false;
                }
                
                // Create user object without password
                const { password: pwd, ...userWithoutPassword } = user;
                this.currentUser = userWithoutPassword;
                
                // Save to storage
                if (remember) {
                    localStorage.setItem('markanUser', JSON.stringify(userWithoutPassword));
                } else {
                    sessionStorage.setItem('markanUser', JSON.stringify(userWithoutPassword));
                }
                
                // Also save to localStorage for persistence
                localStorage.setItem('markanUser', JSON.stringify(userWithoutPassword));
                
                // Update last login
                const userIndex = users.findIndex(u => u.id === user.id);
                if (userIndex !== -1) {
                    users[userIndex].lastLogin = new Date().toISOString();
                    localStorage.setItem('markanUsers', JSON.stringify(users));
                }
                
                this.updateUI();
                showNotification(`Welcome back, ${user.name}!`, 'success');
                
                // Redirect based on role - USING RELATIVE PATHS
                setTimeout(() => {
                    if (user.role === 'admin') {
                        console.log('Redirecting to admin dashboard');
                        window.location.href = 'admin/dashboard.html';
                    } else {
                        console.log('Redirecting to customer dashboard');
                        window.location.href = 'customer/dashboard.html';
                    }
                }, 1500);
                
                return true;
            }
            
            // If no user found, show error
            console.log('No user found with these credentials');
            showNotification('Invalid email or password', 'error');
            return false;
            
        } catch (error) {
            console.error('Login error:', error);
            showNotification('Login failed. Please try again.', 'error');
            return false;
        }
    },
    
    // Register new user
    async register(userData) {
        // Validation
        if (!userData.name || !userData.email || !userData.password || !userData.phone) {
            showNotification('Please fill in all fields', 'error');
            return false;
        }
        
        if (!validateEmail(userData.email)) {
            showNotification('Please enter a valid email', 'error');
            return false;
        }
        
        if (!validateEthiopianPhone(userData.phone)) {
            showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
            return false;
        }
        
        if (!validatePassword(userData.password)) {
            showNotification('Password must be at least 8 characters with one special character', 'error');
            return false;
        }
        
        try {
            // Get existing users
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            
            // Check if email already exists
            if (users.some(u => u.email === userData.email)) {
                showNotification('Email already registered', 'error');
                return false;
            }
            
            // Create new user
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            
            const newUser = {
                id: newId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role || 'customer',
                avatar: `https://via.placeholder.com/150/8B4513/FFD700?text=${userData.name.charAt(0)}`,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: '',
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en'
                },
                rewards: {
                    points: 0,
                    tier: 'bronze'
                }
            };
            
            // Add to users array
            users.push(newUser);
            localStorage.setItem('markanUsers', JSON.stringify(users));
            
            console.log('New user registered:', newUser);
            showNotification('Registration successful! Please login.', 'success');
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            
            return true;
            
        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed. Please try again.', 'error');
            return false;
        }
    },
    
    // Logout user
    logout() {
        this.currentUser = null;
        localStorage.removeItem('markanUser');
        sessionStorage.removeItem('markanUser');
        this.updateUI();
        showNotification('Logged out successfully', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    },
    
    // Check if user is authenticated
    isAuthenticated() {
        return !!this.currentUser;
    },
    
    // Check if user is admin
    isAdmin() {
        return this.currentUser?.role === 'admin';
    },
    
    // Check if user is customer
    isCustomer() {
        return this.currentUser?.role === 'customer';
    },
    
    // Get current user
    getCurrentUser() {
        // Try to get from memory first
        if (this.currentUser) {
            return this.currentUser;
        }
        
        // Then try localStorage
        const savedUser = localStorage.getItem('markanUser');
        if (savedUser) {
            try {
                this.currentUser = JSON.parse(savedUser);
                return this.currentUser;
            } catch (e) {
                console.error('Failed to parse user data');
            }
        }
        
        return null;
    },
    
    // Update user profile
    async updateProfile(updates) {
        if (!this.currentUser) return false;
        
        try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex !== -1) {
                // Update user
                users[userIndex] = { ...users[userIndex], ...updates };
                localStorage.setItem('markanUsers', JSON.stringify(users));
                
                // Update current user
                this.currentUser = { ...this.currentUser, ...updates };
                localStorage.setItem('markanUser', JSON.stringify(this.currentUser));
                
                showNotification('Profile updated successfully', 'success');
                return true;
            }
            
            showNotification('User not found', 'error');
            return false;
            
        } catch (error) {
            console.error('Profile update error:', error);
            showNotification('Failed to update profile', 'error');
            return false;
        }
    },
    
    // Change password
    async changePassword(currentPassword, newPassword) {
        if (!this.currentUser) return false;
        
        if (!validatePassword(newPassword)) {
            showNotification('New password must be at least 8 characters with one special character', 'error');
            return false;
        }
        
        try {
            // Get users from localStorage
            const users = JSON.parse(localStorage.getItem('markanUsers')) || [];
            const userIndex = users.findIndex(u => u.id === this.currentUser.id);
            
            if (userIndex !== -1) {
                // Verify current password
                if (users[userIndex].password !== currentPassword) {
                    showNotification('Current password is incorrect', 'error');
                    return false;
                }
                
                // Update password
                users[userIndex].password = newPassword;
                localStorage.setItem('markanUsers', JSON.stringify(users));
                
                showNotification('Password changed successfully', 'success');
                return true;
            }
            
            showNotification('User not found', 'error');
            return false;
            
        } catch (error) {
            console.error('Password change error:', error);
            showNotification('Failed to change password', 'error');
            return false;
        }
    },
    
    // Update UI based on auth state
    updateUI() {
        // Update user greeting
        const greetingElements = document.querySelectorAll('.user-greeting');
        greetingElements.forEach(el => {
            if (this.currentUser) {
                el.textContent = `Hi, ${this.currentUser.name.split(' ')[0]}`;
                el.style.display = 'inline';
            } else {
                el.style.display = 'none';
            }
        });
        
        // Show/hide admin links
        const adminLinks = document.querySelectorAll('.admin-only');
        adminLinks.forEach(link => {
            link.style.display = this.isAdmin() ? 'inline-block' : 'none';
        });
        
        // Update login/logout buttons
        const loginLinks = document.querySelectorAll('a[href="login.html"]');
        const logoutButtons = document.querySelectorAll('#logoutBtn');
        
        if (this.currentUser) {
            loginLinks.forEach(link => link.style.display = 'none');
            logoutButtons.forEach(btn => btn.style.display = 'inline-flex');
        } else {
            loginLinks.forEach(link => link.style.display = 'inline-block');
            logoutButtons.forEach(btn => btn.style.display = 'none');
        }
    },
    
    // Setup event listeners
    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                const remember = document.getElementById('rememberMe')?.checked || false;
                
                await this.login(email, password, remember);
            });
        }
        
        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const userData = {
                    name: document.getElementById('name').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    password: document.getElementById('password').value,
                    role: document.getElementById('role')?.value || 'customer'
                };
                
                const confirmPassword = document.getElementById('confirmPassword')?.value;
                if (confirmPassword && userData.password !== confirmPassword) {
                    showNotification('Passwords do not match', 'error');
                    return;
                }
                
                await this.register(userData);
            });
        }
        
        // Logout buttons
        document.querySelectorAll('#logoutBtn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    },
    
    // Require authentication
    requireAuth(redirectTo = 'login.html') {
        const user = this.getCurrentUser();
        if (!user) {
            showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 1500);
            return false;
        }
        return true;
    },
    
    // Require admin role
    requireAdmin(redirectTo = '../customer/dashboard.html') {
        const user = this.getCurrentUser();
        if (!user) {
            showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1500);
            return false;
        }
        
        if (user.role !== 'admin') {
            showNotification('Access denied. Admin privileges required.', 'error');
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 1500);
            return false;
        }
        return true;
    },
    
    // Require customer role
    requireCustomer(redirectTo = '../admin/dashboard.html') {
        const user = this.getCurrentUser();
        if (!user) {
            showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = '../login.html';
            }, 1500);
            return false;
        }
        
        if (user.role !== 'customer') {
            showNotification('Access denied. Customer area.', 'error');
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 1500);
            return false;
        }
        return true;
    }
};

// Initialize auth
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});

// Demo login function
window.demoLogin = function(role) {
    if (role === 'admin') {
        document.getElementById('email').value = 'admin@markan.com';
        document.getElementById('password').value = 'Admin@123';
    } else {
        document.getElementById('email').value = 'customer@markan.com';
        document.getElementById('password').value = 'Customer@123';
    }
    
    document.getElementById('loginForm').dispatchEvent(new Event('submit'));
};

// Make Auth available globally
window.Auth = Auth;