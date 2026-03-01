// admin/js/users.js
// Markan Cafe Admin - Users Management
// Full CRUD operations with localStorage - NO HARDCODED DATA

// ===== GLOBAL VARIABLES =====
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let itemsPerPage = 12;
let currentUserId = null;
let userToDelete = null;
let currentFilter = {
    role: 'all',
    status: 'all',
    date: 'all'
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load users
    loadUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update admin name
    updateAdminName();
});

// ===== LOAD USERS =====
function loadUsers() {
    try {
        // Get users from localStorage
        const stored = localStorage.getItem('markanUsers');
        allUsers = stored ? JSON.parse(stored) : [];
        
        // Sort by creation date (newest first)
        allUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply filters
        applyFilters();
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Failed to load users', 'error');
        allUsers = [];
        filteredUsers = [];
        displayUsers([]);
    }
}

// ===== SAVE USERS =====
function saveUsers() {
    try {
        localStorage.setItem('markanUsers', JSON.stringify(allUsers));
        
        // Dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'markanUsers',
            newValue: JSON.stringify(allUsers)
        }));
        
    } catch (error) {
        console.error('Error saving users:', error);
        showNotification('Failed to save users', 'error');
    }
}

// ===== APPLY FILTERS =====
function applyFilters() {
    filteredUsers = [...allUsers];
    
    // Apply role filter
    if (currentFilter.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === currentFilter.role);
    }
    
    // Apply status filter
    if (currentFilter.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === currentFilter.status);
    }
    
    // Apply date filter
    if (currentFilter.date !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        
        switch(currentFilter.date) {
            case 'today':
                filteredUsers = filteredUsers.filter(user => {
                    const joinDate = new Date(user.createdAt);
                    joinDate.setHours(0, 0, 0, 0);
                    return joinDate.getTime() === today.getTime();
                });
                break;
                
            case 'week':
                filteredUsers = filteredUsers.filter(user => {
                    const joinDate = new Date(user.createdAt);
                    return joinDate >= weekAgo;
                });
                break;
                
            case 'month':
                filteredUsers = filteredUsers.filter(user => {
                    const joinDate = new Date(user.createdAt);
                    return joinDate >= monthAgo;
                });
                break;
        }
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update UI
    updateStats();
    displayUsers();
}

// ===== UPDATE STATISTICS =====
function updateStats() {
    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('adminUsers').textContent = allUsers.filter(u => u.role === 'admin').length;
    document.getElementById('customerUsers').textContent = allUsers.filter(u => u.role === 'customer').length;
    document.getElementById('activeUsers').textContent = allUsers.filter(u => u.status === 'active').length;
    document.getElementById('inactiveUsers').textContent = allUsers.filter(u => u.status === 'inactive').length;
}

// ===== DISPLAY USERS =====
function displayUsers() {
    const grid = document.getElementById('usersGrid');
    if (!grid) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);

    if (pageUsers.length === 0) {
        grid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-users-slash"></i>
                <h3>No Users Found</h3>
                <p>Try adjusting your filters or add a new user.</p>
                <button class="btn btn-primary" onclick="openAddUserModal()">
                    <i class="fas fa-user-plus"></i> Add User
                </button>
            </div>
        `;
        updatePagination();
        return;
    }

    grid.innerHTML = pageUsers.map(user => {
        const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
        const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=80`;
        
        return `
            <div class="user-card ${user.status === 'inactive' ? 'inactive' : ''}" 
                 onclick="viewUserDetails(${user.id})">
                <img src="${avatarUrl}" 
                     alt="${user.name}" 
                     class="user-avatar"
                     onerror="this.src='https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=80'">
                <div class="user-info">
                    <h3>${user.name || 'N/A'}</h3>
                    <p class="user-email"><i class="fas fa-envelope"></i> ${user.email}</p>
                    <div class="user-meta">
                        <span><i class="fas fa-phone"></i> ${user.phone || 'N/A'}</span>
                        <span><i class="fas fa-calendar"></i> ${formatJoinDate(user.createdAt)}</span>
                    </div>
                    <div class="user-badges">
                        <span class="role-badge ${user.role}">${user.role || 'customer'}</span>
                        <span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span>
                    </div>
                </div>
                <div class="user-card-actions" onclick="event.stopPropagation()">
                    <button class="action-btn edit" onclick="editUser(${user.id})" title="Edit User">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteUser(${user.id})" title="Delete User">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    updatePagination();
}

// ===== VIEW USER DETAILS =====
window.viewUserDetails = function(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;

    currentUserId = userId;

    // Set avatar
    const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';
    document.getElementById('userAvatar').src = user.avatar || `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`;

    // Set user details
    document.getElementById('userFullName').textContent = user.name || 'N/A';
    document.getElementById('userRole').textContent = user.role || 'customer';
    document.getElementById('userRole').className = `user-role-badge ${user.role}`;
    document.getElementById('userEmail').textContent = user.email || 'N/A';
    document.getElementById('userPhone').textContent = user.phone || 'N/A';
    document.getElementById('userAddress').textContent = user.address || 'No address provided';
    document.getElementById('userStatus').textContent = user.status || 'active';
    document.getElementById('userStatus').className = `status-badge ${user.status || 'active'}`;
    document.getElementById('userJoined').textContent = formatDate(user.createdAt);
    document.getElementById('userLastLogin').textContent = user.lastLogin ? formatDateTime(user.lastLogin) : 'Never';

    // Load user statistics
    loadUserStats(user.id);

    // Load recent activity
    loadUserActivity(user.id);

    // Set status toggle button
    const toggleBtn = document.getElementById('statusToggleText');
    toggleBtn.textContent = user.status === 'active' ? 'Deactivate' : 'Activate';

    document.getElementById('userModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== LOAD USER STATISTICS =====
function loadUserStats(userId) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    
    const userOrders = orders.filter(o => o.customerId == userId);
    const userReservations = reservations.filter(r => r.customerId == userId);
    
    const totalSpent = userOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    
    document.getElementById('userTotalOrders').textContent = userOrders.length;
    document.getElementById('userTotalSpent').textContent = formatETB(totalSpent);
    document.getElementById('userTotalReservations').textContent = userReservations.length;
    
    // Get user reward points from user object
    const user = allUsers.find(u => u.id == userId);
    document.getElementById('userRewardPoints').textContent = user?.rewards?.points || 0;
}

// ===== LOAD USER ACTIVITY =====
function loadUserActivity(userId) {
    const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    
    const activities = [
        ...orders.filter(o => o.customerId == userId).map(o => ({
            type: 'order',
            description: `Order placed: ${o.id} - ${formatETB(o.total || 0)}`,
            time: o.orderDate
        })),
        ...reservations.filter(r => r.customerId == userId).map(r => ({
            type: 'reservation',
            description: `Reservation: ${r.id} for ${r.guests} guests on ${formatDate(r.date)}`,
            time: r.createdAt
        }))
    ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5);

    const activityList = document.getElementById('userRecentActivity');
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="no-activity">No recent activity</p>';
        return;
    }

    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.type === 'order' ? 'shopping-cart' : 'calendar-check'}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${timeAgo(activity.time)}</span>
            </div>
        </div>
    `).join('');
}

// ===== CLOSE USER MODAL =====
window.closeUserModal = function() {
    document.getElementById('userModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== OPEN ADD USER MODAL =====
window.openAddUserModal = function() {
    currentUserId = null;
    document.getElementById('addUserModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('passwordFields').style.display = 'block';
    document.getElementById('userPassword').required = true;
    document.getElementById('userConfirmPassword').required = true;
    document.getElementById('userStatus').checked = true;
    document.getElementById('userRewardPoints').value = 0;
    
    document.getElementById('addUserModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== EDIT USER =====
window.editUser = function(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;

    currentUserId = userId;
    document.getElementById('addUserModalTitle').textContent = 'Edit User';
    document.getElementById('userName').value = user.name || '';
    document.getElementById('userEmail').value = user.email || '';
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role || 'customer';
    document.getElementById('userAddress').value = user.address || '';
    document.getElementById('userStatus').checked = user.status === 'active';
    document.getElementById('userRewardPoints').value = user.rewards?.points || 0;
    document.getElementById('userId').value = user.id;
    
    // Hide password fields for edit
    document.getElementById('passwordFields').style.display = 'none';
    document.getElementById('userPassword').required = false;
    document.getElementById('userConfirmPassword').required = false;
    
    document.getElementById('addUserModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE ADD USER MODAL =====
window.closeAddUserModal = function() {
    document.getElementById('addUserModal').classList.remove('active');
    document.getElementById('userForm').reset();
    document.body.style.overflow = '';
}

// ===== SAVE USER =====
window.saveUser = function() {
    // Get form values
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;
    const address = document.getElementById('userAddress').value.trim();
    const isActive = document.getElementById('userStatus').checked;
    const rewardPoints = parseInt(document.getElementById('userRewardPoints').value) || 0;
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('userConfirmPassword').value;

    // Validate
    if (!name || !email || !phone) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email', 'error');
        return;
    }

    // Validate phone
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number', 'error');
        return;
    }

    const userData = {
        name: name,
        email: email,
        phone: phone,
        role: role,
        address: address,
        status: isActive ? 'active' : 'inactive',
        rewards: {
            points: rewardPoints,
            tier: getTier(rewardPoints)
        },
        updatedAt: new Date().toISOString()
    };

    if (currentUserId) {
        // Update existing user
        const index = allUsers.findIndex(u => u.id == currentUserId);
        if (index !== -1) {
            // Update password if provided
            if (password) {
                if (password !== confirmPassword) {
                    showNotification('Passwords do not match', 'error');
                    return;
                }
                if (!validatePassword(password)) {
                    showNotification('Password must be at least 8 characters with one special character', 'error');
                    return;
                }
                allUsers[index].password = password;
            }

            // Preserve existing data
            allUsers[index] = {
                ...allUsers[index],
                ...userData,
                id: allUsers[index].id,
                createdAt: allUsers[index].createdAt,
                avatar: allUsers[index].avatar
            };
            
            showNotification('User updated successfully', 'success');
        }
    } else {
        // Add new user
        if (!password) {
            showNotification('Password is required for new users', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        if (!validatePassword(password)) {
            showNotification('Password must be at least 8 characters with one special character', 'error');
            return;
        }

        // Check if email already exists
        if (allUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
            showNotification('Email already exists', 'error');
            return;
        }

        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const newUser = {
            id: generateUserId(),
            ...userData,
            password: password,
            avatar: `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLogin: null,
            preferences: {
                notifications: true,
                darkMode: false,
                language: 'en'
            }
        };
        
        allUsers.push(newUser);
        showNotification('User added successfully', 'success');
    }

    // Save to localStorage
    saveUsers();
    
    // Reload data
    loadUsers();
    
    // Close modal
    closeAddUserModal();
}

// ===== GET TIER BASED ON POINTS =====
function getTier(points) {
    if (points >= 1000) return 'gold';
    if (points >= 500) return 'silver';
    return 'bronze';
}

// ===== VALIDATE PASSWORD =====
function validatePassword(password) {
    return /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(password);
}

// ===== GENERATE USER ID =====
function generateUserId() {
    return allUsers.length > 0 ? Math.max(...allUsers.map(u => u.id)) + 1 : 1;
}

// ===== TOGGLE USER STATUS =====
window.toggleUserStatus = function(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;

    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        user.status = newStatus;
        user.updatedAt = new Date().toISOString();
        saveUsers();
        loadUsers();
        closeUserModal();
        showNotification(`User ${action}d successfully`, 'success');
    }
}

// ===== DELETE USER =====
window.deleteUser = function(userId) {
    userToDelete = userId;
    document.getElementById('deleteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE DELETE MODAL =====
window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.remove('active');
    document.body.style.overflow = '';
    userToDelete = null;
}

// ===== CONFIRM DELETE =====
window.confirmDelete = function() {
    if (userToDelete) {
        // Don't allow deleting yourself
        const currentUser = Auth.getCurrentUser();
        if (currentUser && currentUser.id == userToDelete) {
            showNotification('You cannot delete your own account', 'error');
            closeDeleteModal();
            return;
        }
        
        allUsers = allUsers.filter(u => u.id != userToDelete);
        saveUsers();
        loadUsers();
        closeDeleteModal();
        closeUserModal();
        showNotification('User deleted successfully', 'success');
        userToDelete = null;
    }
}

// ===== FILTER USERS =====
window.filterUsers = function(filterType) {
    // This function can be called from stat cards
    switch(filterType) {
        case 'admin':
            currentFilter.role = 'admin';
            document.getElementById('roleFilter').value = 'admin';
            break;
        case 'customer':
            currentFilter.role = 'customer';
            document.getElementById('roleFilter').value = 'customer';
            break;
        case 'active':
            currentFilter.status = 'active';
            document.getElementById('statusFilter').value = 'active';
            break;
        case 'inactive':
            currentFilter.status = 'inactive';
            document.getElementById('statusFilter').value = 'inactive';
            break;
        default:
            currentFilter.role = 'all';
            currentFilter.status = 'all';
            document.getElementById('roleFilter').value = 'all';
            document.getElementById('statusFilter').value = 'all';
    }
    
    applyFilters();
}

// ===== SEARCH USERS =====
function searchUsers(query) {
    const searchTerm = query.toLowerCase();
    
    filteredUsers = allUsers.filter(user => 
        user.name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.phone?.includes(searchTerm)
    );
    
    // Re-apply role and status filters
    if (currentFilter.role !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.role === currentFilter.role);
    }
    
    if (currentFilter.status !== 'all') {
        filteredUsers = filteredUsers.filter(user => user.status === currentFilter.status);
    }
    
    currentPage = 1;
    displayUsers();
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.disabled = currentPage === 1 || totalPages === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (!pageNumbers) return;

    if (totalPages === 0) {
        pageNumbers.innerHTML = '<span class="page-number active">1</span>';
        return;
    }

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
            <span class="page-number ${i === currentPage ? 'active' : ''}" 
                  onclick="goToPage(${i})">${i}</span>
        `;
    }
    pageNumbers.innerHTML = pagesHtml;
}

// ===== GO TO PAGE =====
window.goToPage = function(page) {
    currentPage = page;
    displayUsers();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search
    document.getElementById('searchUsers')?.addEventListener('input', debounce(function(e) {
        searchUsers(e.target.value);
    }, 500));
    
    // Role filter
    document.getElementById('roleFilter')?.addEventListener('change', function(e) {
        currentFilter.role = e.target.value;
        applyFilters();
    });
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentFilter.status = e.target.value;
        applyFilters();
    });
    
    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        currentFilter.date = e.target.value;
        applyFilters();
    });
    
    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayUsers();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayUsers();
        }
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanUsers') {
            loadUsers();
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('userModal').classList.contains('active')) {
                closeUserModal();
            }
            if (document.getElementById('addUserModal').classList.contains('active')) {
                closeAddUserModal();
            }
            if (document.getElementById('deleteModal').classList.contains('active')) {
                closeDeleteModal();
            }
        }
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const userModal = document.getElementById('userModal');
        const addModal = document.getElementById('addUserModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (e.target === userModal) {
            closeUserModal();
        }
        if (e.target === addModal) {
            closeAddUserModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}

// ===== HELPER: FORMAT JOIN DATE =====
function formatJoinDate(dateString) {
    if (!dateString) return 'New';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
}

// ===== HELPER: FORMAT DATE =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== HELPER: FORMAT DATE TIME =====
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
}

// ===== HELPER: TIME AGO =====
function timeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
}

// ===== HELPER: DEBOUNCE =====
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

// ===== SHOW NOTIFICATION =====
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
    }, 5000);
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.viewUserDetails = viewUserDetails;
window.closeUserModal = closeUserModal;
window.openAddUserModal = openAddUserModal;
window.editUser = editUser;
window.closeAddUserModal = closeAddUserModal;
window.saveUser = saveUser;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.filterUsers = filterUsers;
window.goToPage = goToPage;