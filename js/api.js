// js/api.js - Mock API Service
// Markan Cafe - Debre Birhan University

// Mock API service with simulated network delay
const API = {
    // Base delay to simulate network latency
    delay: 500,
    
    // Helper to simulate async requests
    async request(data, shouldFail = false) {
        await new Promise(resolve => setTimeout(resolve, this.delay));
        
        if (shouldFail && Math.random() < 0.1) { // 10% chance of failure
            throw new Error('Network error. Please try again.');
        }
        
        return data;
    },
    
    // ===== Menu APIs =====
    menu: {
        // Get all menu items
        async getAll() {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.getAll());
            }
            return API.request([]);
        },
        
        // Get menu item by ID
        async getById(id) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.getById(id));
            }
            return API.request(null);
        },
        
        // Get items by category
        async getByCategory(category) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.getByCategory(category));
            }
            return API.request([]);
        },
        
        // Search items
        async search(query) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.search(query));
            }
            return API.request([]);
        },
        
        // Get popular items
        async getPopular(limit = 4) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.getPopular(limit));
            }
            return API.request([]);
        },
        
        // Add menu item (admin)
        async add(itemData) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.add(itemData));
            }
            return API.request(null);
        },
        
        // Update menu item (admin)
        async update(id, updates) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.update(id, updates));
            }
            return API.request(null);
        },
        
        // Delete menu item (admin)
        async delete(id) {
            if (typeof MenuDB !== 'undefined') {
                return API.request(MenuDB.delete(id));
            }
            return API.request(null);
        }
    },
    
    // ===== Order APIs =====
    orders: {
        // Get all orders
        async getAll() {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getAll());
            }
            return API.request([]);
        },
        
        // Get order by ID
        async getById(id) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getById(id));
            }
            return API.request(null);
        },
        
        // Get orders by customer ID
        async getByCustomerId(customerId) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getByCustomerId(customerId));
            }
            return API.request([]);
        },
        
        // Get orders by status
        async getByStatus(status) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getByStatus(status));
            }
            return API.request([]);
        },
        
        // Get recent orders
        async getRecent(limit = 5) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getRecent(limit));
            }
            return API.request([]);
        },
        
        // Get today's orders
        async getToday() {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.getTodayOrders());
            }
            return API.request([]);
        },
        
        // Create new order
        async create(orderData) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.add(orderData));
            }
            return API.request({ id: 'ORD-' + Date.now(), ...orderData });
        },
        
        // Update order status
        async updateStatus(orderId, status) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.updateStatus(orderId, status));
            }
            return API.request({ success: true });
        },
        
        // Update order
        async update(orderId, updates) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.update(orderId, updates));
            }
            return API.request({ success: true });
        },
        
        // Delete order
        async delete(orderId) {
            if (typeof OrdersDB !== 'undefined') {
                return API.request(OrdersDB.delete(orderId));
            }
            return API.request({ success: true });
        }
    },
    
    // ===== User APIs =====
    users: {
        // Get all users (admin)
        async getAll() {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.getAll());
            }
            return API.request([]);
        },
        
        // Get user by ID
        async getById(id) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.getById(id));
            }
            return API.request(null);
        },
        
        // Get user by email
        async getByEmail(email) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.getByEmail(email));
            }
            return API.request(null);
        },
        
        // Authenticate user
        async authenticate(email, password) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.authenticate(email, password));
            }
            return API.request(null);
        },
        
        // Register new user
        async register(userData) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.add(userData));
            }
            return API.request({ id: Date.now(), ...userData });
        },
        
        // Update user
        async update(id, updates) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.update(id, updates));
            }
            return API.request({ success: true });
        },
        
        // Delete user (admin)
        async delete(id) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.delete(id));
            }
            return API.request({ success: true });
        },
        
        // Update password
        async updatePassword(id, oldPassword, newPassword) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.updatePassword(id, oldPassword, newPassword));
            }
            return API.request({ success: true });
        },
        
        // Search users
        async search(query) {
            if (typeof UsersDB !== 'undefined') {
                return API.request(UsersDB.search(query));
            }
            return API.request([]);
        }
    },
    
    // ===== Reservation APIs =====
    reservations: {
        // Get all reservations (admin)
        async getAll() {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.getAll());
            }
            return API.request([]);
        },
        
        // Get reservation by ID
        async getById(id) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.getById(id));
            }
            return API.request(null);
        },
        
        // Get reservations by customer ID
        async getByCustomerId(customerId) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.getByCustomerId(customerId));
            }
            return API.request([]);
        },
        
        // Get reservations by date
        async getByDate(date) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.getByDate(date));
            }
            return API.request([]);
        },
        
        // Create new reservation
        async create(reservationData) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.add(reservationData));
            }
            return API.request({ id: 'RES-' + Date.now(), ...reservationData });
        },
        
        // Update reservation status
        async updateStatus(reservationId, status) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.updateStatus(reservationId, status));
            }
            return API.request({ success: true });
        },
        
        // Update reservation
        async update(reservationId, updates) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.update(reservationId, updates));
            }
            return API.request({ success: true });
        },
        
        // Delete reservation
        async delete(reservationId) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.delete(reservationId));
            }
            return API.request({ success: true });
        },
        
        // Check availability
        async checkAvailability(date, time, guests) {
            if (typeof ReservationsDB !== 'undefined') {
                return API.request(ReservationsDB.checkAvailability(date, time, guests));
            }
            return API.request({ available: true });
        }
    },
    
    // ===== Dashboard APIs =====
    dashboard: {
        // Get admin dashboard stats
        async getAdminStats() {
            try {
                const orders = await API.orders.getAll();
                const users = await API.users.getAll();
                const menu = await API.menu.getAll();
                const reservations = await API.reservations.getAll();
                
                const today = new Date().toDateString();
                const todayOrders = orders.filter(o => 
                    new Date(o.orderDate).toDateString() === today
                );
                
                const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total, 0);
                
                const pendingOrders = orders.filter(o => o.status === 'pending').length;
                const preparingOrders = orders.filter(o => o.status === 'preparing').length;
                const completedOrders = orders.filter(o => o.status === 'completed').length;
                
                const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
                
                // Popular items
                const itemCounts = {};
                orders.forEach(order => {
                    order.items.forEach(item => {
                        itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
                    });
                });
                
                const popularItems = Object.entries(itemCounts)
                    .map(([name, count]) => ({ name, count }))
                    .sort((a, b) => b.count - a.count)
                    .slice(0, 5);
                
                return API.request({
                    totalOrders: orders.length,
                    totalUsers: users.length,
                    totalMenuItems: menu.length,
                    totalReservations: reservations.length,
                    todayOrders: todayOrders.length,
                    todayRevenue,
                    totalRevenue,
                    pendingOrders,
                    preparingOrders,
                    completedOrders,
                    popularItems
                });
                
            } catch (error) {
                console.error('Failed to get admin stats:', error);
                return API.request({
                    totalOrders: 0,
                    totalUsers: 0,
                    totalMenuItems: 0,
                    totalReservations: 0,
                    todayOrders: 0,
                    todayRevenue: 0,
                    totalRevenue: 0,
                    pendingOrders: 0,
                    preparingOrders: 0,
                    completedOrders: 0,
                    popularItems: []
                });
            }
        },
        
        // Get customer dashboard stats
        async getCustomerStats(customerId) {
            try {
                const orders = await API.orders.getByCustomerId(customerId);
                const reservations = await API.reservations.getByCustomerId(customerId);
                
                const pendingOrders = orders.filter(o => o.status === 'pending').length;
                const completedOrders = orders.filter(o => o.status === 'completed').length;
                const totalSpent = orders.reduce((sum, o) => sum + o.total, 0);
                
                const upcomingReservations = reservations.filter(r => 
                    new Date(r.date) >= new Date() && r.status !== 'cancelled'
                ).length;
                
                return API.request({
                    totalOrders: orders.length,
                    pendingOrders,
                    completedOrders,
                    totalSpent,
                    totalReservations: reservations.length,
                    upcomingReservations,
                    rewardsPoints: Math.floor(totalSpent * 10),
                    recentOrders: orders.slice(0, 5)
                });
                
            } catch (error) {
                console.error('Failed to get customer stats:', error);
                return API.request({
                    totalOrders: 0,
                    pendingOrders: 0,
                    completedOrders: 0,
                    totalSpent: 0,
                    totalReservations: 0,
                    upcomingReservations: 0,
                    rewardsPoints: 0,
                    recentOrders: []
                });
            }
        }
    }
};

// Make API available globally
window.API = API;