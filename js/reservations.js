// js/reservations.js - Shared Reservations Database
// Markan Cafe - Debre Birhan University
// This file is shared between homepage and customer dashboard

// ============================================
// RESERVATIONS DATABASE MANAGER
// ============================================

const ReservationsDB = {
    // Storage key
    STORAGE_KEY: 'markanReservations',
    
    // Data
    reservations: [],
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    init() {
        console.log('📁 Initializing ReservationsDB...');
        this.loadFromStorage();
        console.log('✅ ReservationsDB ready with', this.reservations.length, 'reservations');
        return this.reservations;
    },
    
    // ========================================
    // DATA OPERATIONS
    // ========================================
    
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                this.reservations = JSON.parse(saved);
                console.log('✅ Reservations loaded from localStorage');
            } else {
                this.reservations = [];
                this.createSampleReservations();
            }
        } catch (e) {
            console.error('❌ Error loading reservations:', e);
            this.reservations = [];
        }
    },
    
    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.reservations));
            console.log('💾 Reservations saved to localStorage');
            return true;
        } catch (e) {
            console.error('❌ Error saving reservations:', e);
            return false;
        }
    },
    
    // ========================================
    // SAMPLE DATA (for testing)
    // ========================================
    
    createSampleReservations() {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        
        const formatDate = (date) => date.toISOString().split('T')[0];
        
        this.reservations = [
            {
                id: 'RES-123456-ABC',
                customerId: 2,
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                customerPhone: '0912345678',
                guests: 4,
                date: formatDate(today),
                time: '19:00',
                duration: 2,
                status: 'confirmed',
                specialRequests: 'Window table, anniversary celebration',
                createdAt: new Date(today.setHours(10, 30)).toISOString()
            },
            {
                id: 'RES-123457-DEF',
                customerId: 3,
                customerName: 'Sarah Smith',
                customerEmail: 'sarah@example.com',
                customerPhone: '0923456789',
                guests: 2,
                date: formatDate(today),
                time: '20:30',
                duration: 1.5,
                status: 'pending',
                specialRequests: 'Vegetarian options',
                createdAt: new Date(today.setHours(14, 15)).toISOString()
            },
            {
                id: 'RES-123458-GHI',
                customerId: 4,
                customerName: 'Mike Johnson',
                customerEmail: 'mike@example.com',
                customerPhone: '0934567890',
                guests: 6,
                date: formatDate(tomorrow),
                time: '18:30',
                duration: 2.5,
                status: 'confirmed',
                specialRequests: 'Birthday celebration, need cake',
                createdAt: new Date(tomorrow.setHours(9, 45)).toISOString()
            }
        ];
        this.saveToStorage();
        console.log('✅ Sample reservations created');
    },
    
    // ========================================
    // GET METHODS
    // ========================================
    
    getAll() {
        return this.reservations;
    },
    
    getById(id) {
        return this.reservations.find(res => res.id === id);
    },
    
    getByDate(date) {
        return this.reservations.filter(res => res.date === date);
    },
    
    getByCustomerId(customerId) {
        return this.reservations.filter(res => res.customerId == customerId);
    },
    
    getByStatus(status) {
        if (status === 'all') return this.reservations;
        return this.reservations.filter(res => res.status === status);
    },
    
    getUpcoming(limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        return this.reservations
            .filter(res => res.date >= today && res.status !== 'cancelled' && res.status !== 'completed')
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
            .slice(0, limit);
    },
    
    // ========================================
    // ADD METHODS
    // ========================================
    
    generateId() {
        return 'RES-' + Date.now().toString().slice(-6) + '-' + 
               Math.random().toString(36).substr(2, 4).toUpperCase();
    },
    
    add(reservationData) {
        try {
            const newReservation = {
                id: this.generateId(),
                customerId: reservationData.customerId || null,
                customerName: reservationData.customerName,
                customerEmail: reservationData.customerEmail,
                customerPhone: reservationData.customerPhone,
                guests: parseInt(reservationData.guests) || 1,
                date: reservationData.date,
                time: reservationData.time,
                duration: parseFloat(reservationData.duration) || 2,
                status: reservationData.status || 'pending',
                specialRequests: reservationData.specialRequests || '',
                createdAt: new Date().toISOString()
            };
            
            this.reservations.push(newReservation);
            this.saveToStorage();
            return newReservation;
            
        } catch (error) {
            console.error('❌ Error adding reservation:', error);
            return null;
        }
    },
    
    // ========================================
    // UPDATE METHODS
    // ========================================
    
    update(id, updates) {
        try {
            const index = this.reservations.findIndex(res => res.id === id);
            if (index === -1) return null;
            
            this.reservations[index] = {
                ...this.reservations[index],
                ...updates
            };
            
            this.saveToStorage();
            return this.reservations[index];
            
        } catch (error) {
            console.error('❌ Error updating reservation:', error);
            return null;
        }
    },
    
    updateStatus(id, status) {
        return this.update(id, { status });
    },
    
    delete(id) {
        try {
            const index = this.reservations.findIndex(res => res.id === id);
            if (index === -1) return false;
            
            this.reservations.splice(index, 1);
            this.saveToStorage();
            return true;
            
        } catch (error) {
            console.error('❌ Error deleting reservation:', error);
            return false;
        }
    },
    
    // ========================================
    // AVAILABILITY CHECKING
    // ========================================
    
    checkAvailability(date, time, guests = 1) {
        const reservationsOnDate = this.getByDate(date);
        const sameSlot = reservationsOnDate.filter(res => 
            res.time === time && res.status !== 'cancelled'
        );
        
        const totalGuests = sameSlot.reduce((sum, res) => sum + (res.guests || 0), 0);
        const maxGuests = 20; // Maximum guests per time slot
        
        return {
            available: totalGuests + parseInt(guests) <= maxGuests,
            booked: sameSlot.length,
            totalGuests: totalGuests,
            remaining: Math.max(0, maxGuests - totalGuests),
            maxGuests: maxGuests
        };
    },
    
    // ========================================
    // STATISTICS
    // ========================================
    
    getStats() {
        return {
            total: this.reservations.length,
            pending: this.reservations.filter(r => r.status === 'pending').length,
            confirmed: this.reservations.filter(r => r.status === 'confirmed').length,
            completed: this.reservations.filter(r => r.status === 'completed').length,
            cancelled: this.reservations.filter(r => r.status === 'cancelled').length
        };
    },
    
    getCustomerStats(customerId) {
        const userReservations = this.getByCustomerId(customerId);
        const now = new Date();
        
        return {
            total: userReservations.length,
            pending: userReservations.filter(r => r.status === 'pending').length,
            confirmed: userReservations.filter(r => r.status === 'confirmed').length,
            completed: userReservations.filter(r => r.status === 'completed').length,
            cancelled: userReservations.filter(r => r.status === 'cancelled').length,
            upcoming: userReservations.filter(r => {
                if (r.status === 'cancelled' || r.status === 'completed') return false;
                const resDate = new Date(r.date + 'T' + r.time);
                return resDate > now;
            }).length
        };
    }
};

// ========================================
// AUTO-INITIALIZE
// ========================================

// Initialize when script loads
(function() {
    ReservationsDB.init();
    window.ReservationsDB = ReservationsDB;
    console.log('📁 ReservationsDB global ready');
})();