// data/users.js - Users Database
// Markan Cafe - Debre Birhan University
// Complete user management with all necessary methods for admin panel

// Initialize users with ONLY admin account if not exists
if (!localStorage.getItem('markanUsers')) {
    const usersDatabase = [
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
    
    localStorage.setItem('markanUsers', JSON.stringify(usersDatabase));
    console.log('✅ Admin account created successfully');
    console.log('📧 Email: admin@markan.com');
    console.log('🔑 Password: Admin@123');
} else {
    // Migrate existing users to include any missing fields
    try {
        const users = JSON.parse(localStorage.getItem('markanUsers'));
        let needsUpdate = false;
        
        const updatedUsers = users.map(user => {
            // Ensure all required fields exist
            if (!user.preferences) {
                user.preferences = {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light',
                    twoFactor: false
                };
                needsUpdate = true;
            }
            if (!user.rewards) {
                user.rewards = {
                    points: 0,
                    tier: 'bronze'
                };
                needsUpdate = true;
            }
            if (!user.bio) {
                user.bio = '';
                needsUpdate = true;
            }
            if (!user.address) {
                user.address = '';
                needsUpdate = true;
            }
            return user;
        });
        
        // Check if admin exists
        const adminExists = updatedUsers.some(u => u.role === 'admin');
        
        if (!adminExists) {
            const adminUser = {
                id: updatedUsers.length > 0 ? Math.max(...updatedUsers.map(u => u.id)) + 1 : 1,
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
            };
            
            updatedUsers.push(adminUser);
            needsUpdate = true;
            console.log('✅ Admin account added to existing users');
        }
        
        if (needsUpdate) {
            localStorage.setItem('markanUsers', JSON.stringify(updatedUsers));
        }
    } catch (e) {
        console.error('Error checking users database:', e);
    }
}

// Users database helper
const UsersDB = {
    // Get all users
    getAll: function() {
        try {
            return JSON.parse(localStorage.getItem('markanUsers')) || [];
        } catch (e) {
            console.error('Error parsing users:', e);
            return [];
        }
    },
    
    // Get user by ID
    getById: function(id) {
        const users = this.getAll();
        return users.find(user => user.id == id);
    },
    
    // Get user by email (case insensitive)
    getByEmail: function(email) {
        const users = this.getAll();
        return users.find(user => user.email.toLowerCase() === email.toLowerCase());
    },
    
    // Authenticate user
    authenticate: function(email, password) {
        const users = this.getAll();
        const user = users.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password === password && 
            u.status === 'active'
        );
        
        if (user) {
            // Update last login
            this.update(user.id, { lastLogin: new Date().toISOString() });
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    },
    
    // Add new user (for customer registration)
    add: function(userData) {
        try {
            const users = this.getAll();
            
            // Check if email already exists
            if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                throw new Error('Email already exists');
            }
            
            const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
            
            const newUser = {
                id: newId,
                name: userData.name,
                email: userData.email,
                phone: userData.phone,
                password: userData.password,
                role: userData.role || 'customer',
                avatar: userData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.name)}&background=8B4513&color=fff&size=150`,
                createdAt: new Date().toISOString(),
                lastLogin: null,
                status: userData.status || 'active',
                address: userData.address || '',
                bio: userData.bio || '',
                preferences: userData.preferences || {
                    notifications: true,
                    darkMode: false,
                    language: 'en',
                    theme: 'light',
                    twoFactor: false
                },
                rewards: userData.rewards || {
                    points: 0,
                    tier: 'bronze'
                }
            };
            
            users.push(newUser);
            localStorage.setItem('markanUsers', JSON.stringify(users));
            
            // Return user without password
            const { password, ...userWithoutPassword } = newUser;
            return userWithoutPassword;
            
        } catch (error) {
            console.error('Error adding user:', error);
            return null;
        }
    },
    
    // Update user
    update: function(id, updates) {
        try {
            const users = this.getAll();
            const index = users.findIndex(user => user.id == id);
            
            if (index !== -1) {
                // Handle password separately
                const { password, ...safeUpdates } = updates;
                if (password) {
                    users[index].password = password;
                }
                users[index] = { ...users[index], ...safeUpdates };
                localStorage.setItem('markanUsers', JSON.stringify(users));
                
                const { password: pwd, ...userWithoutPassword } = users[index];
                return userWithoutPassword;
            }
            return null;
            
        } catch (error) {
            console.error('Error updating user:', error);
            return null;
        }
    },
    
    // Delete user (admin only)
    delete: function(id) {
        try {
            const users = this.getAll();
            const filtered = users.filter(user => user.id != id);
            localStorage.setItem('markanUsers', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting user:', error);
            return false;
        }
    },
    
    // Get all customers (users with role 'customer')
    getCustomers: function() {
        const users = this.getAll();
        return users.filter(user => user.role === 'customer');
    },
    
    // Get all admins
    getAdmins: function() {
        const users = this.getAll();
        return users.filter(user => user.role === 'admin');
    },
    
    // Search users by name or email
    search: function(query) {
        const users = this.getAll();
        const searchTerm = query.toLowerCase();
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    },
    
    // Update user status (active/inactive)
    updateStatus: function(id, status) {
        return this.update(id, { status });
    },
    
    // Get user statistics
    getUserStats: function(userId) {
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
        
        const userOrders = orders.filter(o => o.customerId == userId);
        const userReservations = reservations.filter(r => r.customerId == userId);
        
        return {
            orders: userOrders.length,
            reservations: userReservations.length,
            totalSpent: userOrders.reduce((sum, o) => sum + (o.total || 0), 0),
            points: userOrders.length * 10 // Example: 10 points per order
        };
    }
};

// Make available globally
window.UsersDB = UsersDB;

// Log on load
console.log('📁 Users database ready');
console.log('👤 Admin account: admin@markan.com');