// admin/js/menu-management.js
// Markan Cafe Admin - Menu Management
// Full CRUD operations with localStorage - NO HARDCODED DATA

// ===== GLOBAL VARIABLES =====
let menuItems = [];
let filteredItems = [];
let currentItemId = null;
let currentImageFile = null;
let currentFilter = 'all';
let currentCategory = 'all';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load menu items
    loadMenuItems();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update admin name
    updateAdminName();
    
    // Check for URL parameters (e.g., filter=lowstock)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('filter') === 'lowstock') {
        filterLowStock();
    }
});

// ===== LOAD MENU ITEMS =====
function loadMenuItems() {
    try {
        // Get menu items from localStorage
        const stored = localStorage.getItem('markanMenu');
        menuItems = stored ? JSON.parse(stored) : [];
        
        // Reset filtered items
        filteredItems = [...menuItems];
        
        // Update UI
        updateStats();
        displayMenuItems(filteredItems);
        updateLowStockBadge();
        
    } catch (error) {
        console.error('Error loading menu items:', error);
        showNotification('Failed to load menu items', 'error');
        menuItems = [];
        displayMenuItems([]);
    }
}

// ===== SAVE MENU ITEMS =====
function saveMenuItems() {
    try {
        localStorage.setItem('markanMenu', JSON.stringify(menuItems));
        
        // Update stats and display
        updateStats();
        updateLowStockBadge();
        
        // Dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'markanMenu',
            newValue: JSON.stringify(menuItems)
        }));
        
    } catch (error) {
        console.error('Error saving menu items:', error);
        showNotification('Failed to save menu items', 'error');
    }
}

// ===== UPDATE STATISTICS =====
function updateStats() {
    const totalItems = menuItems.length;
    const availableItems = menuItems.filter(i => i.status === 'available').length;
    const lowStockItems = menuItems.filter(i => i.stock < 5 && i.stock > 0 && i.status === 'available').length;
    const outOfStockItems = menuItems.filter(i => i.stock === 0 || i.status === 'out_of_stock').length;
    
    document.getElementById('totalItems').textContent = totalItems;
    document.getElementById('availableItems').textContent = availableItems;
    document.getElementById('lowStockItems').textContent = lowStockItems;
    document.getElementById('outOfStockItems').textContent = outOfStockItems;
    document.getElementById('lowStockBadge').textContent = lowStockItems;
}

// ===== UPDATE LOW STOCK BADGE =====
function updateLowStockBadge() {
    const lowStockCount = menuItems.filter(i => i.stock < 5 && i.stock > 0 && i.status === 'available').length;
    document.getElementById('lowStockBadge').textContent = lowStockCount;
}

// ===== DISPLAY MENU ITEMS =====
function displayMenuItems(items) {
    const container = document.getElementById('menuItemsGrid');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = `
            <div class="no-items">
                <i class="fas fa-utensils"></i>
                <h3>No Menu Items</h3>
                <p>Click the "Add New Item" button to create your first menu item.</p>
                <button class="btn btn-primary" onclick="openAddModal()">
                    <i class="fas fa-plus"></i> Add First Item
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = items.map(item => {
        const isLowStock = item.stock < 5 && item.stock > 0 && item.status === 'available';
        const isOutOfStock = item.stock === 0 || item.status === 'out_of_stock';
        
        return `
            <div class="menu-card ${isLowStock ? 'low-stock' : ''} ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-id="${item.id}">
                <div class="menu-card-image">
                    <img src="${item.image || '../../assets/images/menu/default.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='https://via.placeholder.com/300x200/8B4513/FFD700?text=Food'">
                    ${isLowStock ? 
                        '<span class="stock-badge low">Low Stock</span>' : ''}
                    ${isOutOfStock ? 
                        '<span class="stock-badge out">Out of Stock</span>' : ''}
                </div>
                <div class="menu-card-content">
                    <div class="menu-card-header">
                        <h3>${item.name}</h3>
                        <span class="menu-price">${formatETB(item.price)}</span>
                    </div>
                    <p class="menu-description">${item.description || 'No description'}</p>
                    <div class="menu-meta">
                        <span class="menu-category">
                            <i class="fas fa-tag"></i> ${formatCategory(item.category)}
                        </span>
                        <span class="menu-stock">
                            <i class="fas fa-box"></i> Stock: ${item.stock || 0}
                        </span>
                    </div>
                    <div class="menu-card-actions">
                        <button class="action-btn edit" onclick="editItem('${item.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete" onclick="deleteItem('${item.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// ===== FORMAT CATEGORY =====
function formatCategory(category) {
    const categories = {
        'beverages': 'Beverages',
        'meals': 'Meals',
        'snacks': 'Snacks',
        'desserts': 'Desserts'
    };
    return categories[category] || category;
}

// ===== OPEN ADD MODAL =====
window.openAddModal = function() {
    currentItemId = null;
    currentImageFile = null;
    
    document.getElementById('modalTitle').textContent = 'Add New Menu Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('imagePreview').innerHTML = '';
    document.getElementById('itemStatus').value = 'available';
    document.getElementById('itemStock').value = '0';
    
    document.getElementById('itemModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== EDIT ITEM =====
window.editItem = function(id) {
    const item = menuItems.find(i => i.id == id);
    if (!item) return;

    currentItemId = id;
    currentImageFile = null;
    
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemCategory').value = item.category || 'beverages';
    document.getElementById('itemPrice').value = item.price || '';
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemStock').value = item.stock || 0;
    document.getElementById('itemStatus').value = item.status || 'available';
    document.getElementById('itemId').value = item.id;
    
    // Show image preview
    if (item.image) {
        document.getElementById('imagePreview').innerHTML = `
            <img src="${item.image}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 5px;">
        `;
    }
    
    document.getElementById('itemModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE MODAL =====
window.closeModal = function() {
    document.getElementById('itemModal').classList.remove('active');
    document.getElementById('itemForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    document.body.style.overflow = '';
    currentImageFile = null;
}

// ===== SAVE ITEM =====
window.saveItem = function() {
    // Get form values
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const price = parseFloat(document.getElementById('itemPrice').value);
    const description = document.getElementById('itemDescription').value.trim();
    const stock = parseInt(document.getElementById('itemStock').value) || 0;
    const status = document.getElementById('itemStatus').value;
    const imageFile = document.getElementById('itemImage').files[0];
    
    // Validate
    if (!name) {
        showNotification('Please enter item name', 'error');
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
    
    // Auto-set status based on stock
    let finalStatus = status;
    if (stock === 0) {
        finalStatus = 'out_of_stock';
    }
    
    // Handle image
    const processSave = (imageData) => {
        const itemData = {
            id: currentItemId || generateId(),
            name: name,
            category: category,
            price: price,
            description: description,
            stock: stock,
            status: finalStatus,
            image: imageData || getCurrentImage() || null,
            updatedAt: new Date().toISOString()
        };
        
        if (!currentItemId) {
            // Add new item
            itemData.createdAt = new Date().toISOString();
            menuItems.push(itemData);
            showNotification('Item added successfully', 'success');
        } else {
            // Update existing item
            const index = menuItems.findIndex(i => i.id == currentItemId);
            if (index !== -1) {
                // Preserve createdAt
                itemData.createdAt = menuItems[index].createdAt;
                menuItems[index] = itemData;
                showNotification('Item updated successfully', 'success');
            }
        }
        
        // Save to localStorage
        saveMenuItems();
        
        // Reload display
        filterItems(currentFilter, currentCategory);
        
        // Close modal
        closeModal();
    };
    
    if (imageFile) {
        // Convert image to base64
        const reader = new FileReader();
        reader.onload = (e) => {
            processSave(e.target.result);
        };
        reader.readAsDataURL(imageFile);
    } else {
        processSave(null);
    }
}

// ===== GET CURRENT IMAGE =====
function getCurrentImage() {
    const preview = document.getElementById('imagePreview').querySelector('img');
    return preview ? preview.src : null;
}

// ===== GENERATE UNIQUE ID =====
function generateId() {
    return 'M' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
}

// ===== DELETE ITEM =====
window.deleteItem = function(id) {
    currentItemId = id;
    document.getElementById('deleteModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE DELETE MODAL =====
window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.remove('active');
    document.body.style.overflow = '';
    currentItemId = null;
}

// ===== CONFIRM DELETE =====
window.confirmDelete = function() {
    if (currentItemId) {
        menuItems = menuItems.filter(i => i.id != currentItemId);
        saveMenuItems();
        
        // Reload display
        filterItems(currentFilter, currentCategory);
        
        showNotification('Item deleted successfully', 'success');
        closeDeleteModal();
    }
}

// ===== FILTER ITEMS =====
window.filterItems = function(filter, category) {
    currentFilter = filter || currentFilter;
    currentCategory = category || document.getElementById('categoryFilter')?.value || 'all';
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('onclick')?.includes(`'${currentFilter}'`)) {
            btn.classList.add('active');
        }
    });
    
    // Update category filter
    const categorySelect = document.getElementById('categoryFilter');
    if (categorySelect) {
        categorySelect.value = currentCategory;
    }
    
    // Apply filters
    let filtered = [...menuItems];
    
    // Apply category filter
    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    // Apply status filter
    switch(currentFilter) {
        case 'available':
            filtered = filtered.filter(item => item.status === 'available' && item.stock > 0);
            break;
        case 'lowstock':
            filtered = filtered.filter(item => item.stock < 5 && item.stock > 0 && item.status === 'available');
            break;
        case 'outofstock':
            filtered = filtered.filter(item => item.stock === 0 || item.status === 'out_of_stock');
            break;
        default:
            // 'all' - no additional filter
            break;
    }
    
    displayMenuItems(filtered);
}

// ===== FILTER LOW STOCK =====
window.filterLowStock = function() {
    currentFilter = 'lowstock';
    filterItems('lowstock', currentCategory);
}

// ===== SEARCH ITEMS =====
function searchItems(query) {
    const searchTerm = query.toLowerCase();
    
    let filtered = menuItems.filter(item => 
        item.name?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm)
    );
    
    // Apply current category filter
    if (currentCategory !== 'all') {
        filtered = filtered.filter(item => item.category === currentCategory);
    }
    
    // Apply current status filter
    switch(currentFilter) {
        case 'available':
            filtered = filtered.filter(item => item.status === 'available' && item.stock > 0);
            break;
        case 'lowstock':
            filtered = filtered.filter(item => item.stock < 5 && item.stock > 0 && item.status === 'available');
            break;
        case 'outofstock':
            filtered = filtered.filter(item => item.stock === 0 || item.status === 'out_of_stock');
            break;
        default:
            // 'all' - no additional filter
            break;
    }
    
    displayMenuItems(filtered);
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search
    document.getElementById('searchMenu')?.addEventListener('input', debounce(function(e) {
        searchItems(e.target.value);
    }, 300));
    
    // Category filter
    document.getElementById('categoryFilter')?.addEventListener('change', function(e) {
        currentCategory = e.target.value;
        filterItems(currentFilter, currentCategory);
    });
    
    // Image preview
    document.getElementById('itemImage')?.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                showNotification('Please select an image file', 'error');
                this.value = '';
                return;
            }
            
            // Validate file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                showNotification('Image size should be less than 2MB', 'error');
                this.value = '';
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                document.getElementById('imagePreview').innerHTML = `
                    <img src="${e.target.result}" alt="Preview" style="max-width: 100px; max-height: 100px; border-radius: 5px;">
                `;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // Stock change affects status
    document.getElementById('itemStock')?.addEventListener('input', function(e) {
        const stock = parseInt(e.target.value) || 0;
        const statusSelect = document.getElementById('itemStatus');
        
        if (stock === 0) {
            statusSelect.value = 'out_of_stock';
            statusSelect.disabled = true;
        } else {
            statusSelect.disabled = false;
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('itemModal').classList.contains('active')) {
                closeModal();
            }
            if (document.getElementById('deleteModal').classList.contains('active')) {
                closeDeleteModal();
            }
        }
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const itemModal = document.getElementById('itemModal');
        const deleteModal = document.getElementById('deleteModal');
        
        if (e.target === itemModal) {
            closeModal();
        }
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanMenu') {
            loadMenuItems();
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

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
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
window.openAddModal = openAddModal;
window.editItem = editItem;
window.closeModal = closeModal;
window.saveItem = saveItem;
window.deleteItem = deleteItem;
window.closeDeleteModal = closeDeleteModal;
window.confirmDelete = confirmDelete;
window.filterItems = filterItems;
window.filterLowStock = filterLowStock;