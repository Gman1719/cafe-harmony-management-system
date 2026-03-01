// data/menu-items.js - Menu Database
// Markan Cafe - Debre Birhan University
// Complete menu management for admin panel

// Initialize empty menu if not exists
if (!localStorage.getItem('markanMenu')) {
    localStorage.setItem('markanMenu', JSON.stringify([]));
    console.log('✅ Empty menu initialized');
}

// Menu database helper
const MenuDB = {
    // Get all menu items
    getAll: function() {
        try {
            return JSON.parse(localStorage.getItem('markanMenu')) || [];
        } catch (e) {
            console.error('Error parsing menu:', e);
            return [];
        }
    },
    
    // Get item by ID
    getById: function(id) {
        const items = this.getAll();
        return items.find(item => item.id == id);
    },
    
    // Get items by category
    getByCategory: function(category) {
        const items = this.getAll();
        if (category === 'all') return items;
        return items.filter(item => item.category === category);
    },
    
    // Get available items (status = 'available' AND stock > 0)
    getAvailable: function() {
        const items = this.getAll();
        return items.filter(item => item.status === 'available' && item.stock > 0);
    },
    
    // Get low stock items (stock < 5 AND > 0)
    getLowStock: function() {
        const items = this.getAll();
        return items.filter(item => item.stock < 5 && item.stock > 0 && item.status === 'available');
    },
    
    // Get out of stock items
    getOutOfStock: function() {
        const items = this.getAll();
        return items.filter(item => item.stock === 0 || item.status === 'out_of_stock');
    },
    
    // Add new menu item
    add: function(itemData) {
        try {
            const items = this.getAll();
            const newId = this.generateId();
            
            // Auto-set status based on stock
            const status = itemData.stock === 0 ? 'out_of_stock' : (itemData.status || 'available');
            
            const newItem = {
                id: newId,
                name: itemData.name,
                description: itemData.description || '',
                price: parseFloat(itemData.price) || 0,
                category: itemData.category || 'other',
                stock: parseInt(itemData.stock) || 0,
                status: status,
                image: itemData.image || null,
                popular: itemData.popular || false,
                ethiopian: itemData.ethiopian || false,
                vegetarian: itemData.vegetarian || false,
                vegan: itemData.vegan || false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            items.push(newItem);
            localStorage.setItem('markanMenu', JSON.stringify(items));
            return newItem;
            
        } catch (error) {
            console.error('Error adding menu item:', error);
            return null;
        }
    },
    
    // Update menu item
    update: function(id, updates) {
        try {
            const items = this.getAll();
            const index = items.findIndex(item => item.id == id);
            
            if (index !== -1) {
                // Auto-update status based on stock if stock is being updated
                if (updates.stock !== undefined) {
                    if (updates.stock === 0) {
                        updates.status = 'out_of_stock';
                    } else if (updates.stock > 0 && items[index].status === 'out_of_stock') {
                        updates.status = 'available';
                    }
                }
                
                items[index] = { 
                    ...items[index], 
                    ...updates, 
                    updatedAt: new Date().toISOString() 
                };
                
                localStorage.setItem('markanMenu', JSON.stringify(items));
                return items[index];
            }
            return null;
            
        } catch (error) {
            console.error('Error updating menu item:', error);
            return null;
        }
    },
    
    // Delete menu item
    delete: function(id) {
        try {
            const items = this.getAll();
            const filtered = items.filter(item => item.id != id);
            localStorage.setItem('markanMenu', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting menu item:', error);
            return false;
        }
    },
    
    // Reduce stock (when order is placed)
    reduceStock: function(itemId, quantity) {
        const items = this.getAll();
        const index = items.findIndex(item => item.id == itemId);
        
        if (index !== -1) {
            items[index].stock -= quantity;
            if (items[index].stock < 0) items[index].stock = 0;
            if (items[index].stock === 0) {
                items[index].status = 'out_of_stock';
            }
            localStorage.setItem('markanMenu', JSON.stringify(items));
            return items[index];
        }
        return null;
    },
    
    // Search items by name or description
    search: function(query) {
        const items = this.getAll();
        const searchTerm = query.toLowerCase();
        return items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    },
    
    // Generate unique ID
    generateId: function() {
        return 'M' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
    },
    
    // Get popular items (based on order count)
    getPopular: function(limit = 5) {
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        const items = this.getAll();
        
        // Count item occurrences in completed orders
        const itemCounts = {};
        orders.filter(o => o.status === 'completed').forEach(order => {
            order.items?.forEach(item => {
                const key = item.id;
                if (itemCounts[key]) {
                    itemCounts[key].count += item.quantity;
                } else {
                    itemCounts[key] = {
                        id: key,
                        count: item.quantity
                    };
                }
            });
        });
        
        // Sort by count and map to full item details
        return Object.values(itemCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, limit)
            .map(count => {
                const item = items.find(i => i.id == count.id);
                return item ? { ...item, orderCount: count.count } : null;
            })
            .filter(i => i);
    }
};

// Make available globally
window.MenuDB = MenuDB;

console.log('📁 Menu database ready');