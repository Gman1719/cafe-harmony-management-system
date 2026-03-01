// data/users.js - Complete User Management System
// Markan Cafe - Debre Birhan University
// Handles all user operations with JSON data structure

// ============================================
// USER DATABASE MANAGER
// ============================================

const UsersDB = {
    // Storage keys
    STORAGE_KEYS: {
        USERS: 'markanUsers',
        CACHE: 'markanUsersCache',
        CURRENT: 'markanUser'
    },
    
    // Data
    users: [],
    currentUser: null,
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    async init() {
        console.log('📁 Initializing UsersDB...');
        await this.loadFromJSON();
        this.ensureAdminExists();
        console.log('✅ UsersDB ready with', this.users.length, 'users');
        return this.users;
    },
    
    // ========================================
    // JSON DATA OPERATIONS
    // ========================================
    
    async loadFromJSON() {
        try {
            // Try to load from localStorage cache first
            const cached = localStorage.getItem(this.STORAGE_KEYS.CACHE);
            if (cached) {
                this.users = JSON.parse(cached);
                console.log('✅ Users loaded from cache');
                return true;
            }
            
            // Fetch from JSON file
            const response = await fetch('data/json/users.json');
            if (!response.ok) {
                throw new Error('Failed to load users.json');
            }
            
            const jsonData = await response.json();
            this.users = jsonData.users || [];
            
            // Save to cache and legacy storage
            this.saveToCache();
            this.saveToLegacy();
            
            console.log('✅ Users loaded from JSON file');
            return true;
            
        } catch (error) {
            console.error('❌ Error loading users from JSON:', error);
            
            // Fallback to legacy localStorage
            const legacy = localStorage.getItem(this.STORAGE_KEYS.USERS);
            if (legacy) {
                try {
                    this.users = JSON.parse(legacy);
                    console.log('✅ Users loaded from legacy storage');
                    this.saveToCache();
                    return true;
                } catch (e) {
                    console.error('❌ Failed to parse legacy users');
                }
            }
            
            // Create default users if nothing works
            this.createDefaultUsers();
            return false;
        }
    },
    
    saveToJSON() {
        // In a real app, this would be an API call
        // For now, we'll save to cache and create a downloadable file
        this.saveToCache();
        this.saveToLegacy();
        
        // Create downloadable JSON for backup
        const dataStr = JSON.stringify({ users: this.users }, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        console.log('📁 Users data ready for export:', url);
        
        return true;
    },
    
    saveToCache() {
        localStorage.setItem(this.STORAGE_KEYS.CACHE, JSON.stringify(this.users));
    },
    
    saveToLegacy() {
        localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(this.users));
    },
    
    // ========================================
    // DEFAULT USERS
    // ========================================
    
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
                    theme: 'light'
                },
                stats: {
                    orders: 0,
                    reservations: 0,
                    points: 0,
                    tier: 'bronze'
                }
            },
            {
                id: 2,
                name: 'John Customer',
                email: 'john@example.com',
                password: 'Customer@123',
                phone: '0912345678',
                role: 'customer',
                avatar: 'https://ui-avatars.com/api/?name=John+Customer&background=8B4513&color=fff&size=150',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: 'Debre Birhan University, Student Dorm',
                bio: 'Coffee lover',
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light'
                },
                stats: {
                    orders: 5,
                    reservations: 2,
                    points: 150,
                    tier: 'bronze'
                }
            }
        ];
        
        this.saveToCache();
        this.saveToLegacy();
        console.log('✅ Default users created');
        console.log('📧 Admin: admin@markan.com / Admin@123');
        console.log('📧 Customer: john@example.com / Customer@123');
    },
    
    ensureAdminExists() {
        const adminExists = this.users.some(u => u.role === 'admin');
        if (!adminExists) {
            const adminUser = {
                id: this.generateId(),
                name: 'Admin User',
                email: 'admin@markan.com',
                password: 'Admin@123',
                phone: '+251911234567',
                role: 'admin',
                avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=8B4513&color=fff&size=150',
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: 'Debre Birhan University',
                bio: 'System Administrator',
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light'
                },
                stats: {
                    orders: 0,
                    reservations: 0,
                    points: 0,
                    tier: 'bronze'
                }
            };
            this.users.push(adminUser);
            this.saveToCache();
            this.saveToLegacy();
            console.log('✅ Admin user added');
        }
    },
    
    // ========================================
    // AUTHENTICATION
    // ========================================
    
    authenticate(email, password) {
        const user = this.users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password &&
            u.status === 'active'
        );
        
        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveToCache();
            this.saveToLegacy();
            
            // Return user without password
            const { password: pwd, ...safeUser } = user;
            
            // Save current session
            localStorage.setItem(this.STORAGE_KEYS.CURRENT, JSON.stringify(safeUser));
            
            return safeUser;
        }
        
        return null;
    },
    
    logout() {
        localStorage.removeItem(this.STORAGE_KEYS.CURRENT);
        this.currentUser = null;
    },
    
    getCurrentUser() {
        if (this.currentUser) return this.currentUser;
        
        const saved = localStorage.getItem(this.STORAGE_KEYS.CURRENT);
        if (saved) {
            try {
                this.currentUser = JSON.parse(saved);
                return this.currentUser;
            } catch (e) {
                console.error('❌ Failed to parse current user');
            }
        }
        return null;
    },
    
    isAuthenticated() {
        return !!this.getCurrentUser();
    },
    
    isAdmin() {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    },
    
    isCustomer() {
        const user = this.getCurrentUser();
        return user?.role === 'customer';
    },
    
    // ========================================
    // USER CRUD OPERATIONS
    // ========================================
    
    getAll() {
        return this.users.map(user => {
            const { password, ...safeUser } = user;
            return safeUser;
        });
    },
    
    getById(id) {
        const user = this.users.find(u => u.id == id);
        if (user) {
            const { password, ...safeUser } = user;
            return safeUser;
        }
        return null;
    },
    
    getByEmail(email) {
        const user = this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user) {
            const { password, ...safeUser } = user;
            return safeUser;
        }
        return null;
    },
    
    getByRole(role) {
        return this.users
            .filter(u => u.role === role)
            .map(user => {
                const { password, ...safeUser } = user;
                return safeUser;
            });
    },
    
    getCustomers() {
        return this.getByRole('customer');
    },
    
    getAdmins() {
        return this.getByRole('admin');
    },
    
    getActiveUsers() {
        return this.users
            .filter(u => u.status === 'active')
            .map(user => {
                const { password, ...safeUser } = user;
                return safeUser;
            });
    },
    
    create(userData) {
        try {
            // Check if email exists
            if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                throw new Error('Email already exists');
            }
            
            const newUser = {
                id: this.generateId(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role || 'customer',
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=8B4513&color=fff&size=150`,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: 'active',
                address: userData.address || '',
                bio: userData.bio || '',
                preferences: {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light'
                },
                stats: {
                    orders: 0,
                    reservations: 0,
                    points: 0,
                    tier: 'bronze'
                }
            };
            
            this.users.push(newUser);
            this.saveToJSON();
            
            const { password, ...safeUser } = newUser;
            return safeUser;
            
        } catch (error) {
            console.error('❌ Error creating user:', error);
            return null;
        }
    },
    
    update(id, updates) {
        const index = this.users.findIndex(u => u.id == id);
        if (index === -1) return null;
        
        // Don't allow password update through this method
        const { password, ...safeUpdates } = updates;
        
        this.users[index] = {
            ...this.users[index],
            ...safeUpdates,
            updatedAt: new Date().toISOString()
        };
        
        this.saveToJSON();
        
        const { password: pwd, ...safeUser } = this.users[index];
        return safeUser;
    },
    
    updatePassword(id, newPassword) {
        const index = this.users.findIndex(u => u.id == id);
        if (index === -1) return false;
        
        this.users[index].password = newPassword;
        this.saveToJSON();
        return true;
    },
    
    delete(id) {
        const initialLength = this.users.length;
        this.users = this.users.filter(u => u.id != id);
        
        if (this.users.length < initialLength) {
            this.saveToJSON();
            return true;
        }
        return false;
    },
    
    updateStatus(id, status) {
        return this.update(id, { status });
    },
    
    // ========================================
    // UTILITY METHODS
    // ========================================
    
    generateId() {
        return this.users.length > 0 
            ? Math.max(...this.users.map(u => u.id)) + 1 
            : 1;
    },
    
    search(query) {
        const searchTerm = query.toLowerCase();
        return this.users
            .filter(user => 
                user.name.toLowerCase().includes(searchTerm) ||
                user.email.toLowerCase().includes(searchTerm) ||
                user.phone.includes(searchTerm)
            )
            .map(user => {
                const { password, ...safeUser } = user;
                return safeUser;
            });
    },
    
    // ========================================
    // STATISTICS
    // ========================================
    
    getStats() {
        return {
            total: this.users.length,
            active: this.users.filter(u => u.status === 'active').length,
            inactive: this.users.filter(u => u.status === 'inactive').length,
            admins: this.users.filter(u => u.role === 'admin').length,
            customers: this.users.filter(u => u.role === 'customer').length,
            newThisMonth: this.users.filter(u => {
                const created = new Date(u.createdAt);
                const now = new Date();
                return created.getMonth() === now.getMonth() && 
                       created.getFullYear() === now.getFullYear();
            }).length
        };
    },
    
    getUserStats(userId) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return null;
        
        // Get orders from OrdersDB if available
        let orderStats = { total: 0, spent: 0 };
        if (window.OrdersDB) {
            const orders = window.OrdersDB.getByCustomerId(userId);
            orderStats = {
                total: orders.length,
                spent: orders.reduce((sum, o) => sum + (o.total || 0), 0)
            };
        }
        
        // Get reservations from ReservationsDB if available
        let reservationStats = { total: 0 };
        if (window.ReservationsDB) {
            const reservations = window.ReservationsDB.getByCustomerId(userId);
            reservationStats = {
                total: reservations.length,
                upcoming: reservations.filter(r => {
                    if (r.status === 'cancelled') return false;
                    const resDate = new Date(r.date + 'T' + r.time);
                    return resDate > new Date();
                }).length
            };
        }
        
        return {
            ...user.stats,
            orders: orderStats.total,
            totalSpent: orderStats.spent,
            reservations: reservationStats.total,
            upcomingReservations: reservationStats.upcoming,
            points: user.stats?.points || 0,
            tier: user.stats?.tier || 'bronze'
        };
    },
    
    // ========================================
    // VALIDATION
    // ========================================
    
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    validatePhone(phone) {
        return /^(09|\+2519)\d{8}$/.test(phone);
    },
    
    validatePassword(password) {
        return /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
    },
    
    emailExists(email) {
        return this.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    },
    
    // ========================================
    // POINTS & REWARDS
    // ========================================
    
    addPoints(userId, points) {
        const user = this.users.find(u => u.id == userId);
        if (!user) return false;
        
        if (!user.stats) user.stats = { points: 0, tier: 'bronze' };
        user.stats.points = (user.stats.points || 0) + points;
        
        // Update tier based on points
        if (user.stats.points >= 1000) {
            user.stats.tier = 'gold';
        } else if (user.stats.points >= 500) {
            user.stats.tier = 'silver';
        }
        
        this.saveToJSON();
        return true;
    },
    
    getTier(points) {
        if (points >= 1000) return 'gold';
        if (points >= 500) return 'silver';
        return 'bronze';
    }
};

// ========================================
// AUTO-INITIALIZE
// ========================================

// Initialize when script loads
(async function() {
    await UsersDB.init();
    window.UsersDB = UsersDB;
    console.log('📁 UsersDB global ready');
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsersDB;
}