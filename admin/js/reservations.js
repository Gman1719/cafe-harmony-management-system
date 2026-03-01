// admin/js/reservations.js - Reservations Management
// Markan Cafe Admin - Complete reservation system with localStorage
// ALL DATA IS DYNAMIC - NO HARDCODING

// ===== GLOBAL VARIABLES =====
let allReservations = [];
let filteredReservations = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentStatusFilter = 'all';
let currentDateFilter = '';
let currentSearchTerm = '';
let currentView = 'list';
let currentMonth = new Date();
let selectedReservationId = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('📅 Reservations Management initializing...');
    
    // Check authentication
    if (!checkAuth()) return;
    
    // Set admin name
    const user = getCurrentUser();
    if (user) {
        const adminNameEl = document.getElementById('adminName');
        if (adminNameEl) adminNameEl.textContent = user.name;
    }
    
    // Initialize reservations database
    initializeReservationsDB();
    
    // Load reservations
    loadReservations();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load notification count
    loadNotificationCount();
    
    // Set default date filter to today
    const today = new Date().toISOString().split('T')[0];
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.value = today;
        currentDateFilter = today;
    }
});

// ===== GET CURRENT USER =====
function getCurrentUser() {
    try {
        const userStr = localStorage.getItem('markanUser');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Error getting current user:', e);
        return null;
    }
}

// ===== CHECK AUTHENTICATION =====
function checkAuth() {
    const userStr = localStorage.getItem('markanUser');
    if (!userStr) {
        window.location.replace('../../login.html');
        return false;
    }
    
    try {
        const user = JSON.parse(userStr);
        if (user.role !== 'admin') {
            window.location.replace('../../customer/html/dashboard.html');
            return false;
        }
        return true;
    } catch (e) {
        console.error('Auth error:', e);
        window.location.replace('../../login.html');
        return false;
    }
}

// ===== INITIALIZE RESERVATIONS DATABASE =====
function initializeReservationsDB() {
    // Check if ReservationsDB already exists
    if (typeof window.ReservationsDB !== 'undefined' && window.ReservationsDB) {
        console.log('✅ ReservationsDB already exists');
        return;
    }
    
    console.log('Creating ReservationsDB...');
    
    // Create ReservationsDB
    window.ReservationsDB = {
        reservations: [],
        
        getAll() {
            return this.reservations;
        },
        
        getById(id) {
            return this.reservations.find(res => res.id === id);
        },
        
        getByDate(date) {
            return this.reservations.filter(res => res.date === date);
        },
        
        getByDateRange(startDate, endDate) {
            const start = new Date(startDate).setHours(0, 0, 0, 0);
            const end = new Date(endDate).setHours(23, 59, 59, 999);
            
            return this.reservations.filter(res => {
                const resDateTime = new Date(res.date + 'T' + res.time).getTime();
                return resDateTime >= start && resDateTime <= end;
            });
        },
        
        getByStatus(status) {
            if (status === 'all') return this.reservations;
            return this.reservations.filter(res => res.status === status);
        },
        
        getByCustomerId(customerId) {
            return this.reservations.filter(res => res.customerId == customerId);
        },
        
        getUpcoming(limit = 10) {
            const today = new Date().toISOString().split('T')[0];
            return this.reservations
                .filter(res => res.date >= today && res.status !== 'cancelled')
                .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
                .slice(0, limit);
        },
        
        add(reservation) {
            reservation.id = this.generateId();
            reservation.createdAt = reservation.createdAt || new Date().toISOString();
            reservation.updatedAt = new Date().toISOString();
            this.reservations.push(reservation);
            this.saveToStorage();
            return reservation;
        },
        
        update(id, updates) {
            const index = this.reservations.findIndex(res => res.id === id);
            if (index !== -1) {
                updates.updatedAt = new Date().toISOString();
                this.reservations[index] = { ...this.reservations[index], ...updates };
                this.saveToStorage();
                return this.reservations[index];
            }
            return null;
        },
        
        updateStatus(id, status) {
            return this.update(id, { status });
        },
        
        delete(id) {
            const index = this.reservations.findIndex(res => res.id === id);
            if (index !== -1) {
                this.reservations.splice(index, 1);
                this.saveToStorage();
                return true;
            }
            return false;
        },
        
        generateId() {
            return 'RES-' + Date.now().toString().slice(-6) + 
                   Math.random().toString(36).substr(2, 3).toUpperCase();
        },
        
        getStats() {
            return {
                pending: this.reservations.filter(r => r.status === 'pending').length,
                confirmed: this.reservations.filter(r => r.status === 'confirmed').length,
                completed: this.reservations.filter(r => r.status === 'completed').length,
                cancelled: this.reservations.filter(r => r.status === 'cancelled').length,
                total: this.reservations.length
            };
        },
        
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
        
        saveToStorage() {
            localStorage.setItem('markanReservations', JSON.stringify(this.reservations));
            console.log('💾 Reservations saved to localStorage');
        },
        
        loadFromStorage() {
            const saved = localStorage.getItem('markanReservations');
            if (saved) {
                try {
                    this.reservations = JSON.parse(saved);
                    console.log('✅ Reservations loaded from localStorage:', this.reservations.length, 'reservations');
                } catch (e) {
                    console.error('Error loading reservations:', e);
                    this.reservations = [];
                    this.createSampleReservations();
                }
            } else {
                // Create sample reservations if no data exists
                this.createSampleReservations();
            }
        },
        
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
                    createdAt: new Date(today.setHours(10, 30)).toISOString(),
                    updatedAt: new Date().toISOString()
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
                    createdAt: new Date(today.setHours(14, 15)).toISOString(),
                    updatedAt: new Date().toISOString()
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
                    createdAt: new Date(tomorrow.setHours(9, 45)).toISOString(),
                    updatedAt: new Date().toISOString()
                },
                {
                    id: 'RES-123459-JKL',
                    customerId: 5,
                    customerName: 'Anna Williams',
                    customerEmail: 'anna@example.com',
                    customerPhone: '0945678901',
                    guests: 3,
                    date: formatDate(nextWeek),
                    time: '13:00',
                    duration: 2,
                    status: 'pending',
                    specialRequests: 'Allergic to nuts',
                    createdAt: new Date(nextWeek.setHours(11, 20)).toISOString(),
                    updatedAt: new Date().toISOString()
                }
            ];
            this.saveToStorage();
            console.log('✅ Sample reservations created');
        }
    };
    
    // Load data from localStorage
    window.ReservationsDB.loadFromStorage();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchReservations');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            currentSearchTerm = e.target.value.toLowerCase();
            currentPage = 1;
            filterReservations();
        });
    }
    
    // Date filter
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.addEventListener('change', function(e) {
            currentDateFilter = e.target.value;
            currentPage = 1;
            filterReservations();
        });
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function(e) {
            currentStatusFilter = e.target.value;
            currentPage = 1;
            filterReservations();
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (typeof Auth !== 'undefined' && Auth.logout) {
                Auth.logout();
            } else {
                localStorage.removeItem('markanUser');
                window.location.href = '../../login.html';
            }
        });
    }
    
    // Pagination buttons
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                displayReservations();
                updatePagination();
            }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                displayReservations();
                updatePagination();
            }
        });
    }
}

// ===== LOAD RESERVATIONS =====
function loadReservations() {
    if (typeof window.ReservationsDB !== 'undefined' && window.ReservationsDB) {
        allReservations = window.ReservationsDB.getAll() || [];
        console.log('📊 Loaded', allReservations.length, 'reservations');
    } else {
        console.warn('ReservationsDB not available');
        allReservations = [];
    }
    
    updateStats();
    filterReservations();
    updateCalendar();
}

// ===== UPDATE STATS CARDS =====
function updateStats() {
    const stats = {
        pending: allReservations.filter(r => r.status === 'pending').length,
        confirmed: allReservations.filter(r => r.status === 'confirmed').length,
        completed: allReservations.filter(r => r.status === 'completed').length,
        cancelled: allReservations.filter(r => r.status === 'cancelled').length
    };
    
    const pendingEl = document.getElementById('pendingReservations');
    const confirmedEl = document.getElementById('confirmedReservations');
    const completedEl = document.getElementById('completedReservations');
    const cancelledEl = document.getElementById('cancelledReservations');
    
    if (pendingEl) pendingEl.textContent = stats.pending;
    if (confirmedEl) confirmedEl.textContent = stats.confirmed;
    if (completedEl) completedEl.textContent = stats.completed;
    if (cancelledEl) cancelledEl.textContent = stats.cancelled;
}

// ===== FILTER RESERVATIONS =====
function filterReservations(status) {
    if (status) {
        currentStatusFilter = status;
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) statusFilter.value = status;
    }
    
    let filtered = [...allReservations];
    
    // Apply status filter
    if (currentStatusFilter !== 'all') {
        filtered = filtered.filter(r => r.status === currentStatusFilter);
    }
    
    // Apply date filter
    if (currentDateFilter) {
        filtered = filtered.filter(r => r.date === currentDateFilter);
    }
    
    // Apply search
    if (currentSearchTerm) {
        filtered = filtered.filter(r => 
            (r.id && r.id.toLowerCase().includes(currentSearchTerm)) ||
            (r.customerName && r.customerName.toLowerCase().includes(currentSearchTerm)) ||
            (r.customerEmail && r.customerEmail.toLowerCase().includes(currentSearchTerm)) ||
            (r.customerPhone && r.customerPhone.includes(currentSearchTerm))
        );
    }
    
    filteredReservations = filtered;
    currentPage = 1;
    displayReservations();
    updatePagination();
}

// ===== DISPLAY RESERVATIONS IN TABLE =====
function displayReservations() {
    const tbody = document.getElementById('reservationsTableBody');
    if (!tbody) return;
    
    if (filteredReservations.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Reservations Found</h3>
                    <p>${allReservations.length === 0 ? 'No reservations have been made yet' : 'No reservations match your filters'}</p>
                </td>
            </tr>
        `;
        return;
    }
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageReservations = filteredReservations.slice(start, end);
    
    tbody.innerHTML = pageReservations.map(res => {
        const timeAgo = getTimeAgo(new Date(res.createdAt));
        
        return `
            <tr onclick="openReservationModal('${res.id}')">
                <td><span class="reservation-id">#${res.id}</span></td>
                <td>
                    <div class="customer-info">
                        <span class="customer-name">${res.customerName || 'N/A'}</span>
                        <span class="customer-phone">${res.customerPhone || ''}</span>
                    </div>
                </td>
                <td>
                    <div class="datetime-info">
                        <span class="date">${formatDate(res.date)}</span>
                        <span class="time">${formatTime(res.time)}</span>
                    </div>
                </td>
                <td><span class="guests-badge"><i class="fas fa-users"></i> ${res.guests || 1}</span></td>
                <td>${res.duration || 2} hr</td>
                <td><span class="status-badge status-${res.status || 'pending'}">${res.status || 'pending'}</span></td>
                <td><span class="time-ago"><i class="far fa-clock"></i> ${timeAgo}</span></td>
                <td>
                    <div class="action-buttons" onclick="event.stopPropagation()">
                        <button class="action-btn view-btn-action" onclick="openReservationModal('${res.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn-action" onclick="openEditReservationModal('${res.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn status-btn-action" onclick="openStatusModal('${res.id}')" title="Update Status">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageNumbers = document.getElementById('pageNumbers');
    
    if (prevBtn) prevBtn.disabled = currentPage === 1;
    if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    if (!pageNumbers) return;
    
    if (totalPages === 0) {
        pageNumbers.innerHTML = '';
        return;
    }
    
    // Generate page numbers
    let pageHtml = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        pageHtml += `<span class="page-number ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</span>`;
    }
    
    pageNumbers.innerHTML = pageHtml;
}

// ===== GO TO SPECIFIC PAGE =====
function goToPage(page) {
    currentPage = page;
    displayReservations();
    updatePagination();
}

// ===== TOGGLE VIEW (LIST/CALENDAR) =====
function toggleView(view) {
    currentView = view;
    
    // Update toggle buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`[onclick="toggleView('${view}')"]`);
    if (activeBtn) activeBtn.classList.add('active');
    
    // Show/hide views
    const listView = document.getElementById('listView');
    const calendarView = document.getElementById('calendarView');
    
    if (listView) listView.classList.toggle('active', view === 'list');
    if (calendarView) calendarView.classList.toggle('active', view === 'calendar');
    
    if (view === 'calendar') {
        updateCalendar();
    }
}

// ===== UPDATE CALENDAR =====
function updateCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    const monthYearEl = document.getElementById('currentMonthYear');
    
    if (!calendarGrid || !monthYearEl) return;
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update month/year display
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    monthYearEl.textContent = `${monthNames[month]} ${year}`;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Get reservations for this month
    const monthReservations = allReservations.filter(res => {
        if (!res.date) return false;
        const resDate = new Date(res.date);
        return resDate.getMonth() === month && resDate.getFullYear() === year;
    });
    
    // Group reservations by date
    const reservationsByDate = {};
    monthReservations.forEach(res => {
        if (!reservationsByDate[res.date]) {
            reservationsByDate[res.date] = [];
        }
        reservationsByDate[res.date].push(res);
    });
    
    // Generate calendar grid
    let calendarHtml = '';
    
    // Add weekday headers
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    weekdays.forEach(day => {
        calendarHtml += `<div class="calendar-weekday">${day}</div>`;
    });
    
    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarHtml += '<div class="calendar-day empty"></div>';
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayReservations = reservationsByDate[dateStr] || [];
        
        let dayClass = 'calendar-day';
        if (dayReservations.length > 0) dayClass += ' has-reservations';
        
        calendarHtml += `<div class="${dayClass}" onclick="viewDateReservations('${dateStr}')">`;
        calendarHtml += `<div class="day-number">${day}</div>`;
        
        if (dayReservations.length > 0) {
            calendarHtml += '<div class="day-reservations">';
            
            // Show up to 3 reservations per day
            dayReservations.slice(0, 3).forEach(res => {
                calendarHtml += `<div class="day-reservation res-${res.status || 'pending'}">${res.time} - ${res.customerName}</div>`;
            });
            
            if (dayReservations.length > 3) {
                calendarHtml += `<div class="day-reservation more">+${dayReservations.length - 3} more</div>`;
            }
            
            calendarHtml += '</div>';
        }
        
        calendarHtml += '</div>';
    }
    
    calendarGrid.innerHTML = calendarHtml;
}

// ===== CHANGE MONTH =====
function changeMonth(delta) {
    currentMonth.setMonth(currentMonth.getMonth() + delta);
    updateCalendar();
}

// ===== VIEW RESERVATIONS FOR SELECTED DATE =====
function viewDateReservations(date) {
    // Switch to list view and filter by date
    toggleView('list');
    const filterDate = document.getElementById('filterDate');
    if (filterDate) {
        filterDate.value = date;
        currentDateFilter = date;
        filterReservations();
    }
}

// ===== OPEN RESERVATION DETAILS MODAL =====
function openReservationModal(reservationId) {
    const res = allReservations.find(r => r.id === reservationId);
    if (!res) return;
    
    selectedReservationId = reservationId;
    
    // Set customer information
    const nameEl = document.getElementById('resCustomerName');
    const phoneEl = document.getElementById('resCustomerPhone');
    const emailEl = document.getElementById('resCustomerEmail');
    
    if (nameEl) nameEl.textContent = res.customerName || 'N/A';
    if (phoneEl) phoneEl.textContent = res.customerPhone || 'N/A';
    if (emailEl) emailEl.textContent = res.customerEmail || 'N/A';
    
    // Set reservation details
    const dateEl = document.getElementById('resDate');
    const timeEl = document.getElementById('resTime');
    const guestsEl = document.getElementById('resGuests');
    const durationEl = document.getElementById('resDuration');
    const requestsEl = document.getElementById('resRequests');
    
    if (dateEl) dateEl.textContent = formatDate(res.date);
    if (timeEl) timeEl.textContent = formatTime(res.time);
    if (guestsEl) guestsEl.textContent = res.guests || 1;
    if (durationEl) durationEl.textContent = res.duration || 2;
    if (requestsEl) requestsEl.textContent = res.specialRequests || 'No special requests';
    
    // Create timeline
    createTimeline(res);
    
    // Add status action buttons
    const statusActions = document.getElementById('resStatusActions');
    if (statusActions) {
        statusActions.innerHTML = `
            ${res.status !== 'pending' ? '<button class="status-action-btn pending" onclick="updateReservationStatus(\'pending\')">Pending</button>' : ''}
            ${res.status !== 'confirmed' ? '<button class="status-action-btn confirmed" onclick="updateReservationStatus(\'confirmed\')">Confirmed</button>' : ''}
            ${res.status !== 'completed' ? '<button class="status-action-btn completed" onclick="updateReservationStatus(\'completed\')">Completed</button>' : ''}
            ${res.status !== 'cancelled' ? '<button class="status-action-btn cancelled" onclick="updateReservationStatus(\'cancelled\')">Cancelled</button>' : ''}
        `;
    }
    
    const modal = document.getElementById('reservationModal');
    if (modal) modal.classList.add('active');
}

// ===== CREATE RESERVATION TIMELINE =====
function createTimeline(res) {
    const timeline = document.getElementById('resTimeline');
    if (!timeline) return;
    
    const events = [
        {
            status: 'created',
            label: 'Reservation Created',
            time: res.createdAt,
            icon: 'fa-plus-circle'
        }
    ];
    
    if (res.status === 'confirmed' || res.status === 'completed' || res.status === 'cancelled') {
        events.push({
            status: 'confirmed',
            label: 'Reservation Confirmed',
            time: res.updatedAt || res.createdAt,
            icon: 'fa-check-circle'
        });
    }
    
    if (res.status === 'completed') {
        events.push({
            status: 'completed',
            label: 'Reservation Completed',
            time: res.updatedAt,
            icon: 'fa-check-double'
        });
    }
    
    if (res.status === 'cancelled') {
        events.push({
            status: 'cancelled',
            label: 'Reservation Cancelled',
            time: res.updatedAt,
            icon: 'fa-times-circle'
        });
    }
    
    timeline.innerHTML = events.map(event => `
        <div class="timeline-item ${event.status}">
            <div class="timeline-content">
                <p><strong>${event.label}</strong></p>
                <p>${formatDateTime(event.time)}</p>
                <small>${getTimeAgo(new Date(event.time))}</small>
            </div>
        </div>
    `).join('');
}

function closeReservationModal() {
    const modal = document.getElementById('reservationModal');
    if (modal) modal.classList.remove('active');
}

// ===== OPEN ADD RESERVATION MODAL =====
function openAddReservationModal() {
    const titleEl = document.getElementById('addResModalTitle');
    const form = document.getElementById('reservationForm');
    const resId = document.getElementById('resId');
    const resDate = document.getElementById('resDate');
    
    if (titleEl) titleEl.textContent = 'Add New Reservation';
    if (form) form.reset();
    if (resId) resId.value = '';
    
    // Set min date to today
    const today = new Date().toISOString().split('T')[0];
    if (resDate) {
        resDate.min = today;
        resDate.value = today;
    }
    
    const modal = document.getElementById('addReservationModal');
    if (modal) modal.classList.add('active');
}

// ===== OPEN EDIT RESERVATION MODAL =====
function openEditReservationModal(reservationId) {
    const res = allReservations.find(r => r.id === reservationId);
    if (!res) return;
    
    const titleEl = document.getElementById('addResModalTitle');
    const idEl = document.getElementById('resId');
    const nameEl = document.getElementById('resName');
    const emailEl = document.getElementById('resEmail');
    const phoneEl = document.getElementById('resPhone');
    const guestsEl = document.getElementById('resGuests');
    const dateEl = document.getElementById('resDate');
    const timeEl = document.getElementById('resTime');
    const durationEl = document.getElementById('resDuration');
    const statusEl = document.getElementById('resStatus');
    const requestsEl = document.getElementById('resRequests');
    
    if (titleEl) titleEl.textContent = 'Edit Reservation';
    if (idEl) idEl.value = res.id;
    if (nameEl) nameEl.value = res.customerName || '';
    if (emailEl) emailEl.value = res.customerEmail || '';
    if (phoneEl) phoneEl.value = res.customerPhone || '';
    if (guestsEl) guestsEl.value = res.guests || 1;
    if (dateEl) dateEl.value = res.date || '';
    if (timeEl) timeEl.value = res.time || '';
    if (durationEl) durationEl.value = res.duration || 2;
    if (statusEl) statusEl.value = res.status || 'pending';
    if (requestsEl) requestsEl.value = res.specialRequests || '';
    
    const modal = document.getElementById('addReservationModal');
    if (modal) modal.classList.add('active');
}

function closeAddReservationModal() {
    const modal = document.getElementById('addReservationModal');
    if (modal) modal.classList.remove('active');
}

// ===== SAVE RESERVATION (CREATE/UPDATE) =====
function saveReservation() {
    console.log('🔍 saveReservation called');
    
    // Get form values
    const name = document.getElementById('resName')?.value.trim();
    const email = document.getElementById('resEmail')?.value.trim();
    const phone = document.getElementById('resPhone')?.value.trim();
    const guests = parseInt(document.getElementById('resGuests')?.value);
    const date = document.getElementById('resDate')?.value;
    const time = document.getElementById('resTime')?.value;
    const duration = parseFloat(document.getElementById('resDuration')?.value);
    const status = document.getElementById('resStatus')?.value;
    const requests = document.getElementById('resRequests')?.value.trim();
    const id = document.getElementById('resId')?.value;
    
    console.log('Form values:', { name, email, phone, guests, date, time, duration, status, requests, id });
    
    // Validation
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
    
    // Validate phone (Ethiopian format)
    const phoneRegex = /^(09|\+2519)\d{8}$/;
    if (!phoneRegex.test(phone)) {
        showNotification('Please enter a valid Ethiopian phone number (09XXXXXXXX or +2519XXXXXXXX)', 'error');
        return;
    }
    
    // Check if ReservationsDB exists
    if (typeof window.ReservationsDB === 'undefined' || !window.ReservationsDB) {
        showNotification('Reservation system not available', 'error');
        return;
    }
    
    // Check availability for new reservations
    if (!id) {
        const availability = window.ReservationsDB.checkAvailability(date, time, guests);
        if (!availability.available) {
            showNotification(`This time slot is full. Only ${availability.remaining} spots left.`, 'error');
            return;
        }
    }
    
    const reservationData = {
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        guests: guests,
        date: date,
        time: time,
        duration: duration,
        status: status,
        specialRequests: requests
    };
    
    if (id) {
        // Update existing reservation
        const updated = window.ReservationsDB.update(id, reservationData);
        if (updated) {
            showNotification('Reservation updated successfully', 'success');
        } else {
            showNotification('Failed to update reservation', 'error');
            return;
        }
    } else {
        // Create new reservation
        // Try to find customer by email to link
        const usersStr = localStorage.getItem('markanUsers');
        if (usersStr) {
            try {
                const users = JSON.parse(usersStr);
                const customer = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
                if (customer) {
                    reservationData.customerId = customer.id;
                }
            } catch (e) {
                console.error('Error finding customer:', e);
            }
        }
        
        const newRes = window.ReservationsDB.add(reservationData);
        if (newRes) {
            showNotification('Reservation created successfully', 'success');
        } else {
            showNotification('Failed to create reservation', 'error');
            return;
        }
    }
    
    // Reload reservations
    loadReservations();
    closeAddReservationModal();
}

// ===== OPEN STATUS UPDATE MODAL =====
function openStatusModal(reservationId) {
    selectedReservationId = reservationId;
    
    // Remove existing modal if any
    const existingModal = document.getElementById('statusModal');
    if (existingModal) existingModal.remove();
    
    // Create status options modal dynamically
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'statusModal';
    modal.innerHTML = `
        <div class="modal-content modal-sm">
            <div class="modal-header">
                <h3>Update Reservation Status</h3>
                <button class="modal-close" onclick="closeStatusModal()"><i class="fas fa-times"></i></button>
            </div>
            <div class="modal-body">
                <div class="status-options">
                    <button class="status-option pending" onclick="updateReservationStatus('pending')">
                        <i class="fas fa-clock"></i> Pending
                    </button>
                    <button class="status-option confirmed" onclick="updateReservationStatus('confirmed')">
                        <i class="fas fa-check-circle"></i> Confirmed
                    </button>
                    <button class="status-option completed" onclick="updateReservationStatus('completed')">
                        <i class="fas fa-check-double"></i> Completed
                    </button>
                    <button class="status-option cancelled" onclick="updateReservationStatus('cancelled')">
                        <i class="fas fa-times-circle"></i> Cancelled
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closeStatusModal() {
    const modal = document.getElementById('statusModal');
    if (modal) modal.remove();
}

// ===== UPDATE RESERVATION STATUS =====
function updateReservationStatus(newStatus) {
    if (!selectedReservationId) return;
    
    if (typeof window.ReservationsDB === 'undefined' || !window.ReservationsDB) {
        showNotification('Reservation system not available', 'error');
        closeStatusModal();
        return;
    }
    
    const updated = window.ReservationsDB.updateStatus(selectedReservationId, newStatus);
    if (updated) {
        showNotification(`Reservation status updated to ${newStatus}`, 'success');
        
        // Reload reservations
        allReservations = window.ReservationsDB.getAll();
        updateStats();
        filterReservations();
        updateCalendar();
        
        // Close modals
        closeReservationModal();
        closeStatusModal();
    } else {
        showNotification('Failed to update reservation status', 'error');
    }
}

// ===== PRINT RESERVATION =====
function printReservation() {
    const res = allReservations.find(r => r.id === selectedReservationId);
    if (!res) return;
    
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
        <html>
            <head>
                <title>Reservation #${res.id} - Markan Cafe</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; max-width: 800px; margin: 0 auto; }
                    .header { text-align: center; border-bottom: 2px solid #4a2c1a; padding: 20px; }
                    .header h1 { color: #4a2c1a; margin: 0; }
                    .header p { color: #666; margin: 5px 0; }
                    .section { margin: 20px 0; padding: 15px; border: 1px solid #e6d5b8; border-radius: 8px; }
                    .section h3 { color: #4a2c1a; margin-top: 0; border-bottom: 1px solid #e6d5b8; padding-bottom: 5px; }
                    .row { display: flex; margin: 10px 0; }
                    .label { font-weight: bold; width: 150px; color: #666; }
                    .value { flex: 1; color: #333; }
                    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9em; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Markan Cafe</h1>
                    <p>Debre Birhan University</p>
                    <h2>Reservation #${res.id}</h2>
                </div>
                
                <div class="section">
                    <h3>Customer Information</h3>
                    <div class="row">
                        <span class="label">Name:</span>
                        <span class="value">${res.customerName || 'N/A'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Phone:</span>
                        <span class="value">${res.customerPhone || 'N/A'}</span>
                    </div>
                    <div class="row">
                        <span class="label">Email:</span>
                        <span class="value">${res.customerEmail || 'N/A'}</span>
                    </div>
                </div>
                
                <div class="section">
                    <h3>Reservation Details</h3>
                    <div class="row">
                        <span class="label">Date:</span>
                        <span class="value">${formatDate(res.date)}</span>
                    </div>
                    <div class="row">
                        <span class="label">Time:</span>
                        <span class="value">${formatTime(res.time)}</span>
                    </div>
                    <div class="row">
                        <span class="label">Guests:</span>
                        <span class="value">${res.guests || 1}</span>
                    </div>
                    <div class="row">
                        <span class="label">Duration:</span>
                        <span class="value">${res.duration || 2} hours</span>
                    </div>
                    <div class="row">
                        <span class="label">Status:</span>
                        <span class="value">${res.status || 'pending'}</span>
                    </div>
                </div>
                
                ${res.specialRequests ? `
                <div class="section">
                    <h3>Special Requests</h3>
                    <p>${res.specialRequests}</p>
                </div>
                ` : ''}
                
                <div class="footer">
                    <p>Thank you for choosing Markan Cafe!</p>
                    <p>Printed on ${new Date().toLocaleString()}</p>
                </div>
            </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
}

// ===== LOAD NOTIFICATION COUNT =====
function loadNotificationCount() {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = allReservations.filter(r => r.date === today && r.status !== 'cancelled').length;
    const pendingCount = allReservations.filter(r => r.status === 'pending').length;
    
    const total = todayReservations + pendingCount;
    const badge = document.getElementById('notificationCount');
    if (badge) {
        badge.textContent = total;
        badge.style.display = total > 0 ? 'block' : 'none';
    }
}

// ===== UTILITY FUNCTIONS =====
function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch (e) {
        return dateStr;
    }
}

function formatTime(timeStr) {
    if (!timeStr) return 'N/A';
    return timeStr;
}

function formatDateTime(dateTimeStr) {
    if (!dateTimeStr) return 'N/A';
    try {
        const date = new Date(dateTimeStr);
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (e) {
        return dateTimeStr;
    }
}

function getTimeAgo(date) {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
}

// ===== SHOW NOTIFICATION =====
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        // Create container if it doesn't exist
        const newContainer = document.createElement('div');
        newContainer.id = 'notificationContainer';
        document.body.appendChild(newContainer);
    }
    
    const notifContainer = document.getElementById('notificationContainer');
    if (!notifContainer) return;

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

    notifContainer.appendChild(notification);

    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.filterReservations = filterReservations;
window.toggleView = toggleView;
window.changeMonth = changeMonth;
window.openReservationModal = openReservationModal;
window.closeReservationModal = closeReservationModal;
window.openAddReservationModal = openAddReservationModal;
window.openEditReservationModal = openEditReservationModal;
window.closeAddReservationModal = closeAddReservationModal;
window.saveReservation = saveReservation;
window.openStatusModal = openStatusModal;
window.closeStatusModal = closeStatusModal;
window.updateReservationStatus = updateReservationStatus;
window.printReservation = printReservation;
window.goToPage = goToPage;
window.viewDateReservations = viewDateReservations;
window.showNotification = showNotification;