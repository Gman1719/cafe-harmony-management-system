// js/admin/reservations.js - Admin Reservation Management
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let allReservations = [];
let filteredReservations = [];
let currentReservationId = null;

// Initialize reservations page
document.addEventListener('DOMContentLoaded', function() {
    updateAdminName();
    loadReservations();
    setupEventListeners();
});

// Update admin name in header
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        const adminNameElements = document.querySelectorAll('#adminName');
        adminNameElements.forEach(el => {
            if (el) el.textContent = user.name;
        });
    }
}

// Load reservations from localStorage
function loadReservations() {
    const stored = localStorage.getItem('markanReservations');
    if (stored) {
        allReservations = JSON.parse(stored);
    } else {
        // Default reservations if none exist
        allReservations = [
            { 
                id: 'RES-1001', 
                customerName: 'John Customer', 
                customerEmail: 'john@example.com',
                customerPhone: '+251922345678',
                guests: 4,
                date: '2025-02-25', 
                time: '19:00', 
                status: 'confirmed',
                specialRequests: 'Window table preferred',
                createdAt: '2025-02-18T10:30:00Z'
            },
            { 
                id: 'RES-1002', 
                customerName: 'Sarah Wilson', 
                customerEmail: 'sarah@example.com',
                customerPhone: '+251933456789',
                guests: 2,
                date: '2025-02-22', 
                time: '18:30', 
                status: 'confirmed',
                specialRequests: 'Vegetarian options',
                createdAt: '2025-02-19T09:15:00Z'
            },
            { 
                id: 'RES-1003', 
                customerName: 'Mike Johnson', 
                customerEmail: 'mike@example.com',
                customerPhone: '+251944567890',
                guests: 6,
                date: '2025-02-26', 
                time: '20:00', 
                status: 'pending',
                specialRequests: 'Birthday celebration',
                createdAt: '2025-02-20T11:45:00Z'
            }
        ];
        localStorage.setItem('markanReservations', JSON.stringify(allReservations));
    }
    
    filteredReservations = [...allReservations];
    displayReservations(filteredReservations);
}

// Display reservations in table
function displayReservations(reservations) {
    const tbody = document.getElementById('reservationsTable');
    if (!tbody) return;
    
    if (reservations.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">No reservations found</td></tr>';
        return;
    }
    
    tbody.innerHTML = reservations.map(res => `
        <tr>
            <td>${res.id || 'N/A'}</td>
            <td>${res.customerName || 'Guest'}</td>
            <td>${res.customerPhone || 'N/A'}</td>
            <td>${res.date || 'N/A'}</td>
            <td>${res.time || 'N/A'}</td>
            <td>${res.guests || 1}</td>
            <td>
                <select class="status-select ${res.status || 'pending'}" 
                        onchange="updateReservationStatus('${res.id}', this.value)"
                        style="padding: 5px; border-radius: 20px; border: 1px solid #ddd;">
                    <option value="pending" ${res.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="confirmed" ${res.status === 'confirmed' ? 'selected' : ''}>Confirmed</option>
                    <option value="completed" ${res.status === 'completed' ? 'selected' : ''}>Completed</option>
                    <option value="cancelled" ${res.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewReservationDetails('${res.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Update reservation status
window.updateReservationStatus = function(reservationId, newStatus) {
    const reservation = allReservations.find(r => r.id === reservationId);
    if (reservation) {
        reservation.status = newStatus;
        reservation.updatedAt = new Date().toISOString();
        localStorage.setItem('markanReservations', JSON.stringify(allReservations));
        showNotification(`Reservation ${reservationId} ${newStatus}`, 'success');
        applyFilters();
    }
};

// View reservation details
window.viewReservationDetails = function(reservationId) {
    const reservation = allReservations.find(r => r.id === reservationId);
    if (!reservation) return;
    
    currentReservationId = reservationId;
    
    const modalContent = document.getElementById('reservationDetails');
    if (modalContent) {
        modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h4>Customer Information</h4>
                    <p><strong>Name:</strong> ${reservation.customerName || 'Guest'}</p>
                    <p><strong>Email:</strong> ${reservation.customerEmail || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${reservation.customerPhone || 'N/A'}</p>
                </div>
                <div>
                    <h4>Reservation Details</h4>
                    <p><strong>Date:</strong> ${reservation.date || 'N/A'}</p>
                    <p><strong>Time:</strong> ${reservation.time || 'N/A'}</p>
                    <p><strong>Guests:</strong> ${reservation.guests || 1}</p>
                    <p><strong>Status:</strong> <span class="status-badge ${reservation.status || 'pending'}">${reservation.status || 'pending'}</span></p>
                </div>
            </div>
            ${reservation.specialRequests ? `
                <div style="margin-top: 20px;">
                    <h4>Special Requests</h4>
                    <p>${reservation.specialRequests}</p>
                </div>
            ` : ''}
            <div style="margin-top: 20px; color: #666; font-size: 0.9rem;">
                <p><strong>Created:</strong> ${new Date(reservation.createdAt).toLocaleString()}</p>
                ${reservation.updatedAt ? `<p><strong>Last Updated:</strong> ${new Date(reservation.updatedAt).toLocaleString()}</p>` : ''}
            </div>
        `;
    }
    
    document.getElementById('reservationModal').classList.add('active');
};

// Close reservation modal
window.closeReservationModal = function() {
    document.getElementById('reservationModal').classList.remove('active');
    currentReservationId = null;
};

// Apply filters
function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchReservation')?.value.toLowerCase() || '';

    filteredReservations = allReservations.filter(res => {
        // Status filter
        if (statusFilter !== 'all' && res.status !== statusFilter) {
            return false;
        }
        
        // Date filter
        if (dateFilter !== 'all') {
            const today = new Date().toISOString().split('T')[0];
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            switch(dateFilter) {
                case 'today':
                    if (res.date !== today) return false;
                    break;
                case 'tomorrow':
                    if (res.date !== tomorrowStr) return false;
                    break;
                case 'week':
                    const resDate = new Date(res.date);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    if (resDate > weekFromNow || resDate < new Date()) return false;
                    break;
            }
        }
        
        // Search filter
        if (searchTerm) {
            const matchesId = res.id?.toLowerCase().includes(searchTerm);
            const matchesName = res.customerName?.toLowerCase().includes(searchTerm);
            const matchesPhone = res.customerPhone?.includes(searchTerm);
            if (!matchesId && !matchesName && !matchesPhone) return false;
        }
        
        return true;
    });
    
    displayReservations(filteredReservations);
}

// Refresh reservations
window.refreshReservations = function() {
    loadReservations();
    showNotification('Reservations refreshed', 'success');
};

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchReservation');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    // Date filter
    const dateFilter = document.getElementById('dateFilter');
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshReservations');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshReservations);
    }
    
    // Modal close button
    const modalClose = document.querySelector('#reservationModal .modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeReservationModal);
    }
    
    // Modal action buttons
    const confirmBtn = document.querySelector('#reservationModal .btn-success');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (currentReservationId) {
                updateReservationStatus(currentReservationId, 'confirmed');
                closeReservationModal();
            }
        });
    }
    
    const cancelBtn = document.querySelector('#reservationModal .btn-danger');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            if (currentReservationId) {
                updateReservationStatus(currentReservationId, 'cancelled');
                closeReservationModal();
            }
        });
    }
    
    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Export functions
window.applyFilters = applyFilters;