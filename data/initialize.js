// data/initialize.js - Database Initialization
// Markan Cafe - Debre Birhan University
// Ensures all data stores are properly initialized

(function() {
    console.log('🚀 Initializing Markan Cafe databases...');
    
    // ===== USERS DATABASE =====
    if (!localStorage.getItem('markanUsers')) {
        const users = [
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
        localStorage.setItem('markanUsers', JSON.stringify(users));
        console.log('✅ Users database initialized with admin account');
    } else {
        console.log('📁 Users database already exists');
    }
    
    // ===== MENU DATABASE =====
    if (!localStorage.getItem('markanMenu')) {
        localStorage.setItem('markanMenu', JSON.stringify([]));
        console.log('✅ Menu database initialized (empty)');
    } else {
        console.log('📁 Menu database already exists');
    }
    
    // ===== ORDERS DATABASE =====
    if (!localStorage.getItem('markanOrders')) {
        localStorage.setItem('markanOrders', JSON.stringify([]));
        console.log('✅ Orders database initialized (empty)');
    } else {
        console.log('📁 Orders database already exists');
    }
    
    // ===== RESERVATIONS DATABASE =====
    if (!localStorage.getItem('markanReservations')) {
        localStorage.setItem('markanReservations', JSON.stringify([]));
        console.log('✅ Reservations database initialized (empty)');
    } else {
        console.log('📁 Reservations database already exists');
    }
    
    // ===== ADMIN ACTIVITY LOG =====
    if (!localStorage.getItem('adminActivityLog')) {
        localStorage.setItem('adminActivityLog', JSON.stringify([]));
        console.log('✅ Admin activity log initialized');
    }
    
    // ===== ADMIN SESSIONS =====
    if (!localStorage.getItem('adminSessions')) {
        localStorage.setItem('adminSessions', JSON.stringify([]));
        console.log('✅ Admin sessions initialized');
    }
    
    // ===== ADMIN NOTIFICATIONS =====
    if (!localStorage.getItem('adminNotifications')) {
        const notifications = [
            {
                id: 1,
                type: 'info',
                title: 'Welcome to Admin Panel',
                message: 'Manage your cafe efficiently from here.',
                time: new Date().toISOString(),
                read: false,
                icon: 'info-circle'
            }
        ];
        localStorage.setItem('adminNotifications', JSON.stringify(notifications));
        console.log('✅ Admin notifications initialized');
    }
    
    // ===== CUSTOMER NOTIFICATIONS =====
    if (!localStorage.getItem('customerNotifications')) {
        localStorage.setItem('customerNotifications', JSON.stringify([]));
        console.log('✅ Customer notifications initialized');
    }
    
    // ===== CUSTOMER PREFERENCES =====
    if (!localStorage.getItem('customerPreferences')) {
        localStorage.setItem('customerPreferences', JSON.stringify({
            language: 'en',
            currency: 'ETB',
            saveAddress: true,
            defaultTakeaway: false,
            theme: 'light'
        }));
        console.log('✅ Customer preferences initialized');
    }
    
    // ===== NOTIFICATION SETTINGS =====
    if (!localStorage.getItem('notificationSettings')) {
        localStorage.setItem('notificationSettings', JSON.stringify({
            notifyOrders: true,
            notifyReservations: true,
            notifyPromotions: false,
            notifyEmail: true,
            soundEnabled: true
        }));
        console.log('✅ Notification settings initialized');
    }
    
    console.log('✅ All databases initialized successfully');
    console.log('👤 Admin login: admin@markan.com / Admin@123');
})();

// Helper function to reset all data (for development)
function resetAllData() {
    if (confirm('⚠️ WARNING: This will delete ALL data. Are you sure?')) {
        localStorage.removeItem('markanUsers');
        localStorage.removeItem('markanMenu');
        localStorage.removeItem('markanOrders');
        localStorage.removeItem('markanReservations');
        localStorage.removeItem('adminActivityLog');
        localStorage.removeItem('adminSessions');
        localStorage.removeItem('adminNotifications');
        localStorage.removeItem('customerNotifications');
        
        // Re-run initialization
        location.reload();
    }
}

// Helper function to check database status
function checkDatabaseStatus() {
    const status = {
        users: localStorage.getItem('markanUsers') ? '✅' : '❌',
        menu: localStorage.getItem('markanMenu') ? '✅' : '❌',
        orders: localStorage.getItem('markanOrders') ? '✅' : '❌',
        reservations: localStorage.getItem('markanReservations') ? '✅' : '❌'
    };
    
    console.table(status);
    return status;
}

// Make helper functions available globally
window.resetAllData = resetAllData;
window.checkDatabaseStatus = checkDatabaseStatus;