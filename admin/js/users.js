// admin/js/users.js - Users Management
// Markan Cafe Admin - Complete user management with localStorage
// ALL DATA IS DYNAMIC - NO HARDCODING

// ===== GLOBAL VARIABLES =====
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let itemsPerPage = 12; // Grid view shows 12 users per page
let currentRoleFilter = 'all';
let currentStatusFilter = 'all';
let currentDateFilter = 'all';
let currentSearchTerm = '';
let selectedUserId = null;
let deleteUserId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('👥 Users Management initializing...');
    
    // Check authentication
    checkAuth();
    
    // Set admin name
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
    
    // Initialize users database
    initializeUsersDB();
    
    // Load users
    loadUsers();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load notification count
    loadNotificationCount();
});

// ===== CHECK AUTHENTICATION =====
function checkAuth() {
    const userStr = localStorage.getItem('markanUser');
    if (!userStr) {
        window.location.replace('../../login.html');
        return;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            window.location.replace('../../customer/html/dashboard.html');
            return;
        }
    } catch (e) {
        console.error('Auth error:', e);
        window.location.replace('../../login.html');
    }
}

// ===== INITIALIZE USERS DATABASE =====
function initializeUsersDB() {
    // Check if UsersDB exists
    if (typeof UsersDB === 'undefined') {
        console.log('Creating UsersDB...');
        
        // Create UsersDB if it doesn't exist
        window.UsersDB = {
            users: [],
            
            getAll() {
                return this.users;
            },
            
            getById(id) {
                return this.users.find(user => user.id == id);
            },
            
            getByEmail(email) {
                return this.users.find(user => user.email.toLowerCase() === email.toLowerCase());
            },
            
            getByRole(role) {
                if (role === 'all') return this.users;
                return this.users.filter(user => user.role === role);
            },
            
            getByStatus(status) {
                if (status === 'all') return this.users;
                return this.users.filter(user => user.status === status);
            },
            
            getActive() {
                return this.users.filter(user => user.status === 'active');
            },
            
            getInactive() {
                return this.users.filter(user => user.status === 'inactive');
            },
            
            getAdmins() {
                return this.users.filter(user => user.role === 'admin');
            },
            
            getCustomers() {
                return this.users.filter(user => user.role === 'customer');
            },
            
            getNewThisMonth() {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                
                return this.users.filter(user => {
                    const created = new Date(user.createdAt);
                    return created >= startOfMonth;
                });
            },
            
            authenticate(email, password) {
                const user = this.users.find(u => 
                    u.email.toLowerCase() === email.toLowerCase() && 
                    u.password === password &&
                    u.status === 'active'
                );
                
                if (user) {
                    const { password, ...safeUser } = user;
                    return safeUser;
                }
                return null;
            },
            
            add(userData) {
                // Check if email exists
                if (this.users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
                    throw new Error('Email already exists');
                }
                
                const newUser = {
                    id: this.generateId(),
                    ...userData,
                    avatar: userData.avatar || this.generateAvatar(userData.name),
                    createdAt: new Date().toISOString(),
                    lastLogin: null,
                    updatedAt: new Date().toISOString(),
                    preferences: userData.preferences || {
                        notifications: true,
                        darkMode: false,
                        language: 'en',
                        theme: 'light'
                    },
                    stats: userData.stats || {
                        orders: 0,
                        reservations: 0,
                        points: userData.rewardPoints || 0,
                        tier: this.calculateTier(userData.rewardPoints || 0)
                    }
                };
                
                this.users.push(newUser);
                this.saveToStorage();
                
                const { password, ...safeUser } = newUser;
                return safeUser;
            },
            
            update(id, updates) {
                const index = this.users.findIndex(u => u.id == id);
                if (index === -1) return null;
                
                // Don't allow password update through this method
                const { password, ...safeUpdates } = updates;
                
                // Update stats tier if points changed
                if (safeUpdates.stats?.points !== undefined) {
                    safeUpdates.stats.tier = this.calculateTier(safeUpdates.stats.points);
                }
                
                this.users[index] = {
                    ...this.users[index],
                    ...safeUpdates,
                    updatedAt: new Date().toISOString()
                };
                
                this.saveToStorage();
                
                const { password: pwd, ...safeUser } = this.users[index];
                return safeUser;
            },
            
            updatePassword(id, newPassword) {
                const index = this.users.findIndex(u => u.id == id);
                if (index === -1) return false;
                
                this.users[index].password = newPassword;
                this.users[index].updatedAt = new Date().toISOString();
                this.saveToStorage();
                return true;
            },
            
            updateStatus(id, status) {
                return this.update(id, { status });
            },
            
            delete(id) {
                const index = this.users.findIndex(u => u.id == id);
                if (index === -1) return false;
                
                this.users.splice(index, 1);
                this.saveToStorage();
                return true;
            },
            
            generateId() {
                return this.users.length > 0 
                    ? Math.max(...this.users.map(u => u.id)) + 1 
                    : 1;
            },
            
            generateAvatar(name) {
                const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                return `https://ui-avatars.com/api/?name=${initials}&background=8B4513&color=fff&size=150`;
            },
            
            calculateTier(points) {
                if (points >= 1000) return 'gold';
                if (points >= 500) return 'silver';
                return 'bronze';
            },
            
            search(query) {
                const searchTerm = query.toLowerCase();
                return this.users.filter(user => 
                    user.name?.toLowerCase().includes(searchTerm) ||
                    user.email?.toLowerCase().includes(searchTerm) ||
                    user.phone?.includes(searchTerm)
                );
            },
            
            getStats() {
                return {
                    total: this.users.length,
                    active: this.users.filter(u => u.status === 'active').length,
                    inactive: this.users.filter(u => u.status === 'inactive').length,
                    admins: this.users.filter(u => u.role === 'admin').length,
                    customers: this.users.filter(u => u.role === 'customer').length,
                    newThisMonth: this.getNewThisMonth().length
                };
            },
            
            saveToStorage() {
                localStorage.setItem('markanUsers', JSON.stringify(this.users));
                console.log('💾 Users saved to localStorage');
            },
            
            loadFromStorage() {
                const saved = localStorage.getItem('markanUsers');
                if (saved) {
                    try {
                        this.users = JSON.parse(saved);
                        console.log('✅ Users loaded from localStorage:', this.users.length, 'users');
                    } catch (e) {
                        console.error('Error loading users:', e);
                        this.users = [];
                    }
                } else {
                    // Create default users if no data exists
                    this.createDefaultUsers();
                }
            },
            
            createDefaultUsers() {
                const now = new Date();
                const lastWeek = new Date(now);
                lastWeek.setDate(lastWeek.getDate() - 7);
                
                this.users = [
                    {
                        id: 1,
                        name: 'Admin User',
                        email: 'admin@markan.com',
                        password: 'Admin@123',
                        phone: '+251911234567',
                        role: 'admin',
                        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=8B4513&color=fff&size=150',
                        address: 'Debre Birhan University, Staff Quarters',
                        bio: 'Cafe administrator',
                        createdAt: now.toISOString(),
                        lastLogin: now.toISOString(),
                        status: 'active',
                        preferences: {
                            notifications: true,
                            darkMode: false,
                            language: 'en',
                            theme: 'light'
                        },
                        stats: {
                            orders: 0,
                            reservations: 0,
                            points: 0,
                            tier: 'bronze'
                        }
                    },
                    {
                        id: 2,
                        name: 'John Doe',
                        email: 'john@example.com',
                        password: 'Customer@123',
                        phone: '0912345678',
                        role: 'customer',
                        avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=8B4513&color=fff&size=150',
                        address: 'Debre Birhan University, Student Dorm',
                        bio: 'Coffee lover',
                        createdAt: lastWeek.toISOString(),
                        lastLogin: lastWeek.toISOString(),
                        status: 'active',
                        preferences: {
                            notifications: true,
                            darkMode: false,
                            language: 'en',
                            theme: 'light'
                        },
                        stats: {
                            orders: 5,
                            reservations: 2,
                            points: 150,
                            tier: 'bronze'
                        }
                    },
                    {
                        id: 3,
                        name: 'Sarah Smith',
                        email: 'sarah@example.com',
                        password: 'Customer@123',
                        phone: '0923456789',
                        role: 'customer',
                        avatar: 'https://ui-avatars.com/api/?name=Sarah+Smith&background=8B4513&color=fff&size=150',
                        address: 'Debre Birhan University, Faculty Housing',
                        bio: 'Professor and coffee enthusiast',
                        createdAt: lastWeek.toISOString(),
                        lastLogin: null,
                        status: 'active',
                        preferences: {
                            notifications: true,
                            darkMode: false,
                            language: 'en',
                            theme: 'light'
                        },
                        stats: {
                            orders: 3,
                            reservations: 1,
                            points: 75,
                            tier: 'bronze'
                        }
                    },
                    {
                        id: 4,
                        name: 'Mike Johnson',
                        email: 'mike@example.com',
                        password: 'Customer@123',
                        phone: '0934567890',
                        role: 'customer',
                        avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=8B4513&color=fff&size=150',
                        address: 'Debre Birhan University, Student Dorm',
                        bio: '',
                        createdAt: lastWeek.toISOString(),
                        lastLogin: null,
                        status: 'inactive',
                        preferences: {
                            notifications: true,
                            darkMode: false,
                            language: 'en',
                            theme: 'light'
                        },
                        stats: {
                            orders: 1,
                            reservations: 0,
                            points: 10,
                            tier: 'bronze'
                        }
                    }
                ];
                this.saveToStorage();
                console.log('✅ Default users created');
            }
        };
        
        // Load data from localStorage
        UsersDB.loadFromStorage();
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search input
    document.getElementById('searchUsers')?.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.toLowerCase();
        currentPage = 1;
        filterUsers();
    });
    
    // Role filter
    document.getElementById('roleFilter')?.addEventListener('change', function(e) {
        currentRoleFilter = e.target.value;
        currentPage = 1;
        filterUsers();
    });
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentStatusFilter = e.target.value;
        currentPage = 1;
        filterUsers();
    });
    
    // Date filter
    document.getElementById('dateFilter')?.addEventListener('change', function(e) {
        currentDateFilter = e.target.value;
        currentPage = 1;
        filterUsers();
    });
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
    
    // Pagination buttons
    document.getElementById('prevPage')?.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayUsers();
        }
    });
    
    document.getElementById('nextPage')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayUsers();
        }
    });
}

// ===== LOAD USERS =====
function loadUsers() {
    if (typeof UsersDB !== 'undefined') {
        allUsers = UsersDB.getAll() || [];
        console.log('📊 Loaded', allUsers.length, 'users');
    } else {
        allUsers = [];
    }
    
    updateStats();
    filterUsers();
}

// ===== UPDATE STATS CARDS =====
function updateStats() {
    const stats = {
        total: allUsers.length,
        admins: allUsers.filter(u => u.role === 'admin').length,
        customers: allUsers.filter(u => u.role === 'customer').length,
        active: allUsers.filter(u => u.status === 'active').length,
        inactive: allUsers.filter(u => u.status === 'inactive').length
    };
    
    document.getElementById('totalUsers').textContent = stats.total;
    document.getElementById('adminUsers').textContent = stats.admins;
    document.getElementById('customerUsers').textContent = stats.customers;
    document.getElementById('activeUsers').textContent = stats.active;
    document.getElementById('inactiveUsers').textContent = stats.inactive;
}

// ===== FILTER USERS =====
function filterUsers(filterType, filterValue) {
    if (filterType && filterValue !== undefined) {
        // Handle stat card clicks
        if (filterType === 'admin' || filterType === 'customer') {
            currentRoleFilter = filterType;
            document.getElementById('roleFilter').value = filterType;
        } else if (filterType === 'active' || filterType === 'inactive') {
            currentStatusFilter = filterType;
            document.getElementById('statusFilter').value = filterType;
        }
    }
    
    let filtered = [...allUsers];
    
    // Apply role filter
    if (currentRoleFilter !== 'all') {
        filtered = filtered.filter(u => u.role === currentRoleFilter);
    }
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filtered = filtered.filter(u => u.status === currentStatusFilter);
    }
    
    // Apply date filter
    if (currentDateFilter !== 'all') {
        const now = new Date();
        const today = now.toDateString();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        
        filtered = filtered.filter(u => {
            const created = new Date(u.createdAt);
            
            switch(currentDateFilter) {
                case 'today':
                    return created.toDateString() === today;
                case 'week':
                    return created >= startOfWeek;
                case 'month':
                    return created >= startOfMonth;
                default:
                    return true;
            }
        });
    }
    
    // Apply search
    if (currentSearchTerm) {
        filtered = filtered.filter(u => 
            u.name?.toLowerCase().includes(currentSearchTerm) ||
            u.email?.toLowerCase().includes(currentSearchTerm) ||
            u.phone?.includes(currentSearchTerm)
        );
    }
    
    filteredUsers = filtered;
    currentPage = 1;
    displayUsers();
    updatePagination();
}

// ===== DISPLAY USERS IN GRID =====
function displayUsers() {
    const grid = document.getElementById('usersGrid');
    
    if (filteredUsers.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Users Found</h3>
                <p>${allUsers.length === 0 ? 'No users have been created yet' : 'No users match your filters'}</p>
                ${allUsers.length === 0 ? `
                    <button class="btn btn-primary" onclick="openAddUserModal()">
                        <i class="fas fa-user-plus"></i> Add First User
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageUsers = filteredUsers.slice(start, end);
    
    grid.innerHTML = pageUsers.map(user => {
        const avatar = user.avatar || UsersDB.generateAvatar(user.name);
        const tierClass = user.stats?.tier || 'bronze';
        const joinedDate = new Date(user.createdAt).toLocaleDateString();
        
        return `
            <div class="user-card" onclick="openUserModal(${user.id})">
                <div class="user-card-header">
                    <img src="${avatar}" alt="${user.name}" class="user-avatar">
                    <div class="user-basic-info">
                        <h3>${user.name}</h3>
                        <p><i class="fas fa-envelope"></i> ${user.email}</p>
                        <p><i class="fas fa-phone"></i> ${user.phone || 'N/A'}</p>
                    </div>
                    <span class="user-role-badge role-${user.role}">${user.role}</span>
                </div>
                <div class="user-card-body">
                    <div class="user-contact-info">
                        <p><i class="fas fa-map-marker-alt"></i> ${user.address || 'No address'}</p>
                    </div>
                    <div class="user-stats-preview">
                        <div class="preview-stat">
                            <span class="stat-value">${user.stats?.orders || 0}</span>
                            <span class="stat-label">Orders</span>
                        </div>
                        <div class="preview-stat">
                            <span class="stat-value">${user.stats?.reservations || 0}</span>
                            <span class="stat-label">Reservations</span>
                        </div>
                        <div class="preview-stat">
                            <span class="stat-value">${user.stats?.points || 0}</span>
                            <span class="stat-label">Points</span>
                        </div>
                    </div>
                    <div class="user-card-footer">
                        <span class="user-status status-${user.status}">
                            <i class="fas fa-circle"></i> ${user.status}
                        </span>
                        <span class="user-tier tier-${tierClass}">
                            <i class="fas fa-star"></i> ${tierClass}
                        </span>
                        <small>Joined ${joinedDate}</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    if (totalPages === 0) {
        pageNumbers.innerHTML = '';
        return;
    }
    
    // Generate page numbers
    let pageHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
    }
    
    pageNumbers.innerHTML = pageHtml;
}

// ===== GO TO SPECIFIC PAGE =====
function goToPage(page) {
    currentPage = page;
    displayUsers();
    updatePagination();
}

// ===== OPEN USER DETAILS MODAL =====
function openUserModal(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    selectedUserId = userId;
    
    // Set user details
    document.getElementById('userFullName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('userRole').className = `user-role-badge role-${user.role}`;
    document.getElementById('userEmail').textContent = user.email;
    document.getElementById('userPhone').textContent = user.phone || 'N/A';
    document.getElementById('userAddress').textContent = user.address || 'No address provided';
    
    // Set avatar
    const avatarImg = document.getElementById('userAvatar');
    avatarImg.src = user.avatar || UsersDB.generateAvatar(user.name);
    
    // Set status
    const statusSpan = document.getElementById('userStatus');
    statusSpan.textContent = user.status;
    statusSpan.className = `status-badge status-${user.status}`;
    
    // Set dates
    document.getElementById('userJoined').textContent = new Date(user.createdAt).toLocaleDateString();
    document.getElementById('userLastLogin').textContent = user.lastLogin 
        ? new Date(user.lastLogin).toLocaleString() 
        : 'Never';
    
    // Set statistics
    document.getElementById('userTotalOrders').textContent = user.stats?.orders || 0;
    document.getElementById('userTotalSpent').textContent = formatCurrency(user.stats?.totalSpent || 0);
    document.getElementById('userTotalReservations').textContent = user.stats?.reservations || 0;
    document.getElementById('userRewardPoints').textContent = user.stats?.points || 0;
    
    // Set status toggle text
    const toggleText = document.getElementById('statusToggleText');
    toggleText.textContent = user.status === 'active' ? 'Deactivate' : 'Activate';
    
    // Load recent activity
    loadUserRecentActivity(user);
    
    document.getElementById('userModal').classList.add('active');
}

function closeUserModal() {
    document.getElementById('userModal').classList.remove('active');
}

// ===== LOAD USER RECENT ACTIVITY =====
function loadUserRecentActivity(user) {
    const activityList = document.getElementById('userRecentActivity');
    
    const activities = [];
    
    // Get orders
    if (typeof OrdersDB !== 'undefined') {
        const orders = OrdersDB.getByCustomerId(user.id) || [];
        orders.slice(0, 3).forEach(order => {
            activities.push({
                type: 'order',
                description: `Order #${order.id} - ${order.status}`,
                time: order.orderDate,
                icon: 'shopping-cart'
            });
        });
    }
    
    // Get reservations
    if (typeof ReservationsDB !== 'undefined') {
        const reservations = ReservationsDB.getByCustomerId(user.id) || [];
        reservations.slice(0, 3).forEach(res => {
            activities.push({
                type: 'reservation',
                description: `Reservation for ${res.date} at ${res.time}`,
                time: res.createdAt,
                icon: 'calendar-check'
            });
        });
    }
    
    // Sort by time
    activities.sort((a, b) => new Date(b.time) - new Date(a.time));
    
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="no-data">No recent activity</p>';
        return;
    }
    
    activityList.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon ${activity.type}">
                <i class="fas fa-${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <p>${activity.description}</p>
                <span class="activity-time">${getTimeAgo(new Date(activity.time))}</span>
            </div>
        </div>
    `).join('');
}

// ===== EDIT USER =====
function editUser(userId) {
    closeUserModal();
    openEditUserModal(userId);
}

// ===== TOGGLE USER STATUS =====
function toggleUserStatus(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (confirm(`Are you sure you want to ${action} this user?`)) {
        const updated = UsersDB.updateStatus(userId, newStatus);
        if (updated) {
            showNotification(`User ${action}d successfully`, 'success');
            
            // Reload users
            allUsers = UsersDB.getAll();
            updateStats();
            filterUsers();
            
            // Update modal if open
            if (selectedUserId == userId) {
                openUserModal(userId);
            }
        } else {
            showNotification('Failed to update user status', 'error');
        }
    }
}

// ===== OPEN ADD USER MODAL =====
function openAddUserModal() {
    document.getElementById('addUserModalTitle').textContent = 'Add New User';
    document.getElementById('userForm').reset();
    document.getElementById('userId').value = '';
    document.getElementById('userPassword').required = true;
    document.getElementById('userConfirmPassword').required = true;
    document.getElementById('userStatus').checked = true;
    document.getElementById('userRewardPoints').value = 0;
    
    document.getElementById('addUserModal').classList.add('active');
}

// ===== OPEN EDIT USER MODAL =====
function openEditUserModal(userId) {
    const user = allUsers.find(u => u.id == userId);
    if (!user) return;
    
    document.getElementById('addUserModalTitle').textContent = 'Edit User';
    document.getElementById('userId').value = user.id;
    document.getElementById('userName').value = user.name;
    document.getElementById('userEmail').value = user.email;
    document.getElementById('userPhone').value = user.phone || '';
    document.getElementById('userRole').value = user.role;
    document.getElementById('userAddress').value = user.address || '';
    document.getElementById('userStatus').checked = user.status === 'active';
    document.getElementById('userRewardPoints').value = user.stats?.points || 0;
    
    // Password fields are optional in edit mode
    document.getElementById('userPassword').required = false;
    document.getElementById('userConfirmPassword').required = false;
    document.getElementById('userPassword').value = '';
    document.getElementById('userConfirmPassword').value = '';
    
    document.getElementById('addUserModal').classList.add('active');
}

function closeAddUserModal() {
    document.getElementById('addUserModal').classList.remove('active');
}

// ===== SAVE USER (CREATE/UPDATE) =====
function saveUser() {
    // Get form values
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const role = document.getElementById('userRole').value;
    const address = document.getElementById('userAddress').value.trim();
    const isActive = document.getElementById('userStatus').checked;
    const points = parseInt(document.getElementById('userRewardPoints').value) || 0;
    const password = document.getElementById('userPassword').value;
    const confirmPassword = document.getElementById('userConfirmPassword').value;
    const id = document.getElementById('userId').value;
    
    // Validation
    if (!name || !email || !phone || !role) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }
    
    // Validate phone (Ethiopian format)
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }
    
    const userData = {
        name,
        email,
        phone,
        role,
        address,
        status: isActive ? 'active' : 'inactive',
        stats: {
            points: points,
            tier: UsersDB.calculateTier(points)
        }
    };
    
    if (id) {
        // Update existing user
        if (password) {
            // Validate password if provided
            if (password !== confirmPassword) {
                showNotification('Passwords do not match', 'error');
                return;
            }
            
            const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
            if (!passwordRegex.test(password)) {
                showNotification('Password must be at least 8 characters with one special character', 'error');
                return;
            }
            
            // Update password separately
            UsersDB.updatePassword(id, password);
        }
        
        const updated = UsersDB.update(id, userData);
        if (updated) {
            showNotification('User updated successfully', 'success');
        }
    } else {
        // Validate password for new user
        if (!password || !confirmPassword) {
            showNotification('Password is required for new users', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }
        
        const passwordRegex = /^(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        if (!passwordRegex.test(password)) {
            showNotification('Password must be at least 8 characters with one special character', 'error');
            return;
        }
        
        // Add password to userData
        userData.password = password;
        
        try {
            const newUser = UsersDB.add(userData);
            if (newUser) {
                showNotification('User created successfully', 'success');
            }
        } catch (error) {
            showNotification(error.message, 'error');
            return;
        }
    }
    
    // Reload users
    allUsers = UsersDB.getAll();
    updateStats();
    filterUsers();
    closeAddUserModal();
}

// ===== OPEN DELETE MODAL =====
function openDeleteModal(userId) {
    deleteUserId = userId;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteUserId = null;
}

// ===== CONFIRM DELETE =====
function confirmDelete() {
    if (!deleteUserId) return;
    
    // Don't allow deleting yourself
    const currentUser = Auth.getCurrentUser();
    if (currentUser.id == deleteUserId) {
        showNotification('You cannot delete your own account', 'error');
        closeDeleteModal();
        return;
    }
    
    const deleted = UsersDB.delete(deleteUserId);
    if (deleted) {
        showNotification('User deleted successfully', 'success');
        
        // Reload users
        allUsers = UsersDB.getAll();
        updateStats();
        filterUsers();
        
        // Close user modal if open
        if (selectedUserId == deleteUserId) {
            closeUserModal();
        }
    } else {
        showNotification('Failed to delete user', 'error');
    }
    
    closeDeleteModal();
}

// ===== LOAD NOTIFICATION COUNT =====
function loadNotificationCount() {
    const inactiveCount = allUsers.filter(u => u.status === 'inactive').length;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = inactiveCount;
        badge.style.display = inactiveCount > 0 ? 'block' : 'none';
    }
}

// ===== UTILITY FUNCTIONS =====
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '').trim() + ' ETB';
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterUsers = filterUsers;
window.openUserModal = openUserModal;
window.closeUserModal = closeUserModal;
window.openAddUserModal = openAddUserModal;
window.openEditUserModal = openEditUserModal;
window.closeAddUserModal = closeAddUserModal;
window.saveUser = saveUser;
window.editUser = editUser;
window.toggleUserStatus = toggleUserStatus;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.goToPage = goToPage;
window.showNotification = showNotification;