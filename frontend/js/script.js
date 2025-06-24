// Global variables
const API_BASE_URL = 'http://localhost:8082/api/v1';
const CART_API_URL = 'http://localhost:8083/api/v1';
let cart = [];

// DOM Elements
const productsContainer = document.getElementById('products-container');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchInput = document.getElementById('search-input');
const cartCount = document.getElementById('cart-count');

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    // Load cart from local storage
    loadCart();
    
    // Fetch and display products
    fetchProducts();
    
    // Add event listeners to filter buttons
    if (filterButtons) {
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                const category = button.getAttribute('data-category');
                filterProducts(category);
                
                // Update active button
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
    
    // Add event listener to search input
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            searchProducts(searchTerm);
        });
    }
    
    // Add event listener to contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactForm);
    }
    
    // Add event listener to newsletter form
    const newsletterForm = document.getElementById('newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterForm);
    }
});

// Fetch products from the backend API
async function fetchProducts() {
    try {
        const response = await fetch(`${API_BASE_URL}/getproducts`);
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }
        
        products = await response.json();
        displayProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        // Display sample products if API is not available
        displaySampleProducts();
    }
}

// Display products in the product list
function displayProducts(productsToDisplay) {
    if (!productList) return;
    
    productList.innerHTML = '';
    
    if (productsToDisplay.length === 0) {
        productList.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }
    
    productsToDisplay.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.setAttribute('data-category', product.category || 'all');
        
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.imageUrl || 'https://via.placeholder.com/300x200'}" alt="${product.productName}">
            </div>
            <div class="product-info">
                <h3>${product.productName}</h3>
                <p>${product.description || 'No description available'}</p>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="btn add-to-cart" data-id="${product.id}">Add to Cart</button>
                </div>
            </div>
        `;
        
        productList.appendChild(productCard);
        
        // Add event listener to Add to Cart button
        const addToCartBtn = productCard.querySelector('.add-to-cart');
        addToCartBtn.addEventListener('click', () => addToCart(product));
    });
}

// Filter products by category
function filterProducts(category) {
    if (category === 'all') {
        displayProducts(products);
        return;
    }
    
    const filteredProducts = products.filter(product => 
        product.category === category || product.productName.toLowerCase().includes(category.toLowerCase())
    );
    
    displayProducts(filteredProducts);
}

// Add product to cart
async function addToCart(product) {
    try {
        // Create cart item
        const cartItem = {
            id: Date.now(), // Temporary ID
            productId: product.id,
            productName: product.productName,
            quantity: 1,
            totalPrice: product.price
        };
        
        // Try to add to backend cart
        const response = await fetch(`${CART_API_URL}/addcartitem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(cartItem)
        });
        
        if (!response.ok) {
            throw new Error('Failed to add item to cart');
        }
        
        const result = await response.json();
        
        // If successful, update local cart
        if (result.id) {
            cart.push(result);
            saveCart();
            updateCartCount();
            showNotification('Product added to cart!');
        } else if (result.errorMessage) {
            throw new Error(result.errorMessage);
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        // Fallback to local cart if API fails
        const existingItem = cart.find(item => item.productId === product.id);
        
        if (existingItem) {
            existingItem.quantity += 1;
            existingItem.totalPrice = existingItem.quantity * product.price;
        } else {
            const cartItem = {
                id: Date.now(),
                productId: product.id,
                productName: product.productName,
                quantity: 1,
                totalPrice: product.price
            };
            cart.push(cartItem);
        }
        
        saveCart();
        updateCartCount();
        showNotification('Product added to cart!');
    }
}

// Load cart from local storage
function loadCart() {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCartCount();
    }
}

// Save cart to local storage
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

// Update cart count in the header
function updateCartCount() {
    if (!cartCount) return;
    
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
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

// Handle contact form submission
function handleContactForm(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Here you would typically send this data to a backend API
    console.log('Contact form submitted:', { name, email, message });
    
    // Show success message
    showNotification('Message sent successfully!');
    
    // Reset form
    event.target.reset();
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

// Display sample products if API is not available
function displaySampleProducts() {
    const sampleProducts = [
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
    
    products = sampleProducts;
    displayProducts(sampleProducts);
}