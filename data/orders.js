// data/orders.js - Orders Database
// Markan Cafe - Debre Birhan University
// Complete order management for admin and customer panels

// Initialize empty orders if not exists
if (!localStorage.getItem('markanOrders')) {
    localStorage.setItem('markanOrders', JSON.stringify([]));
    console.log('✅ Empty orders initialized');
}

// Orders database helper
const OrdersDB = {
    // Get all orders
    getAll: function() {
        try {
            return JSON.parse(localStorage.getItem('markanOrders')) || [];
        } catch (e) {
            console.error('Error parsing orders:', e);
            return [];
        }
    },
    
    // Get order by ID
    getById: function(id) {
        const orders = this.getAll();
        return orders.find(order => order.id === id);
    },
    
    // Get orders by customer ID
    getByCustomerId: function(customerId) {
        const orders = this.getAll();
        return orders.filter(order => order.customerId == customerId)
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    },
    
    // Get orders by status
    getByStatus: function(status) {
        const orders = this.getAll();
        if (status === 'all') return orders;
        return orders.filter(order => order.status === status);
    },
    
    // Get orders by date range
    getByDateRange: function(startDate, endDate) {
        const orders = this.getAll();
        const start = new Date(startDate).setHours(0, 0, 0, 0);
        const end = new Date(endDate).setHours(23, 59, 59, 999);
        
        return orders.filter(order => {
            const orderDate = new Date(order.orderDate).getTime();
            return orderDate >= start && orderDate <= end;
        });
    },
    
    // Get today's orders
    getToday: function() {
        const today = new Date().toDateString();
        return this.getAll().filter(order => 
            new Date(order.orderDate).toDateString() === today
        );
    },
    
    // Get recent orders
    getRecent: function(limit = 5) {
        const orders = this.getAll();
        return orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, limit);
    },
    
    // Create new order
    add: function(orderData) {
        try {
            const orders = this.getAll();
            
            // Generate order ID
            const orderId = 'ORD-' + Date.now().toString().slice(-6) + 
                           Math.random().toString(36).substr(2, 3).toUpperCase();
            
            // Calculate totals if not provided
            const subtotal = orderData.subtotal || 
                orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            const tax = orderData.tax || subtotal * 0.1;
            const total = orderData.total || subtotal + tax + (orderData.deliveryFee || 0);
            
            const newOrder = {
                id: orderId,
                customerId: orderData.customerId,
                customerName: orderData.customerName,
                customerPhone: orderData.customerPhone,
                customerEmail: orderData.customerEmail,
                items: orderData.items.map(item => ({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    category: item.category
                })),
                subtotal: subtotal,
                tax: tax,
                deliveryFee: orderData.deliveryFee || 0,
                total: total,
                status: orderData.status || 'pending',
                paymentMethod: orderData.paymentMethod || 'cash',
                orderType: orderData.orderType || 'pickup',
                deliveryAddress: orderData.deliveryAddress || '',
                specialInstructions: orderData.specialInstructions || '',
                orderDate: new Date().toISOString(),
                completedDate: null,
                estimatedTime: orderData.estimatedTime || null
            };
            
            orders.push(newOrder);
            localStorage.setItem('markanOrders', JSON.stringify(orders));
            
            // Update menu stock
            this.updateStockAfterOrder(newOrder);
            
            return newOrder;
            
        } catch (error) {
            console.error('Error creating order:', error);
            return null;
        }
    },
    
    // Update order status
    updateStatus: function(orderId, status) {
        try {
            const orders = this.getAll();
            const index = orders.findIndex(order => order.id === orderId);
            
            if (index !== -1) {
                orders[index].status = status;
                if (status === 'completed') {
                    orders[index].completedDate = new Date().toISOString();
                }
                localStorage.setItem('markanOrders', JSON.stringify(orders));
                return orders[index];
            }
            return null;
            
        } catch (error) {
            console.error('Error updating order status:', error);
            return null;
        }
    },
    
    // Update order
    update: function(orderId, updates) {
        try {
            const orders = this.getAll();
            const index = orders.findIndex(order => order.id === orderId);
            
            if (index !== -1) {
                orders[index] = { ...orders[index], ...updates };
                localStorage.setItem('markanOrders', JSON.stringify(orders));
                return orders[index];
            }
            return null;
            
        } catch (error) {
            console.error('Error updating order:', error);
            return null;
        }
    },
    
    // Delete order
    delete: function(orderId) {
        try {
            const orders = this.getAll();
            const filtered = orders.filter(order => order.id !== orderId);
            localStorage.setItem('markanOrders', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting order:', error);
            return false;
        }
    },
    
    // Update stock after order
    updateStockAfterOrder: function(order) {
        const menu = JSON.parse(localStorage.getItem('markanMenu')) || [];
        
        order.items.forEach(orderItem => {
            const menuIndex = menu.findIndex(item => item.id == orderItem.id);
            if (menuIndex !== -1) {
                menu[menuIndex].stock -= orderItem.quantity;
                if (menu[menuIndex].stock < 0) menu[menuIndex].stock = 0;
                if (menu[menuIndex].stock === 0) {
                    menu[menuIndex].status = 'out_of_stock';
                }
            }
        });
        
        localStorage.setItem('markanMenu', JSON.stringify(menu));
    },
    
    // Get order statistics
    getStats: function() {
        const orders = this.getAll();
        const completed = orders.filter(o => o.status === 'completed');
        
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            preparing: orders.filter(o => o.status === 'preparing').length,
            ready: orders.filter(o => o.status === 'ready').length,
            completed: completed.length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalRevenue: completed.reduce((sum, o) => sum + (o.total || 0), 0),
            averageOrder: completed.length > 0 
                ? completed.reduce((sum, o) => sum + (o.total || 0), 0) / completed.length 
                : 0
        };
    },
    
    // Get customer order statistics
    getCustomerStats: function(customerId) {
        const orders = this.getByCustomerId(customerId);
        const completed = orders.filter(o => o.status === 'completed');
        
        return {
            total: orders.length,
            pending: orders.filter(o => o.status === 'pending').length,
            completed: completed.length,
            cancelled: orders.filter(o => o.status === 'cancelled').length,
            totalSpent: completed.reduce((sum, o) => sum + (o.total || 0), 0)
        };
    }
};

// Make available globally
window.OrdersDB = OrdersDB;

console.log('📁 Orders database ready');