// js/admin/reservations.js - Admin Reservation Management
// Markan Cafe - Debre Birhan University

let allReservations = [];
let filteredReservations = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load reservations
    await loadReservations();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadReservations() {
    const container = document.getElementById('reservationsTable');
    if (!container) return;
    
    try {
        container.innerHTML = '<tr><td colspan="8"><div class="spinner"></div></td></tr>';
        
        allReservations = await API.reservations.getAll();
        filteredReservations = [...allReservations];
        
        applyFilters();
        
    } catch (error) {
        console.error('Failed to load reservations:', error);
        container.innerHTML = '<tr><td colspan="8">Failed to load reservations</td></tr>';
    }
}

function applyFilters() {
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const dateFilter = document.getElementById('dateFilter')?.value || 'all';
    const searchTerm = document.getElementById('searchReservation')?.value.toLowerCase() || '';
    
    let filtered = [...allReservations];
    
    // Apply status filter
    if (statusFilter !== 'all') {
        filtered = filtered.filter(res => res.status === statusFilter);
    }
    
    // Apply date filter
    if (dateFilter !== 'all') {
        const today = new Date().toISOString().split('T')[0];
        
        filtered = filtered.filter(res => {
            if (dateFilter === 'today') {
                return res.date === today;
            } else if (dateFilter === 'upcoming') {
                return res.date >= today && res.status !== 'cancelled' && res.status !== 'completed';
            }
            return true;
        });
    }
    
    // Apply search
    if (searchTerm) {
        filtered = filtered.filter(res => 
            res.id.toLowerCase().includes(searchTerm) ||
            res.customerName.toLowerCase().includes(searchTerm) ||
            res.customerPhone.includes(searchTerm) ||
            res.customerEmail.toLowerCase().includes(searchTerm)
        );
    }
    
    filteredReservations = filtered;
    displayReservations();
}

function displayReservations() {
    const container = document.getElementById('reservationsTable');
    if (!container) return;
    
    if (filteredReservations.length === 0) {
        container.innerHTML = '<tr><td colspan="8">No reservations found</td></tr>';
        return;
    }
    
    container.innerHTML = filteredReservations.map(res => `
        <tr>
            <td>${res.id}</td>
            <td>${res.customerName}</td>
            <td>${res.customerPhone}</td>
            <td>${res.guests}</td>
            <td>${formatDateOnly(res.date)} at ${res.time}</td>
            <td><span class="status-badge ${res.status}">${res.status}</span></td>
            <td>
                <select class="status-select" onchange="updateReservationStatus('${res.id}', this.value)">
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

window.updateReservationStatus = async function(reservationId, newStatus) {
    try {
        await API.reservations.updateStatus(reservationId, newStatus);
        showNotification(`Reservation ${reservationId} status updated to ${newStatus}`, 'success');
        await loadReservations(); // Reload reservations
    } catch (error) {
        console.error('Failed to update reservation status:', error);
        showNotification('Failed to update reservation status', 'error');
    }
};

window.viewReservationDetails = function(reservationId) {
    const reservation = allReservations.find(r => r.id === reservationId);
    if (!reservation) return;
    
    const modalId = 'reservationDetailsModal';
    let modal = document.getElementById(modalId);
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>Reservation Details - ${reservation.id}</h3>
                <button class="modal-close"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="reservation-details">
                    <div class="detail-section">
                        <h4>Customer Information</h4>
                        <p><strong>Name:</strong> ${reservation.customerName}</p>
                        <p><strong>Email:</strong> ${reservation.customerEmail}</p>
                        <p><strong>Phone:</strong> ${reservation.customerPhone}</p>
                    </div>
                    
                    <div class="detail-section">
                        <h4>Reservation Details</h4>
                        <p><strong>Date:</strong> ${formatDateOnly(reservation.date)}</p>
                        <p><strong>Time:</strong> ${reservation.time}</p>
                        <p><strong>Duration:</strong> ${reservation.duration} hours</p>
                        <p><strong>Guests:</strong> ${reservation.guests}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${reservation.status}">${reservation.status}</span></p>
                    </div>
                    
                    ${reservation.specialRequests ? `
                        <div class="detail-section">
                            <h4>Special Requests</h4>
                            <p>${reservation.specialRequests}</p>
                        </div>
                    ` : ''}
                    
                    <div class="detail-section">
                        <h4>Timeline</h4>
                        <p><strong>Created:</strong> ${formatDate(reservation.createdAt)}</p>
                        ${reservation.updatedAt ? `<p><strong>Last Updated:</strong> ${formatDate(reservation.updatedAt)}</p>` : ''}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button class="btn btn-primary" onclick="window.print()">
                    <i class="fas fa-print"></i> Print
                </button>
                <button class="btn btn-outline" onclick="this.closest('.modal').classList.remove('active')">
                    Close
                </button>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
    
    // Add close button handlers
    modal.querySelector('.modal-close').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
};

function setupEventListeners() {
    // Filter changes
    const statusFilter = document.getElementById('statusFilter');
    const dateFilter = document.getElementById('dateFilter');
    const searchInput = document.getElementById('searchReservation');
    
    if (statusFilter) {
        statusFilter.addEventListener('change', applyFilters);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Refresh button
    const refreshBtn = document.getElementById('refreshReservations');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async () => {
            await loadReservations();
            showNotification('Reservations refreshed', 'success');
        });
    }
}