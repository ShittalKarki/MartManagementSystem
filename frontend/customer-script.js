/* MartMS */
// Customer Dashboard JavaScript
let products = [];
let cart = [];
let currentCategory = 'all';
let currentView = 'grid';
let currentPage = 1;
let productsPerPage = 12;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCustomerDashboard();
});

function initializeCustomerDashboard() {
    setupEventListeners();
    loadProducts();
    setupUserMenu();
    checkGuestMode();
}

// Event Listeners
function setupEventListeners() {
    // Category navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const category = this.getAttribute('data-category');
            selectCategory(category);
        });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(handleSearch, 300));

    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.getAttribute('data-view');
            toggleView(view);
        });
    });

    // Close modals when clicking overlay
    document.getElementById('overlay').addEventListener('click', closeAllModals);
}

// User Menu Setup
function setupUserMenu() {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');

    userMenuBtn.addEventListener('click', function() {
        userDropdown.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!userMenuBtn.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.remove('show');
        }
    });
}

// Check Guest Mode
function checkGuestMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('guest') === 'true') {
        document.getElementById('userName').textContent = 'Guest User';
        // Hide user menu for guests
        document.querySelector('.user-menu').style.display = 'none';
    }
}

// Category Selection
function selectCategory(category) {
    currentCategory = category;
    currentPage = 1;
    
    // Update active category button
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-category="${category}"]`).classList.add('active');
    
    // Update breadcrumb
    const breadcrumbText = document.getElementById('breadcrumbText');
    if (category === 'all') {
        breadcrumbText.textContent = 'All Products';
    } else {
        const categoryNames = {
            'grocery': 'Grocery & Food',
            'fruits': 'Fruits',
            'meat': 'Meat & Seafood',
            'bakery': 'Bakery',
            'packaged': 'Packaged Foods',
            'personal': 'Personal Care',
            'household': 'Household',
            'stationery': 'Stationery',
            'electronics': 'Electronics',
            'baby': 'Baby Care',
            'footwear': 'Footwear'
        };
        breadcrumbText.textContent = categoryNames[category] || category;
    }
    
    // Filter and display products
    filterAndDisplayProducts();
}

// Load Products
async function loadProducts() {
    try {
        // Simulate API call - replace with actual API endpoint
        const response = await fetchProducts();
        products = response.products || [];
        filterAndDisplayProducts();
    } catch (error) {
        console.error('Error loading products:', error);
        showMessage('Error loading products. Please try again.', 'error');
    }
}

// Filter and Display Products
function filterAndDisplayProducts() {
    let filteredProducts = products;
    
    // Filter by category
    if (currentCategory !== 'all') {
        filteredProducts = products.filter(product => 
            product.category.toLowerCase().includes(currentCategory)
        );
    }
    
    // Apply price filter
    const priceRange = document.getElementById('priceRange').value;
    if (priceRange !== 'all') {
        filteredProducts = applyPriceFilter(filteredProducts, priceRange);
    }
    
    // Apply search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Sort products
    const sortBy = document.getElementById('sortSelect').value;
    filteredProducts = sortProducts(filteredProducts, sortBy);
    
    // Display products
    displayProducts(filteredProducts);
}

// Apply Price Filter
function applyPriceFilter(products, priceRange) {
    switch (priceRange) {
        case '0-100':
            return products.filter(p => p.sellingPrice <= 100);
        case '100-500':
            return products.filter(p => p.sellingPrice > 100 && p.sellingPrice <= 500);
        case '500-1000':
            return products.filter(p => p.sellingPrice > 500 && p.sellingPrice <= 1000);
        case '1000+':
            return products.filter(p => p.sellingPrice > 1000);
        default:
            return products;
    }
}

// Sort Products
function sortProducts(products, sortBy) {
    const sortedProducts = [...products];
    
    switch (sortBy) {
        case 'name':
            return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
        case 'price-low':
            return sortedProducts.sort((a, b) => a.sellingPrice - b.sellingPrice);
        case 'price-high':
            return sortedProducts.sort((a, b) => b.sellingPrice - a.sellingPrice);
        case 'popularity':
            return sortedProducts.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        default:
            return sortedProducts;
    }
}

// Display Products
function displayProducts(products) {
    const container = document.getElementById('productsContainer');
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const productsToShow = products.slice(startIndex, endIndex);
    
    if (productsToShow.length === 0) {
        container.innerHTML = `
            <div class="no-products">
                <i class="fas fa-search"></i>
                <h3>No products found</h3>
                <p>Try adjusting your search criteria or browse all products.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = productsToShow.map(product => createProductCard(product)).join('');
    
    // Show/hide load more button
    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (endIndex < products.length) {
        loadMoreBtn.style.display = 'inline-flex';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// Create Product Card
function createProductCard(product) {
    const discount = product.originalPrice ? 
        Math.round(((product.originalPrice - product.sellingPrice) / product.originalPrice) * 100) : 0;
    
    return `
        <div class="product-card" onclick="showProductModal(${product.id})">
            <div class="product-image">
                <img src="${product.image || 'https://via.placeholder.com/300x200?text=Product'}" alt="${product.name}">
                ${discount > 0 ? `<div class="product-badge">-${discount}%</div>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description}</p>
                <div class="product-price">
                    <span class="current-price">NPR ${product.sellingPrice.toFixed(2)}</span>
                    ${product.originalPrice ? `<span class="original-price">NPR ${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-meta">
                    <span class="stock-info">
                        <i class="fas fa-check-circle"></i> In Stock
                    </span>
                    <span class="category-info">
                        <i class="fas fa-tags"></i> ${product.category}
                    </span>
                </div>
                <div class="product-actions">
                    <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                    <button class="quick-view-btn" onclick="event.stopPropagation(); showProductModal(${product.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Search Functionality
function handleSearch() {
    currentPage = 1;
    filterAndDisplayProducts();
}

// View Toggle
function toggleView(view) {
    currentView = view;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Update products container class
    const container = document.getElementById('productsContainer');
    container.className = `products-container ${view}-view`;
}

// Load More Products
function loadMoreProducts() {
    currentPage++;
    filterAndDisplayProducts();
}

// Cart Management
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    updateCart();
    showMessage(`${product.name} added to cart!`, 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
}

function updateCartQuantity(productId, newQuantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            item.quantity = newQuantity;
        }
        updateCart();
    }
}

function updateCart() {
    // Update cart count
    const cartCount = document.getElementById('cartCount');
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart items
    const cartItems = document.getElementById('cartItems');
    if (cart.length === 0) {
        cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
    } else {
        cartItems.innerHTML = cart.map(item => createCartItem(item)).join('');
    }
    
    // Update cart total
    const cartTotal = document.getElementById('cartTotal');
    const total = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    cartTotal.textContent = total.toFixed(2);
    
    // Save cart to localStorage
    localStorage.setItem('dailyDealsCart', JSON.stringify(cart));
}

function createCartItem(item) {
    return `
        <div class="cart-item">
            <div class="cart-item-image">
                <img src="${item.image || 'https://via.placeholder.com/60x60?text=Product'}" alt="${item.name}">
            </div>
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">NPR ${item.sellingPrice.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity - 1})">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" 
                           onchange="updateCartQuantity(${item.id}, parseInt(this.value))" min="1">
                    <button class="quantity-btn" onclick="updateCartQuantity(${item.id}, ${item.quantity + 1})">+</button>
                    <button class="remove-item" onclick="removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Cart Toggle
function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    cartSidebar.classList.toggle('open');
}

// Product Modal
function showProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Populate modal with product data
    document.getElementById('modalProductName').textContent = product.name;
    document.getElementById('modalProductDescription').textContent = product.description;
    document.getElementById('modalProductPrice').textContent = product.sellingPrice.toFixed(2);
    document.getElementById('modalProductImage').src = product.image || 'https://via.placeholder.com/300x300?text=Product';
    document.getElementById('modalProductCategory').textContent = product.category;
    
    // Show original price if available
    const originalPriceElement = document.getElementById('modalOriginalPrice');
    if (product.originalPrice) {
        originalPriceElement.style.display = 'inline';
        originalPriceElement.textContent = `NPR ${product.originalPrice.toFixed(2)}`;
    } else {
        originalPriceElement.style.display = 'none';
    }
    
    // Reset quantity
    document.getElementById('modalQuantity').value = 1;
    
    // Show modal
    document.getElementById('productModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function addToCartFromModal() {
    const productId = parseInt(document.getElementById('modalProductName').getAttribute('data-product-id'));
    const quantity = parseInt(document.getElementById('modalQuantity').value);
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    // Add to cart with specified quantity
    for (let i = 0; i < quantity; i++) {
        addToCart(productId);
    }
    
    closeProductModal();
    showMessage(`${quantity}x ${product.name} added to cart!`, 'success');
}

function increaseQuantity() {
    const input = document.getElementById('modalQuantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('modalQuantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}

// Checkout
function proceedToCheckout() {
    if (cart.length === 0) {
        showMessage('Your cart is empty!', 'error');
        return;
    }
    
    // Populate checkout form
    populateCheckoutForm();
    
    // Show checkout modal
    document.getElementById('checkoutModal').classList.add('show');
    document.getElementById('overlay').classList.add('show');
}

function populateCheckoutForm() {
    // Populate order items
    const checkoutItems = document.getElementById('checkoutItems');
    checkoutItems.innerHTML = cart.map(item => `
        <div class="order-item">
            <span>${item.name} x${item.quantity}</span>
            <span>NPR ${(item.sellingPrice * item.quantity).toFixed(2)}</span>
        </div>
    `).join('');
    
    // Calculate totals
    const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
    const deliveryFee = 50;
    const total = subtotal + deliveryFee;
    
    document.getElementById('checkoutSubtotal').textContent = subtotal.toFixed(2);
    document.getElementById('checkoutTotal').textContent = total.toFixed(2);
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('show');
    document.getElementById('overlay').classList.remove('show');
}

function placeOrder() {
    // Validate form
    const name = document.getElementById('checkoutName').value;
    const phone = document.getElementById('checkoutPhone').value;
    const email = document.getElementById('checkoutEmail').value;
    const address = document.getElementById('checkoutAddress').value;
    
    if (!name || !phone || !email || !address) {
        showMessage('Please fill in all required fields.', 'error');
        return;
    }
    
    // Simulate order placement
    showMessage('Order placed successfully! Thank you for shopping with Daily Deals.', 'success');
    
    // Clear cart
    cart = [];
    updateCart();
    
    // Close modal
    closeCheckoutModal();
    
    // Reset form
    document.getElementById('checkoutName').value = '';
    document.getElementById('checkoutPhone').value = '';
    document.getElementById('checkoutEmail').value = '';
    document.getElementById('checkoutAddress').value = '';
}

// Utility Functions
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('show');
    });
    document.getElementById('overlay').classList.remove('show');
}

function showMessage(message, type) {
    // Create and show message toast
    const toast = document.createElement('div');
    toast.className = `message-toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Hide toast after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

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

// User Functions
function showProfile() {
    showMessage('Profile feature coming soon!', 'info');
}

function showOrders() {
    showMessage('Order history feature coming soon!', 'info');
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

// Filter Functions
function sortProducts() {
    filterAndDisplayProducts();
}

function filterByPrice() {
    currentPage = 1;
    filterAndDisplayProducts();
}

// Simulate API calls (replace with actual API endpoints)
async function fetchProducts() {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock data
    return {
        products: [
            {
                id: 1,
                name: "Fresh Organic Apples",
                description: "Sweet and juicy organic apples, perfect for healthy snacking",
                category: "Fruits",
                sellingPrice: 120.00,
                originalPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Apples",
                popularity: 95
            },
            {
                id: 2,
                name: "Premium Basmati Rice",
                description: "Long grain aromatic basmati rice, perfect for biryani and pulao",
                category: "Grocery & Food",
                sellingPrice: 450.00,
                image: "https://via.placeholder.com/300x200?text=Rice",
                popularity: 88
            },
            {
                id: 3,
                name: "Fresh Chicken Breast",
                description: "Boneless chicken breast, perfect for grilling and cooking",
                category: "Meat & Seafood",
                sellingPrice: 650.00,
                image: "https://via.placeholder.com/300x200?text=Chicken",
                popularity: 92
            },
            {
                id: 4,
                name: "Artisan Sourdough Bread",
                description: "Freshly baked sourdough bread with crispy crust",
                category: "Bakery",
                sellingPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Bread",
                popularity: 85
            },
            {
                id: 5,
                name: "Organic Honey",
                description: "Pure organic honey, great for tea and cooking",
                category: "Packaged Foods",
                sellingPrice: 350.00,
                originalPrice: 400.00,
                image: "https://via.placeholder.com/300x200?text=Honey",
                popularity: 78
            },
            {
                id: 6,
                name: "Natural Face Cream",
                description: "Moisturizing face cream with natural ingredients",
                category: "Personal Care",
                sellingPrice: 280.00,
                image: "https://via.placeholder.com/300x200?text=Cream",
                popularity: 82
            },
            {
                id: 7,
                name: "Eco-Friendly Dish Soap",
                description: "Biodegradable dish soap, safe for family and environment",
                category: "Household",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Soap",
                popularity: 75
            },
            {
                id: 8,
                name: "Premium Writing Pen",
                description: "Smooth writing pen with ergonomic design",
                category: "Stationery",
                sellingPrice: 85.00,
                image: "https://via.placeholder.com/300x200?text=Pen",
                popularity: 70
            },
            {
                id: 9,
                name: "Wireless Bluetooth Earbuds",
                description: "High-quality wireless earbuds with noise cancellation",
                category: "Electronics",
                sellingPrice: 2500.00,
                originalPrice: 3000.00,
                image: "https://via.placeholder.com/300x200?text=Earbuds",
                popularity: 90
            },
            {
                id: 10,
                name: "Baby Diapers Pack",
                description: "Soft and absorbent diapers for babies",
                category: "Baby Care",
                sellingPrice: 450.00,
                image: "https://via.placeholder.com/300x200?text=Diapers",
                popularity: 87
            },
            {
                id: 11,
                name: "Comfortable Running Shoes",
                description: "Lightweight running shoes with cushioned sole",
                category: "Footwear",
                sellingPrice: 1800.00,
                originalPrice: 2200.00,
                image: "https://via.placeholder.com/300x200?text=Shoes",
                popularity: 83
            },
            {
                id: 12,
                name: "Fresh Tomatoes",
                description: "Ripe and juicy tomatoes, perfect for salads and cooking",
                category: "Fruits",
                sellingPrice: 80.00,
                image: "https://via.placeholder.com/300x200?text=Tomatoes",
                popularity: 89
            }
        ]
    };
}

// Load cart from localStorage on page load
window.addEventListener('load', function() {
    const savedCart = localStorage.getItem('dailyDealsCart');
    if (savedCart) {
        cart = JSON.parse(savedCart);
        updateCart();
    }
});

// Add message toast styles
const style = document.createElement('style');
style.textContent = `
    .message-toast {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        color: #4a5568;
        padding: 15px 25px;
        border-radius: 12px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
        z-index: 3000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 300px;
    }
    
    .message-toast.show {
        transform: translateX(0);
    }
    
    .message-toast.success {
        border-left: 4px solid #48bb78;
    }
    
    .message-toast.success i {
        color: #48bb78;
    }
    
    .message-toast.error {
        border-left: 4px solid #f56565;
    }
    
    .message-toast.error i {
        color: #f56565;
    }
    
    .message-toast.info {
        border-left: 4px solid #667eea;
    }
    
    .message-toast.info i {
        color: #667eea;
    }
    
    .message-toast i {
        font-size: 1.2rem;
    }
    
    .message-toast span {
        font-size: 0.9rem;
        font-weight: 500;
    }
    
    .empty-cart {
        text-align: center;
        color: #a0aec0;
        padding: 40px 20px;
    }
    
    .no-products {
        text-align: center;
        padding: 60px 20px;
        color: #a0aec0;
    }
    
    .no-products i {
        font-size: 3rem;
        margin-bottom: 20px;
        color: #cbd5e0;
    }
    
    .no-products h3 {
        margin-bottom: 10px;
        color: #4a5568;
    }
`;
document.head.appendChild(style);
