// admin/js/billing.js
// Markan Cafe Admin - Billing Management
// Handles all billing, revenue, and transaction functionality

// Global variables
let allTransactions = [];
let filteredTransactions = [];
let currentPage = 1;
let itemsPerPage = 10;
let currentTransactionId = null;
let updateInterval;
let revenueChart, paymentChart, dailyChart, categoryChart;
let currentDateRange = 'today';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    // Check admin access
    if (!Auth.requireAdmin()) {
        window.location.href = '../../login.html';
        return;
    }

    initializeCharts();
    loadBillingData();
    setupEventListeners();
    updateAdminName();
    startRealTimeUpdates();
});

// ===== DATA LOADING =====
function loadBillingData() {
    try {
        // Get orders from localStorage
        const orders = JSON.parse(localStorage.getItem('markanOrders')) || [];
        
        // Filter only completed orders for billing
        allTransactions = orders
            .filter(o => o.status === 'completed')
            .sort((a, b) => new Date(b.completedDate || b.orderDate) - new Date(a.orderDate || a.completedDate));
        
        filterByDateRange(currentDateRange);
        updateSummary();
        updateTopProducts();
        updateCharts();
        displayTransactions();
    } catch (error) {
        console.error('Error loading billing data:', error);
        showNotification('Failed to load billing data', 'error');
    }
}

// ===== DATE RANGE FILTERING =====
function filterByDateRange(range) {
    const now = new Date();
    let startDate = new Date();
    
    switch(range) {
        case 'today':
            startDate.setHours(0, 0, 0, 0);
            filteredTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.completedDate || t.orderDate);
                return tDate >= startDate;
            });
            break;
            
        case 'yesterday':
            startDate.setDate(startDate.getDate() - 1);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setHours(23, 59, 59, 999);
            filteredTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.completedDate || t.orderDate);
                return tDate >= startDate && tDate <= endDate;
            });
            break;
            
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            filteredTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.completedDate || t.orderDate);
                return tDate >= startDate;
            });
            break;
            
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            filteredTransactions = allTransactions.filter(t => {
                const tDate = new Date(t.completedDate || t.orderDate);
                return tDate >= startDate;
            });
            break;
            
        case 'custom':
            const customStart = document.getElementById('startDate')?.value;
            const customEnd = document.getElementById('endDate')?.value;
            
            if (customStart && customEnd) {
                filteredTransactions = allTransactions.filter(t => {
                    const tDate = new Date(t.completedDate || t.orderDate);
                    return tDate >= new Date(customStart) && tDate <= new Date(customEnd);
                });
            } else {
                filteredTransactions = [...allTransactions];
            }
            break;
            
        default:
            filteredTransactions = [...allTransactions];
    }
    
    currentPage = 1;
    displayTransactions();
    updateSummary();
    updateTopProducts();
    updateCharts();
}

// ===== SUMMARY CARDS UPDATE =====
function updateSummary() {
    const totalRevenue = filteredTransactions.reduce((sum, t) => sum + (t.total || 0), 0);
    const totalOrders = filteredTransactions.length;
    const averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Get unique payment methods count
    const paymentMethods = new Set(filteredTransactions.map(t => t.paymentMethod)).size;
    
    document.getElementById('totalRevenue').textContent = formatETB(totalRevenue);
    document.getElementById('totalOrders').textContent = totalOrders;
    document.getElementById('averageOrder').textContent = formatETB(averageOrder);
    document.getElementById('paymentMethods').textContent = paymentMethods;
    
    // Calculate and update trend
    updateTrend(totalRevenue);
}

// ===== TREND CALCULATION =====
function updateTrend(currentRevenue) {
    // Get previous period revenue for comparison
    const now = new Date();
    let previousStart = new Date();
    let previousEnd = new Date();
    
    switch(currentDateRange) {
        case 'today':
            previousStart.setDate(previousStart.getDate() - 1);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setHours(23, 59, 59, 999);
            break;
            
        case 'yesterday':
            previousStart.setDate(previousStart.getDate() - 2);
            previousStart.setHours(0, 0, 0, 0);
            previousEnd.setDate(previousEnd.getDate() - 1);
            previousEnd.setHours(23, 59, 59, 999);
            break;
            
        case 'week':
            previousStart.setDate(previousStart.getDate() - 14);
            previousEnd.setDate(previousEnd.getDate() - 7);
            break;
            
        case 'month':
            previousStart.setMonth(previousStart.getMonth() - 2);
            previousEnd.setMonth(previousEnd.getMonth() - 1);
            break;
            
        default:
            document.getElementById('revenueTrend').textContent = 'Comparison not available';
            return;
    }
    
    const previousRevenue = allTransactions
        .filter(t => {
            const tDate = new Date(t.completedDate || t.orderDate);
            return tDate >= previousStart && tDate <= previousEnd;
        })
        .reduce((sum, t) => sum + (t.total || 0), 0);
    
    if (previousRevenue > 0) {
        const percentChange = ((currentRevenue - previousRevenue) / previousRevenue * 100).toFixed(1);
        const trendEl = document.getElementById('revenueTrend');
        trendEl.textContent = `${percentChange >= 0 ? '+' : ''}${percentChange}% from previous period`;
        trendEl.className = `trend ${percentChange >= 0 ? 'positive' : 'negative'}`;
    } else {
        document.getElementById('revenueTrend').textContent = 'No previous data';
    }
}

// ===== TOP PRODUCTS =====
function updateTopProducts() {
    const productMap = new Map();
    
    filteredTransactions.forEach(transaction => {
        transaction.items?.forEach(item => {
            const key = item.id || item.name;
            if (productMap.has(key)) {
                const existing = productMap.get(key);
                existing.quantity += item.quantity;
                existing.revenue += (item.price * item.quantity);
            } else {
                productMap.set(key, {
                    name: item.name,
                    quantity: item.quantity,
                    revenue: item.price * item.quantity,
                    category: item.category || 'Uncategorized'
                });
            }
        });
    });
    
    const topProducts = Array.from(productMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
    
    const container = document.getElementById('topProducts');
    if (!container) return;
    
    if (topProducts.length === 0) {
        container.innerHTML = '<p class="no-data">No product data available</p>';
        return;
    }
    
    container.innerHTML = topProducts.map((product, index) => `
        <div class="product-item">
            <div class="product-rank">${index + 1}</div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>${product.category}</p>
            </div>
            <div class="product-stats">
                <span class="quantity">${product.quantity} sold</span>
                <span class="revenue">${formatETB(product.revenue)}</span>
            </div>
        </div>
    `).join('');
}

// ===== CHARTS INITIALIZATION =====
function initializeCharts() {
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart')?.getContext('2d');
    if (revenueCtx) {
        revenueChart = new Chart(revenueCtx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Revenue (ETB)',
                    data: [],
                    borderColor: '#8B4513',
                    backgroundColor: 'rgba(139,69,19,0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#FFD700',
                    pointBorderColor: '#8B4513',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return formatETB(context.raw);
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatETB(value);
                            }
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Payment Chart
    const paymentCtx = document.getElementById('paymentChart')?.getContext('2d');
    if (paymentCtx) {
        paymentChart = new Chart(paymentCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cash', 'Card', 'Online'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: ['#8B4513', '#FFD700', '#A0522D'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: '#FFFFFF'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${formatETB(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    // Daily Chart
    const dailyCtx = document.getElementById('dailyChart')?.getContext('2d');
    if (dailyCtx) {
        dailyChart = new Chart(dailyCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Number of Transactions',
                    data: [],
                    backgroundColor: '#8B4513',
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.raw} transactions`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255,255,255,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // Category Chart
    const categoryCtx = document.getElementById('categoryChart')?.getContext('2d');
    if (categoryCtx) {
        categoryChart = new Chart(categoryCtx, {
            type: 'pie',
            data: {
                labels: ['Beverages', 'Meals', 'Snacks', 'Desserts'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#8B4513', '#A0522D', '#D2691E', '#FFD700']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { 
                        position: 'bottom',
                        labels: {
                            color: '#FFFFFF'
                        }
                    }
                }
            }
        });
    }
}

// ===== CHARTS UPDATE =====
function updateCharts() {
    // Update revenue chart (last 7 days)
    const last7Days = getLast7Days();
    const revenueData = last7Days.map(day => {
        return filteredTransactions
            .filter(t => {
                const tDate = new Date(t.completedDate || t.orderDate);
                return tDate.toDateString() === day.toDateString();
            })
            .reduce((sum, t) => sum + (t.total || 0), 0);
    });

    if (revenueChart) {
        revenueChart.data.labels = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }));
        revenueChart.data.datasets[0].data = revenueData;
        revenueChart.update();
    }

    // Update payment chart
    const payments = {
        cash: filteredTransactions.filter(t => t.paymentMethod === 'cash').reduce((sum, t) => sum + (t.total || 0), 0),
        card: filteredTransactions.filter(t => t.paymentMethod === 'card').reduce((sum, t) => sum + (t.total || 0), 0),
        online: filteredTransactions.filter(t => t.paymentMethod === 'online').reduce((sum, t) => sum + (t.total || 0), 0)
    };

    if (paymentChart) {
        paymentChart.data.datasets[0].data = [payments.cash, payments.card, payments.online];
        paymentChart.update();
    }

    // Update daily chart
    const dailyTransactions = last7Days.map(day => {
        return filteredTransactions.filter(t => {
            const tDate = new Date(t.completedDate || t.orderDate);
            return tDate.toDateString() === day.toDateString();
        }).length;
    });

    if (dailyChart) {
        dailyChart.data.labels = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
        dailyChart.data.datasets[0].data = dailyTransactions;
        dailyChart.update();
    }

    // Update category chart
    const categories = {
        beverages: 0,
        meals: 0,
        snacks: 0,
        desserts: 0
    };

    filteredTransactions.forEach(t => {
        t.items?.forEach(item => {
            const category = item.category || 'meals';
            if (categories.hasOwnProperty(category)) {
                categories[category] += item.price * item.quantity;
            }
        });
    });

    if (categoryChart) {
        categoryChart.data.datasets[0].data = [
            categories.beverages,
            categories.meals,
            categories.snacks,
            categories.desserts
        ];
        categoryChart.update();
    }
}

// ===== HELPER: GET LAST 7 DAYS =====
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const day = new Date();
        day.setDate(day.getDate() - i);
        day.setHours(0, 0, 0, 0);
        days.push(day);
    }
    return days;
}

// ===== DISPLAY TRANSACTIONS =====
function displayTransactions() {
    const tbody = document.getElementById('transactionsTable');
    if (!tbody) return;

    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageTransactions = filteredTransactions.slice(start, end);

    if (pageTransactions.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center">
                    <div class="no-data">
                        <i class="fas fa-receipt"></i>
                        <p>No transactions found</p>
                    </div>
                </td>
            </tr>
        `;
        updatePagination();
        return;
    }

    tbody.innerHTML = pageTransactions.map(t => `
        <tr onclick="viewTransaction('${t.id}')">
            <td><strong>${t.id}</strong></td>
            <td>${formatDateTime(t.completedDate || t.orderDate)}</td>
            <td>${t.customerName || 'Guest'}</td>
            <td>${t.items?.length || 0} items</td>
            <td>${formatETB(t.total || 0)}</td>
            <td>
                <span class="payment-badge ${t.paymentMethod || 'cash'}">
                    ${(t.paymentMethod || 'cash').charAt(0).toUpperCase() + (t.paymentMethod || 'cash').slice(1)}
                </span>
            </td>
            <td>
                <span class="status-badge completed">Completed</span>
            </td>
            <td onclick="event.stopPropagation()">
                <div class="action-buttons">
                    <button class="action-btn view" onclick="viewTransaction('${t.id}')" title="View Details">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn print" onclick="printTransaction('${t.id}')" title="Print Invoice">
                        <i class="fas fa-print"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    updatePagination();
}

// ===== VIEW TRANSACTION =====
window.viewTransaction = function(transactionId) {
    const transaction = allTransactions.find(t => t.id === transactionId);
    if (!transaction) return;

    currentTransactionId = transactionId;

    // Set invoice details
    document.getElementById('invoiceNumber').textContent = `Invoice #${transaction.id}`;
    document.getElementById('invoiceDate').textContent = `Date: ${formatDateTime(transaction.completedDate || transaction.orderDate)}`;
    document.getElementById('invoiceCustomer').textContent = transaction.customerName || 'Guest Customer';
    document.getElementById('invoiceCustomerPhone').textContent = transaction.customerPhone || 'Phone not provided';
    document.getElementById('invoiceCustomerEmail').textContent = transaction.customerEmail || 'Email not provided';
    document.getElementById('invoicePayment').textContent = (transaction.paymentMethod || 'cash').charAt(0).toUpperCase() + (transaction.paymentMethod || 'cash').slice(1);
    document.getElementById('invoiceStatus').textContent = transaction.status || 'completed';
    document.getElementById('invoiceStatus').className = `status-badge ${transaction.status || 'completed'}`;

    // Set items
    const itemsBody = document.getElementById('invoiceItems');
    if (transaction.items && transaction.items.length > 0) {
        itemsBody.innerHTML = transaction.items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>${formatETB(item.price)}</td>
                <td>${formatETB(item.price * item.quantity)}</td>
            </tr>
        `).join('');
    } else {
        itemsBody.innerHTML = '<tr><td colspan="4" class="text-center">No items</td></tr>';
    }

    // Set totals
    const subtotal = transaction.subtotal || transaction.total * 0.9 || 0;
    const tax = transaction.tax || transaction.total * 0.1 || 0;
    const total = transaction.total || subtotal + tax;

    document.getElementById('invoiceSubtotal').textContent = formatETB(subtotal);
    document.getElementById('invoiceTax').textContent = formatETB(tax);
    document.getElementById('invoiceTotal').textContent = formatETB(total);

    document.getElementById('transactionModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// ===== CLOSE TRANSACTION MODAL =====
window.closeTransactionModal = function() {
    document.getElementById('transactionModal').classList.remove('active');
    document.body.style.overflow = '';
}

// ===== PRINT INVOICE =====
window.printInvoice = function() {
    const transaction = allTransactions.find(t => t.id === currentTransactionId);
    if (!transaction) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Invoice ${transaction.id}</title>
                <style>
                    body { 
                        font-family: 'Poppins', Arial, sans-serif; 
                        padding: 40px; 
                        max-width: 800px; 
                        margin: 0 auto;
                        background: #fff;
                        color: #333;
                    }
                    .header { 
                        display: flex; 
                        justify-content: space-between; 
                        align-items: center; 
                        margin-bottom: 30px; 
                        padding-bottom: 20px;
                        border-bottom: 2px solid #8B4513;
                    }
                    .logo { 
                        height: 60px; 
                    }
                    .invoice-info { 
                        text-align: right; 
                    }
                    .invoice-info h1 {
                        color: #8B4513;
                        margin: 0 0 5px 0;
                    }
                    .customer { 
                        margin: 30px 0; 
                        padding: 20px; 
                        background: #f9f9f9; 
                        border-radius: 8px;
                    }
                    table { 
                        width: 100%; 
                        border-collapse: collapse; 
                        margin: 30px 0; 
                    }
                    th { 
                        background: #8B4513; 
                        color: white; 
                        padding: 12px; 
                        text-align: left; 
                    }
                    td { 
                        padding: 10px; 
                        border-bottom: 1px solid #ddd; 
                    }
                    .total { 
                        font-size: 1.3rem; 
                        color: #8B4513; 
                        font-weight: bold; 
                        text-align: right;
                    }
                    .footer { 
                        margin-top: 40px; 
                        text-align: center; 
                        color: #8B4513; 
                        font-style: italic;
                        padding-top: 20px;
                        border-top: 1px solid #ddd;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <img src="../../assets/images/logo.png" class="logo" onerror="this.src='https://via.placeholder.com/120x60/8B4513/FFD700?text=Markan'">
                    <div class="invoice-info">
                        <h1>INVOICE</h1>
                        <p><strong>${transaction.id}</strong></p>
                        <p>Date: ${formatDateTime(transaction.completedDate || transaction.orderDate)}</p>
                    </div>
                </div>
                
                <div class="customer">
                    <h3>Bill To:</h3>
                    <p><strong>${transaction.customerName || 'Guest Customer'}</strong></p>
                    <p>${transaction.customerPhone || ''}</p>
                    <p>${transaction.customerEmail || ''}</p>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${transaction.items.map(item => `
                            <tr>
                                <td>${item.name}</td>
                                <td>${item.quantity}</td>
                                <td>${formatETB(item.price)}</td>
                                <td>${formatETB(item.price * item.quantity)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                
                <div style="text-align: right;">
                    <p><strong>Subtotal:</strong> ${formatETB(transaction.subtotal || transaction.total * 0.9)}</p>
                    <p><strong>Tax (10%):</strong> ${formatETB(transaction.tax || transaction.total * 0.1)}</p>
                    <p class="total"><strong>Total:</strong> ${formatETB(transaction.total)}</p>
                </div>
                
                <div class="footer">
                    <p>Thank you for dining with Markan Cafe!</p>
                    <p>Debre Birhan University, Ethiopia</p>
                </div>
            </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ===== PRINT TRANSACTION =====
window.printTransaction = function(transactionId) {
    viewTransaction(transactionId);
    setTimeout(printInvoice, 500);
}

// ===== DOWNLOAD INVOICE (SIMULATED) =====
window.downloadInvoice = function() {
    showNotification('Invoice download started', 'success');
}

// ===== SET DATE RANGE =====
window.setDateRange = function(range) {
    currentDateRange = range;
    
    // Update active button
    document.querySelectorAll('.range-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Show/hide custom range
    const customRange = document.getElementById('customRange');
    if (customRange) {
        customRange.style.display = range === 'custom' ? 'flex' : 'none';
    }
    
    if (range !== 'custom') {
        filterByDateRange(range);
    }
}

// ===== APPLY CUSTOM RANGE =====
window.applyCustomRange = function() {
    filterByDateRange('custom');
}

// ===== GENERATE REPORT =====
window.generateReport = function() {
    showNotification('Report generation started', 'success');
}

// ===== EXPORT BILLING =====
window.exportBilling = function() {
    try {
        const dataStr = JSON.stringify(filteredTransactions, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = `billing_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showNotification('Billing data exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('Failed to export data', 'error');
    }
}

// ===== UPDATE PAGINATION =====
function updatePagination() {
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
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
    displayTransactions();
}

// ===== SETUP EVENT LISTENERS =====
function setupEventListeners() {
    // Search
    document.getElementById('searchBills')?.addEventListener('input', debounce(function(e) {
        const searchTerm = e.target.value.toLowerCase();
        if (searchTerm.length < 2) {
            filteredTransactions = [...allTransactions];
            filterByDateRange(currentDateRange);
        } else {
            filteredTransactions = allTransactions.filter(t => 
                t.id?.toLowerCase().includes(searchTerm) ||
                t.customerName?.toLowerCase().includes(searchTerm) ||
                t.customerEmail?.toLowerCase().includes(searchTerm)
            );
        }
        currentPage = 1;
        displayTransactions();
    }, 500));

    // Pagination
    document.getElementById('prevPage')?.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            displayTransactions();
        }
    });

    document.getElementById('nextPage')?.addEventListener('click', function() {
        const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            displayTransactions();
        }
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        Auth.logout();
    });
}

// ===== REAL-TIME UPDATES =====
function startRealTimeUpdates() {
    // Update every 30 seconds
    updateInterval = setInterval(() => {
        loadBillingData();
    }, 30000);
}

// ===== CLEANUP =====
window.addEventListener('beforeunload', function() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});

// ===== HELPER: FORMAT ETB =====
function formatETB(amount) {
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount).replace('ETB', '') + ' ETB';
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

// ===== HELPER: FORMAT TIME =====
function formatTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
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

// ===== UPDATE ADMIN NAME =====
function updateAdminName() {
    const user = Auth.getCurrentUser();
    if (user) {
        document.getElementById('adminName').textContent = user.name;
    }
}

// ===== MAKE FUNCTIONS GLOBAL =====
window.setDateRange = setDateRange;
window.applyCustomRange = applyCustomRange;
window.generateReport = generateReport;
window.exportBilling = exportBilling;
window.viewTransaction = viewTransaction;
window.closeTransactionModal = closeTransactionModal;
window.printInvoice = printInvoice;
window.downloadInvoice = downloadInvoice;
window.printTransaction = printTransaction;
window.goToPage = goToPage;