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
            } catch (e) {
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
            // Check if UsersDB exists
            if (typeof UsersDB !== 'undefined') {
                const user = UsersDB.authenticate(email, password);
                
                if (user) {
                    // Remove password from user object
                    const { password: pwd, ...userWithoutPassword } = user;
                    
                    this.currentUser = userWithoutPassword;
                    
                    // Save to storage
                    if (remember) {
                        localStorage.setItem('markanUser', JSON.stringify(userWithoutPassword));
                    } else {
                        sessionStorage.setItem('markanUser', JSON.stringify(userWithoutPassword));
                    }
                    
                    this.updateUI();
                    showNotification(`Welcome back, ${user.name}!`, 'success');
                    
                    // Redirect based on role
                    setTimeout(() => {
                        if (user.role === 'admin') {
                            window.location.href = 'admin/dashboard.html';
                        } else {
                            window.location.href = 'customer/dashboard.html';
                        }
                    }, 1500);
                    
                    return true;
                }
            }
            
            // Fallback for demo
            if (email === 'admin@markan.com' && password === 'Admin@123') {
                const user = {
                    id: 1,
                    name: 'Admin User',
                    email: 'admin@markan.com',
                    role: 'admin',
                    phone: '+251912345678'
                };
                
                this.currentUser = user;
                
                if (remember) {
                    localStorage.setItem('markanUser', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('markanUser', JSON.stringify(user));
                }
                
                this.updateUI();
                showNotification('Welcome back, Admin!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'admin/dashboard.html';
                }, 1500);
                
                return true;
            }
            
            if (email === 'customer@markan.com' && password === 'Customer@123') {
                const user = {
                    id: 2,
                    name: 'John Customer',
                    email: 'customer@markan.com',
                    role: 'customer',
                    phone: '+251998765432'
                };
                
                this.currentUser = user;
                
                if (remember) {
                    localStorage.setItem('markanUser', JSON.stringify(user));
                } else {
                    sessionStorage.setItem('markanUser', JSON.stringify(user));
                }
                
                this.updateUI();
                showNotification('Welcome back, Customer!', 'success');
                
                setTimeout(() => {
                    window.location.href = 'customer/dashboard.html';
                }, 1500);
                
                return true;
            }
            
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
            // Check if UsersDB exists
            if (typeof UsersDB !== 'undefined') {
                // Check if email already exists
                const existingUser = UsersDB.getByEmail(userData.email);
                if (existingUser) {
                    showNotification('Email already registered', 'error');
                    return false;
                }
                
                // Add user
                const newUser = UsersDB.add(userData);
                
                if (newUser) {
                    showNotification('Registration successful! Please login.', 'success');
                    
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 1500);
                    
                    return true;
                }
            }
            
            // Fallback
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
        return this.currentUser;
    },
    
    // Update user profile
    async updateProfile(updates) {
        if (!this.currentUser) return false;
        
        try {
            // Check if UsersDB exists
            if (typeof UsersDB !== 'undefined') {
                const updatedUser = UsersDB.update(this.currentUser.id, updates);
                if (updatedUser) {
                    this.currentUser = updatedUser;
                    localStorage.setItem('markanUser', JSON.stringify(updatedUser));
                    sessionStorage.setItem('markanUser', JSON.stringify(updatedUser));
                    this.updateUI();
                    showNotification('Profile updated successfully', 'success');
                    return true;
                }
            }
            
            // Fallback
            this.currentUser = { ...this.currentUser, ...updates };
            localStorage.setItem('markanUser', JSON.stringify(this.currentUser));
            sessionStorage.setItem('markanUser', JSON.stringify(this.currentUser));
            this.updateUI();
            showNotification('Profile updated successfully', 'success');
            return true;
            
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
            // Check if UsersDB exists
            if (typeof UsersDB !== 'undefined') {
                const success = UsersDB.updatePassword(this.currentUser.id, currentPassword, newPassword);
                if (success) {
                    showNotification('Password changed successfully', 'success');
                    return true;
                } else {
                    showNotification('Current password is incorrect', 'error');
                    return false;
                }
            }
            
            // Fallback
            showNotification('Password changed successfully', 'success');
            return true;
            
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
        if (!this.isAuthenticated()) {
            showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = redirectTo;
            }, 1500);
            return false;
        }
        return true;
    },
    
    // Require admin role
    requireAdmin(redirectTo = 'customer/dashboard.html') {
        if (!this.isAuthenticated()) {
            showNotification('Please login to access this page', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return false;
        }
        
        if (!this.isAdmin()) {
            showNotification('Access denied. Admin privileges required.', 'error');
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