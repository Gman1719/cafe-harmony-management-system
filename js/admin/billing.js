// js/admin/billing.js - Admin Billing Logic
// Markan Cafe - Debre Birhan University

let selectedOrder = null;
let pastBills = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Check admin authentication
    if (!Auth.requireAdmin()) return;
    
    // Load orders for dropdown
    await loadOrdersForSelect();
    
    // Load past bills
    loadPastBills();
    
    // Setup event listeners
    setupEventListeners();
});

async function loadOrdersForSelect() {
    const select = document.getElementById('orderSelect');
    if (!select) return;
    
    try {
        const orders = await API.orders.getAll();
        const pendingOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
        
        // Clear existing options
        select.innerHTML = '<option value="">Select Order to Bill</option>';
        
        pendingOrders.forEach(order => {
            const option = document.createElement('option');
            option.value = order.id;
            option.textContent = `${order.id} - ${order.customerName} - ${formatCurrency(order.total)}`;
            select.appendChild(option);
        });
        
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

window.generateBill = async function() {
    const select = document.getElementById('orderSelect');
    const orderId = select.value;
    
    if (!orderId) {
        showNotification('Please select an order', 'warning');
        return;
    }
    
    try {
        const orders = await API.orders.getAll();
        selectedOrder = orders.find(o => o.id === orderId);
        
        if (!selectedOrder) return;
        
        displayBill(selectedOrder);
        
    } catch (error) {
        console.error('Failed to generate bill:', error);
        showNotification('Failed to generate bill', 'error');
    }
};

function displayBill(order) {
    const container = document.getElementById('billingCard');
    if (!container) return;
    
    const invoiceNumber = `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    const itemsHtml = order.items.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.quantity}</td>
            <td>$${item.price.toFixed(2)}</td>
            <td>$${(item.price * item.quantity).toFixed(2)}</td>
        </tr>
    `).join('');
    
    container.innerHTML = `
        <div class="bill-header">
            <div class="bill-header-left">
                <h2>Markan Cafe</h2>
                <p><i class="fas fa-map-marker-alt"></i> Debre Birhan University</p>
                <p><i class="fas fa-phone"></i> +251 906 902 551</p>
                <p><i class="fas fa-envelope"></i> getiyedemis17@gmail.com</p>
            </div>
            <div class="bill-header-right">
                <p><strong>Invoice #:</strong> ${invoiceNumber}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Order ID:</strong> ${order.id}</p>
            </div>
        </div>
        
        <div class="customer-info">
            <div class="info-group">
                <span class="info-label">Customer</span>
                <span class="info-value">${order.customerName}</span>
            </div>
            <div class="info-group">
                <span class="info-label">Phone</span>
                <span class="info-value">${order.customerPhone || 'N/A'}</span>
            </div>
            <div class="info-group">
                <span class="info-label">Order Date</span>
                <span class="info-value">${formatDate(order.orderDate)}</span>
            </div>
            <div class="info-group">
                <span class="info-label">Payment Method</span>
                <span class="info-value">${order.paymentMethod}</span>
            </div>
        </div>
        
        <div class="bill-items">
            <table class="bill-table">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        
        <div class="bill-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (10%):</span>
                <span>$${order.tax.toFixed(2)}</span>
            </div>
            <div class="summary-row grand-total">
                <span>Total:</span>
                <span>$${order.total.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="payment-actions">
            <button class="btn btn-success" onclick="processPayment('${order.id}')">
                <i class="fas fa-check"></i> Mark as Paid
            </button>
            <button class="btn btn-primary" onclick="window.print()">
                <i class="fas fa-print"></i> Print Bill
            </button>
            <button class="btn btn-outline" onclick="downloadBill()">
                <i class="fas fa-download"></i> Download
            </button>
        </div>
    `;
}

window.processPayment = async function(orderId) {
    try {
        await API.orders.updateStatus(orderId, 'completed');
        
        // Save to past bills
        const bill = {
            ...selectedOrder,
            invoiceNumber: `INV-${Date.now()}`,
            paidAt: new Date().toISOString()
        };
        
        const pastBills = JSON.parse(localStorage.getItem('pastBills') || '[]');
        pastBills.push(bill);
        localStorage.setItem('pastBills', JSON.stringify(pastBills));
        
        showNotification('Payment processed successfully', 'success');
        
        // Reload orders dropdown
        await loadOrdersForSelect();
        
        // Load past bills
        loadPastBills();
        
        // Clear bill display
        document.getElementById('billingCard').innerHTML = `
            <div class="empty-bill">
                <i class="fas fa-file-invoice"></i>
                <h3>Select an order to generate bill</h3>
            </div>
        `;
        
    } catch (error) {
        console.error('Failed to process payment:', error);
        showNotification('Failed to process payment', 'error');
    }
};

window.downloadBill = function() {
    showNotification('Bill download started', 'success');
    // In a real app, this would generate a PDF
};

function loadPastBills() {
    const container = document.getElementById('pastBills');
    if (!container) return;
    
    const pastBills = JSON.parse(localStorage.getItem('pastBills') || '[]');
    
    if (pastBills.length === 0) {
        container.innerHTML = '<p class="no-data">No past bills</p>';
        return;
    }
    
    container.innerHTML = pastBills.slice(-6).reverse().map(bill => `
        <div class="past-bill-card" onclick="viewPastBill('${bill.invoiceNumber}')">
            <div class="past-bill-header">
                <span class="past-bill-number">${bill.invoiceNumber}</span>
                <span class="past-bill-date">${formatDate(bill.paidAt || bill.orderDate)}</span>
            </div>
            <div class="past-bill-customer">${bill.customerName}</div>
            <div class="past-bill-total">${formatCurrency(bill.total)}</div>
            <span class="past-bill-status paid">Paid</span>
        </div>
    `).join('');
}

window.viewPastBill = function(invoiceNumber) {
    const pastBills = JSON.parse(localStorage.getItem('pastBills') || '[]');
    const bill = pastBills.find(b => b.invoiceNumber === invoiceNumber);
    
    if (bill) {
        displayBill(bill);
    }
};

function setupEventListeners() {
    const generateBtn = document.getElementById('generateBillBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateBill);
    }
}