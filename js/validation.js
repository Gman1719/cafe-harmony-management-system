// js/validation.js - Form Validation Module
// Markan Cafe - Debre Birhan University

const Validator = {
    // Required field validation
    required(value, fieldName = 'Field') {
        if (!value || value.toString().trim() === '') {
            return `${fieldName} is required`;
        }
        return null;
    },
    
    // FIXED: Email validation - simpler and more reliable
    email(value, fieldName = 'Email') {
        // Simple but effective email validation
        // Must have: text@text.text
        if (!value || !value.includes('@') || !value.includes('.')) {
            return `${fieldName} must be a valid email address`;
        }
        
        // Check if there's text before @, between @ and ., and after .
        const parts = value.split('@');
        if (parts.length !== 2) return `${fieldName} must be a valid email address`;
        
        const localPart = parts[0];
        const domainPart = parts[1];
        
        if (!localPart || localPart.length === 0) return `${fieldName} must be a valid email address`;
        if (!domainPart || !domainPart.includes('.')) return `${fieldName} must be a valid email address`;
        
        const domainParts = domainPart.split('.');
        if (domainParts.length < 2) return `${fieldName} must be a valid email address`;
        if (domainParts.some(part => part.length === 0)) return `${fieldName} must be a valid email address`;
        
        return null; // Email is valid
    },
    
    // Ethiopian phone validation
    ethiopianPhone(value, fieldName = 'Phone') {
        const regex = /^(09|\+2519)\d{8}$/;
        if (!regex.test(value)) {
            return `${fieldName} must be a valid Ethiopian number (09XXXXXXXX or +2519XXXXXXXX)`;
        }
        return null;
    },
    
    // Password validation
    password(value, fieldName = 'Password') {
        const regex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!regex.test(value)) {
            return `${fieldName} must be at least 8 characters with one special character`;
        }
        return null;
    },
    
    // Confirm password validation
    confirmPassword(password, confirmPassword, fieldName = 'Confirm Password') {
        if (password !== confirmPassword) {
            return `${fieldName} must match password`;
        }
        return null;
    },
    
    // Show field error
    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        this.clearFieldError(fieldId);
        
        field.classList.add('error');
        
        const error = document.createElement('div');
        error.className = 'field-error';
        error.id = `${fieldId}-error`;
        error.textContent = message;
        error.style.color = '#dc3545';
        error.style.fontSize = '0.85rem';
        error.style.marginTop = '0.25rem';
        
        field.parentNode.appendChild(error);
    },
    
    // Clear field error
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        field.classList.remove('error');
        
        const error = document.getElementById(`${fieldId}-error`);
        if (error) error.remove();
    },
    
    // Clear all errors
    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(el => el.remove());
        document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    }
};

// Make Validator available globally
window.Validator = Validator;

// ============================================
// FIXED: FORM HANDLERS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Validator initialized');
    
    // ===== FIXED: LOGIN FORM HANDLER =====
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        console.log('✅ Login form found, attaching handler...');
        
        // Remove any existing handlers to avoid duplicates
        loginForm.removeEventListener('submit', handleLoginSubmit);
        
        // Add new handler
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // ===== REGISTRATION FORM HANDLER =====
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        console.log('✅ Registration form found');
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }
    
    // ===== AUTO-REDIRECT IF ALREADY LOGGED IN =====
    checkExistingSession();
});

// ===== LOGIN HANDLER FUNCTION =====
async function handleLoginSubmit(e) {
    e.preventDefault();
    console.log('🔑 Login form submitted');
    
    Validator.clearAllErrors();
    
    // Get values and TRIM them
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const rememberCheck = document.getElementById('rememberMe');
    
    if (!emailInput || !passwordInput) {
        console.error('❌ Form inputs not found');
        showUserNotification('Form error. Please refresh the page.', 'error');
        return;
    }
    
    const email = emailInput.value?.trim() || '';
    const password = passwordInput.value || '';
    const remember = rememberCheck ? rememberCheck.checked : false;
    
    console.log('Login attempt - Email:', `"${email}"`);
    console.log('Login attempt - Password length:', password.length);
    
    // FIXED: Use simpler validation
    let hasError = false;
    
    if (!email) {
        Validator.showFieldError('email', 'Email is required');
        hasError = true;
        console.log('❌ Email is empty');
    } else {
        // Simple email check
        if (!email.includes('@') || !email.includes('.')) {
            Validator.showFieldError('email', 'Please enter a valid email');
            hasError = true;
            console.log('❌ Email format invalid:', email);
        } else {
            console.log('✅ Email format valid:', email);
        }
    }
    
    if (!password) {
        Validator.showFieldError('password', 'Password is required');
        hasError = true;
        console.log('❌ Password is empty');
    } else {
        console.log('✅ Password provided, length:', password.length);
    }
    
    if (hasError) {
        showUserNotification('Please fix the errors in the form', 'error');
        return;
    }
    
    // Test authentication directly
    if (typeof UsersDB !== 'undefined') {
        console.log('Attempting authentication with:', email);
        const testAuth = UsersDB.authenticate(email, password);
        console.log('Direct auth test:', testAuth ? '✅ SUCCESS' : '❌ FAILED');
        
        if (!testAuth) {
            showUserNotification('Invalid email or password', 'error');
            return;
        }
    } else {
        console.error('❌ UsersDB not available');
        showUserNotification('Authentication system unavailable', 'error');
        return;
    }
    
    // Call Auth.login
    if (typeof Auth !== 'undefined') {
        console.log('Calling Auth.login with:', email);
        
        // Show loading state
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
        submitBtn.disabled = true;
        
        try {
            const result = await Auth.login(email, password, remember);
            console.log('Auth.login result:', result);
            
            if (!result || !result.success) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                showUserNotification(result?.error || 'Login failed', 'error');
            }
            // Redirect happens in Auth.login
        } catch (error) {
            console.error('❌ Auth.login error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showUserNotification('Login failed. Please try again.', 'error');
        }
    } else {
        console.error('❌ Auth not available');
        showUserNotification('Login system unavailable', 'error');
    }
}

// ===== REGISTRATION HANDLER FUNCTION =====
async function handleRegisterSubmit(e) {
    e.preventDefault();
    console.log('📝 Registration form submitted');
    
    Validator.clearAllErrors();
    
    const formData = {
        name: document.getElementById('name')?.value?.trim() || '',
        email: document.getElementById('email')?.value?.trim() || '',
        phone: document.getElementById('phone')?.value?.trim() || '',
        password: document.getElementById('password')?.value || '',
        confirmPassword: document.getElementById('confirmPassword')?.value || '',
        role: document.getElementById('role')?.value || 'customer',
        terms: document.getElementById('terms')?.checked || false
    };
    
    console.log('Form data:', { ...formData, password: '***' });
    
    // Manual validation
    let hasError = false;
    
    if (!formData.name) {
        Validator.showFieldError('name', 'Full name is required');
        hasError = true;
    }
    
    if (!formData.email) {
        Validator.showFieldError('email', 'Email is required');
        hasError = true;
    } else if (!formData.email.includes('@') || !formData.email.includes('.')) {
        Validator.showFieldError('email', 'Please enter a valid email');
        hasError = true;
    }
    
    if (!formData.phone) {
        Validator.showFieldError('phone', 'Phone number is required');
        hasError = true;
    } else {
        const phoneRegex = /^(09|\+2519)\d{8}$/;
        if (!phoneRegex.test(formData.phone)) {
            Validator.showFieldError('phone', 'Please enter a valid Ethiopian phone number');
            hasError = true;
        }
    }
    
    if (!formData.password) {
        Validator.showFieldError('password', 'Password is required');
        hasError = true;
    } else {
        const passRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passRegex.test(formData.password)) {
            Validator.showFieldError('password', 'Password must be at least 8 characters with one special character');
            hasError = true;
        }
    }
    
    if (formData.password !== formData.confirmPassword) {
        Validator.showFieldError('confirmPassword', 'Passwords do not match');
        hasError = true;
    }
    
    if (!formData.terms) {
        showUserNotification('Please agree to the Terms of Service', 'error');
        hasError = true;
    }
    
    if (hasError) {
        showUserNotification('Please fix the errors in the form', 'error');
        return;
    }
    
    // Call Auth.register
    if (typeof Auth !== 'undefined') {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...';
        submitBtn.disabled = true;
        
        try {
            const result = await Auth.register(formData);
            if (!result || !result.success) {
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
                showUserNotification(result?.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('❌ Registration error:', error);
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
            showUserNotification('Registration failed. Please try again.', 'error');
        }
    }
}

// ===== CHECK EXISTING SESSION =====
function checkExistingSession() {
    const userStr = localStorage.getItem('markanUser');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            console.log('✅ Already logged in as:', user.email);
            
            setTimeout(() => {
                if (window.location.pathname.includes('login.html') || 
                    window.location.pathname.endsWith('login') ||
                    window.location.pathname === '/login') {
                    
                    console.log('Redirecting to dashboard...');
                    if (user.role === 'admin') {
                        window.location.href = 'admin/html/dashboard.html';
                    } else if (user.role === 'customer') {
                        window.location.href = 'customer/html/dashboard.html';
                    } else if (user.role === 'staff') {
                        window.location.href = 'staff/html/dashboard.html';
                    }
                }
            }, 1000);
        } catch (e) {
            console.error('Error parsing user data');
            localStorage.removeItem('markanUser');
        }
    }
}

// ===== NOTIFICATION FUNCTION =====
function showUserNotification(message, type = 'info') {
    if (typeof showNotification === 'function') {
        showNotification(message, type);
    } else {
        alert(`${type.toUpperCase()}: ${message}`);
    }
}

// Make test function available globally
window.testLogin = function(email, password) {
    console.log('Testing login with:', email);
    if (typeof UsersDB === 'undefined') {
        console.error('UsersDB not available');
        return;
    }
    const result = UsersDB.authenticate(email, password);
    console.log('Result:', result ? '✅ SUCCESS' : '❌ FAILED');
    if (result) {
        localStorage.setItem('markanUser', JSON.stringify(result));
        console.log('Logged in, redirecting...');
        if (result.role === 'admin') {
            window.location.href = 'admin/html/dashboard.html';
        } else {
            window.location.href = 'customer/html/dashboard.html';
        }
    }
    return result;
};