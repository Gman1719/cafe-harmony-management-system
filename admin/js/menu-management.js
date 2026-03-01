// admin/js/menu-management.js - Menu Management
// Markan Cafe - Debre Birhan University
// Complete CRUD operations for menu items with localStorage

// ============================================
// GLOBAL VARIABLES
// ============================================
let menuItems = [];
let currentFilter = 'all';
let currentCategory = 'all';
let currentSearchTerm = '';
let itemToDelete = null;
let imageFile = null;

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('📋 Menu Management initializing...');
    
    // Check authentication
    checkAuth();
    
    // Set admin name
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
    
    // Initialize menu database if needed
    initializeMenuDB();
    
    // Load menu items
    loadMenuItems();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load notifications count
    loadNotificationCount();
});

// ============================================
// CHECK AUTHENTICATION
// ============================================
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

// ============================================
// INITIALIZE MENU DATABASE
// ============================================
function initializeMenuDB() {
    // Check if MenuDB exists
    if (typeof MenuDB === 'undefined') {
        console.log('Creating MenuDB...');
        
        // Create MenuDB if it doesn't exist
        window.MenuDB = {
            items: [],
            
            getAll() {
                return this.items;
            },
            
            getById(id) {
                return this.items.find(item => item.id == id);
            },
            
            getByCategory(category) {
                if (category === 'all') return this.items;
                return this.items.filter(item => item.category === category);
            },
            
            getAvailable() {
                return this.items.filter(item => item.status === 'available' && item.stock > 0);
            },
            
            getLowStock() {
                return this.items.filter(item => item.stock < 5 && item.stock > 0);
            },
            
            getOutOfStock() {
                return this.items.filter(item => item.stock === 0 || item.status === 'out_of_stock');
            },
            
            add(item) {
                item.id = this.generateId();
                this.items.push(item);
                this.saveToStorage();
                return item;
            },
            
            update(id, updates) {
                const index = this.items.findIndex(item => item.id == id);
                if (index !== -1) {
                    this.items[index] = { ...this.items[index], ...updates };
                    this.saveToStorage();
                    return this.items[index];
                }
                return null;
            },
            
            delete(id) {
                const index = this.items.findIndex(item => item.id == id);
                if (index !== -1) {
                    this.items.splice(index, 1);
                    this.saveToStorage();
                    return true;
                }
                return false;
            },
            
            generateId() {
                return Date.now() + Math.floor(Math.random() * 1000);
            },
            
            saveToStorage() {
                localStorage.setItem('markanMenu', JSON.stringify(this.items));
                console.log('💾 Menu saved to localStorage');
            },
            
            loadFromStorage() {
                const saved = localStorage.getItem('markanMenu');
                if (saved) {
                    try {
                        this.items = JSON.parse(saved);
                        console.log('✅ Menu loaded from localStorage:', this.items.length, 'items');
                    } catch (e) {
                        console.error('Error loading menu:', e);
                        this.items = [];
                    }
                } else {
                    // Create sample data if no menu exists
                    this.createSampleData();
                }
            },
            
            createSampleData() {
                this.items = [
                    {
                        id: 1,
                        name: 'Ethiopian Coffee',
                        description: 'Traditional Ethiopian coffee ceremony',
                        price: 50,
                        category: 'beverages',
                        image: 'assets/images/coffee.jpg',
                        stock: 100,
                        status: 'available',
                        popular: true,
                        ethiopian: true,
                        vegetarian: true,
                        vegan: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: 'Doro Wat',
                        description: 'Spicy Ethiopian chicken stew',
                        price: 180,
                        category: 'meals',
                        image: 'assets/images/doro-wat.jpg',
                        stock: 50,
                        status: 'available',
                        popular: true,
                        ethiopian: true,
                        vegetarian: false,
                        vegan: false,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 3,
                        name: 'Shiro Wat',
                        description: 'Chickpea stew, vegan friendly',
                        price: 120,
                        category: 'meals',
                        image: 'assets/images/shiro.jpg',
                        stock: 30,
                        status: 'available',
                        popular: true,
                        ethiopian: true,
                        vegetarian: true,
                        vegan: true,
                        createdAt: new Date().toISOString()
                    },
                    {
                        id: 4,
                        name: 'Sambusa',
                        description: 'Fried pastry with lentil filling',
                        price: 25,
                        category: 'snacks',
                        image: 'assets/images/sambusa.jpg',
                        stock: 8,
                        status: 'available',
                        popular: true,
                        ethiopian: true,
                        vegetarian: true,
                        vegan: true,
                        createdAt: new Date().toISOString()
                    }
                ];
                this.saveToStorage();
                console.log('✅ Sample menu created');
            }
        };
        
        // Load data from localStorage
        MenuDB.loadFromStorage();
    }
}

// ============================================
// SETUP EVENT LISTENERS
// ============================================
function setupEventListeners() {
    // Search input
    document.getElementById('searchMenu')?.addEventListener('input', function(e) {
        currentSearchTerm = e.target.value.toLowerCase();
        filterAndDisplayItems();
    });
    
    // Category filter
    document.getElementById('categoryFilter')?.addEventListener('change', function(e) {
        currentCategory = e.target.value;
        filterAndDisplayItems();
    });
    
    // Image preview
    document.getElementById('itemImage')?.addEventListener('change', handleImagePreview);
    
    // Logout button
    document.getElementById('logoutBtn')?.addEventListener('click', function(e) {
        e.preventDefault();
        Auth.logout();
    });
}

// ============================================
// LOAD MENU ITEMS
// ============================================
function loadMenuItems() {
    if (typeof MenuDB !== 'undefined') {
        menuItems = MenuDB.getAll() || [];
        console.log('📊 Loaded', menuItems.length, 'menu items');
    } else {
        menuItems = [];
    }
    
    updateStats();
    filterAndDisplayItems();
}

// ============================================
// UPDATE STATS CARDS
// ============================================
function updateStats() {
    const totalItems = menuItems.length;
    const availableItems = menuItems.filter(item => 
        item.status === 'available' && item.stock > 0
    ).length;
    const lowStockItems = menuItems.filter(item => 
        item.stock < 5 && item.stock > 0
    ).length;
    const outOfStockItems = menuItems.filter(item => 
        item.stock === 0 || item.status === 'out_of_stock'
    ).length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('availableItems').textContent = availableItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('outOfStockItems').textContent = outOfStockItems;
    document.getElementById('lowStockBadge').textContent = lowStockItems;
}

// ============================================
// FILTER AND DISPLAY ITEMS
// ============================================
function filterAndDisplayItems() {
    let filtered = [...menuItems];
    
    // Apply filter
    switch(currentFilter) {
        case 'available':
            filtered = filtered.filter(item => item.status === 'available' && item.stock > 0);
            break;
        case 'lowstock':
            filtered = filtered.filter(item => item.stock < 5 && item.stock > 0);
            break;
        case 'outofstock':
            filtered = filtered.filter(item => item.stock === 0 || item.status === 'out_of_stock');
            break;
    }
    
    // Apply category filter
    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    // Apply search
    if (currentSearchTerm) {
        filtered = filtered.filter(item => 
            item.name?.toLowerCase().includes(currentSearchTerm) ||
            item.description?.toLowerCase().includes(currentSearchTerm)
        );
    }
    
    displayMenuItems(filtered);
}

// ============================================
// DISPLAY MENU ITEMS IN GRID
// ============================================
function displayMenuItems(items) {
    const grid = document.getElementById('menuItemsGrid');
    
    if (items.length === 0) {
        grid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>No Menu Items Found</h3>
                <p>${menuItems.length === 0 ? 'Add your first menu item to get started' : 'No items match your filters'}</p>
                ${menuItems.length === 0 ? `
                    <button class="btn btn-primary" onclick="openAddModal()">
                        <i class="fas fa-plus"></i> Add First Item
                    </button>
                ` : ''}
            </div>
        `;
        return;
    }
    
    grid.innerHTML = items.map(item => `
        <div class="menu-item-card">
            <div class="menu-item-image" style="background-image: url('${item.image || '../../assets/images/placeholder-food.jpg'}')">
                ${item.popular ? '<span class="menu-item-badge badge-popular">Popular</span>' : ''}
                ${item.ethiopian ? '<span class="menu-item-badge badge-ethiopian">Ethiopian</span>' : ''}
                <span class="stock-badge ${item.stock < 5 ? 'stock-low' : ''} ${item.stock === 0 ? 'stock-out' : ''}">
                    <i class="fas fa-box"></i> ${item.stock} left
                </span>
            </div>
            <div class="menu-item-content">
                <div class="menu-item-header">
                    <h3 class="menu-item-name">${item.name}</h3>
                    <span class="menu-item-price">${item.price} ETB</span>
                </div>
                <span class="menu-item-category">${item.category}</span>
                <p class="menu-item-description">${item.description || 'No description'}</p>
                <div class="menu-item-footer">
                    <div class="menu-item-stock">
                        <i class="fas ${item.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}" 
                           style="color: ${item.stock > 0 ? '#2e7d32' : '#d32f2f'}"></i>
                        ${item.status === 'available' && item.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </div>
                    <div class="menu-item-actions">
                        <button class="action-btn edit-btn" onclick="openEditModal(${item.id})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="openDeleteModal(${item.id})" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                        <button class="action-btn view-btn" onclick="viewItem(${item.id})" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// FILTER FUNCTIONS
// ============================================
function filterItems(filter) {
    currentFilter = filter;
    
    // Update active button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    filterAndDisplayItems();
}

function filterLowStock() {
    filterItems('lowstock');
}

// ============================================
// MODAL FUNCTIONS - ADD/EDIT
// ============================================
function openAddModal() {
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('imagePreview').style.backgroundImage = '';
    imageFile = null;
    
    document.getElementById('itemModal').classList.add('active');
}

function openEditModal(id) {
    const item = menuItems.find(i => i.id == id);
    if (!item) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemId').value = item.id;
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemCategory').value = item.category || 'beverages';
    document.getElementById('itemPrice').value = item.price || 0;
    document.getElementById('itemStock').value = item.stock || 0;
    document.getElementById('itemStatus').value = item.status || 'available';
    document.getElementById('itemDescription').value = item.description || '';
    
    if (item.image) {
        document.getElementById('imagePreview').style.backgroundImage = `url('${item.image}')`;
    } else {
        document.getElementById('imagePreview').style.backgroundImage = '';
    }
    
    imageFile = null;
    document.getElementById('itemModal').classList.add('active');
}

function closeModal() {
    document.getElementById('itemModal').classList.remove('active');
}

// ============================================
// IMAGE HANDLING
// ============================================
function handleImagePreview(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        showNotification('Image size should be less than 2MB', 'error');
        e.target.value = '';
        return;
    }
    
    // Check file type
    if (!file.type.startsWith('image/')) {
        showNotification('Please select an image file', 'error');
        e.target.value = '';
        return;
    }
    
    imageFile = file;
    
    // Preview image
    const reader = new FileReader();
    reader.onload = function(e) {
        document.getElementById('imagePreview').style.backgroundImage = `url('${e.target.result}')`;
    };
    reader.readAsDataURL(file);
}

// ============================================
// SAVE ITEM (CREATE/UPDATE)
// ============================================
function saveItem() {
    // Get form values
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const stock = parseInt(document.getElementById('itemStock').value);
    const status = document.getElementById('itemStatus').value;
    const description = document.getElementById('itemDescription').value.trim();
    const id = document.getElementById('itemId').value;
    
    // Validation
    if (!name) {
        showNotification('Item name is required', 'error');
        return;
    }
    
    if (!price || price <= 0) {
        showNotification('Please enter a valid price', 'error');
        return;
    }
    
    if (stock < 0) {
        showNotification('Stock cannot be negative', 'error');
        return;
    }
    
    // Determine final status based on stock
    let finalStatus = status;
    if (stock === 0) {
        finalStatus = 'out_of_stock';
    } else if (stock > 0 && status === 'out_of_stock') {
        finalStatus = 'available';
    }
    
    // Create item object
    const itemData = {
        name: name,
        category: category,
        price: price,
        stock: stock,
        status: finalStatus,
        description: description,
        updatedAt: new Date().toISOString()
    };
    
    // Handle image
    if (imageFile) {
        // In a real app, you'd upload to server
        // For demo, we'll create a data URL
        const reader = new FileReader();
        reader.onload = function(e) {
            itemData.image = e.target.result;
            saveItemToDB(itemData, id);
        };
        reader.readAsDataURL(imageFile);
    } else {
        // No new image, keep existing
        if (id) {
            const existing = menuItems.find(i => i.id == id);
            if (existing && existing.image) {
                itemData.image = existing.image;
            }
        }
        saveItemToDB(itemData, id);
    }
}

function saveItemToDB(itemData, id) {
    if (id) {
        // Update existing item
        const updated = MenuDB.update(id, itemData);
        if (updated) {
            showNotification('Item updated successfully', 'success');
        }
    } else {
        // Add new item
        itemData.createdAt = new Date().toISOString();
        itemData.popular = false;
        itemData.ethiopian = false;
        itemData.vegetarian = false;
        itemData.vegan = false;
        
        const newItem = MenuDB.add(itemData);
        if (newItem) {
            showNotification('Item added successfully', 'success');
        }
    }
    
    // Reload items
    loadMenuItems();
    closeModal();
}

// ============================================
// DELETE FUNCTIONS
// ============================================
function openDeleteModal(id) {
    itemToDelete = id;
    document.getElementById('deleteModal').classList.add('active');
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    itemToDelete = null;
}

function confirmDelete() {
    if (itemToDelete) {
        const deleted = MenuDB.delete(itemToDelete);
        if (deleted) {
            showNotification('Item deleted successfully', 'success');
            loadMenuItems();
        } else {
            showNotification('Failed to delete item', 'error');
        }
    }
    closeDeleteModal();
}

// ============================================
// VIEW ITEM DETAILS
// ============================================
function viewItem(id) {
    const item = menuItems.find(i => i.id == id);
    if (!item) return;
    
    // You could open a details modal here
    // For now, just show in console
    console.log('Item details:', item);
    showNotification(`Viewing ${item.name}`, 'info');
}

// ============================================
// LOAD NOTIFICATION COUNT
// ============================================
function loadNotificationCount() {
    // Get low stock count for badge
    const lowStock = menuItems.filter(item => item.stock < 5 && item.stock > 0).length;
    const outOfStock = menuItems.filter(item => item.stock === 0).length;
    
    const total = lowStock + outOfStock;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'block' : 'none';
    }
}

// ============================================
// NOTIFICATION FUNCTION
// ============================================
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
        <div class="notification-content">
            <p>${message}</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ============================================
// EXPORT FUNCTIONS TO GLOBAL SCOPE
// ============================================
window.openAddModal = openAddModal;
window.openEditModal = openEditModal;
window.closeModal = closeModal;
window.saveItem = saveItem;
window.filterItems = filterItems;
window.filterLowStock = filterLowStock;
window.openDeleteModal = openDeleteModal;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.viewItem = viewItem;
window.showNotification = showNotification;