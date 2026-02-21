// js/customer/reservations.js - Reservation Logic
// Markan Cafe - Debre Birhan University

let allReservations = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Load reservations
    await loadReservations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Setup date picker with min date = today
    const dateInput = document.getElementById('resDate');
    if (dateInput) {
        const today = new Date().toISOString().split('T')[0];
        dateInput.min = today;
    }
});

async function loadReservations() {
    const container = document.getElementById('reservationsGrid');
    if (!container) return;
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    try {
        container.innerHTML = '<div class="spinner"></div>';
        
        allReservations = await API.reservations.getByCustomerId(user.id);
        
        displayReservations(allReservations);
        
    } catch (error) {
        console.error('Failed to load reservations:', error);
        container.innerHTML = '<p class="error">Failed to load reservations</p>';
    }
}

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
                    <p><i class="fas fa-calendar"></i> ${formatDateOnly(res.date)} at ${res.time}</p>
                    <p><i class="fas fa-users"></i> ${res.guests} guest${res.guests > 1 ? 's' : ''}</p>
                    ${res.specialRequests ? `<p><i class="fas fa-comment"></i> ${res.specialRequests}</p>` : ''}
                </div>
                <div class="reservation-actions">
                    ${res.status === 'pending' || res.status === 'confirmed' ? `
                        <button class="btn btn-danger btn-small" onclick="cancelReservation('${res.id}')">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }
    
    if (past.length > 0) {
        html += '<h3>Past Reservations</h3>';
        html += past.map(res => `
            <div class="reservation-card past">
                <div class="reservation-header">
                    <span class="reservation-id">${res.id}</span>
                    <span class="reservation-status ${res.status}">${res.status}</span>
                </div>
                <div class="reservation-details">
                    <p><i class="fas fa-calendar"></i> ${formatDateOnly(res.date)} at ${res.time}</p>
                    <p><i class="fas fa-users"></i> ${res.guests} guest${res.guests > 1 ? 's' : ''}</p>
                </div>
            </div>
        `).join('');
    }
    
    if (upcoming.length === 0 && past.length === 0) {
        html = `
            <div class="no-results">
                <i class="fas fa-calendar-times"></i>
                <h3>No reservations found</h3>
                <p>You haven't made any reservations yet</p>
                <button class="btn btn-primary" onclick="showNewReservationForm()">
                    Make a Reservation
                </button>
            </div>
        `;
    }
    
    container.innerHTML = html;
}

window.showNewReservationForm = function() {
    document.getElementById('newReservationForm').style.display = 'block';
    document.getElementById('existingReservations').style.display = 'none';
};

window.hideNewReservationForm = function() {
    document.getElementById('newReservationForm').style.display = 'none';
    document.getElementById('existingReservations').style.display = 'block';
};

window.makeReservation = async function() {
    const form = document.getElementById('reservationForm');
    
    // Validate form
    const name = document.getElementById('resName')?.value;
    const email = document.getElementById('resEmail')?.value;
    const phone = document.getElementById('resPhone')?.value;
    const guests = document.getElementById('resGuests')?.value;
    const date = document.getElementById('resDate')?.value;
    const time = document.getElementById('resTime')?.value;
    const requests = document.getElementById('resRequests')?.value;
    
    if (!name || !email || !phone || !guests || !date || !time) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    // Validate phone
    if (!validateEthiopianPhone(phone)) {
        showNotification('Please enter a valid Ethiopian phone number', 'error');
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
    
    const reservationData = {
        customerId: user.id,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        guests: parseInt(guests),
        date,
        time,
        duration: document.getElementById('resDuration')?.value || 2,
        specialRequests: requests || ''
    };
    
    try {
        // Check availability
        const availability = await API.reservations.checkAvailability(date, time, guests);
        
        if (!availability.available) {
            showNotification('Sorry, this time slot is not available. Please choose another time.', 'error');
            return;
        }
        
        // Create reservation
        await API.reservations.create(reservationData);
        
        showNotification('Reservation request sent successfully! We\'ll confirm shortly.', 'success');
        
        // Reset form and hide
        form.reset();
        hideNewReservationForm();
        
        // Reload reservations
        await loadReservations();
        
    } catch (error) {
        console.error('Failed to make reservation:', error);
        showNotification('Failed to make reservation. Please try again.', 'error');
    }
};

window.cancelReservation = async function(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) return;
    
    try {
        await API.reservations.updateStatus(reservationId, 'cancelled');
        showNotification('Reservation cancelled', 'success');
        await loadReservations(); // Reload reservations
    } catch (error) {
        console.error('Failed to cancel reservation:', error);
        showNotification('Failed to cancel reservation', 'error');
    }
};

function setupEventListeners() {
    // New reservation button
    const newResBtn = document.getElementById('newReservationBtn');
    if (newResBtn) {
        newResBtn.addEventListener('click', showNewReservationForm);
    }
    
    // Cancel new reservation button
    const cancelBtn = document.getElementById('cancelNewReservation');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideNewReservationForm);
    }
    
    // Submit reservation button
    const submitBtn = document.getElementById('submitReservation');
    if (submitBtn) {
        submitBtn.addEventListener('click', makeReservation);
    }
}