// js/config.js - Application Configuration
// Markan Cafe - Debre Birhan University

const CONFIG = {
    app: {
        name: 'Markan Cafe',
        university: 'Debre Birhan University',
        version: '2.0.0'
    },
    
    auth: {
        storageKey: 'markanUser',
        sessionTimeout: 3600000, // 1 hour in milliseconds
        passwordMinLength: 8
    },
    
    routes: {
        public: [
            '/',
            '/index.html',
            '/menu.html',
            '/about.html',
            '/contact.html',
            '/faq.html'
        ],
        auth: [
            '/login.html',
            '/register.html'
        ],
        customer: {
            dashboard: '/customer/html/dashboard.html',
            menu: '/customer/html/menu.html',
            cart: '/customer/html/cart.html',
            orders: '/customer/html/orders.html',
            reservations: '/customer/html/reservations.html',
            profile: '/customer/html/profile.html'
        },
        admin: {
            dashboard: '/admin/html/dashboard.html',
            menu: '/admin/html/menu-management.html',
            orders: '/admin/html/orders.html',
            reservations: '/admin/html/reservations.html',
            users: '/admin/html/users.html',
            billing: '/admin/html/billing.html',
            profile: '/admin/html/profile.html'
        }
    },
    
    currency: {
        code: 'ETB',
        symbol: 'ETB'
    },
    
    theme: {
        colors: {
            primary: '#8B4513',
            secondary: '#2C1810',
            accent: '#A0522D',
            background: '#1a1a1a',
            card: '#2d2d2d',
            text: '#FFFFFF'
        }
    }
};

window.CONFIG = CONFIG;