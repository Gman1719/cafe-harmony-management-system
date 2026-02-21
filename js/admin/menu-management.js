// js/admin/menu-management.js - Admin Menu Management
// Markan Cafe - Debre Birhan University

let menuItems = [];
let currentItemId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load menu items
    await loadMenuItems();
    
    // Load categories
    loadCategories();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadMenuItems() {
    const container = document.getElementById('menuItemsTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';
        
        menuItems = await API.menu.getAll();
        
        displayMenuItems(menuItems);
        
    } catch (error) {
        console.error('Failed to load menu items:', error);
        container.innerHTML = '<tr><td colspan="8">Failed to load menu items</td></tr>';
    }
}

function displayMenuItems(items) {
    const container = document.getElementById('menuItemsTable');
    if (!container) return;
    
    if (items.length === 0) {
        container.innerHTML = '<tr><td colspan="8">No menu items found</td></tr>';
        return;
    }
    
    container.innerHTML = items.map(item => `
        <tr>
            <td>
                <div class="item-image" style="background-image: url('${item.image || 'https://via.placeholder.com/50x50/8B4513/FFD700?text=Food'}')"></div>
            </td>
            <td>${item.name}</td>
            <td>${item.category}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>${item.description.substring(0, 30)}...</td>
            <td>
                ${item.popular ? '<span class="badge">Popular</span>' : ''}
                ${item.ethiopian ? '<span class="badge">Ethiopian</span>' : ''}
                ${item.vegetarian ? '<span class="badge">Veg</span>' : ''}
            </td>
            <td>${item.inStock ? '✓' : '✗'}</td>
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

function loadCategories() {
    const container = document.getElementById('categoryFilters');
    if (!container) return;
    
    const categories = ['all', 'beverages', 'meals', 'snacks', 'desserts'];
    
    container.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === 'all' ? 'active' : ''}" data-category="${cat}">
            ${cat.charAt(0).toUpperCase() + cat.slice(1)}
        </button>
    `).join('');
    
    // Add filter event listeners
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterItems(btn.dataset.category);
        });
    });
}

function filterItems(category) {
    if (category === 'all') {
        displayMenuItems(menuItems);
    } else {
        const filtered = menuItems.filter(item => item.category === category);
        displayMenuItems(filtered);
    }
}

window.searchItems = debounce(function() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput?.value.toLowerCase() || '';
    
    if (!searchTerm) {
        displayMenuItems(menuItems);
        return;
    }
    
    const filtered = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
    );
    
    displayMenuItems(filtered);
}, 300);

window.openAddModal = function() {
    currentItemId = null;
    document.getElementById('modalTitle').textContent = 'Add Menu Item';
    document.getElementById('itemForm').reset();
    document.getElementById('itemId').value = '';
    Modal.show('itemModal');
};

window.editItem = function(itemId) {
    const item = menuItems.find(i => i.id === itemId);
    if (!item) return;
    
    currentItemId = itemId;
    document.getElementById('modalTitle').textContent = 'Edit Menu Item';
    document.getElementById('itemName').value = item.name;
    document.getElementById('itemCategory').value = item.category;
    document.getElementById('itemPrice').value = item.price;
    document.getElementById('itemDescription').value = item.description;
    document.getElementById('itemImage').value = item.image || '';
    document.getElementById('itemPopular').checked = item.popular || false;
    document.getElementById('itemEthiopian').checked = item.ethiopian || false;
    document.getElementById('itemVegetarian').checked = item.vegetarian || false;
    document.getElementById('itemVegan').checked = item.vegan || false;
    document.getElementById('itemInStock').checked = item.inStock !== false;
    document.getElementById('itemId').value = item.id;
    
    Modal.show('itemModal');
};

window.saveItem = async function() {
    const form = document.getElementById('itemForm');
    
    // Validate form
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const itemData = {
        name: document.getElementById('itemName').value,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(document.getElementById('itemPrice').value),
        description: document.getElementById('itemDescription').value,
        image: document.getElementById('itemImage').value || `https://via.placeholder.com/300x200/8B4513/FFD700?text=${document.getElementById('itemName').value}`,
        popular: document.getElementById('itemPopular').checked,
        ethiopian: document.getElementById('itemEthiopian').checked,
        vegetarian: document.getElementById('itemVegetarian').checked,
        vegan: document.getElementById('itemVegan').checked,
        inStock: document.getElementById('itemInStock').checked
    };
    
    try {
        if (currentItemId) {
            // Update existing item
            await API.menu.update(currentItemId, itemData);
            showNotification('Item updated successfully', 'success');
        } else {
            // Add new item
            await API.menu.add(itemData);
            showNotification('Item added successfully', 'success');
        }
        
        Modal.hide('itemModal');
        await loadMenuItems(); // Reload items
        
    } catch (error) {
        console.error('Failed to save item:', error);
        showNotification('Failed to save item', 'error');
    }
};

window.deleteItem = function(itemId) {
    if (confirm('Are you sure you want to delete this item?')) {
        // Show delete confirmation modal
        currentItemId = itemId;
        Modal.show('deleteModal');
    }
};

window.confirmDelete = async function() {
    if (!currentItemId) return;
    
    try {
        await API.menu.delete(currentItemId);
        showNotification('Item deleted', 'success');
        await loadMenuItems(); // Reload items
        Modal.hide('deleteModal');
    } catch (error) {
        console.error('Failed to delete item:', error);
        showNotification('Failed to delete item', 'error');
    }
};

window.closeModal = function() {
    Modal.hide('itemModal');
};

window.closeDeleteModal = function() {
    Modal.hide('deleteModal');
};

function setupEventListeners() {
    // Add item button
    const addBtn = document.getElementById('addItemBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddModal);
    }
    
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', searchItems);
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
            Modal.hide(btn.closest('.modal').id);
        });
    });
}