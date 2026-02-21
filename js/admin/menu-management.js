// js/admin/menu-management.js - Admin Menu Management
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let menuItems = [];
let currentItemId = null;
let categories = ['all', 'beverages', 'meals', 'snacks', 'desserts'];

// Initialize menu management
document.addEventListener('DOMContentLoaded', function() {
    updateAdminName();
    loadMenuItems();
    setupEventListeners();
    loadCategories();
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

// Load menu items from localStorage
function loadMenuItems() {
    const stored = localStorage.getItem('markanMenu');
    if (stored) {
        menuItems = JSON.parse(stored);
    } else {
        // Default menu items if none exist
        menuItems = [
            { 
                id: 1, 
                name: 'Ethiopian Coffee', 
                category: 'beverages', 
                price: 4.50, 
                description: 'Traditional Ethiopian coffee ceremony style, served with popcorn',
                image: 'assets/images/menu/beverages/ethiopian-coffee.jpg',
                popular: true,
                inStock: true,
                ethiopian: true
            },
            { 
                id: 2, 
                name: 'Doro Wat', 
                category: 'meals', 
                price: 12.99, 
                description: 'Spicy Ethiopian chicken stew with hard-boiled eggs, served with injera',
                image: 'assets/images/menu/meals/doro-wat.jpg',
                popular: true,
                inStock: true,
                ethiopian: true
            },
            { 
                id: 3, 
                name: 'Sambusa', 
                category: 'snacks', 
                price: 3.50, 
                description: 'Fried pastry filled with lentils or meat, Ethiopian style',
                image: 'assets/images/menu/snacks/sambusa.jpg',
                popular: true,
                inStock: true,
                ethiopian: true
            }
        ];
        localStorage.setItem('markanMenu', JSON.stringify(menuItems));
    }
    
    displayMenuItems(menuItems);
}

// Display menu items in table
function displayMenuItems(items) {
    const tbody = document.getElementById('menuItemsTable');
    if (!tbody) return;
    
    if (items.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No menu items found</td></tr>';
        return;
    }
    
    tbody.innerHTML = items.map(item => `
        <tr>
            <td>
                <img src="${item.image || 'https://via.placeholder.com/50x50/8B4513/FFD700?text=Food'}" 
                     alt="${item.name}" 
                     style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;"
                     onerror="this.src='https://via.placeholder.com/50x50/8B4513/FFD700?text=Food'">
            </td>
            <td>${item.name} ${item.popular ? '<span style="background: #FFD700; color: #8B4513; padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; margin-left: 5px;">Popular</span>' : ''}</td>
            <td>${item.category}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.description.substring(0, 30)}${item.description.length > 30 ? '...' : ''}</td>
            <td><span class="status-badge ${item.inStock ? 'completed' : 'cancelled'}">${item.inStock ? 'In Stock' : 'Out of Stock'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit" onclick="editItem(${item.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Load categories for filter
function loadCategories() {
    const filterSelect = document.getElementById('categoryFilter');
    if (!filterSelect) return;
    
    filterSelect.innerHTML = categories.map(cat => `
        <option value="${cat}">${cat === 'all' ? 'All Categories' : cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
    `).join('');
}

// Open add item modal
window.openAddModal = function() {
    currentItemId = null;
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    document.getElementById('itemModal').classList.add('active');
};

// Edit item
window.editItem = function(id) {
    const item = menuItems.find(i => i.id === id);
    if (!item) return;

    currentItemId = id;
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemName').value = item.name || '';
    document.getElementById('itemCategory').value = item.category || 'beverages';
    document.getElementById('itemPrice').value = item.price || 0;
    document.getElementById('itemDescription').value = item.description || '';
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemPopular').checked = item.popular || false;
    document.getElementById('itemInStock').checked = item.inStock !== false;
    document.getElementById('itemId').value = item.id;
    
    document.getElementById('itemModal').classList.add('active');
};

// Save item (add or update)
window.saveItem = function() {
    // Get form values
    const name = document.getElementById('itemName')?.value;
    const category = document.getElementById('itemCategory')?.value;
    const price = parseFloat(document.getElementById('itemPrice')?.value);
    const description = document.getElementById('itemDescription')?.value;
    const image = document.getElementById('itemImage')?.value;
    const popular = document.getElementById('itemPopular')?.checked || false;
    const inStock = document.getElementById('itemInStock')?.checked !== false;

    // Validate
    if (!name || !category || !price || !description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    if (isNaN(price) || price <= 0) {
        showNotification('Please enter a valid price', 'error');
        return;
    }

    if (currentItemId) {
        // Update existing item
        const index = menuItems.findIndex(i => i.id === currentItemId);
        if (index !== -1) {
            menuItems[index] = {
                ...menuItems[index],
                name, category, price, description, image, popular, inStock
            };
            showNotification('Item updated successfully', 'success');
        }
    } else {
        // Add new item
        const newId = menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1;
        menuItems.push({
            id: newId,
            name, category, price, description, image, popular, inStock,
            ethiopian: category === 'meals' || category === 'beverages'
        });
        showNotification('Item added successfully', 'success');
    }

    // Save to localStorage
    localStorage.setItem('markanMenu', JSON.stringify(menuItems));
    
    // Refresh display
    displayMenuItems(menuItems);
    closeModal();
};

// Delete item
window.deleteItem = function(id) {
    currentItemId = id;
    document.getElementById('deleteModal').classList.add('active');
};

// Confirm delete
window.confirmDelete = function() {
    if (currentItemId) {
        menuItems = menuItems.filter(i => i.id !== currentItemId);
        localStorage.setItem('markanMenu', JSON.stringify(menuItems));
        displayMenuItems(menuItems);
        showNotification('Item deleted successfully', 'success');
        closeDeleteModal();
    }
};

// Close modals
window.closeModal = function() {
    document.getElementById('itemModal').classList.remove('active');
    currentItemId = null;
};

window.closeDeleteModal = function() {
    document.getElementById('deleteModal').classList.remove('active');
    currentItemId = null;
};

// Filter items by category
function filterByCategory() {
    const category = document.getElementById('categoryFilter')?.value || 'all';
    
    if (category === 'all') {
        displayMenuItems(menuItems);
    } else {
        const filtered = menuItems.filter(item => item.category === category);
        displayMenuItems(filtered);
    }
}

// Search items
function searchItems() {
    const searchTerm = document.getElementById('searchMenu')?.value.toLowerCase() || '';
    
    if (!searchTerm) {
        filterByCategory();
        return;
    }
    
    const filtered = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );
    
    displayMenuItems(filtered);
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchMenu');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(searchItems, 300));
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', filterByCategory);
    }
    
    // Add item button
    const addBtn = document.getElementById('addItemBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    // Item form submit
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveItem();
        });
    }
    
    // Delete confirmation button
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', confirmDelete);
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

// Debounce function for search
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
window.filterByCategory = filterByCategory;
window.searchItems = searchItems;