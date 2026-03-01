// customer/js/reservations.js - Customer Reservations
// Markan Cafe - Debre Birhan University
// COMPLETE FIXED VERSION - ALL FUNCTIONS WORKING

// ===== GLOBAL VARIABLES =====
let allReservations = [];
let filteredReservations = [];
let currentUser = null;
let currentTab = 'upcoming';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Customer Reservations page initializing...');
    
    // Get current user
    currentUser = getCurrentUser();
    if (!currentUser) {
        window.location.replace('../../login.html');
        return;
    }
    
    console.log('✅ Current user:', currentUser.name, '(ID:', currentUser.id, ')');
    
    // Set user name
    setUserName();
    
    // Ensure ReservationsDB exists
    ensureReservationsDB();
    
    // Load reservations
    loadReservations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update sidebar badges
    updateSidebarBadges();
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        if (!userStr) return null;
        return JSON.parse(userStr);
    } catch (e) {
        console.error('Error getting user:', e);
        return null;
    }
}

// ===== SET USER NAME =====
function setUserName() {
    if (!currentUser) return;
    
    const firstName = currentUser.name.split(' ')[0];
    const userNameEl = document.getElementById('userName');
    const userGreeting = document.getElementById('userGreeting');
    
    if (userNameEl) userNameEl.textContent = firstName;
    if (userGreeting) userGreeting.innerHTML = `Hi, ${firstName}`;
}

// ===== ENSURE RESERVATIONSDB EXISTS =====
function ensureReservationsDB() {
    // If ReservationsDB doesn't exist, create it
    if (typeof window.ReservationsDB === 'undefined') {
        console.log('📁 Creating ReservationsDB from localStorage...');
        
        window.ReservationsDB = {
            reservations: [],
            
            getAll() {
                return this.reservations;
            },
            
            getById(id) {
                return this.reservations.find(r => r.id === id);
            },
            
            getByDate(date) {
                return this.reservations.filter(r => r.date === date);
            },
            
            getByCustomerId(customerId) {
                return this.reservations.filter(r => r.customerId == customerId);
            },
            
            getByStatus(status) {
                if (status === 'all') return this.reservations;
                return this.reservations.filter(r => r.status === status);
            },
            
            checkAvailability(date, time, guests) {
                const sameSlot = this.reservations.filter(r => 
                    r.date === date && 
                    r.time === time && 
                    r.status !== 'cancelled'
                );
                
                const totalGuests = sameSlot.reduce((sum, r) => sum + r.guests, 0);
                const maxGuests = 20;
                
                return {
                    available: totalGuests + parseInt(guests) <= maxGuests,
                    remaining: Math.max(0, maxGuests - totalGuests)
                };
            },
            
            add(reservation) {
                reservation.id = 'RES-' + Date.now().toString().slice(-6) + '-' + 
                                 Math.random().toString(36).substr(2, 4).toUpperCase();
                reservation.createdAt = new Date().toISOString();
                this.reservations.push(reservation);
                this.saveToStorage();
                return reservation;
            },
            
            updateStatus(id, status) {
                const index = this.reservations.findIndex(r => r.id === id);
                if (index !== -1) {
                    this.reservations[index].status = status;
                    this.saveToStorage();
                    return true;
                }
                return false;
            },
            
            saveToStorage() {
                localStorage.setItem('markanReservations', JSON.stringify(this.reservations));
            },
            
            loadFromStorage() {
                try {
                    const saved = localStorage.getItem('markanReservations');
                    this.reservations = saved ? JSON.parse(saved) : [];
                    console.log('✅ Loaded', this.reservations.length, 'reservations from localStorage');
                } catch (e) {
                    console.error('Error loading:', e);
                    this.reservations = [];
                }
            }
        };
        
        window.ReservationsDB.loadFromStorage();
    } else {
        console.log('✅ ReservationsDB already exists');
        // Make sure it has the latest data
        window.ReservationsDB.loadFromStorage();
    }
}

// ===== LOAD RESERVATIONS =====
function loadReservations() {
    if (!window.ReservationsDB) {
        console.error('❌ ReservationsDB not available');
        return;
    }
    
    // Get ALL reservations first for debugging
    const all = window.ReservationsDB.getAll();
    console.log('📊 Total reservations in system:', all.length);
    
    // Filter by current user
    allReservations = window.ReservationsDB.getByCustomerId(currentUser.id);
    console.log(`👤 Reservations for user ${currentUser.id}:`, allReservations.length);
    
    // If no reservations for this user, check if there are reservations without customerId
    if (allReservations.length === 0 && all.length > 0) {
        console.log('🔍 Checking for reservations without customerId...');
        const unassigned = all.filter(r => !r.customerId);
        if (unassigned.length > 0) {
            console.log('Found', unassigned.length, 'unassigned reservations');
            
            // Check if any match by email
            const emailMatches = all.filter(r => 
                r.customerEmail && 
                r.customerEmail.toLowerCase() === currentUser.email.toLowerCase()
            );
            
            if (emailMatches.length > 0) {
                console.log('✅ Found', emailMatches.length, 'reservations matching email');
                
                // Update them with customerId
                emailMatches.forEach(r => {
                    r.customerId = currentUser.id;
                    console.log(`   Updated reservation ${r.id} with customerId ${currentUser.id}`);
                });
                
                window.ReservationsDB.saveToStorage();
                allReservations = emailMatches;
            }
        }
    }
    
    // Sort by date (newest first)
    allReservations.sort((a, b) => {
        const dateA = new Date(a.date + 'T' + a.time);
        const dateB = new Date(b.date + 'T' + b.time);
        return dateB - dateA;
    });
    
    console.log('📋 Final user reservations:', allReservations.length);
    
    // Display reservations
    filterReservations('upcoming');
    
    // Update reservation badge
    updateReservationBadge();
}

// ===== FILTER RESERVATIONS =====
function filterReservations(tab) {
    currentTab = tab;
    
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tab) {
            btn.classList.add('active');
        }
    });
    
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // Filter reservations based on tab
    if (tab === 'upcoming') {
        filteredReservations = allReservations.filter(res => {
            if (res.status === 'cancelled' || res.status === 'completed') return false;
            const resDate = new Date(res.date + 'T' + res.time);
            return resDate >= now;
        });
    } else if (tab === 'past') {
        filteredReservations = allReservations.filter(res => {
            if (res.status === 'cancelled') return false;
            const resDate = new Date(res.date + 'T' + res.time);
            return resDate < now || res.status === 'completed';
        });
    } else if (tab === 'cancelled') {
        filteredReservations = allReservations.filter(res => 
            res.status === 'cancelled'
        );
    }
    
    console.log(`📊 ${tab} reservations:`, filteredReservations.length);
    displayReservations();
}

// ===== DISPLAY RESERVATIONS =====
function displayReservations() {
    const container = document.getElementById('reservationsGrid');
    if (!container) return;
    
    if (filteredReservations.length === 0) {
        container.innerHTML = `
            <div class="no-reservations">
                <i class="fas fa-calendar-times"></i>
                <h3>No Reservations Found</h3>
                <p>${getEmptyStateMessage()}</p>
                <button class="btn-reserve" onclick="window.openReservationModal()">
                    <i class="fas fa-calendar-plus"></i> Make a Reservation
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredReservations.map(res => {
        const resDate = new Date(res.date + 'T' + res.time);
        const formattedDate = resDate.toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        const formattedTime = resDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        return `
            <div class="reservation-card ${res.status}" onclick="showReservationDetails('${res.id}')">
                <div class="reservation-header">
                    <span class="reservation-id">#${res.id}</span>
                    <span class="reservation-status ${res.status}">${res.status}</span>
                </div>
                <div class="reservation-details">
                    <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    <p><i class="fas fa-clock"></i> ${formattedTime} (${res.duration || 2} hrs)</p>
                    <p><i class="fas fa-users"></i> ${res.guests} ${res.guests === 1 ? 'Guest' : 'Guests'}</p>
                </div>
                ${res.status !== 'cancelled' && res.status !== 'completed' ? `
                    <div class="reservation-actions" onclick="event.stopPropagation()">
                        <button class="btn-cancel" onclick="cancelReservation('${res.id}')">
                            <i class="fas fa-times"></i> Cancel
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// ===== GET EMPTY STATE MESSAGE =====
function getEmptyStateMessage() {
    if (allReservations.length === 0) {
        return 'You haven\'t made any reservations yet';
    }
    
    switch(currentTab) {
        case 'upcoming':
            return 'No upcoming reservations found';
        case 'past':
            return 'No past reservations found';
        case 'cancelled':
            return 'No cancelled reservations found';
        default:
            return 'No reservations found';
    }
}

// ===== SHOW RESERVATION DETAILS =====
function showReservationDetails(reservationId) {
    const reservation = allReservations.find(r => r.id === reservationId);
    if (!reservation) return;
    
    const resDate = new Date(reservation.date + 'T' + reservation.time);
    const formattedDate = resDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = resDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    const modalHtml = `
        <div class="modal" id="detailsModal" style="display: flex; z-index: 2000;">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Reservation Details</h3>
                    <button class="modal-close" onclick="closeDetailsModal()"><i class="fas fa-times"></i></button>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom: 1.5rem;">
                        <h4 style="color: #4a2c1a; margin-bottom: 0.5rem;">Reservation #${reservation.id}</h4>
                        <span class="reservation-status ${reservation.status}" style="display: inline-block;">${reservation.status}</span>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                        <div>
                            <p><strong>Date:</strong> ${formattedDate}</p>
                            <p><strong>Time:</strong> ${formattedTime}</p>
                            <p><strong>Duration:</strong> ${reservation.duration || 2} hours</p>
                        </div>
                        <div>
                            <p><strong>Guests:</strong> ${reservation.guests}</p>
                            <p><strong>Phone:</strong> ${reservation.customerPhone}</p>
                            <p><strong>Email:</strong> ${reservation.customerEmail}</p>
                        </div>
                    </div>
                    
                    ${reservation.specialRequests ? `
                        <div style="margin-bottom: 1.5rem;">
                            <h4 style="color: #4a2c1a; margin-bottom: 0.5rem;">Special Requests</h4>
                            <p style="background: #f5e6d3; padding: 1rem; border-radius: 8px;">${reservation.specialRequests}</p>
                        </div>
                    ` : ''}
                    
                    ${reservation.status !== 'cancelled' && reservation.status !== 'completed' ? `
                        <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                            <button class="btn-cancel" onclick="cancelReservation('${reservation.id}'); closeDetailsModal();" style="flex: 0 1 auto;">
                                <i class="fas fa-times"></i> Cancel Reservation
                            </button>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-actions">
                    <button class="btn btn-outline" onclick="closeDetailsModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    
    const modalContainer = document.getElementById('detailsModalContainer');
    if (modalContainer) modalContainer.remove();
    
    const newContainer = document.createElement('div');
    newContainer.id = 'detailsModalContainer';
    newContainer.innerHTML = modalHtml;
    document.body.appendChild(newContainer);
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE DETAILS MODAL =====
function closeDetailsModal() {
    const modal = document.getElementById('detailsModalContainer');
    if (modal) modal.remove();
    document.body.style.overflow = '';
}

// ===== CANCEL RESERVATION =====
function cancelReservation(reservationId) {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
        return;
    }
    
    if (window.ReservationsDB) {
        const success = window.ReservationsDB.updateStatus(reservationId, 'cancelled');
        
        if (success) {
            showNotification('Reservation cancelled successfully', 'success');
            
            // Reload reservations
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification('Error cancelling reservation', 'error');
        }
    }
}

// ===== UPDATE RESERVATION BADGE =====
function updateReservationBadge() {
    const now = new Date();
    const upcomingCount = allReservations.filter(r => {
        if (r.status === 'cancelled' || r.status === 'completed') return false;
        const resDate = new Date(r.date + 'T' + r.time);
        return resDate > now;
    }).length;
    
    const badge = document.getElementById('sidebarReservationBadge');
    if (badge) {
        badge.textContent = upcomingCount;
        badge.style.display = upcomingCount > 0 ? 'inline-block' : 'none';
    }
}

// ===== UPDATE SIDEBAR BADGES =====
function updateSidebarBadges() {
    if (!currentUser) return;
    
    // Update reservation badge
    updateReservationBadge();
    
    // Update orders badge
    if (window.OrdersDB && window.OrdersDB.getByCustomerId) {
        try {
            const orders = window.OrdersDB.getByCustomerId(currentUser.id) || [];
            const pendingOrders = orders.filter(o => o && o.status === 'pending').length;
            const ordersBadge = document.getElementById('sidebarOrdersBadge');
            if (ordersBadge) {
                ordersBadge.textContent = pendingOrders;
                ordersBadge.style.display = pendingOrders > 0 ? 'inline-block' : 'none';
            }
        } catch (e) {
            console.error('Error loading orders:', e);
        }
    }
    
    // Update cart badge
    updateCartCount();
    
    // Update points and tier
    if (currentUser && currentUser.stats) {
        const pointsEl = document.getElementById('userPoints');
        const tierEl = document.getElementById('userTier');
        if (pointsEl) pointsEl.textContent = (currentUser.stats.points || 0) + ' pts';
        if (tierEl) tierEl.textContent = (currentUser.stats.tier || 'bronze').charAt(0).toUpperCase() + 
            (currentUser.stats.tier || 'bronze').slice(1);
    }
}

// ===== UPDATE CART COUNT =====
function updateCartCount() {
    if (!currentUser) return;
    
    const cartKey = `cart_${currentUser.id}`;
    try {
        const cart = JSON.parse(localStorage.getItem(cartKey)) || [];
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        
        const cartBadges = document.querySelectorAll('#cartCount, #sidebarCartBadge');
        cartBadges.forEach(badge => {
            if (badge) {
                badge.textContent = totalItems;
                badge.style.display = totalItems > 0 ? 'inline-block' : 'none';
            }
        });
    } catch (e) {
        console.error('Error updating cart count:', e);
    }
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filterReservations(this.dataset.tab);
        });
    });
    
    // Open reservation modal button - FIXED
    const openBtn = document.getElementById('openReservationModal');
    if (openBtn) {
        console.log('✅ Found openReservationModal button, attaching listener');
        // Remove any existing listeners by cloning
        const newBtn = openBtn.cloneNode(true);
        openBtn.parentNode.replaceChild(newBtn, openBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🔘 Make Reservation button clicked');
            openReservationModal();
        });
    } else {
        console.error('❌ Could not find openReservationModal button');
    }
    
    // Modal close button
    const closeBtn = document.querySelector('#reservationModal .modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeReservationModal);
    }
    
    // Close modal on outside click
    const modal = document.getElementById('reservationModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeReservationModal();
            }
        });
    }
    
    // Reservation form submission
    const form = document.getElementById('reservationForm');
    if (form) {
        // Remove any existing listeners
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            makeReservation();
        });
    }
    
    // Listen for storage events
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanReservations') {
            console.log('🔄 Reservations updated in another tab');
            loadReservations();
        }
    });
}

// ===== OPEN RESERVATION MODAL =====
function openReservationModal() {
    console.log('📱 Opening reservation modal');
    const modal = document.getElementById('reservationModal');
    if (!modal) {
        console.error('❌ Reservation modal not found');
        return;
    }
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('resDate');
    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
    }
    
    // Pre-fill user data
    if (currentUser) {
        const nameInput = document.getElementById('resName');
        const emailInput = document.getElementById('resEmail');
        const phoneInput = document.getElementById('resPhone');
        
        if (nameInput) nameInput.value = currentUser.name || '';
        if (emailInput) emailInput.value = currentUser.email || '';
        if (phoneInput) phoneInput.value = currentUser.phone || '';
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE RESERVATION MODAL =====
function closeReservationModal() {
    console.log('📱 Closing reservation modal');
    const modal = document.getElementById('reservationModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    const form = document.getElementById('reservationForm');
    if (form) form.reset();
}

// ===== MAKE RESERVATION =====
function makeReservation() {
    console.log('📝 Making reservation...');
    
    // Validate phone
    const phone = document.getElementById('resPhone').value;
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }
    
    // Get form data
    const reservationData = {
        customerId: currentUser.id,
        customerName: document.getElementById('resName').value,
        customerEmail: document.getElementById('resEmail').value,
        customerPhone: phone,
        guests: parseInt(document.getElementById('resGuests').value),
        date: document.getElementById('resDate').value,
        time: document.getElementById('resTime').value,
        duration: parseFloat(document.getElementById('resDuration').value),
        specialRequests: document.getElementById('resRequests').value,
        status: 'pending'
    };
    
    console.log('📝 Creating reservation:', reservationData);
    
    // Check availability
    if (window.ReservationsDB) {
        const availability = window.ReservationsDB.checkAvailability(
            reservationData.date, 
            reservationData.time, 
            reservationData.guests
        );
        
        if (!availability.available) {
            showNotification(`Sorry, this time slot is full. Only ${availability.remaining} spots left.`, 'error');
            return;
        }
        
        // Save reservation
        const newReservation = window.ReservationsDB.add(reservationData);
        
        if (newReservation) {
            showNotification('Reservation confirmed!', 'success');
            closeReservationModal();
            
            // Reload reservations
            setTimeout(() => {
                location.reload();
            }, 1500);
        } else {
            showNotification('Error creating reservation. Please try again.', 'error');
        }
    } else {
        showNotification('Reservation system is temporarily unavailable', 'error');
    }
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: 'fa-check-circle',
        error: 'fa-exclamation-circle',
        warning: 'fa-exclamation-triangle',
        info: 'fa-info-circle'
    };
    
    notification.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;
    
    container.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ===== DEBUG CHECK =====
console.log('✅ reservations.js loaded, openReservationModal available:', typeof openReservationModal === 'function');

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterReservations = filterReservations;
window.showReservationDetails = showReservationDetails;
window.closeDetailsModal = closeDetailsModal;
window.cancelReservation = cancelReservation;
window.openReservationModal = openReservationModal;
window.closeReservationModal = closeReservationModal;
window.makeReservation = makeReservation;
window.showNotification = showNotification;