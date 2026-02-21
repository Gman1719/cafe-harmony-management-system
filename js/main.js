// js/main.js - Core Application Logic
// Markan Cafe - Debre Birhan University

// Global Application State
const AppState = {
    currentUser: null,
    cart: [],
    menuItems: [],
    orders: [],
    reservations: [],
    isLoading: false,
    notifications: []
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
    
    // Setup back to top button
    setupBackToTop();
    
    // Load popular items on homepage
    if (document.getElementById('popularItems')) {
        loadPopularItems();
    }
    
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
    
    // Initialize tooltips
    initTooltips();
    
    // Setup form validation
    setupFormValidation();
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
    } else {
        AppState.cart.push({
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image,
            category: item.category,
            quantity
        });
    }
    
    saveCart();
    showNotification(`${item.name} added to cart`, 'success');
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

function setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    if (!backToTop) return;
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
            backToTop.classList.add('visible');
        } else {
            backToTop.classList.remove('visible');
        }
    });
    
    backToTop.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initTooltips() {
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(el => {
        el.addEventListener('mouseenter', (e) => {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = e.target.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = e.target.getBoundingClientRect();
            tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';
            tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
            
            e.target.addEventListener('mouseleave', () => {
                tooltip.remove();
            }, { once: true });
        });
    });
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
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, duration);
}

function createNotificationContainer() {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    document.body.appendChild(container);
    return container;
}

// ===== Form Validation Setup =====
function setupFormValidation() {
    // Contact form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Message sent successfully! We\'ll reply soon.', 'success');
            contactForm.reset();
        });
    }
    
    // Newsletter form
    const newsletterForm = document.getElementById('newsletterForm');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Subscribed to newsletter!', 'success');
            newsletterForm.reset();
        });
    }
}

// ===== Data Loading Functions =====
async function loadPopularItems() {
    const container = document.getElementById('popularItems');
    if (!container) return;
    
    try {
        // Check if MenuDB exists
        if (typeof MenuDB !== 'undefined') {
            const items = MenuDB.getPopular(4);
            displayPopularItems(items);
        } else {
            // Fallback data
            const fallbackItems = [
                { id: 1, name: 'Espresso', price: 3.50, image: 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Espresso', rating: 4.5, description: 'Strong and bold single shot' },
                { id: 2, name: 'Cappuccino', price: 4.50, image: 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Cappuccino', rating: 4.7, description: 'Espresso with steamed milk' },
                { id: 9, name: 'Croissant', price: 3.75, image: 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Croissant', rating: 4.5, description: 'Buttery, flaky pastry' },
                { id: 21, name: 'Cheesecake', price: 6.50, image: 'https://via.placeholder.com/300x200/8B4513/FFD700?text=Cheesecake', rating: 4.8, description: 'Creamy New York style' }
            ];
            displayPopularItems(fallbackItems);
        }
    } catch (error) {
        console.error('Failed to load popular items:', error);
        container.innerHTML = '<p class="error">Failed to load items</p>';
    }
}

function displayPopularItems(items) {
    const container = document.getElementById('popularItems');
    if (!container) return;
    
    container.innerHTML = items.map(item => `
        <div class="menu-card" onclick="window.location.href='menu.html?id=${item.id}'">
            <div class="menu-card-image" style="background-image: url('${item.image}')">
                <span class="menu-card-badge popular">Popular</span>
            </div>
            <div class="menu-card-content">
                <h3 class="menu-card-title">${item.name}</h3>
                <p class="menu-card-description">${item.description.substring(0, 60)}...</p>
                <div class="menu-card-footer">
                    <span class="menu-card-price">$${item.price.toFixed(2)}</span>
                    <div class="menu-card-rating">
                        ${generateStars(item.rating)} <span>(${item.rating})</span>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) stars += '<i class="fas fa-star"></i>';
    if (hasHalf) stars += '<i class="fas fa-star-half-alt"></i>';
    for (let i = fullStars + (hasHalf ? 1 : 0); i < 5; i++) stars += '<i class="far fa-star"></i>';
    
    return stars;
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

function formatDateOnly(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date(date));
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

// ===== Loading States =====
function showLoading(container) {
    const loader = document.createElement('div');
    loader.className = 'spinner';
    loader.id = 'loadingSpinner';
    
    if (container) {
        container.innerHTML = '';
        container.appendChild(loader);
    } else {
        document.body.appendChild(loader);
    }
    
    AppState.isLoading = true;
}

function hideLoading() {
    const loader = document.getElementById('loadingSpinner');
    if (loader) loader.remove();
    AppState.isLoading = false;
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
window.formatDateOnly = formatDateOnly;
window.debounce = debounce;
window.validateEthiopianPhone = validateEthiopianPhone;
window.validatePassword = validatePassword;
window.validateEmail = validateEmail;
window.showLoading = showLoading;
window.hideLoading = hideLoading;