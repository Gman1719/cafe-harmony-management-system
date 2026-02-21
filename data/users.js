// data/users.js - Users Database
// Markan Cafe - Debre Birhan University

// Initialize users in localStorage if not exists
if (!localStorage.getItem('markanUsers')) {
    const usersDatabase = [
        {
            id: 1,
            name: 'Admin User',
            email: 'admin@markan.com',
            password: 'Admin@123',
            phone: '+251911234567',
            role: 'admin',
            avatar: 'https://via.placeholder.com/150/8B4513/FFD700?text=Admin',
            createdAt: '2025-01-01T00:00:00Z',
            lastLogin: '2025-02-20T08:30:00Z',
            status: 'active',
            address: 'Debre Birhan University, Staff Quarters',
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'en'
            }
        },
        {
            id: 2,
            name: 'John Customer',
            email: 'customer@markan.com',
            password: 'Customer@123',
            phone: '+251922345678',
            role: 'customer',
            avatar: 'https://via.placeholder.com/150/8B4513/FFD700?text=John',
            createdAt: '2025-01-15T10:30:00Z',
            lastLogin: '2025-02-19T14:20:00Z',
            status: 'active',
            address: 'Debre Birhan University, Block A Room 12',
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'en'
            },
            rewards: {
                points: 150,
                tier: 'silver'
            }
        }
    ];
    
    localStorage.setItem('markanUsers', JSON.stringify(usersDatabase));
}

// Users database helper
const UsersDB = {
    // Get all users
    getAll: function() {
        return JSON.parse(localStorage.getItem('markanUsers')) || [];
    },
    
    // Get user by ID
    getById: function(id) {
        const users = this.getAll();
        return users.find(user => user.id === parseInt(id));
    },
    
    // Get user by email
    getByEmail: function(email) {
        const users = this.getAll();
        return users.find(user => user.email === email);
    },
    
    // Authenticate user
    authenticate: function(email, password) {
        const users = this.getAll();
        const user = users.find(u => u.email === email && u.password === password && u.status === 'active');
        if (user) {
            // Update last login
            this.update(user.id, { lastLogin: new Date().toISOString() });
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        }
        return null;
    },
    
    // Add new user
    add: function(userData) {
        const users = this.getAll();
        const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            ...userData,
            avatar: `https://via.placeholder.com/150/8B4513/FFD700?text=${userData.name.charAt(0)}`,
            createdAt: new Date().toISOString(),
            lastLogin: null,
            status: 'active',
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
        users.push(newUser);
        localStorage.setItem('markanUsers', JSON.stringify(users));
        
        // Return user without password
        const { password, ...userWithoutPassword } = newUser;
        return userWithoutPassword;
    },
    
    // Update user
    update: function(id, updates) {
        const users = this.getAll();
        const index = users.findIndex(user => user.id === parseInt(id));
        if (index !== -1) {
            const { password, ...safeUpdates } = updates;
            users[index] = { ...users[index], ...safeUpdates };
            localStorage.setItem('markanUsers', JSON.stringify(users));
            
            const { password: pwd, ...userWithoutPassword } = users[index];
            return userWithoutPassword;
        }
        return null;
    }
};

// Make available globally
window.UsersDB = UsersDB;