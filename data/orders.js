// data/orders.js - Orders Database
// Markan Cafe - Debre Birhan University

const ordersDatabase = [
    {
        id: 'ORD-1001',
        customerId: 2,
        customerName: 'John Customer',
        customerPhone: '+251922345678',
        items: [
            { id: 1, name: 'Ethiopian Coffee', quantity: 2, price: 4.50 },
            { id: 11, name: 'Sambusa', quantity: 1, price: 3.50 }
        ],
        subtotal: 12.50,
        tax: 1.25,
        total: 13.75,
        status: 'completed',
        paymentMethod: 'cash',
        orderDate: '2025-02-19T10:30:00Z',
        completedDate: '2025-02-19T10:45:00Z',
        specialInstructions: 'Extra spicy please'
    },
    {
        id: 'ORD-1002',
        customerId: 2,
        customerName: 'John Customer',
        customerPhone: '+251922345678',
        items: [
            { id: 5, name: 'Doro Wat', quantity: 1, price: 12.99 },
            { id: 13, name: 'Injera with Ayib', quantity: 1, price: 5.99 }
        ],
        subtotal: 18.98,
        tax: 1.90,
        total: 20.88,
        status: 'preparing',
        paymentMethod: 'card',
        orderDate: '2025-02-20T09:15:00Z',
        completedDate: null,
        specialInstructions: 'Extra injera please'
    },
    {
        id: 'ORD-1003',
        customerId: 3,
        customerName: 'Abebech Tesfaye',
        customerPhone: '+251933456789',
        items: [
            { id: 6, name: 'Kitfo', quantity: 1, price: 14.50 },
            { id: 14, name: 'Ethiopian Honey Bread', quantity: 1, price: 4.99 }
        ],
        subtotal: 19.49,
        tax: 1.95,
        total: 21.44,
        status: 'pending',
        paymentMethod: 'online',
        orderDate: '2025-02-20T11:45:00Z',
        completedDate: null,
        specialInstructions: ''
    },
    {
        id: 'ORD-1004',
        customerId: 4,
        customerName: 'Kebede Alemu',
        customerPhone: '+251944567890',
        items: [
            { id: 7, name: 'Tibs', quantity: 1, price: 13.50 },
            { id: 12, name: 'Kolo', quantity: 1, price: 2.50 }
        ],
        subtotal: 16.00,
        tax: 1.60,
        total: 17.60,
        status: 'completed',
        paymentMethod: 'cash',
        orderDate: '2025-02-18T14:20:00Z',
        completedDate: '2025-02-18T14:50:00Z',
        specialInstructions: 'Tibs medium rare'
    }
];

// Initialize orders in localStorage if not exists
if (!localStorage.getItem('markanOrders')) {
    localStorage.setItem('markanOrders', JSON.stringify(ordersDatabase));
}

// Orders database helper
const OrdersDB = {
    // Get all orders
    getAll: function() {
        const orders = localStorage.getItem('markanOrders');
        return orders ? JSON.parse(orders) : ordersDatabase;
    },
    
    // Get order by ID
    getById: function(id) {
        const orders = this.getAll();
        return orders.find(order => order.id === id);
    },
    
    // Get orders by customer ID
    getByCustomerId: function(customerId) {
        const orders = this.getAll();
        return orders.filter(order => order.customerId === parseInt(customerId))
                    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    },
    
    // Add new order
    add: function(orderData) {
        const orders = this.getAll();
        const orderCount = orders.length + 1;
        const newOrder = {
            id: `ORD-${1000 + orderCount}`,
            ...orderData,
            orderDate: new Date().toISOString(),
            status: orderData.status || 'pending',
            completedDate: null
        };
        orders.push(newOrder);
        localStorage.setItem('markanOrders', JSON.stringify(orders));
        return newOrder;
    },
    
    // Update order status
    updateStatus: function(orderId, status) {
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
    },
    
    // Get orders by status
    getByStatus: function(status) {
        const orders = this.getAll();
        if (status === 'all') return orders;
        return orders.filter(order => order.status === status);
    },
    
    // Get recent orders
    getRecent: function(limit = 5) {
        const orders = this.getAll();
        return orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                    .slice(0, limit);
    },
    
    // Get today's orders
    getTodayOrders: function() {
        const today = new Date().toDateString();
        return this.getAll().filter(order => 
            new Date(order.orderDate).toDateString() === today
        );
    }
};

// Make available globally
window.OrdersDB = OrdersDB;