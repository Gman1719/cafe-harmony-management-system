// js/main.js - Core Application Logic
// Markan Cafe - Debre Birhan University

// Global Application State
const AppState = {
    currentUser: null,
    cart: [],
    menuItems: [],
    orders: [],
    reservations: [],
    isLoading: false
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    console.log('Markan Cafe System Initialized');
    
    // Check authentication status
    checkAuthStatus();
    
    // Load cart from localStorage
    loadCart();
    
    // Update cart count in UI
    updateCartCount();
    
    // Setup mobile menu toggle
    setupMobileMenu();
    
    // Set current date in admin dashboard
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
});

// ===== Authentication Functions =====
function checkAuthStatus() {
    const savedUser = localStorage.getItem('markanUser');
    if (savedUser) {
        try {
            AppState.currentUser = JSON.parse(savedUser);
            updateUIForUser();
        } catch (e) {
            console.error('Failed to parse user data');
            localStorage.removeItem('markanUser');
        }
    }
}

function updateUIForUser() {
    if (!AppState.currentUser) return;
    
    // Update user greeting
    const greetingElements = document.querySelectorAll('.user-greeting');
    greetingElements.forEach(el => {
        el.textContent = `Hi, ${AppState.currentUser.name.split(' ')[0]}`;
    });
    
    // Show/hide admin links
    const adminLinks = document.querySelectorAll('.admin-only');
    adminLinks.forEach(link => {
        link.style.display = AppState.currentUser.role === 'admin' ? 'inline-block' : 'none';
    });
    
    // Update login/logout buttons
    const loginLinks = document.querySelectorAll('a[href="login.html"]');
    const logoutButtons = document.querySelectorAll('#logoutBtn');
    
    loginLinks.forEach(link => link.style.display = 'none');
    logoutButtons.forEach(btn => btn.style.display = 'inline-flex');
}

// ===== Cart Functions =====
function loadCart() {
    const savedCart = localStorage.getItem('markanCart');
    if (savedCart) {
        try {
            AppState.cart = JSON.parse(savedCart);
        } catch (e) {
            AppState.cart = [];
        }
    }
}

function saveCart() {
    localStorage.setItem('markanCart', JSON.stringify(AppState.cart));
    updateCartCount();
}

function updateCartCount() {
    const totalItems = AppState.cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    const badges = document.querySelectorAll('.cart-count, #cartCount');
    badges.forEach(badge => {
        badge.textContent = totalItems;
        badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
    });
}

function addToCart(item, quantity = 1) {
    const existingItem = AppState.cart.find(i => i.id === item.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + quantity;
        showNotification(`${item.name} quantity updated in cart`, 'success');
    } else {
        AppState.cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            quantity
        });
        showNotification(`${item.name} added to cart successfully!`, 'success');
    }
    
    saveCart();
}

function removeFromCart(itemId) {
    const index = AppState.cart.findIndex(i => i.id === itemId);
    if (index !== -1) {
        const item = AppState.cart[index];
        AppState.cart.splice(index, 1);
        saveCart();
        showNotification(`${item.name} removed from cart`, 'info');
    }
}

function updateCartItemQuantity(itemId, newQuantity) {
    const item = AppState.cart.find(i => i.id === itemId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(itemId);
        } else {
            item.quantity = newQuantity;
            saveCart();
        }
    }
}

function clearCart() {
    if (AppState.cart.length === 0) return;
    
    if (confirm('Are you sure you want to clear your cart?')) {
        AppState.cart = [];
        saveCart();
        showNotification('Cart cleared', 'warning');
    }
}

function getCartSubtotal() {
    return AppState.cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
}

function getCartTax() {
    return getCartSubtotal() * 0.10; // 10% tax
}

function getCartTotal() {
    return getCartSubtotal() + getCartTax();
}

// ===== UI Functions =====
function setupMobileMenu() {
    const toggle = document.getElementById('navbarToggle');
    const menu = document.getElementById('navbarMenu');
    
    if (toggle && menu) {
        toggle.addEventListener('click', () => {
            menu.classList.toggle('active');
            toggle.innerHTML = menu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
}

// ===== Notification System =====
function showNotification(message, type = 'info', duration = 3000) {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        createNotificationContainer();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]} notification-icon"></i>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;
    
    document.getElementById('notificationContainer').appendChild(notification);
    
    // Add close handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    document.body.appendChild(container);
    return container;
}

// ===== Utility Functions =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date));
}

function validateEthiopianPhone(phone) {
    const regex = /^(09|\+2519)\d{8}$/;
    return regex.test(phone);
}

function validatePassword(password) {
    const regex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
    return regex.test(password);
}

function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== Export Global Functions =====
window.AppState = AppState;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.updateCartItemQuantity = updateCartItemQuantity;
window.clearCart = clearCart;
window.getCartSubtotal = getCartSubtotal;
window.getCartTax = getCartTax;
window.getCartTotal = getCartTotal;
window.showNotification = showNotification;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.validateEthiopianPhone = validateEthiopianPhone;
window.validatePassword = validatePassword;
window.validateEmail = validateEmail;
window.debounce = debounce;