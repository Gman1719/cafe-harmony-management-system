// data/reservations.js - Reservations Database
// Markan Cafe - Debre Birhan University
// Complete reservation management for admin and customer panels

// Initialize empty reservations if not exists
if (!localStorage.getItem('markanReservations')) {
    localStorage.setItem('markanReservations', JSON.stringify([]));
    console.log('✅ Empty reservations initialized');
}

// Reservations database helper
const ReservationsDB = {
    // Get all reservations
    getAll: function() {
        try {
            return JSON.parse(localStorage.getItem('markanReservations')) || [];
        } catch (e) {
            console.error('Error parsing reservations:', e);
            return [];
        }
    },
    
    // Get reservation by ID
    getById: function(id) {
        const reservations = this.getAll();
        return reservations.find(res => res.id === id);
    },
    
    // Get reservations by customer ID
    getByCustomerId: function(customerId) {
        const reservations = this.getAll();
        return reservations.filter(res => res.customerId == customerId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    
    // Get reservations by status
    getByStatus: function(status) {
        const reservations = this.getAll();
        if (status === 'all') return reservations;
        return reservations.filter(res => res.status === status);
    },
    
    // Get reservations by date
    getByDate: function(date) {
        const reservations = this.getAll();
        return reservations.filter(res => res.date === date);
    },
    
    // Get reservations by date range
    getByDateRange: function(startDate, endDate) {
        const reservations = this.getAll();
        return reservations.filter(res => {
            const resDate = new Date(res.date);
            return resDate >= new Date(startDate) && resDate <= new Date(endDate);
        });
    },
    
    // Get upcoming reservations (future dates, not cancelled)
    getUpcoming: function(limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        const reservations = this.getAll();
        return reservations
            .filter(res => res.date >= today && res.status !== 'cancelled')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .slice(0, limit);
    },
    
    // Add new reservation
    add: function(reservationData) {
        try {
            const reservations = this.getAll();
            
            // Generate reservation ID
            const resId = 'RES-' + Date.now().toString().slice(-6) + 
                         Math.random().toString(36).substr(2, 3).toUpperCase();
            
            const newReservation = {
                id: resId,
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
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            reservations.push(newReservation);
            localStorage.setItem('markanReservations', JSON.stringify(reservations));
            return newReservation;
            
        } catch (error) {
            console.error('Error adding reservation:', error);
            return null;
        }
    },
    
    // Update reservation
    update: function(reservationId, updates) {
        try {
            const reservations = this.getAll();
            const index = reservations.findIndex(res => res.id === reservationId);
            
            if (index !== -1) {
                reservations[index] = { 
                    ...reservations[index], 
                    ...updates, 
                    updatedAt: new Date().toISOString() 
                };
                localStorage.setItem('markanReservations', JSON.stringify(reservations));
                return reservations[index];
            }
            return null;
            
        } catch (error) {
            console.error('Error updating reservation:', error);
            return null;
        }
    },
    
    // Update reservation status
    updateStatus: function(reservationId, status) {
        return this.update(reservationId, { status });
    },
    
    // Delete reservation
    delete: function(reservationId) {
        try {
            const reservations = this.getAll();
            const filtered = reservations.filter(res => res.id !== reservationId);
            localStorage.setItem('markanReservations', JSON.stringify(filtered));
            return true;
        } catch (error) {
            console.error('Error deleting reservation:', error);
            return false;
        }
    },
    
    // Check availability for a time slot
    checkAvailability: function(date, time, guests = 1) {
        const reservations = this.getAll();
        const sameSlot = reservations.filter(res => 
            res.date === date && 
            res.time === time && 
            res.status !== 'cancelled'
        );
        
        // Assume max 10 reservations per time slot
        return {
            available: sameSlot.length < 10,
            booked: sameSlot.length,
            remaining: 10 - sameSlot.length
        };
    },
    
    // Get reservation statistics
    getStats: function() {
        const reservations = this.getAll();
        const today = new Date().toISOString().split('T')[0];
        
        return {
            total: reservations.length,
            pending: reservations.filter(r => r.status === 'pending').length,
            confirmed: reservations.filter(r => r.status === 'confirmed').length,
            completed: reservations.filter(r => r.status === 'completed').length,
            cancelled: reservations.filter(r => r.status === 'cancelled').length,
            today: reservations.filter(r => r.date === today && r.status !== 'cancelled').length,
            upcoming: this.getUpcoming().length
        };
    },
    
    // Get customer reservation statistics
    getCustomerStats: function(customerId) {
        const reservations = this.getByCustomerId(customerId);
        const now = new Date();
        
        return {
            total: reservations.length,
            pending: reservations.filter(r => r.status === 'pending').length,
            confirmed: reservations.filter(r => r.status === 'confirmed').length,
            completed: reservations.filter(r => r.status === 'completed').length,
            cancelled: reservations.filter(r => r.status === 'cancelled').length,
            upcoming: reservations.filter(r => {
                if (r.status === 'cancelled') return false;
                const resDate = new Date(r.date + 'T' + r.time);
                return resDate > now;
            }).length
        };
    }
};

// Make available globally
window.ReservationsDB = ReservationsDB;

console.log('📁 Reservations database ready');