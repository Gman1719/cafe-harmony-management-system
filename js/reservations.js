// js/customer/reservations.js - Reservation Logic
// Markan Cafe - Debre Birhan University

let allReservations = [];

// Initialize reservations page
document.addEventListener('DOMContentLoaded', function() {
    loadReservations();
    setupDatePicker();
});

// Load reservations
function loadReservations() {
    const container = document.getElementById('reservationsGrid');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    // Get reservations from localStorage
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    allReservations = reservations.filter(r => r.customerId === user.id)
                                  .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    displayReservations(allReservations);
}

// Display reservations
function displayReservations(reservations) {
    const container = document.getElementById('reservationsGrid');
    if (!container) return;
    
    const upcoming = reservations.filter(r => new Date(r.date) >= new Date() && r.status !== 'cancelled');
    const past = reservations.filter(r => new Date(r.date) < new Date() || r.status === 'cancelled');
    
    let html = '';
    
    if (upcoming.length > 0) {
        html += '<h3>Upcoming Reservations</h3>';
        html += upcoming.map(res => `
            <div class="reservation-card">
                <div class="reservation-header">
                    <span class="reservation-id">${res.id}</span>
                    <span class="reservation-status ${res.status}">${res.status}</span>
                </div>
                <div class="reservation-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(res.date)} at ${res.time}</p>
                    <p><i class="fas fa-users"></i> ${res.guests} guest${res.guests > 1 ? 's' : ''}</p>
                    ${res.specialRequests ? `<p><i class="fas fa-comment"></i> ${res.specialRequests}</p>` : ''}
                </div>
                ${res.status === 'pending' || res.status === 'confirmed' ? `
                    <div class="reservation-actions">
                        <button class="btn-cancel-reservation" onclick="cancelReservation('${res.id}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }
    
    if (past.length > 0) {
        html += '<h3 style="margin-top: 2rem;">Past Reservations</h3>';
        html += past.map(res => `
            <div class="reservation-card" style="opacity: 0.7;">
                <div class="reservation-header">
                    <span class="reservation-id">${res.id}</span>
                    <span class="reservation-status ${res.status}">${res.status}</span>
                </div>
                <div class="reservation-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(res.date)} at ${res.time}</p>
                    <p><i class="fas fa-users"></i> ${res.guests} guest${res.guests > 1 ? 's' : ''}</p>
                </div>
            </div>
        `).join('');
    }
    
    if (upcoming.length === 0 && past.length === 0) {
        html = `
            <div class="no-reservations">
                <i class="fas fa-calendar-times"></i>
                <h3>No reservations found</h3>
                <p>You haven't made any reservations yet</p>
                <button class="btn-reserve" onclick="openReservationModal()">
                    Make a Reservation
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

// Make reservation
window.makeReservation = function() {
    // Get form values
    const name = document.getElementById('resName')?.value;
    const email = document.getElementById('resEmail')?.value;
    const phone = document.getElementById('resPhone')?.value;
    const guests = document.getElementById('resGuests')?.value;
    const date = document.getElementById('resDate')?.value;
    const time = document.getElementById('resTime')?.value;
    const duration = document.getElementById('resDuration')?.value || '1.5';
    const requests = document.getElementById('resRequests')?.value;

    // Validate
    if (!name || !email || !phone || !guests || !date || !time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification('Please enter a valid email address', 'error');
        return;
    }

    // Validate phone
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }

    // Validate date (must be today or future)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification('Please select a future date', 'error');
        return;
    }

    const user = Auth.getCurrentUser();
    if (!user) return;

    // Check availability (simple check)
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    const sameDateTime = reservations.filter(r => 
        r.date === date && 
        r.time === time && 
        r.status !== 'cancelled'
    );
    
    // Assume max 10 reservations per time slot
    if (sameDateTime.length >= 10) {
        showNotification('Sorry, this time slot is fully booked. Please choose another time.', 'error');
        return;
    }

    // Create reservation
    const newReservation = {
        id: 'RES-' + Date.now().toString().slice(-4),
        customerId: user.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        guests: parseInt(guests),
        date: date,
        time: time,
        duration: parseFloat(duration),
        specialRequests: requests || '',
        status: 'pending',
        createdAt: new Date().toISOString()
    };

    reservations.push(newReservation);
    localStorage.setItem('markanReservations', JSON.stringify(reservations));

    showNotification('Reservation request sent successfully! We\'ll confirm shortly.', 'success');
    
    // Reset form and close modal
    document.getElementById('reservationForm').reset();
    closeReservationModal();
    
    // Reload reservations
    loadReservations();
};

// Cancel reservation
window.cancelReservation = function(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    const index = reservations.findIndex(r => r.id === reservationId);
    
    if (index !== -1) {
        reservations[index].status = 'cancelled';
        reservations[index].updatedAt = new Date().toISOString();
        localStorage.setItem('markanReservations', JSON.stringify(reservations));
        
        showNotification('Reservation cancelled', 'success');
        loadReservations();
    }
};

// Setup date picker with min date = today
function setupDatePicker() {
    const dateInput = document.getElementById('resDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Open reservation modal (called from HTML)
window.openReservationModal = function() {
    const modal = document.getElementById('reservationModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
};

// Close reservation modal (called from HTML)
window.closeReservationModal = function() {
    const modal = document.getElementById('reservationModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};