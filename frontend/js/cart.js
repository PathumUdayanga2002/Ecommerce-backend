// Global variables
const API_BASE_URL = 'http://localhost:8082/api/v1';
const CART_API_URL = 'http://localhost:8083/api/v1';
let cart = [];
let products = [];

// DOM Elements
const cartItemsContainer = document.getElementById('cart-items');
const cartContainer = document.getElementById('cart-container');
const emptyCartMessage = document.querySelector('.empty-cart-message');
const cartCount = document.getElementById('cart-count');
const subtotalElement = document.getElementById('subtotal');
const shippingElement = document.getElementById('shipping');
const taxElement = document.getElementById('tax');
const totalElement = document.getElementById('total');
const checkoutBtn = document.getElementById('checkout-btn');

// Initialize the cart page
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from local storage
    loadCart();
    
    // Fetch products for reference
    fetchProducts();
    
    // Add event listener to checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }
    
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
        
        displayCart();
        updateCartSummary();
    } catch (error) {
        console.error('Error fetching cart from API:', error);
        // If API fails, use local storage cart
        displayCart();
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
    } catch (error) {
        console.error('Error fetching products:', error);
        // Use sample products if API fails
        products = getSampleProducts();
    }
}

// Display cart items
function displayCart() {
    if (!cartItemsContainer || !cartContainer || !emptyCartMessage) return;
    
    if (cart.length === 0) {
        cartItemsContainer.style.display = 'none';
        emptyCartMessage.style.display = 'block';
        return;
    }
    
    cartItemsContainer.style.display = 'block';
    emptyCartMessage.style.display = 'none';
    
    // Clear previous items
    // Keep the header
    const cartHeader = cartItemsContainer.querySelector('.cart-header');
    cartItemsContainer.innerHTML = '';
    cartItemsContainer.appendChild(cartHeader);
    
    // Add cart items
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        
        // Find product details if available
        const product = products.find(p => p.id === item.productId);
        const productPrice = product ? product.price : (item.totalPrice / item.quantity);
        const productImage = product ? product.imageUrl : 'https://via.placeholder.com/80x80';
        
        cartItem.innerHTML = `
            <div class="cart-product">
                <img src="${productImage}" alt="${item.productName}">
                <div>
                    <h4>${item.productName}</h4>
                    <p>Product ID: ${item.productId}</p>
                </div>
            </div>
            <div class="cart-price">$${productPrice.toFixed(2)}</div>
            <div class="cart-quantity">
                <button class="decrease-qty" data-id="${item.id}">-</button>
                <input type="number" value="${item.quantity}" min="1" data-id="${item.id}">
                <button class="increase-qty" data-id="${item.id}">+</button>
            </div>
            <div class="cart-total">
                $${item.totalPrice.toFixed(2)}
                <span class="remove-item" data-id="${item.id}"><i class="fas fa-trash"></i></span>
            </div>
        `;
        
        cartItemsContainer.appendChild(cartItem);
    });
    
    // Add event listeners to cart item buttons
    addCartItemEventListeners();
}

// Add event listeners to cart item buttons
function addCartItemEventListeners() {
    // Decrease quantity buttons
    const decreaseButtons = document.querySelectorAll('.decrease-qty');
    decreaseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemId = parseInt(button.getAttribute('data-id'));
            updateItemQuantity(itemId, 'decrease');
        });
    });
    
    // Increase quantity buttons
    const increaseButtons = document.querySelectorAll('.increase-qty');
    increaseButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemId = parseInt(button.getAttribute('data-id'));
            updateItemQuantity(itemId, 'increase');
        });
    });
    
    // Quantity input fields
    const quantityInputs = document.querySelectorAll('.cart-quantity input');
    quantityInputs.forEach(input => {
        input.addEventListener('change', () => {
            const itemId = parseInt(input.getAttribute('data-id'));
            const newQuantity = parseInt(input.value);
            if (newQuantity > 0) {
                updateItemQuantity(itemId, 'set', newQuantity);
            } else {
                input.value = 1;
                updateItemQuantity(itemId, 'set', 1);
            }
        });
    });
    
    // Remove item buttons
    const removeButtons = document.querySelectorAll('.remove-item');
    removeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const itemId = parseInt(button.getAttribute('data-id'));
            removeCartItem(itemId);
        });
    });
}

// Update item quantity
async function updateItemQuantity(itemId, action, newQuantity) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    const product = products.find(p => p.id === item.productId);
    const productPrice = product ? product.price : (item.totalPrice / item.quantity);
    
    switch (action) {
        case 'increase':
            item.quantity += 1;
            break;
        case 'decrease':
            if (item.quantity > 1) {
                item.quantity -= 1;
            }
            break;
        case 'set':
            item.quantity = newQuantity;
            break;
    }
    
    item.totalPrice = item.quantity * productPrice;
    
    try {
        // Update item in API
        const response = await fetch(`${CART_API_URL}/updateorder`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(item)
        });
        
        if (!response.ok) {
            throw new Error('Failed to update cart item');
        }
    } catch (error) {
        console.error('Error updating cart item:', error);
        // Continue with local update even if API fails
    }
    
    // Update local storage
    saveCart();
    
    // Update display
    displayCart();
    updateCartSummary();
    updateCartCount();
}

// Remove item from cart
async function removeCartItem(itemId) {
    const itemIndex = cart.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;
    
    try {
        // Remove item from API
        const response = await fetch(`${CART_API_URL}/deleteorder/${itemId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to remove cart item');
        }
    } catch (error) {
        console.error('Error removing cart item:', error);
        // Continue with local removal even if API fails
    }
    
    // Remove from local cart
    cart.splice(itemIndex, 1);
    
    // Update local storage
    saveCart();
    
    // Update display
    displayCart();
    updateCartSummary();
    updateCartCount();
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

// Save cart to local storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Handle checkout
function handleCheckout() {
    if (cart.length === 0) {
        showNotification('Your cart is empty');
        return;
    }
    
    // Here you would typically redirect to a checkout page
    // For now, just show a notification
    showNotification('Proceeding to checkout...');
    
    // Clear cart after checkout (in a real app, you would do this after payment)
    setTimeout(() => {
        cart = [];
        saveCart();
        displayCart();
        updateCartSummary();
        updateCartCount();
        showNotification('Thank you for your purchase!');
    }, 2000);
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