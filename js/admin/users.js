// js/admin/users.js - Admin User Management
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let allUsers = [];
let filteredUsers = [];
let currentUserId = null;

// Initialize users page
document.addEventListener('DOMContentLoaded', function() {
    updateAdminName();
    loadUsers();
    setupEventListeners();
});

// Update admin name in header
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        const adminNameElements = document.querySelectorAll('#adminName');
        adminNameElements.forEach(el => {
            if (el) el.textContent = user.name;
        });
    }
}

// Load users from localStorage
function loadUsers() {
    const stored = localStorage.getItem('markanUsers');
    if (stored) {
        allUsers = JSON.parse(stored);
    } else {
        // Default users if none exist
        allUsers = [
            {
                id: 1,
                name: 'Admin User',
                email: 'admin@markan.com',
                password: 'Admin@123',
                phone: '+251911234567',
                role: 'admin',
                status: 'active',
                joined: '2025-01-01T00:00:00Z'
            },
            {
                id: 2,
                name: 'John Customer',
                email: 'customer@markan.com',
                password: 'Customer@123',
                phone: '+251922345678',
                role: 'customer',
                status: 'active',
                joined: '2025-01-15T10:30:00Z'
            },
            {
                id: 3,
                name: 'Sarah Wilson',
                email: 'sarah@example.com',
                password: 'Sarah@123',
                phone: '+251933456789',
                role: 'customer',
                status: 'active',
                joined: '2025-01-20T09:15:00Z'
            }
        ];
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
    }
    
    filteredUsers = [...allUsers];
    displayUsers(filteredUsers);
}

// Display users in table
function displayUsers(users) {
    const tbody = document.getElementById('usersTable');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No users found</td></tr>';
        return;
    }
    
    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="https://via.placeholder.com/30x30/8B4513/FFD700?text=${user.name.charAt(0)}" 
                         style="width: 30px; height: 30px; border-radius: 50%;"
                         onerror="this.src='https://via.placeholder.com/30x30/8B4513/FFD700?text=U'">
                    ${user.name}
                </div>
            </td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span style="background: ${user.role === 'admin' ? '#8B4513' : '#4CAF50'}; color: white; padding: 3px 10px; border-radius: 12px;">${user.role}</span></td>
            <td><span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span></td>
            <td>${new Date(user.joined || user.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editUser(${user.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Open add user modal
window.openAddUserModal = function() {
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordField').style.display = 'block';
    document.getElementById('userPassword').required = true;
    document.getElementById('userModal').classList.add('active');
};

// Edit user
window.editUser = function(id) {
    const user = allUsers.find(u => u.id === id);
    if (!user) return;

    currentUserId = id;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role || 'customer';
    document.getElementById('userStatus').value = user.status || 'active';
    document.getElementById('userId').value = user.id;
    document.getElementById('passwordField').style.display = 'none';
    document.getElementById('userPassword').required = false;
    
    document.getElementById('userModal').classList.add('active');
};

// Save user (add or update)
window.saveUser = function() {
    // Get form values
    const name = document.getElementById('userName')?.value;
    const email = document.getElementById('userEmail')?.value;
    const phone = document.getElementById('userPhone')?.value;
    const role = document.getElementById('userRole')?.value;
    const status = document.getElementById('userStatus')?.value;
    const password = document.getElementById('userPassword')?.value;

    // Validate
    if (!name || !email || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Validate phone
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }

    const currentUser = Auth.getCurrentUser();

    if (currentUserId) {
        // Update existing user
        const index = allUsers.findIndex(u => u.id === currentUserId);
        if (index !== -1) {
            // Don't allow changing own role/status
            if (currentUser && currentUser.id === currentUserId) {
                if (role !== allUsers[index].role || status !== allUsers[index].status) {
                    showNotification('You cannot change your own role or status', 'error');
                    return;
                }
            }
            
            allUsers[index] = {
                ...allUsers[index],
                name, email, phone, role, status
            };
            
            localStorage.setItem('markanUsers', JSON.stringify(allUsers));
            
            // Update current user if it's the same user
            if (currentUser && currentUser.id === currentUserId) {
                const updatedUser = { ...currentUser, name, email, phone };
                localStorage.setItem('markanUser', JSON.stringify(updatedUser));
                Auth.currentUser = updatedUser;
            }
            
            showNotification('User updated successfully', 'success');
        }
    } else {
        // Add new user
        if (!password) {
            showNotification('Password is required for new users', 'error');
            return;
        }

        // Validate password
        const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            showNotification('Password must be at least 8 characters with one special character', 'error');
            return;
        }

        // Check if email already exists
        if (allUsers.some(u => u.email === email)) {
            showNotification('Email already exists', 'error');
            return;
        }

        const newId = allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1;
        const newUser = {
            id: newId,
            name, email, phone, role, status,
            password: password,
            joined: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        allUsers.push(newUser);
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        showNotification('User added successfully', 'success');
    }

    displayUsers(allUsers);
    closeUserModal();
};

// Delete user
window.deleteUser = function(id) {
    const currentUser = Auth.getCurrentUser();
    
    // Prevent deleting yourself
    if (currentUser && currentUser.id === id) {
        showNotification('You cannot delete your own account', 'error');
        return;
    }
    
    currentUserId = id;
    document.getElementById('deleteUserModal').classList.add('active');
};

// Confirm delete user
window.confirmDeleteUser = function() {
    if (currentUserId) {
        allUsers = allUsers.filter(u => u.id !== currentUserId);
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        displayUsers(allUsers);
        showNotification('User deleted successfully', 'success');
        closeDeleteUserModal();
    }
};

// Close modals
window.closeUserModal = function() {
    document.getElementById('userModal').classList.remove('active');
    currentUserId = null;
};

window.closeDeleteUserModal = function() {
    document.getElementById('deleteUserModal').classList.remove('active');
    currentUserId = null;
};

// Apply filters
function applyFilters() {
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';

    filteredUsers = allUsers.filter(user => {
        // Role filter
        if (roleFilter !== 'all' && user.role !== roleFilter) {
            return false;
        }
        
        // Status filter
        if (statusFilter !== 'all' && user.status !== statusFilter) {
            return false;
        }
        
        // Search filter
        if (searchTerm) {
            const matchesName = user.name?.toLowerCase().includes(searchTerm);
            const matchesEmail = user.email?.toLowerCase().includes(searchTerm);
            const matchesPhone = user.phone?.includes(searchTerm);
            if (!matchesName && !matchesEmail && !matchesPhone) return false;
        }
        
        return true;
    });
    
    displayUsers(filteredUsers);
}

// Refresh users
window.refreshUsers = function() {
    loadUsers();
    showNotification('Users refreshed', 'success');
};

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchUser');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Role filter
    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Add user button
    const addBtn = document.getElementById('addUserBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddUserModal);
    }
    
    // User form submit
    const userForm = document.getElementById('userForm');
    if (userForm) {
        userForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveUser();
        });
    }
    
    // Delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteUserBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDeleteUser);
    }
    
    // Modal close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Close modals on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Debounce function
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

// Export functions
window.applyFilters = applyFilters;