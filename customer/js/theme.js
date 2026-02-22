// customer/js/theme.js
// Markan Cafe - Dark/Light Theme Management

// Theme configuration
const themes = {
    light: {
        '--coffee-dark': '#2C1810',
        '--coffee-medium': '#8B4513',
        '--coffee-light': '#D2691E',
        '--primary-gold': '#FFD700',
        '--primary-cream': '#FDF5E6',
        '--bg-warm': '#F5DEB3',
        '--card-bg': '#FFFFFF',
        '--text-dark': '#2C1810',
        '--text-muted': '#8B7D6B',
        '--border-color': '#E5D5C5',
        '--shadow-color': 'rgba(0, 0, 0, 0.1)'
    },
    dark: {
        '--coffee-dark': '#F5E6D3',
        '--coffee-medium': '#D2691E',
        '--coffee-light': '#8B4513',
        '--primary-gold': '#FFD700',
        '--primary-cream': '#2C1810',
        '--bg-warm': '#3D2B1F',
        '--card-bg': '#2D2A24',
        '--text-dark': '#F5E6D3',
        '--text-muted': '#B8A99A',
        '--border-color': '#4A3F35',
        '--shadow-color': 'rgba(255, 255, 255, 0.05)'
    }
};

// Initialize theme
document.addEventListener('DOMContentLoaded', function() {
    loadTheme();
    setupThemeToggle();
});

// Load saved theme
function loadTheme() {
    const savedTheme = localStorage.getItem('customerTheme') || 'light';
    applyTheme(savedTheme);
}

// Apply theme
function applyTheme(themeName) {
    const theme = themes[themeName];
    if (!theme) return;

    // Apply CSS variables
    Object.keys(theme).forEach(key => {
        document.documentElement.style.setProperty(key, theme[key]);
    });

    // Update body class
    document.body.classList.remove('light-theme', 'dark-theme');
    document.body.classList.add(`${themeName}-theme`);

    // Save preference
    localStorage.setItem('customerTheme', themeName);

    // Update toggle button icon
    updateThemeIcon(themeName);

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeName } }));
}

// Update theme toggle icon
function updateThemeIcon(themeName) {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    const icon = toggleBtn.querySelector('i');
    if (icon) {
        if (themeName === 'dark') {
            icon.className = 'fas fa-sun';
            toggleBtn.title = 'Switch to Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            toggleBtn.title = 'Switch to Dark Mode';
        }
    }
}

// Setup theme toggle button
function setupThemeToggle() {
    const toggleBtn = document.getElementById('themeToggle');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function() {
        const currentTheme = localStorage.getItem('customerTheme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        applyTheme(newTheme);
        
        // Show notification
        showNotification(`${newTheme === 'dark' ? '🌙' : '☀️'} ${newTheme.charAt(0).toUpperCase() + newTheme.slice(1)} mode activated`, 'info');
    });
}

// Get current theme
function getCurrentTheme() {
    return localStorage.getItem('customerTheme') || 'light';
}

// Check if dark mode is active
function isDarkMode() {
    return getCurrentTheme() === 'dark';
}

// Toggle theme programmatically
function toggleTheme() {
    const currentTheme = getCurrentTheme();
    applyTheme(currentTheme === 'light' ? 'dark' : 'light');
}

// Watch for system theme changes
if (window.matchMedia) {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    mediaQuery.addEventListener('change', function(e) {
        // Only auto-switch if user hasn't set a preference
        if (!localStorage.getItem('customerTheme')) {
            applyTheme(e.matches ? 'dark' : 'light');
        }
    });
}

// Export functions for global use
window.applyTheme = applyTheme;
window.getCurrentTheme = getCurrentTheme;
window.isDarkMode = isDarkMode;
window.toggleTheme = toggleTheme;

// Show notification (uses the same system as other files)
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 
                            type === 'error' ? 'exclamation-circle' : 
                            type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}