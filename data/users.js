// data/users.js - Users Database
// Markan Cafe - Debre Birhan University

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
    },
    {
        id: 3,
        name: 'Abebech Tesfaye',
        email: 'abebech@example.com',
        password: 'Abebech@123',
        phone: '+251933456789',
        role: 'customer',
        avatar: 'https://via.placeholder.com/150/8B4513/FFD700?text=Abebech',
        createdAt: '2025-01-20T09:15:00Z',
        lastLogin: '2025-02-18T11:45:00Z',
        status: 'active',
        address: 'Debre Birhan, Kebele 03',
        preferences: {
            notifications: false,
            darkMode: true,
            language: 'am'
        },
        rewards: {
            points: 75,
            tier: 'bronze'
        }
    },
    {
        id: 4,
        name: 'Kebede Alemu',
        email: 'kebede@example.com',
        password: 'Kebede@123',
        phone: '+251944567890',
        role: 'customer',
        avatar: 'https://via.placeholder.com/150/8B4513/FFD700?text=Kebede',
        createdAt: '2025-02-01T13:20:00Z',
        lastLogin: '2025-02-19T16:30:00Z',
        status: 'active',
        address: 'Debre Birhan University, Block C Room 45',
        preferences: {
            notifications: true,
            darkMode: false,
            language: 'en'
        },
        rewards: {
            points: 200,
            tier: 'gold'
        }
    },
    {
        id: 5,
        name: 'Tigist Haile',
        email: 'tigist@example.com',
        password: 'Tigist@123',
        phone: '+251955678901',
        role: 'customer',
        avatar: 'https://via.placeholder.com/150/8B4513/FFD700?text=Tigist',
        createdAt: '2025-02-10T11:00:00Z',
        lastLogin: '2025-02-20T09:45:00Z',
        status: 'inactive',
        address: 'Debre Birhan, Kebele 05',
        preferences: {
            notifications: true,
            darkMode: false,
            language: 'en'
        },
        rewards: {
            points: 25,
            tier: 'bronze'
        }
    }
];

// Initialize users in localStorage if not exists
if (!localStorage.getItem('markanUsers')) {
    localStorage.setItem('markanUsers', JSON.stringify(usersDatabase));
}

// Users database helper
const UsersDB = {
    // Get all users
    getAll: function() {
        const users = localStorage.getItem('markanUsers');
        return users ? JSON.parse(users) : usersDatabase;
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
        const newId = Math.max(...users.map(u => u.id), 0) + 1;
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
            // Don't update password through this method
            const { password, ...safeUpdates } = updates;
            users[index] = { ...users[index], ...safeUpdates };
            localStorage.setItem('markanUsers', JSON.stringify(users));
            
            // Return updated user without password
            const { password: pwd, ...userWithoutPassword } = users[index];
            return userWithoutPassword;
        }
        return null;
    },
    
    // Update password
    updatePassword: function(id, oldPassword, newPassword) {
        const users = this.getAll();
        const index = users.findIndex(user => user.id === parseInt(id));
        if (index !== -1) {
            if (users[index].password !== oldPassword) {
                return false;
            }
            users[index].password = newPassword;
            localStorage.setItem('markanUsers', JSON.stringify(users));
            return true;
        }
        return false;
    },
    
    // Delete user
    delete: function(id) {
        const users = this.getAll();
        const filtered = users.filter(user => user.id !== parseInt(id));
        localStorage.setItem('markanUsers', JSON.stringify(filtered));
        return filtered;
    },
    
    // Get users by role
    getByRole: function(role) {
        const users = this.getAll();
        return users.filter(user => user.role === role);
    },
    
    // Get active users
    getActive: function() {
        const users = this.getAll();
        return users.filter(user => user.status === 'active');
    },
    
    // Update user status
    updateStatus: function(id, status) {
        return this.update(id, { status });
    },
    
    // Add reward points
    addRewardPoints: function(id, points) {
        const users = this.getAll();
        const index = users.findIndex(user => user.id === parseInt(id));
        if (index !== -1) {
            const currentPoints = users[index].rewards?.points || 0;
            const newPoints = currentPoints + points;
            
            // Update tier based on points
            let tier = 'bronze';
            if (newPoints >= 500) tier = 'gold';
            else if (newPoints >= 200) tier = 'silver';
            
            users[index].rewards = {
                points: newPoints,
                tier: tier
            };
            
            localStorage.setItem('markanUsers', JSON.stringify(users));
            return users[index].rewards;
        }
        return null;
    },
    
    // Search users
    search: function(query) {
        const users = this.getAll();
        const searchTerm = query.toLowerCase();
        return users.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            user.phone.includes(searchTerm)
        );
    },
    
    // Get total users count
    getCount: function() {
        return this.getAll().length;
    },
    
    // Get active users count
    getActiveCount: function() {
        return this.getActive().length;
    }
};

// Make available globally
window.UsersDB = UsersDB;