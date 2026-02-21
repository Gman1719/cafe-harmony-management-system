// js/admin/billing.js - Admin Billing Logic
// Markan Cafe - Debre Birhan University

// Check admin authentication
if (!Auth.requireAdmin()) {
    window.location.href = '../login.html';
}

// Global variables
let invoices = [];
let orders = [];
let currentInvoiceId = null;

// Initialize billing page
document.addEventListener('DOMContentLoaded', function() {
    updateAdminName();
    loadData();
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

// Load data from localStorage
function loadData() {
    // Load orders
    const storedOrders = localStorage.getItem('markanOrders');
    orders = storedOrders ? JSON.parse(storedOrders) : [];
    
    // Load invoices from localStorage
    const storedInvoices = localStorage.getItem('markanInvoices');
    if (storedInvoices) {
        invoices = JSON.parse(storedInvoices);
    } else {
        // Default invoices if none exist
        invoices = [
            {
                id: 'INV-1001',
                orderId: 'ORD-1001',
                customerName: 'John Customer',
                date: '2025-02-20',
                amount: 45.50,
                status: 'paid',
                items: [
                    { name: 'Ethiopian Coffee', quantity: 2, price: 4.50 },
                    { name: 'Sambusa', quantity: 1, price: 3.50 }
                ]
            },
            {
                id: 'INV-1002',
                orderId: 'ORD-1002',
                customerName: 'Sarah Wilson',
                date: '2025-02-20',
                amount: 32.80,
                status: 'paid',
                items: [
                    { name: 'Doro Wat', quantity: 1, price: 12.99 },
                    { name: 'Injera', quantity: 2, price: 2.50 }
                ]
            }
        ];
        localStorage.setItem('markanInvoices', JSON.stringify(invoices));
    }
    
    updateStats();
    populateOrderSelect();
    displayInvoices(invoices);
}

// Update statistics
function updateStats() {
    const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.amount || 0), 0);
    const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
    const pendingInvoices = invoices.filter(inv => inv.status === 'pending').length;

    const totalRevenueEl = document.getElementById('totalRevenue');
    const totalInvoicesEl = document.getElementById('totalInvoices');
    const paidInvoicesEl = document.getElementById('paidInvoices');
    const pendingInvoicesEl = document.getElementById('pendingInvoices');

    if (totalRevenueEl) totalRevenueEl.textContent = formatCurrency(totalRevenue);
    if (totalInvoicesEl) totalInvoicesEl.textContent = invoices.length;
    if (paidInvoicesEl) paidInvoicesEl.textContent = paidInvoices;
    if (pendingInvoicesEl) pendingInvoicesEl.textContent = pendingInvoices;
}

// Populate order select dropdown
function populateOrderSelect() {
    const select = document.getElementById('orderSelect');
    if (!select) return;
    
    // Get completed orders that don't have invoices yet
    const completedOrders = orders.filter(o => o.status === 'completed');
    const invoicedOrderIds = invoices.map(inv => inv.orderId);
    const availableOrders = completedOrders.filter(o => !invoicedOrderIds.includes(o.id));

    select.innerHTML = '<option value="">Select Order to Invoice</option>';
    
    if (availableOrders.length === 0) {
        select.innerHTML += '<option value="" disabled>No available orders</option>';
        return;
    }
    
    availableOrders.forEach(order => {
        const option = document.createElement('option');
        option.value = order.id;
        option.textContent = `${order.id} - ${order.customerName || 'Guest'} - ${formatCurrency(order.total || 0)}`;
        select.appendChild(option);
    });
}

// Generate new invoice
window.generateInvoice = function() {
    const orderId = document.getElementById('orderSelect')?.value;
    if (!orderId) {
        showNotification('Please select an order', 'warning');
        return;
    }

    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    // Check if invoice already exists
    if (invoices.some(inv => inv.orderId === orderId)) {
        showNotification('Invoice already exists for this order', 'error');
        return;
    }

    const newInvoice = {
        id: `INV-${Date.now().toString().slice(-4)}`,
        orderId: order.id,
        customerName: order.customerName || 'Guest',
        date: new Date().toISOString().split('T')[0],
        amount: order.total || 0,
        status: 'pending',
        items: order.items || []
    };

    invoices.push(newInvoice);
    localStorage.setItem('markanInvoices', JSON.stringify(invoices));
    
    updateStats();
    populateOrderSelect();
    displayInvoices(invoices);
    
    showNotification('Invoice generated successfully', 'success');
};

// Generate new invoice button
window.generateNewInvoice = function() {
    document.getElementById('orderSelect').value = '';
    showNotification('Select an order from the dropdown to generate invoice', 'info');
};

// View invoice details
window.viewInvoice = function(invoiceId) {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    currentInvoiceId = invoiceId;

    const itemsHtml = invoice.items && invoice.items.length > 0 
        ? invoice.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>$${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="4">No items</td></tr>';

    const invoiceDetails = document.getElementById('invoiceDetails');
    if (invoiceDetails) {
        invoiceDetails.innerHTML = `
            <div style="padding: 20px; background: #f8f9fa; border-radius: 10px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div>
                        <h2 style="color: #8B4513; margin: 0;">Markan Cafe</h2>
                        <p style="margin: 5px 0;">Debre Birhan University</p>
                        <p style="margin: 5px 0;">+251 906 902 551</p>
                    </div>
                    <div style="text-align: right;">
                        <h3 style="margin: 0;">INVOICE</h3>
                        <p style="margin: 5px 0; font-size: 1.2rem; font-weight: bold;">${invoice.id}</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                    <div>
                        <p><strong>Bill To:</strong></p>
                        <p>${invoice.customerName || 'Guest'}</p>
                    </div>
                    <div>
                        <p><strong>Invoice Date:</strong> ${invoice.date}</p>
                        <p><strong>Status:</strong> <span class="status-badge ${invoice.status}">${invoice.status}</span></p>
                    </div>
                </div>
                
                <table class="admin-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div style="text-align: right; border-top: 2px solid #ddd; padding-top: 20px;">
                    <p style="font-size: 1.1rem;"><strong>Subtotal:</strong> $${(invoice.amount || 0).toFixed(2)}</p>
                    <p style="font-size: 1.1rem;"><strong>Tax (10%):</strong> $${((invoice.amount || 0) * 0.1).toFixed(2)}</p>
                    <h3 style="font-size: 1.5rem; color: #8B4513;"><strong>Total:</strong> $${((invoice.amount || 0) * 1.1).toFixed(2)}</h3>
                </div>
                
                <div style="margin-top: 30px; text-align: center; color: #666; font-size: 0.9rem;">
                    <p>Thank you for dining with Markan Cafe!</p>
                    <p>For any questions, please contact us at getiyedemis17@gmail.com</p>
                </div>
            </div>
        `;
    }

    document.getElementById('invoiceModal').classList.add('active');
};

// Mark invoice as paid
window.markAsPaid = function() {
    if (currentInvoiceId) {
        const index = invoices.findIndex(inv => inv.id === currentInvoiceId);
        if (index !== -1) {
            invoices[index].status = 'paid';
            localStorage.setItem('markanInvoices', JSON.stringify(invoices));
            displayInvoices(invoices);
            updateStats();
            showNotification('Invoice marked as paid', 'success');
            closeInvoiceModal();
        }
    }
};

// Mark as paid from list
window.markAsPaidFromList = function(invoiceId) {
    const index = invoices.findIndex(inv => inv.id === invoiceId);
    if (index !== -1 && invoices[index].status !== 'paid') {
        invoices[index].status = 'paid';
        localStorage.setItem('markanInvoices', JSON.stringify(invoices));
        displayInvoices(invoices);
        updateStats();
        showNotification('Invoice marked as paid', 'success');
    }
};

// Print invoice
window.printInvoice = function() {
    window.print();
};

// Close invoice modal
window.closeInvoiceModal = function() {
    document.getElementById('invoiceModal').classList.remove('active');
    currentInvoiceId = null;
};

// Display invoices in table
function displayInvoices(invoicesToShow) {
    const tbody = document.getElementById('invoicesTable');
    if (!tbody) return;
    
    if (invoicesToShow.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = invoicesToShow.map(inv => `
        <tr>
            <td>${inv.id || 'N/A'}</td>
            <td>${inv.orderId || 'N/A'}</td>
            <td>${inv.customerName || 'Guest'}</td>
            <td>${inv.date || 'N/A'}</td>
            <td>${formatCurrency(inv.amount || 0)}</td>
            <td><span class="status-badge ${inv.status || 'pending'}">${inv.status || 'pending'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewInvoice('${inv.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${inv.status !== 'paid' ? `
                        <button class="action-btn edit" onclick="markAsPaidFromList('${inv.id}')">
                            <i class="fas fa-check"></i>
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Apply search filter
function applyFilters() {
    const searchTerm = document.getElementById('searchBill')?.value.toLowerCase() || '';

    const filtered = invoices.filter(inv => 
        inv.id?.toLowerCase().includes(searchTerm) ||
        inv.orderId?.toLowerCase().includes(searchTerm) ||
        inv.customerName?.toLowerCase().includes(searchTerm)
    );

    displayInvoices(filtered);
}

// Setup event listeners
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchBill');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }
    
    // Generate invoice button
    const generateBtn = document.getElementById('generateBillBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateInvoice);
    }
    
    // Modal close button
    const modalClose = document.querySelector('#invoiceModal .modal-close');
    if (modalClose) {
        modalClose.addEventListener('click', closeInvoiceModal);
    }
    
    // Modal mark as paid button
    const markPaidBtn = document.querySelector('#invoiceModal .btn-success');
    if (markPaidBtn) {
        markPaidBtn.addEventListener('click', markAsPaid);
    }
    
    // Modal print button
    const printBtn = document.querySelector('#invoiceModal .btn-primary');
    if (printBtn) {
        printBtn.addEventListener('click', printInvoice);
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

// Format currency helper
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Export functions
window.applyFilters = applyFilters;
window.formatCurrency = formatCurrency;