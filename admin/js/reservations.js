// admin/js/reservations.js
// Markan Cafe Admin - Reservations Management
// Full CRUD operations with localStorage - NO HARDCODED DATA

// ===== GLOBAL VARIABLES =====
let allReservations = [];
let filteredReservations = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentReservationId = null;
let currentFilter = {
    status: 'all',
    date: ''
};
let currentView = 'list';
let currentMonth = new Date();
let currentYear = currentMonth.getFullYear();
let currentMonthIndex = currentMonth.getMonth();

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    // Load reservations
    loadReservations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Update admin name
    updateAdminName();
    
    // Initialize calendar
    renderCalendar();
});

// ===== LOAD RESERVATIONS =====
function loadReservations() {
    try {
        // Get reservations from localStorage
        const stored = localStorage.getItem('markanReservations');
        allReservations = stored ? JSON.parse(stored) : [];
        
        // Sort by date (newest first)
        allReservations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        // Apply filters
        applyFilters();
        
    } catch (error) {
        console.error('Error loading reservations:', error);
        showNotification('Failed to load reservations', 'error');
        allReservations = [];
        filteredReservations = [];
        displayReservations([]);
    }
}

// ===== SAVE RESERVATIONS =====
function saveReservations() {
    try {
        localStorage.setItem('markanReservations', JSON.stringify(allReservations));
        
        // Dispatch storage event for cross-tab updates
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'markanReservations',
            newValue: JSON.stringify(allReservations)
        }));
        
        // Update calendar if active
        if (currentView === 'calendar') {
            renderCalendar();
        }
        
    } catch (error) {
        console.error('Error saving reservations:', error);
        showNotification('Failed to save reservations', 'error');
    }
}

// ===== APPLY FILTERS =====
function applyFilters() {
    filteredReservations = [...allReservations];
    
    // Apply status filter
    if (currentFilter.status !== 'all') {
        filteredReservations = filteredReservations.filter(res => 
            res.status === currentFilter.status
        );
    }
    
    // Apply date filter
    if (currentFilter.date) {
        filteredReservations = filteredReservations.filter(res => 
            res.date === currentFilter.date
        );
    }
    
    // Reset to first page
    currentPage = 1;
    
    // Update UI
    updateStats();
    
    if (currentView === 'list') {
        displayReservations();
    }
}

// ===== UPDATE STATISTICS =====
function updateStats() {
    document.getElementById('pendingReservations').textContent = 
        allReservations.filter(r => r.status === 'pending').length;
    
    document.getElementById('confirmedReservations').textContent = 
        allReservations.filter(r => r.status === 'confirmed').length;
    
    document.getElementById('completedReservations').textContent = 
        allReservations.filter(r => r.status === 'completed').length;
    
    document.getElementById('cancelledReservations').textContent = 
        allReservations.filter(r => r.status === 'cancelled').length;
}

// ===== DISPLAY RESERVATIONS =====
function displayReservations() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageReservations = filteredReservations.slice(start, end);

    if (pageReservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="no-data">
                        <i class="fas fa-calendar-times"></i>
                        <p>No reservations found</p>
                    </div>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageReservations.map(res => `
        <tr onclick="viewReservationDetails('${res.id}')" style="cursor: pointer;">
            <td><strong>${res.id}</strong></td>
            <td>${res.customerName || 'N/A'}</td>
            <td>${formatDate(res.date)} at ${res.time}</td>
            <td>${res.guests}</td>
            <td>${res.duration || 2} hours</td>
            <td>
                <span class="status-badge ${res.status || 'pending'}">
                    ${formatStatus(res.status || 'pending')}
                </span>
            </td>
            <td>${formatDate(res.createdAt)}</td>
            <td onclick="event.stopPropagation()">
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewReservationDetails('${res.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editReservation('${res.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deleteReservation('${res.id}')" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();
}

// ===== FORMAT STATUS =====
function formatStatus(status) {
    const statuses = {
        'pending': 'Pending',
        'confirmed': 'Confirmed',
        'completed': 'Completed',
        'cancelled': 'Cancelled'
    };
    return statuses[status] || status;
}

// ===== VIEW RESERVATION DETAILS =====
window.viewReservationDetails = function(reservationId) {
    const reservation = allReservations.find(r => r.id === reservationId);
    if (!reservation) return;

    currentReservationId = reservationId;
    
    // Set customer information
    document.getElementById('resCustomerName').textContent = reservation.customerName || 'N/A';
    document.getElementById('resCustomerPhone').textContent = reservation.customerPhone || 'N/A';
    document.getElementById('resCustomerEmail').textContent = reservation.customerEmail || 'N/A';
    
    // Set reservation details
    document.getElementById('resDate').textContent = formatDate(reservation.date);
    document.getElementById('resTime').textContent = reservation.time;
    document.getElementById('resGuests').textContent = reservation.guests;
    document.getElementById('resDuration').textContent = reservation.duration || 2;
    document.getElementById('resRequests').textContent = reservation.specialRequests || 'No special requests';

    // Build timeline
    buildTimeline(reservation);

    // Add status action buttons
    addReservationStatusButtons(reservation.status);

    document.getElementById('reservationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== BUILD TIMELINE =====
function buildTimeline(reservation) {
    const timeline = document.getElementById('resTimeline');
    
    const events = [
        { 
            status: 'created', 
            time: reservation.createdAt, 
            title: 'Reservation Created' 
        }
    ];
    
    if (reservation.status !== 'pending' || reservation.updatedAt) {
        events.push({ 
            status: reservation.status, 
            time: reservation.updatedAt || reservation.createdAt, 
            title: `Status changed to ${formatStatus(reservation.status)}` 
        });
    }

    timeline.innerHTML = events.map(event => `
        <div class="timeline-item ${event.status}">
            <div class="timeline-time">${formatDateTime(event.time)}</div>
            <div class="timeline-title">${event.title}</div>
        </div>
    `).join('');
}

// ===== ADD RESERVATION STATUS BUTTONS =====
function addReservationStatusButtons(currentStatus) {
    const container = document.getElementById('resStatusActions');
    if (!container) return;
    
    const statuses = [
        { value: 'pending', label: 'Pending', icon: 'clock', color: 'pending' },
        { value: 'confirmed', label: 'Confirm', icon: 'check-circle', color: 'confirmed' },
        { value: 'completed', label: 'Complete', icon: 'check-double', color: 'completed' },
        { value: 'cancelled', label: 'Cancel', icon: 'times-circle', color: 'cancelled' }
    ];
    
    container.innerHTML = statuses.map(status => `
        <button class="btn ${status.value === currentStatus ? 'btn-primary' : 'btn-outline'} ${status.color}" 
                onclick="updateReservationStatus('${status.value}')"
                ${status.value === currentStatus ? 'disabled' : ''}>
            <i class="fas fa-${status.icon}"></i> ${status.label}
        </button>
    `).join('');
}

// ===== CLOSE RESERVATION MODAL =====
window.closeReservationModal = function() {
    document.getElementById('reservationModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== UPDATE RESERVATION STATUS =====
window.updateReservationStatus = function(newStatus) {
    if (!currentReservationId) return;

    const index = allReservations.findIndex(r => r.id === currentReservationId);
    if (index === -1) return;

    // Update reservation status
    allReservations[index].status = newStatus;
    allReservations[index].updatedAt = new Date().toISOString();
    
    // Save to localStorage
    saveReservations();
    
    // Reload data
    loadReservations();
    
    // Close modal
    closeReservationModal();
    
    showNotification(`Reservation ${formatStatus(newStatus)}`, 'success');
}

// ===== OPEN ADD RESERVATION MODAL =====
window.openAddReservationModal = function() {
    currentReservationId = null;
    document.getElementById('addResModalTitle').textContent = 'Add New Reservation';
    document.getElementById('reservationForm').reset();
    document.getElementById('resId').value = '';
    
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('resDate').value = today;
    document.getElementById('resDate').min = today;
    
    document.getElementById('addReservationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== EDIT RESERVATION =====
window.editReservation = function(id) {
    const reservation = allReservations.find(r => r.id === id);
    if (!reservation) return;

    currentReservationId = id;
    document.getElementById('addResModalTitle').textContent = 'Edit Reservation';
    document.getElementById('resName').value = reservation.customerName || '';
    document.getElementById('resEmail').value = reservation.customerEmail || '';
    document.getElementById('resPhone').value = reservation.customerPhone || '';
    document.getElementById('resGuests').value = reservation.guests || '';
    document.getElementById('resDate').value = reservation.date || '';
    document.getElementById('resTime').value = reservation.time || '';
    document.getElementById('resDuration').value = reservation.duration || 2;
    document.getElementById('resStatus').value = reservation.status || 'pending';
    document.getElementById('resRequests').value = reservation.specialRequests || '';
    document.getElementById('resId').value = reservation.id;

    document.getElementById('addReservationModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE ADD RESERVATION MODAL =====
window.closeAddReservationModal = function() {
    document.getElementById('addReservationModal').classList.remove('active');
    document.getElementById('reservationForm').reset();
    document.body.style.overflow = '';
}

// ===== SAVE RESERVATION =====
window.saveReservation = function() {
    // Get form values
    const name = document.getElementById('resName').value.trim();
    const email = document.getElementById('resEmail').value.trim();
    const phone = document.getElementById('resPhone').value.trim();
    const guests = parseInt(document.getElementById('resGuests').value);
    const date = document.getElementById('resDate').value;
    const time = document.getElementById('resTime').value;
    const duration = parseFloat(document.getElementById('resDuration').value);
    const status = document.getElementById('resStatus').value;
    const requests = document.getElementById('resRequests').value.trim();

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

    const reservationData = {
        id: currentReservationId || generateReservationId(),
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        guests: guests,
        date: date,
        time: time,
        duration: duration,
        status: status,
        specialRequests: requests,
        updatedAt: new Date().toISOString()
    };

    if (!currentReservationId) {
        // Add new reservation
        reservationData.createdAt = new Date().toISOString();
        reservationData.customerId = null; // Manual entry by admin
        
        // Check availability (max 10 per slot)
        const sameDateTime = allReservations.filter(r => 
            r.date === date && 
            r.time === time && 
            r.status !== 'cancelled'
        );
        
        if (sameDateTime.length >= 10) {
            showNotification('This time slot is fully booked. Please choose another time.', 'error');
            return;
        }
        
        allReservations.push(reservationData);
        showNotification('Reservation added successfully', 'success');
    } else {
        // Update existing
        const index = allReservations.findIndex(r => r.id === currentReservationId);
        if (index !== -1) {
            // Preserve createdAt
            reservationData.createdAt = allReservations[index].createdAt;
            allReservations[index] = reservationData;
            showNotification('Reservation updated successfully', 'success');
        }
    }

    // Save to localStorage
    saveReservations();
    
    // Reload data
    loadReservations();
    
    // Close modal
    closeAddReservationModal();
}

// ===== GENERATE RESERVATION ID =====
function generateReservationId() {
    const prefix = 'RES';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}${timestamp}${random}`;
}

// ===== DELETE RESERVATION =====
window.deleteReservation = function(id) {
    if (confirm('Are you sure you want to delete this reservation? This action cannot be undone.')) {
        allReservations = allReservations.filter(r => r.id !== id);
        saveReservations();
        loadReservations();
        showNotification('Reservation deleted successfully', 'success');
    }
}

// ===== FILTER RESERVATIONS =====
window.filterReservations = function(status) {
    currentFilter.status = status;
    document.getElementById('statusFilter').value = status;
    applyFilters();
}

// ===== SEARCH RESERVATIONS =====
function searchReservations(query) {
    const searchTerm = query.toLowerCase();
    
    filteredReservations = allReservations.filter(res => 
        res.id?.toLowerCase().includes(searchTerm) ||
        res.customerName?.toLowerCase().includes(searchTerm) ||
        res.customerPhone?.includes(searchTerm) ||
        res.customerEmail?.toLowerCase().includes(searchTerm)
    );
    
    // Re-apply status filter
    if (currentFilter.status !== 'all') {
        filteredReservations = filteredReservations.filter(res => 
            res.status === currentFilter.status
        );
    }
    
    currentPage = 1;
    displayReservations();
}

// ===== FILTER BY DATE =====
function filterByDate(date) {
    currentFilter.date = date;
    
    if (!date) {
        filteredReservations = [...allReservations];
    } else {
        filteredReservations = allReservations.filter(res => res.date === date);
    }
    
    // Re-apply status filter
    if (currentFilter.status !== 'all') {
        filteredReservations = filteredReservations.filter(res => 
            res.status === currentFilter.status
        );
    }
    
    currentPage = 1;
    displayReservations();
}

// ===== TOGGLE VIEW =====
window.toggleView = function(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(view)) {
            btn.classList.add('active');
        }
    });
    
    // Show selected view
    document.getElementById('listView').classList.remove('active');
    document.getElementById('calendarView').classList.remove('active');
    document.getElementById(`${view}View`).classList.add('active');
    
    if (view === 'calendar') {
        renderCalendar();
    }
}

// ===== RENDER CALENDAR =====
function renderCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('currentMonthYear').textContent = 
        currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay(); // 0 = Sunday
    const monthLength = lastDay.getDate();
    const today = new Date();

    let html = '';

    // Weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        html += `<div class="calendar-weekday">${day}</div>`;
    });

    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dateStr = formatDateString(year, month - 1, day);
        html += `<div class="calendar-day other-month" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                </div>`;
    }

    // Current month days
    for (let i = 1; i <= monthLength; i++) {
        const dateStr = formatDateString(year, month, i);
        const isToday = today.getFullYear() === year && 
                       today.getMonth() === month && 
                       today.getDate() === i;
        
        // Get reservations for this day
        const dayReservations = allReservations.filter(r => r.date === dateStr);
        
        html += `<div class="calendar-day ${isToday ? 'today' : ''}" data-date="${dateStr}">
                    <div class="day-number">${i}</div>`;
        
        dayReservations.slice(0, 3).forEach(res => {
            html += `<div class="reservation-indicator ${res.status}" 
                         onclick="viewReservationDetails('${res.id}')"
                         title="${res.customerName} - ${res.time}">
                        ${res.time} ${res.customerName}
                    </div>`;
        });
        
        if (dayReservations.length > 3) {
            html += `<div class="reservation-indicator">+${dayReservations.length - 3} more</div>`;
        }
        
        html += `</div>`;
    }

    // Next month days
    const totalDays = startingDay + monthLength;
    const remainingDays = 42 - totalDays; // 6 rows * 7 days = 42
    for (let i = 1; i <= remainingDays; i++) {
        const dateStr = formatDateString(year, month + 1, i);
        html += `<div class="calendar-day other-month" data-date="${dateStr}">
                    <div class="day-number">${i}</div>
                </div>`;
    }

    calendarGrid.innerHTML = html;
    
    // Add click handlers to calendar days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.addEventListener('click', function(e) {
            if (!e.target.classList.contains('reservation-indicator')) {
                const date = this.dataset.date;
                if (date) {
                    document.getElementById('filterDate').value = date;
                    filterByDate(date);
                    toggleView('list');
                }
            }
        });
    });
}

// ===== FORMAT DATE STRING =====
function formatDateString(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ===== CHANGE MONTH =====
window.changeMonth = function(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    renderCalendar();
}

// ===== PRINT RESERVATION =====
window.printReservation = function() {
    const reservation = allReservations.find(r => r.id === currentReservationId);
    if (!reservation) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Reservation ${reservation.id}</title>
                <style>
                    body { 
                        font-family: 'Poppins', Arial, sans-serif; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto;
                    }
                    h1 { color: #8B4513; }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        margin-bottom: 30px;
                        border-bottom: 2px solid #8B4513;
                        padding-bottom: 20px;
                    }
                    .section { 
                        margin: 20px 0; 
                        padding: 20px; 
                        background: #f9f9f9; 
                        border-radius: 8px; 
                    }
                    .details p { margin: 5px 0; }
                    .status { 
                        display: inline-block;
                        padding: 5px 15px;
                        border-radius: 20px;
                        font-weight: 500;
                    }
                    .status.pending { background: #fff3cd; color: #856404; }
                    .status.confirmed { background: #d4edda; color: #155724; }
                    .status.completed { background: #cce5ff; color: #004085; }
                    .status.cancelled { background: #f8d7da; color: #721c24; }
                    .footer {
                        margin-top: 40px;
                        text-align: center;
                        color: #666;
                        font-style: italic;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Reservation #${reservation.id}</h1>
                    <div>
                        <p><strong>Status:</strong> 
                            <span class="status ${reservation.status}">${formatStatus(reservation.status)}</span>
                        </p>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Customer Information</h3>
                    <p><strong>Name:</strong> ${reservation.customerName}</p>
                    <p><strong>Phone:</strong> ${reservation.customerPhone}</p>
                    <p><strong>Email:</strong> ${reservation.customerEmail}</p>
                </div>
                
                <div class="section">
                    <h3>Reservation Details</h3>
                    <p><strong>Date:</strong> ${formatDate(reservation.date)}</p>
                    <p><strong>Time:</strong> ${reservation.time}</p>
                    <p><strong>Guests:</strong> ${reservation.guests}</p>
                    <p><strong>Duration:</strong> ${reservation.duration || 2} hours</p>
                </div>
                
                ${reservation.specialRequests ? `
                    <div class="section">
                        <h3>Special Requests</h3>
                        <p>${reservation.specialRequests}</p>
                    </div>
                ` : ''}
                
                <div class="footer">
                    <p>Created: ${formatDateTime(reservation.createdAt)}</p>
                    ${reservation.updatedAt ? `<p>Last updated: ${formatDateTime(reservation.updatedAt)}</p>` : ''}
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const pageNumbers = document.getElementById('pageNumbers');
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');

    if (prevBtn) prevBtn.disabled = currentPage === 1 || totalPages === 0;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

    if (!pageNumbers) return;

    if (totalPages === 0) {
        pageNumbers.innerHTML = '<span class="page-number active">1</span>';
        return;
    }

    let pagesHtml = '';
    for (let i = 1; i <= totalPages; i++) {
        pagesHtml += `
            <span class="page-number ${i === currentPage ? 'active' : ''}" 
                  onclick="goToPage(${i})">${i}</span>
        `;
    }
    pageNumbers.innerHTML = pagesHtml;
}

// ===== GO TO PAGE =====
window.goToPage = function(page) {
    currentPage = page;
    displayReservations();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search
    document.getElementById('searchReservations')?.addEventListener('input', debounce(function(e) {
        searchReservations(e.target.value);
    }, 500));
    
    // Status filter
    document.getElementById('statusFilter')?.addEventListener('change', function(e) {
        currentFilter.status = e.target.value;
        applyFilters();
    });
    
    // Date filter
    document.getElementById('filterDate')?.addEventListener('change', function(e) {
        filterByDate(e.target.value);
    });
    
    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayReservations();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayReservations();
        }
    });
    
    // Storage events (cross-tab updates)
    window.addEventListener('storage', function(e) {
        if (e.key === 'markanReservations') {
            loadReservations();
        }
    });
    
    // Close modals on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            if (document.getElementById('reservationModal').classList.contains('active')) {
                closeReservationModal();
            }
            if (document.getElementById('addReservationModal').classList.contains('active')) {
                closeAddReservationModal();
            }
        }
    });
    
    // Click outside modal to close
    window.addEventListener('click', function(e) {
        const resModal = document.getElementById('reservationModal');
        const addModal = document.getElementById('addReservationModal');
        
        if (e.target === resModal) {
            closeReservationModal();
        }
        if (e.target === addModal) {
            closeAddReservationModal();
        }
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}

// ===== HELPER: FORMAT DATE =====
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// ===== HELPER: FORMAT DATE TIME =====
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===== HELPER: DEBOUNCE =====
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

// ===== SHOW NOTIFICATION =====
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

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterReservations = filterReservations;
window.viewReservationDetails = viewReservationDetails;
window.closeReservationModal = closeReservationModal;
window.updateReservationStatus = updateReservationStatus;
window.openAddReservationModal = openAddReservationModal;
window.editReservation = editReservation;
window.closeAddReservationModal = closeAddReservationModal;
window.saveReservation = saveReservation;
window.deleteReservation = deleteReservation;
window.toggleView = toggleView;
window.changeMonth = changeMonth;
window.printReservation = printReservation;
window.goToPage = goToPage;