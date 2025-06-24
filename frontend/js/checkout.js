// Global variables
const API_BASE_URL = 'http://localhost:8082/api/v1';
const CART_API_URL = 'http://localhost:8083/api/v1';
const ORDER_API_URL = 'http://localhost:8084/api/v1'; // Order service URL (when implemented)
let cart = [];
let products = [];

// DOM Elements
const orderItemsContainer = document.getElementById('order-items');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const cartCount = document.getElementById('cart-count');
const checkoutForm = document.getElementById('checkout-form');
const creditCardFields = document.getElementById('credit-card-fields');
const paymentMethods = document.querySelectorAll('input[name="payment-method"]');

// Initialize the checkout page
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from local storage
    loadCart();
    
    // Fetch products for reference
    fetchProducts();
    
    // Add event listener to checkout form
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckout);
    }
    
    // Add event listeners to payment method radios
    paymentMethods.forEach(method => {
        method.addEventListener('change', togglePaymentFields);
    });
    
    // Add event listener to newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterForm);
    }
});

// Load cart from local storage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
        
        // Try to fetch cart from API
        fetchCartFromAPI();
    } else {
        // Try to fetch cart from API
        fetchCartFromAPI();
    }
}

// Fetch cart from API
async function fetchCartFromAPI() {
    try {
        const response = await fetch(`${CART_API_URL}/getcart`);
        if (!response.ok) {
            throw new Error('Failed to fetch cart');
        }
        
        const apiCart = await response.json();
        if (apiCart && apiCart.length > 0) {
            cart = apiCart;
            saveCart();
        }
        
        displayOrderSummary();
        updateCartSummary();
    } catch (error) {
        console.error('Error fetching cart from API:', error);
        // If API fails, use local storage cart
        displayOrderSummary();
        updateCartSummary();
    }
}

// Fetch products from the backend API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/getproducts`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        products = await response.json();
        displayOrderSummary();
    } catch (error) {
        console.error('Error fetching products:', error);
        // Use sample products if API fails
        products = getSampleProducts();
        displayOrderSummary();
    }
}

// Display order summary
function displayOrderSummary() {
    if (!orderItemsContainer) return;
    
    // Clear previous items
    orderItemsContainer.innerHTML = '';
    
    // Add order items
    cart.forEach(item => {
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        
        // Find product details if available
        const product = products.find(p => p.id === item.productId);
        const productPrice = product ? product.price : (item.totalPrice / item.quantity);
        
        orderItem.innerHTML = `
            <div class="order-item-details">
                <div class="order-item-name">${item.productName}</div>
                <div class="order-item-price">$${productPrice.toFixed(2)} × ${item.quantity}</div>
            </div>
            <div class="order-item-total">$${item.totalPrice.toFixed(2)}</div>
        `;
        
        orderItemsContainer.appendChild(orderItem);
    });
}

// Update cart summary
function updateCartSummary() {
    if (!subtotalElement || !shippingElement || !taxElement || !totalElement) return;
    
    const subtotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    const shipping = subtotal > 0 ? 10 : 0; // $10 shipping fee if cart is not empty
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + shipping + tax;
    
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    shippingElement.textContent = `$${shipping.toFixed(2)}`;
    taxElement.textContent = `$${tax.toFixed(2)}`;
    totalElement.textContent = `$${total.toFixed(2)}`;
}

// Update cart count in the header
function updateCartCount() {
    if (!cartCount) return;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
}

// Toggle payment fields based on selected payment method
function togglePaymentFields() {
    if (!creditCardFields) return;
    
    const selectedMethod = document.querySelector('input[name="payment-method"]:checked').value;
    
    if (selectedMethod === 'credit-card') {
        creditCardFields.style.display = 'block';
    } else {
        creditCardFields.style.display = 'none';
    }
}

// Handle checkout form submission
async function handleCheckout(event) {
    event.preventDefault();
    
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    // Get form data
    const formData = new FormData(event.target);
    const orderData = {
        customerName: formData.get('fullname'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zipCode: formData.get('zip'),
        country: formData.get('country'),
        paymentMethod: formData.get('payment-method'),
        items: cart,
        subtotal: parseFloat(subtotalElement.textContent.replace('$', '')),
        shipping: parseFloat(shippingElement.textContent.replace('$', '')),
        tax: parseFloat(taxElement.textContent.replace('$', '')),
        total: parseFloat(totalElement.textContent.replace('$', ''))
    };
    
    // If credit card is selected, add card details
    if (orderData.paymentMethod === 'credit-card') {
        orderData.cardNumber = formData.get('card-number');
        orderData.expiryDate = formData.get('expiry-date');
        orderData.cvv = formData.get('cvv');
    }
    
    try {
        // Submit order to API (when order service is implemented)
        // const response = await fetch(`${ORDER_API_URL}/createorder`, {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json'
        //     },
        //     body: JSON.stringify(orderData)
        // });
        
        // if (!response.ok) {
        //     throw new Error('Failed to create order');
        // }
        
        // const order = await response.json();
        
        // For now, simulate a successful order
        const order = {
            id: Math.floor(Math.random() * 1000000),
            ...orderData,
            orderDate: new Date().toISOString(),
            status: 'PENDING'
        };
        
        // Clear cart after successful order
        clearCart();
        
        // Show order confirmation
        showOrderConfirmation(order);
    } catch (error) {
        console.error('Error creating order:', error);
        showNotification('Failed to process order. Please try again.');
    }
}

// Show order confirmation
function showOrderConfirmation(order) {
    // Hide checkout form and order summary
    const checkoutContent = document.querySelector('.checkout-content');
    if (checkoutContent) {
        checkoutContent.style.display = 'none';
    }
    
    // Create and show confirmation message
    const confirmationElement = document.createElement('div');
    confirmationElement.className = 'order-confirmation';
    confirmationElement.innerHTML = `
        <h3>Thank You for Your Order!</h3>
        <p>Your order has been received and is being processed.</p>
        <p>Order Number: <span class="order-number">#${order.id}</span></p>
        <p>We've sent a confirmation email to ${order.email}.</p>
        <a href="index.html" class="continue-shopping-btn">Continue Shopping</a>
    `;
    
    const checkoutContainer = document.querySelector('.checkout-container');
    if (checkoutContainer) {
        checkoutContainer.appendChild(confirmationElement);
        confirmationElement.style.display = 'block';
    }
}

// Clear cart
function clearCart() {
    try {
        // Clear cart in API
        fetch(`${CART_API_URL}/clearcart`, {
            method: 'DELETE'
        });
    } catch (error) {
        console.error('Error clearing cart in API:', error);
    }
    
    // Clear local cart
    cart = [];
    saveCart();
    updateCartCount();
}

// Save cart to local storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Handle newsletter form submission
function handleNewsletterForm(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    
    // Here you would typically send this data to a backend API
    console.log('Newsletter subscription:', email);
    
    // Show success message
    showNotification('Subscribed to newsletter!');
    
    // Reset form
    event.target.reset();
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.classList.add('hide');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

// Get sample products if API is not available
function getSampleProducts() {
    return [
        {
            id: 1,
            productId: 1,
            productName: 'Smartphone X',
            description: 'Latest smartphone with advanced features',
            price: 699,
            category: 'electronics',
            imageUrl: 'https://via.placeholder.com/300x200?text=Smartphone'
        },
        {
            id: 2,
            productId: 2,
            productName: 'Laptop Pro',
            description: 'Powerful laptop for professionals',
            price: 1299,
            category: 'electronics',
            imageUrl: 'https://via.placeholder.com/300x200?text=Laptop'
        },
        {
            id: 3,
            productId: 3,
            productName: 'Casual T-Shirt',
            description: 'Comfortable cotton t-shirt',
            price: 24.99,
            category: 'clothing',
            imageUrl: 'https://via.placeholder.com/300x200?text=T-Shirt'
        },
        {
            id: 4,
            productId: 4,
            productName: 'Coffee Maker',
            description: 'Automatic coffee maker for home use',
            price: 89.99,
            category: 'home',
            imageUrl: 'https://via.placeholder.com/300x200?text=Coffee+Maker'
        },
        {
            id: 5,
            productId: 5,
            productName: 'Wireless Headphones',
            description: 'Noise-cancelling wireless headphones',
            price: 149.99,
            category: 'electronics',
            imageUrl: 'https://via.placeholder.com/300x200?text=Headphones'
        },
        {
            id: 6,
            productId: 6,
            productName: 'Jeans',
            description: 'Classic blue jeans',
            price: 49.99,
            category: 'clothing',
            imageUrl: 'https://via.placeholder.com/300x200?text=Jeans'
        },
        {
            id: 7,
            productId: 7,
            productName: 'Blender',
            description: 'High-speed blender for smoothies',
            price: 79.99,
            category: 'home',
            imageUrl: 'https://via.placeholder.com/300x200?text=Blender'
        },
        {
            id: 8,
            productId: 8,
            productName: 'Smart Watch',
            description: 'Fitness and health tracking smart watch',
            price: 199.99,
            category: 'electronics',
            imageUrl: 'https://via.placeholder.com/300x200?text=Smart+Watch'
        }
    ];
}