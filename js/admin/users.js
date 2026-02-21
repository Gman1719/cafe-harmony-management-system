// js/admin/users.js - Admin User Management
// Markan Cafe - Debre Birhan University

let allUsers = [];
let filteredUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load users
    await loadUsers();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadUsers() {
    const container = document.getElementById('usersTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';
        
        allUsers = await API.users.getAll();
        filteredUsers = [...allUsers];
        
        applyFilters();
        
    } catch (error) {
        console.error('Failed to load users:', error);
        container.innerHTML = '<tr><td colspan="8">Failed to load users</td></tr>';
    }
}

function applyFilters() {
    const roleFilter = document.getElementById('roleFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchUser')?.value.toLowerCase() || '';
    
    let filtered = [...allUsers];
    
    // Apply role filter
    if (roleFilter !== 'all') {
        filtered = filtered.filter(user => user.role === roleFilter);
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(user => user.status === statusFilter);
    }
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm) ||
            (user.phone && user.phone.includes(searchTerm))
        );
    }
    
    filteredUsers = filtered;
    displayUsers();
}

function displayUsers() {
    const container = document.getElementById('usersTable');
    if (!container) return;
    
    if (filteredUsers.length === 0) {
        container.innerHTML = '<tr><td colspan="8">No users found</td></tr>';
        return;
    }
    
    container.innerHTML = filteredUsers.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>
                <div class="user-info">
                    <img src="${user.avatar || 'https://via.placeholder.com/30x30/8B4513/FFD700?text=U'}" alt="${user.name}" class="user-avatar">
                    <span>${user.name}</span>
                </div>
            </td>
            <td>${user.email}</td>
            <td>${user.phone || 'N/A'}</td>
            <td><span class="role-badge ${user.role}">${user.role}</span></td>
            <td><span class="status-badge ${user.status}">${user.status}</span></td>
            <td>${user.rewards?.points || 0}</td>
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

window.openAddUserModal = function() {
    currentUserId = null;
    document.getElementById('userModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    Modal.show('userModal');
};

window.editUser = function(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    currentUserId = userId;
    document.getElementById('userModalTitle').textContent = 'Edit User';
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('userStatus').value = user.status;
    document.getElementById('userId').value = user.id;
    document.getElementById('userPassword').required = false;
    
    Modal.show('userModal');
};

window.saveUser = async function() {
    const form = document.getElementById('userForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const userData = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        phone: document.getElementById('userPhone').value,
        role: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
    };
    
    const password = document.getElementById('userPassword').value;
    if (password) {
        userData.password = password;
    }
    
    try {
        if (currentUserId) {
            // Update existing user
            await API.users.update(currentUserId, userData);
            showNotification('User updated successfully', 'success');
        } else {
            // Add new user
            if (!password) {
                showNotification('Password is required for new users', 'error');
                return;
            }
            await API.users.register(userData);
            showNotification('User added successfully', 'success');
        }
        
        Modal.hide('userModal');
        await loadUsers(); // Reload users
        
    } catch (error) {
        console.error('Failed to save user:', error);
        showNotification(error.message || 'Failed to save user', 'error');
    }
};

window.deleteUser = function(userId) {
    const currentUser = Auth.getCurrentUser();
    
    // Prevent deleting yourself
    if (currentUser && currentUser.id === userId) {
        showNotification('You cannot delete your own account', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this user?')) {
        currentUserId = userId;
        Modal.show('deleteUserModal');
    }
};

window.confirmDeleteUser = async function() {
    if (!currentUserId) return;
    
    try {
        await API.users.delete(currentUserId);
        showNotification('User deleted', 'success');
        await loadUsers(); // Reload users
        Modal.hide('deleteUserModal');
    } catch (error) {
        console.error('Failed to delete user:', error);
        showNotification('Failed to delete user', 'error');
    }
};

window.closeUserModal = function() {
    Modal.hide('userModal');
};

window.closeDeleteUserModal = function() {
    Modal.hide('deleteUserModal');
};

function setupEventListeners() {
    // Filter changes
    const roleFilter = document.getElementById('roleFilter');
    const statusFilter = document.getElementById('statusFilter');
    const searchInput = document.getElementById('searchUser');
    
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
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
            Modal.hide(btn.closest('.modal').id);
        });
    });
}