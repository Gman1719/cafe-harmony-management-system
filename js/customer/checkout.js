// js/customer/checkout.js - Checkout Logic
// Markan Cafe - Debre Birhan University

let currentStep = 1;

document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    if (!Auth.requireAuth()) return;
    
    // Load checkout items
    loadCheckoutItems();
    
    // Setup event listeners
    setupEventListeners();
});

function loadCheckoutItems() {
    const billingCard = document.getElementById('billingCard');
    if (!billingCard) return;
    
    if (AppState.cart.length === 0) {
        billingCard.innerHTML = `
            <div class="empty-cart">
                <i class="fas fa-shopping-cart"></i>
                <h3>Your cart is empty</h3>
                <p>Add some Ethiopian dishes before checkout</p>
                <a href="menu.html" class="btn btn-primary">Browse Menu</a>
            </div>
        `;
        return;
    }
    
    displayOrderReview();
}

function displayOrderReview() {
    const billingCard = document.getElementById('billingCard');
    const subtotal = getCartSubtotal();
    const tax = getCartTax();
    const total = getCartTotal();
    
    const user = Auth.getCurrentUser();
    
    billingCard.innerHTML = `
        <div class="bill-header">
            <div class="bill-header-left">
                <h2>Markan Cafe</h2>
                <p><i class="fas fa-map-marker-alt"></i> Debre Birhan University</p>
                <p><i class="fas fa-phone"></i> +251 906 902 551</p>
                <p><i class="fas fa-envelope"></i> getiyedemis17@gmail.com</p>
            </div>
            <div class="bill-header-right">
                <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
                <p><strong>Order Time:</strong> ${new Date().toLocaleTimeString()}</p>
                <p><strong>Customer:</strong> ${user?.name || 'Guest'}</p>
                <p><strong>Phone:</strong> ${user?.phone || 'Not provided'}</p>
            </div>
        </div>
        
        <div class="customer-info">
            <div class="info-group">
                <span class="info-label">Delivery Address</span>
                <span class="info-value">${user?.address || 'Debre Birhan University, Main Campus'}</span>
            </div>
            <div class="info-group">
                <span class="info-label">Delivery Method</span>
                <span class="info-value">Pickup (15-20 min)</span>
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
                    ${AppState.cart.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>${item.quantity || 1}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>$${(item.price * (item.quantity || 1)).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        <div class="bill-summary">
            <div class="summary-row">
                <span>Subtotal:</span>
                <span>$${subtotal.toFixed(2)}</span>
            </div>
            <div class="summary-row">
                <span>Tax (10%):</span>
                <span>$${tax.toFixed(2)}</span>
            </div>
            <div class="summary-row grand-total">
                <span>Total:</span>
                <span>$${total.toFixed(2)}</span>
            </div>
        </div>
        
        <div class="payment-methods">
            <h3>Payment Method</h3>
            <div class="payment-options">
                <div class="payment-option">
                    <input type="radio" name="payment" id="card" value="card" checked>
                    <label for="card">
                        <i class="fas fa-credit-card"></i>
                        <span>Credit Card</span>
                    </label>
                </div>
                <div class="payment-option">
                    <input type="radio" name="payment" id="cash" value="cash">
                    <label for="cash">
                        <i class="fas fa-money-bill-wave"></i>
                        <span>Cash on Pickup</span>
                    </label>
                </div>
                <div class="payment-option">
                    <input type="radio" name="payment" id="telebirr" value="telebirr">
                    <label for="telebirr">
                        <i class="fas fa-mobile-alt"></i>
                        <span>Telebirr</span>
                    </label>
                </div>
            </div>
        </div>
        
        <div class="payment-actions">
            <button class="btn btn-primary" onclick="processPayment()">
                <i class="fas fa-lock"></i> Place Order • $${total.toFixed(2)}
            </button>
            <button class="btn btn-outline" onclick="window.location.href='cart.html'">
                <i class="fas fa-arrow-left"></i> Back to Cart
            </button>
        </div>
    `;
}

window.processPayment = async function() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked')?.value || 'card';
    
    const user = Auth.getCurrentUser();
    if (!user) return;
    
    const subtotal = getCartSubtotal();
    const tax = getCartTax();
    const total = getCartTotal();
    
    const orderData = {
        customerId: user.id,
        customerName: user.name,
        customerPhone: user.phone,
        items: AppState.cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity || 1
        })),
        subtotal,
        tax,
        total,
        paymentMethod,
        status: 'pending',
        specialInstructions: document.getElementById('specialInstructions')?.value || ''
    };
    
    try {
        showNotification('Processing your order...', 'info');
        
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create order
        const order = await API.orders.create(orderData);
        
        // Clear cart
        clearCart();
        
        // Show confirmation
        showOrderConfirmation(order);
        
    } catch (error) {
        console.error('Payment failed:', error);
        showNotification('Payment failed. Please try again.', 'error');
    }
};

function showOrderConfirmation(order) {
    const billingCard = document.getElementById('billingCard');
    
    billingCard.innerHTML = `
        <div class="order-confirmation">
            <div class="confirmation-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2 class="confirmation-title">Order Confirmed!</h2>
            <p class="confirmation-message">Thank you for your order. We'll start preparing your Ethiopian dishes right away.</p>
            
            <div class="order-details">
                <div class="order-detail-row">
                    <span class="order-detail-label">Order Number:</span>
                    <span class="order-detail-value">${order.id}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Total Amount:</span>
                    <span class="order-detail-value">$${order.total.toFixed(2)}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Payment Method:</span>
                    <span class="order-detail-value">${order.paymentMethod}</span>
                </div>
                <div class="order-detail-row">
                    <span class="order-detail-label">Pickup Time:</span>
                    <span class="order-detail-value">15-20 minutes</span>
                </div>
            </div>
            
            <div class="confirmation-actions">
                <button class="btn btn-primary" onclick="window.location.href='orders.html'">
                    Track Order
                </button>
                <button class="btn btn-outline" onclick="window.location.href='menu.html'">
                    Order More
                </button>
            </div>
        </div>
    `;
    
    currentStep = 3;
    updateSteps();
}

function updateSteps() {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
}

function setupEventListeners() {
    // Delivery method selection
    const deliveryMethod = document.getElementById('deliveryMethod');
    if (deliveryMethod) {
        deliveryMethod.addEventListener('change', (e) => {
            if (e.target.value === 'delivery') {
                showNotification('Delivery option coming soon!', 'info');
                e.target.value = 'pickup';
            }
        });
    }
}