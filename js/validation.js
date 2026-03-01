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
    
    // Email validation
    email(value, fieldName = 'Email') {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!regex.test(value)) {
            return `${fieldName} must be a valid email address`;
        }
        return null;
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
    
    // Min length validation
    minLength(value, min, fieldName = 'Field') {
        if (value.length < min) {
            return `${fieldName} must be at least ${min} characters`;
        }
        return null;
    },
    
    // Max length validation
    maxLength(value, max, fieldName = 'Field') {
        if (value.length > max) {
            return `${fieldName} must be no more than ${max} characters`;
        }
        return null;
    },
    
    // Numeric validation
    numeric(value, fieldName = 'Field') {
        if (isNaN(value) || value === '') {
            return `${fieldName} must be a number`;
        }
        return null;
    },
    
    // Min value validation
    min(value, min, fieldName = 'Field') {
        const num = parseFloat(value);
        if (num < min) {
            return `${fieldName} must be at least ${min}`;
        }
        return null;
    },
    
    // Max value validation
    max(value, max, fieldName = 'Field') {
        const num = parseFloat(value);
        if (num > max) {
            return `${fieldName} must be no more than ${max}`;
        }
        return null;
    },
    
    // Date validation
    date(value, fieldName = 'Date') {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        return null;
    },
    
    // Future date validation
    futureDate(value, fieldName = 'Date') {
        const date = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (date < today) {
            return `${fieldName} must be today or in the future`;
        }
        return null;
    },
    
    // Time validation
    time(value, fieldName = 'Time') {
        const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!regex.test(value)) {
            return `${fieldName} must be a valid time (HH:MM)`;
        }
        return null;
    },
    
    // Select validation
    select(value, fieldName = 'Selection') {
        if (!value || value === '') {
            return `Please select ${fieldName}`;
        }
        return null;
    },
    
    // Validate form with rules
    validate(formData, rules) {
        const errors = {};
        
        for (const [field, fieldRules] of Object.entries(rules)) {
            const value = formData[field];
            
            for (const rule of fieldRules) {
                let error = null;
                
                if (typeof rule === 'function') {
                    error = rule(value);
                } else if (Array.isArray(rule)) {
                    const [ruleName, ...params] = rule;
                    if (typeof this[ruleName] === 'function') {
                        error = this[ruleName](value, ...params);
                    }
                }
                
                if (error) {
                    errors[field] = error;
                    break;
                }
            }
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
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
        error.style.color = 'var(--danger)';
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

// Add validation to forms
document.addEventListener('DOMContentLoaded', () => {
    // Registration form validation
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            Validator.clearAllErrors();
            
            const formData = {
                name: document.getElementById('name')?.value,
                email: document.getElementById('email')?.value,
                phone: document.getElementById('phone')?.value,
                password: document.getElementById('password')?.value,
                confirmPassword: document.getElementById('confirmPassword')?.value,
                role: document.getElementById('role')?.value,
                terms: document.getElementById('terms')?.checked
            };
            
            const rules = {
                name: [v => Validator.required(v, 'Full Name')],
                email: [v => Validator.required(v, 'Email'), v => Validator.email(v)],
                phone: [v => Validator.required(v, 'Phone'), v => Validator.ethiopianPhone(v)],
                password: [v => Validator.required(v, 'Password'), v => Validator.password(v)],
                confirmPassword: [v => Validator.confirmPassword(formData.password, v, 'Confirm Password')],
                role: [v => Validator.select(v, 'role')]
            };
            
            // Check terms
            if (!formData.terms) {
                Validator.showFieldError('terms', 'You must agree to the Terms of Service');
                showNotification('Please agree to the Terms of Service', 'error');
                return;
            }
            
            const result = Validator.validate(formData, rules);
            
            if (!result.isValid) {
                Object.entries(result.errors).forEach(([field, message]) => {
                    const fieldId = {
                        name: 'name',
                        email: 'email',
                        phone: 'phone',
                        password: 'password',
                        confirmPassword: 'confirmPassword',
                        role: 'role'
                    }[field];
                    
                    if (fieldId) {
                        Validator.showFieldError(fieldId, message);
                    }
                });
                
                showNotification('Please fix the errors in the form', 'error');
                return;
            }
            
            // If validation passes, call Auth.register
            Auth.register(formData);
        });
    }
    
    // Login form validation
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            Validator.clearAllErrors();
            
            const email = document.getElementById('email')?.value;
            const password = document.getElementById('password')?.value;
            const remember = document.getElementById('rememberMe')?.checked || false;
            
            let hasError = false;
            
            if (!Validator.required(email, 'Email')) {
                Validator.showFieldError('email', 'Email is required');
                hasError = true;
            } else if (!Validator.email(email)) {
                Validator.showFieldError('email', 'Please enter a valid email');
                hasError = true;
            }
            
            if (!Validator.required(password, 'Password')) {
                Validator.showFieldError('password', 'Password is required');
                hasError = true;
            }
            
            if (hasError) {
                showNotification('Please fix the errors in the form', 'error');
                return;
            }
            
            // Call Auth.login
            Auth.login(email, password, remember);
        });
    }
});