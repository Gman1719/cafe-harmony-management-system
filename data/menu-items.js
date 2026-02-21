// data/menu-items.js - Menu Database
// Markan Cafe - Debre Birhan University

const menuDatabase = [
    // Ethiopian Coffee & Beverages
    {
        id: 1,
        name: 'Ethiopian Coffee',
        description: 'Traditional Ethiopian coffee ceremony style, served with popcorn',
        price: 4.50,
        category: 'beverages',
        image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=300',
        rating: 4.9,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 2,
        name: 'Macchiato',
        description: 'Espresso with a dash of steamed milk - Italian style',
        price: 3.75,
        category: 'beverages',
        image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=300',
        rating: 4.7,
        popular: true,
        inStock: true,
        ethiopian: false
    },
    {
        id: 3,
        name: 'Spiced Tea (Shai)',
        description: 'Traditional Ethiopian spiced tea with cinnamon and cardamom',
        price: 3.25,
        category: 'beverages',
        image: 'https://images.unsplash.com/photo-1594631252845-29fc4cc8cde9?w=300',
        rating: 4.6,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 4,
        name: 'Fresh Orange Juice',
        description: 'Freshly squeezed Ethiopian oranges',
        price: 4.00,
        category: 'beverages',
        image: 'https://images.unsplash.com/photo-1613478225719-9c25d6b8f3d2?w=300',
        rating: 4.5,
        popular: false,
        inStock: true,
        ethiopian: true
    },
    
    // Ethiopian Dishes
    {
        id: 5,
        name: 'Doro Wat',
        description: 'Spicy Ethiopian chicken stew with hard-boiled eggs, served with injera',
        price: 12.99,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.9,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 6,
        name: 'Kitfo',
        description: 'Minced raw beef seasoned with mitmita and niter kibbeh, served with ayib',
        price: 14.50,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.8,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 7,
        name: 'Tibs',
        description: 'Sautéed meat with onions, peppers, and traditional spices',
        price: 13.50,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.7,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 8,
        name: 'Shiro Wat',
        description: 'Chickpea stew with berbere spice, vegan-friendly',
        price: 8.99,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.6,
        popular: true,
        inStock: true,
        ethiopian: true,
        vegetarian: true
    },
    {
        id: 9,
        name: 'Misir Wat',
        description: 'Red lentil stew with berbere spice, vegan-friendly',
        price: 8.99,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.5,
        popular: false,
        inStock: true,
        ethiopian: true,
        vegetarian: true
    },
    {
        id: 10,
        name: 'Gomen',
        description: 'Sautéed collard greens with garlic and ginger, vegan-friendly',
        price: 7.99,
        category: 'meals',
        image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=300',
        rating: 4.4,
        popular: false,
        inStock: true,
        ethiopian: true,
        vegetarian: true
    },
    
    // Snacks & Sides
    {
        id: 11,
        name: 'Sambusa',
        description: 'Fried pastry filled with lentils or meat, Ethiopian style',
        price: 3.50,
        category: 'snacks',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
        rating: 4.7,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 12,
        name: 'Kolo',
        description: 'Roasted barley snack, traditional Ethiopian street food',
        price: 2.50,
        category: 'snacks',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
        rating: 4.3,
        popular: false,
        inStock: true,
        ethiopian: true,
        vegan: true
    },
    {
        id: 13,
        name: 'Injera with Ayib',
        description: 'Ethiopian flatbread with fresh cottage cheese',
        price: 5.99,
        category: 'snacks',
        image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=300',
        rating: 4.5,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    
    // Desserts
    {
        id: 14,
        name: 'Ethiopian Honey Bread',
        description: 'Traditional sweet bread made with honey and spices',
        price: 4.99,
        category: 'desserts',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300',
        rating: 4.6,
        popular: true,
        inStock: true,
        ethiopian: true
    },
    {
        id: 15,
        name: 'Baklava',
        description: 'Layered pastry with nuts and honey',
        price: 5.50,
        category: 'desserts',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300',
        rating: 4.7,
        popular: true,
        inStock: true,
        ethiopian: false
    },
    {
        id: 16,
        name: 'Fresh Fruit Platter',
        description: 'Assorted Ethiopian seasonal fruits',
        price: 6.50,
        category: 'desserts',
        image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=300',
        rating: 4.4,
        popular: false,
        inStock: true,
        ethiopian: true,
        vegan: true
    }
];

// Initialize menu items in localStorage if not exists
if (!localStorage.getItem('markanMenu')) {
    localStorage.setItem('markanMenu', JSON.stringify(menuDatabase));
}

// Menu database helper
const MenuDB = {
    // Get all menu items
    getAll: function() {
        const items = localStorage.getItem('markanMenu');
        return items ? JSON.parse(items) : menuDatabase;
    },
    
    // Get item by ID
    getById: function(id) {
        const items = this.getAll();
        return items.find(item => item.id === parseInt(id));
    },
    
    // Add new menu item
    add: function(item) {
        const items = this.getAll();
        const newId = Math.max(...items.map(i => i.id), 0) + 1;
        const newItem = {
            id: newId,
            rating: 0,
            inStock: true,
            ...item
        };
        items.push(newItem);
        localStorage.setItem('markanMenu', JSON.stringify(items));
        return newItem;
    },
    
    // Update menu item
    update: function(id, updates) {
        const items = this.getAll();
        const index = items.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            items[index] = { ...items[index], ...updates };
            localStorage.setItem('markanMenu', JSON.stringify(items));
            return items[index];
        }
        return null;
    },
    
    // Delete menu item
    delete: function(id) {
        const items = this.getAll();
        const filtered = items.filter(item => item.id !== parseInt(id));
        localStorage.setItem('markanMenu', JSON.stringify(filtered));
        return filtered;
    },
    
    // Get items by category
    getByCategory: function(category) {
        const items = this.getAll();
        if (category === 'all') return items;
        return items.filter(item => item.category === category);
    },
    
    // Search items
    search: function(query) {
        const items = this.getAll();
        const searchTerm = query.toLowerCase();
        return items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.description.toLowerCase().includes(searchTerm)
        );
    },
    
    // Get popular items
    getPopular: function(limit = 4) {
        const items = this.getAll();
        return items.filter(item => item.popular).slice(0, limit);
    },
    
    // Get Ethiopian items
    getEthiopian: function() {
        const items = this.getAll();
        return items.filter(item => item.ethiopian);
    },
    
    // Get vegetarian items
    getVegetarian: function() {
        const items = this.getAll();
        return items.filter(item => item.vegetarian || item.vegan);
    }
};

// Make available globally
window.MenuDB = MenuDB;