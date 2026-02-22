// customer/js/reservations.js
// Markan Cafe - Customer Reservations Management

// Global variables
let allReservations = [];
let filteredReservations = [];
let currentTab = 'upcoming';

// Initialize reservations page
document.addEventListener('DOMContentLoaded', function() {
    loadReservations();
    setupEventListeners();
    
    // Check for reservation ID in URL
    const urlParams = new URLSearchParams(window.location.search);
    const resId = urlParams.get('id');
    if (resId) {
        setTimeout(() => highlightReservation(resId), 500);
    }
});

// Load reservations from localStorage
function loadReservations() {
    const user = Auth.getCurrentUser();
    if (!user) return;

    const reservations = JSON.parse(localStorage.getItem('markanReservations')) || [];
    
    // Filter reservations for current user
    allReservations = reservations
        .filter(r => r.customerId == user.id)
        .sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));
    
    filterByTab(currentTab);
}

// Filter reservations by tab
window.filterReservations = function(tab) {
    currentTab = tab;
    filterByTab(tab);
};

function filterByTab(tab) {
    const now = new Date();
    
    switch(tab) {
        case 'upcoming':
            filteredReservations = allReservations.filter(r => {
                if (r.status === 'cancelled') return false;
                const resDateTime = new Date(r.date + 'T' + r.time);
                return resDateTime >= now;
            });
            break;
        case 'past':
            filteredReservations = allReservations.filter(r => {
                if (r.status === 'cancelled') return false;
                const resDateTime = new Date(r.date + 'T' + r.time);
                return resDateTime < now;
            });
            break;
        case 'cancelled':
            filteredReservations = allReservations.filter(r => r.status === 'cancelled');
            break;
        default:
            filteredReservations = [...allReservations];
    }
    
    displayReservations(filteredReservations);
}

// Display reservations in grid
function displayReservations(reservations) {
    const grid = document.getElementById('reservationsGrid');
    if (!grid) return;

    if (reservations.length === 0) {
        let message = '';
        let icon = '';
        
        switch(currentTab) {
            case 'upcoming':
                message = 'No upcoming reservations';
                icon = 'fa-calendar-times';
                break;
            case 'past':
                message = 'No past reservations';
                icon = 'fa-history';
                break;
            case 'cancelled':
                message = 'No cancelled reservations';
                icon = 'fa-times-circle';
                break;
            default:
                message = 'No reservations found';
                icon = 'fa-calendar-times';
        }
        
        grid.innerHTML = `
            <div class="no-reservations">
                <i class="fas ${icon}"></i>
                <h3>${message}</h3>
                <p>Would you like to make a reservation?</p>
                <button class="btn-reserve" onclick="openReservationModal()">
                    <i class="fas fa-calendar-plus"></i> Make a Reservation
                </button>
            </div>
        `;
        return;
    }

    grid.innerHTML = reservations.map(res => {
        const resDateTime = new Date(res.date + 'T' + res.time);
        const now = new Date();
        const isUpcoming = resDateTime >= now && res.status !== 'cancelled';
        const canCancel = isUpcoming && res.status !== 'cancelled';
        
        return `
            <div class="reservation-card ${res.status}" data-id="${res.id}">
                <div class="reservation-header">
                    <span class="reservation-id">${res.id}</span>
                    <span class="reservation-status ${res.status}">${res.status}</span>
                </div>
                <div class="reservation-details">
                    <p><i class="fas fa-calendar"></i> ${formatDate(res.date)}</p>
                    <p><i class="fas fa-clock"></i> ${res.time} (${res.duration || 2} hours)</p>
                    <p><i class="fas fa-users"></i> ${res.guests} guest${res.guests > 1 ? 's' : ''}</p>
                    ${res.specialRequests ? `
                        <p><i class="fas fa-comment"></i> ${res.specialRequests}</p>
                    ` : ''}
                </div>
                ${canCancel ? `
                    <div class="reservation-actions">
                        <button class="btn-cancel" onclick="cancelReservation('${res.id}')">
                            <i class="fas fa-times"></i> Cancel Reservation
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Make a new reservation
window.makeReservation = function() {
    // Get form values
    const name = document.getElementById('resName')?.value;
    const email = document.getElementById('resEmail')?.value;
    const phone = document.getElementById('resPhone')?.value;
    const guests = document.getElementById('resGuests')?.value;
    const date = document.getElementById('resDate')?.value;
    const time = document.getElementById('resTime')?.value;
    const duration = document.getElementById('resDuration')?.value;
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
        id: generateReservationId(),
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
    
    // Send notification
    sendReservationNotification(newReservation);
    
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
        const reservation = reservations[index];
        
        // Check if reservation can be cancelled (anytime)
        reservations[index].status = 'cancelled';
        reservations[index].updatedAt = new Date().toISOString();
        localStorage.setItem('markanReservations', JSON.stringify(reservations));
        
        showNotification('Reservation cancelled successfully', 'success');
        
        // Send cancellation notification
        sendCancellationNotification(reservation);
        
        // Reload reservations
        loadReservations();
    }
};

// Generate reservation ID
function generateReservationId() {
    const prefix = 'RES';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

// Send reservation notification (simulated)
function sendReservationNotification(reservation) {
    console.log('Reservation notification sent:', reservation);
    
    // Create notification in system
    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    notifications.unshift({
        id: Date.now(),
        type: 'reservation',
        title: 'Reservation Request Sent',
        message: `Your reservation for ${formatDate(reservation.date)} at ${reservation.time} has been submitted.`,
        time: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('customerNotifications', JSON.stringify(notifications));
}

// Send cancellation notification
function sendCancellationNotification(reservation) {
    console.log('Cancellation notification sent:', reservation);
    
    // Create notification in system
    const notifications = JSON.parse(localStorage.getItem('customerNotifications')) || [];
    notifications.unshift({
        id: Date.now(),
        type: 'reservation',
        title: 'Reservation Cancelled',
        message: `Your reservation for ${formatDate(reservation.date)} at ${reservation.time} has been cancelled.`,
        time: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('customerNotifications', JSON.stringify(notifications));
}

// Highlight specific reservation
function highlightReservation(reservationId) {
    const card = document.querySelector(`.reservation-card[data-id="${reservationId}"]`);
    if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.animation = 'pulse 1s';
        setTimeout(() => {
            card.style.animation = '';
        }, 1000);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Listen for storage events (updates from admin)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanReservations') {
            loadReservations();
        }
    });

    // Refresh reservations every 30 seconds
    setInterval(() => {
        loadReservations();
    }, 30000);
}

// Helper: Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Show notification
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

// Export functions for global use
window.makeReservation = makeReservation;
window.cancelReservation = cancelReservation;
window.filterReservations = filterReservations;