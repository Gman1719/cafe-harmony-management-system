// js/auth-guard.js - Route Protection Helper
// Markan Cafe - Debre Birhan University

(function() {
    // Wait for Auth to be ready
    if (typeof Auth === 'undefined') {
        console.error('Auth not loaded');
        return;
    }
    
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Check if page is admin page
    const isAdminPage = currentPath.includes('/admin/');
    
    // Check if page is customer page
    const isCustomerPage = currentPath.includes('/customer/');
    
    // Check if page is auth page (login/register)
    const isAuthPage = currentPath.endsWith('login.html') || 
                      currentPath.endsWith('register.html');
    
    // Get current user
    const user = Auth.getCurrentUser();
    
    // Admin page protection
    if (isAdminPage) {
        if (!user) {
            // Not logged in - redirect to login
            const redirect = encodeURIComponent(currentPath);
            window.location.href = `../../login.html?redirect=${redirect}`;
            return;
        }
        
        if (user.role !== 'admin') {
            // Not admin - redirect to customer dashboard
            window.location.href = '../../customer/html/dashboard.html';
            return;
        }
    }
    
    // Customer page protection
    if (isCustomerPage) {
        if (!user) {
            // Not logged in - redirect to login
            const redirect = encodeURIComponent(currentPath);
            window.location.href = `../../login.html?redirect=${redirect}`;
            return;
        }
        
        if (user.role !== 'customer') {
            // Not customer - redirect to admin dashboard
            window.location.href = '../../admin/html/dashboard.html';
            return;
        }
    }
    
    // Auth page protection (login/register)
    if (isAuthPage && user) {
        // Already logged in - redirect to appropriate dashboard
        const dashboardUrl = user.role === 'admin' 
            ? '/admin/html/dashboard.html'
            : '/customer/html/dashboard.html';
        window.location.href = dashboardUrl;
    }
})();