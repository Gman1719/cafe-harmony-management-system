// data/reservations.js - Reservations Database
// Markan Cafe - Debre Birhan University

const reservationsDatabase = [
    {
        id: 'RES-1001',
        customerId: 2,
        customerName: 'John Customer',
        customerEmail: 'customer@markan.com',
        customerPhone: '+251922345678',
        guests: 4,
        date: '2025-02-25',
        time: '19:00',
        duration: 2,
        status: 'confirmed',
        specialRequests: 'Window table preferred, anniversary celebration',
        createdAt: '2025-02-18T10:30:00Z',
        updatedAt: '2025-02-18T14:20:00Z'
    },
    {
        id: 'RES-1002',
        customerId: 3,
        customerName: 'Abebech Tesfaye',
        customerEmail: 'abebech@example.com',
        customerPhone: '+251933456789',
        guests: 2,
        date: '2025-02-22',
        time: '18:30',
        duration: 1.5,
        status: 'confirmed',
        specialRequests: 'Vegetarian options, quiet corner',
        createdAt: '2025-02-19T09:15:00Z',
        updatedAt: '2025-02-19T11:45:00Z'
    },
    {
        id: 'RES-1003',
        customerId: 4,
        customerName: 'Kebede Alemu',
        customerEmail: 'kebede@example.com',
        customerPhone: '+251944567890',
        guests: 6,
        date: '2025-02-26',
        time: '20:00',
        duration: 2.5,
        status: 'pending',
        specialRequests: 'Birthday celebration, need cake arrangement',
        createdAt: '2025-02-20T11:45:00Z',
        updatedAt: null
    },
    {
        id: 'RES-1004',
        customerId: 2,
        customerName: 'John Customer',
        customerEmail: 'customer@markan.com',
        customerPhone: '+251922345678',
        guests: 3,
        date: '2025-02-21',
        time: '12:30',
        duration: 1,
        status: 'cancelled',
        specialRequests: 'Quick lunch',
        createdAt: '2025-02-15T14:20:00Z',
        updatedAt: '2025-02-16T10:00:00Z'
    },
    {
        id: 'RES-1005',
        customerId: 5,
        customerName: 'Tigist Haile',
        customerEmail: 'tigist@example.com',
        customerPhone: '+251955678901',
        guests: 2,
        date: '2025-02-23',
        time: '13:00',
        duration: 1.5,
        status: 'completed',
        specialRequests: 'Coffee ceremony experience',
        createdAt: '2025-02-10T16:30:00Z',
        updatedAt: '2025-02-23T15:00:00Z'
    }
];

// Initialize reservations in localStorage if not exists
if (!localStorage.getItem('markanReservations')) {
    localStorage.setItem('markanReservations', JSON.stringify(reservationsDatabase));
}

// Reservations database helper
const ReservationsDB = {
    // Get all reservations
    getAll: function() {
        const reservations = localStorage.getItem('markanReservations');
        return reservations ? JSON.parse(reservations) : reservationsDatabase;
    },
    
    // Get reservation by ID
    getById: function(id) {
        const reservations = this.getAll();
        return reservations.find(res => res.id === id);
    },
    
    // Get reservations by customer ID
    getByCustomerId: function(customerId) {
        const reservations = this.getAll();
        return reservations.filter(res => res.customerId === parseInt(customerId))
                    .sort((a, b) => new Date(a.date) - new Date(b.date));
    },
    
    // Add new reservation
    add: function(reservationData) {
        const reservations = this.getAll();
        const resCount = reservations.length + 1;
        const newReservation = {
            id: `RES-${1000 + resCount}`,
            ...reservationData,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: null
        };
        reservations.push(newReservation);
        localStorage.setItem('markanReservations', JSON.stringify(reservations));
        return newReservation;
    },
    
    // Update reservation status
    updateStatus: function(reservationId, status) {
        const reservations = this.getAll();
        const index = reservations.findIndex(res => res.id === reservationId);
        if (index !== -1) {
            reservations[index].status = status;
            reservations[index].updatedAt = new Date().toISOString();
            localStorage.setItem('markanReservations', JSON.stringify(reservations));
            return reservations[index];
        }
        return null;
    },
    
    // Update reservation
    update: function(reservationId, updates) {
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
    },
    
    // Delete reservation
    delete: function(reservationId) {
        const reservations = this.getAll();
        const filtered = reservations.filter(res => res.id !== reservationId);
        localStorage.setItem('markanReservations', JSON.stringify(filtered));
        return filtered;
    },
    
    // Get reservations by date
    getByDate: function(date) {
        const reservations = this.getAll();
        return reservations.filter(res => res.date === date);
    },
    
    // Get reservations by status
    getByStatus: function(status) {
        const reservations = this.getAll();
        if (status === 'all') return reservations;
        return reservations.filter(res => res.status === status);
    },
    
    // Get upcoming reservations
    getUpcoming: function(limit = 10) {
        const today = new Date().toISOString().split('T')[0];
        const reservations = this.getAll();
        return reservations.filter(res => res.date >= today && res.status !== 'cancelled')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .slice(0, limit);
    },
    
    // Get today's reservations
    getToday: function() {
        const today = new Date().toISOString().split('T')[0];
        return this.getByDate(today);
    },
    
    // Check availability
    checkAvailability: function(date, time, guests) {
        const reservations = this.getByDate(date);
        const requestedTime = parseInt(time.split(':')[0]);
        
        // Count reservations at the same time
        const sameTimeReservations = reservations.filter(res => {
            if (res.status === 'cancelled') return false;
            const resTime = parseInt(res.time.split(':')[0]);
            return Math.abs(resTime - requestedTime) < 2; // Within 2 hours
        });
        
        // Assume max capacity of 30 people per time slot
        const totalGuests = sameTimeReservations.reduce((sum, res) => sum + res.guests, 0);
        const available = (totalGuests + guests) <= 30;
        
        return {
            available,
            currentGuests: totalGuests,
            maxGuests: 30,
            remainingGuests: 30 - totalGuests
        };
    },
    
    // Get reservation count
    getCount: function() {
        return this.getAll().length;
    },
    
    // Get pending count
    getPendingCount: function() {
        return this.getByStatus('pending').length;
    }
};

// Make available globally
window.ReservationsDB = ReservationsDB;