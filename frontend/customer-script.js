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
        const categoryMapping = {
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
        
        const targetCategory = categoryMapping[currentCategory];
        if (targetCategory) {
            filteredProducts = products.filter(product => 
                product.category === targetCategory
            );
        }
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
function onSortChange() {
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
    
    // Return comprehensive mock data with products organized by category
    return {
        products: [
            // GROCERY & FOOD
            {
                id: 1,
                name: "Premium Basmati Rice",
                description: "Long grain aromatic basmati rice, perfect for biryani and pulao",
                category: "Grocery & Food",
                sellingPrice: 450.00,
                originalPrice: 520.00,
                image: "https://via.placeholder.com/300x200?text=Basmati+Rice",
                popularity: 95
            },
            {
                id: 2,
                name: "Organic Whole Wheat Flour",
                description: "Nutritious whole wheat flour for healthy baking",
                category: "Grocery & Food",
                sellingPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Wheat+Flour",
                popularity: 88
            },
            {
                id: 3,
                name: "Pure Mustard Oil",
                description: "Traditional mustard oil for authentic cooking",
                category: "Grocery & Food",
                sellingPrice: 220.00,
                originalPrice: 250.00,
                image: "https://via.placeholder.com/300x200?text=Mustard+Oil",
                popularity: 82
            },
            {
                id: 4,
                name: "Organic Green Tea",
                description: "Antioxidant-rich green tea for healthy lifestyle",
                category: "Grocery & Food",
                sellingPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Green+Tea",
                popularity: 85
            },
            {
                id: 5,
                name: "Premium Black Pepper",
                description: "Aromatic black pepper for enhanced flavor",
                category: "Grocery & Food",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Black+Pepper",
                popularity: 78
            },

            // FRUITS
            {
                id: 6,
                name: "Fresh Organic Apples",
                description: "Sweet and juicy organic apples, perfect for healthy snacking",
                category: "Fruits",
                sellingPrice: 120.00,
                originalPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Organic+Apples",
                popularity: 96
            },
            {
                id: 7,
                name: "Fresh Bananas",
                description: "Ripe and sweet bananas, great for smoothies and snacking",
                category: "Fruits",
                sellingPrice: 80.00,
                image: "https://via.placeholder.com/300x200?text=Bananas",
                popularity: 92
            },
            {
                id: 8,
                name: "Fresh Oranges",
                description: "Juicy oranges rich in vitamin C",
                category: "Fruits",
                sellingPrice: 100.00,
                originalPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Oranges",
                popularity: 89
            },
            {
                id: 9,
                name: "Fresh Mangoes",
                description: "Sweet and ripe mangoes, perfect for desserts",
                category: "Fruits",
                sellingPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Mangoes",
                popularity: 94
            },
            {
                id: 10,
                name: "Fresh Strawberries",
                description: "Sweet and fresh strawberries for desserts and salads",
                category: "Fruits",
                sellingPrice: 250.00,
                originalPrice: 300.00,
                image: "https://via.placeholder.com/300x200?text=Strawberries",
                popularity: 87
            },

            // MEAT & SEAFOOD
            {
                id: 11,
                name: "Fresh Chicken Breast",
                description: "Boneless chicken breast, perfect for grilling and cooking",
                category: "Meat & Seafood",
                sellingPrice: 650.00,
                originalPrice: 750.00,
                image: "https://via.placeholder.com/300x200?text=Chicken+Breast",
                popularity: 93
            },
            {
                id: 12,
                name: "Fresh Mutton",
                description: "Tender mutton for traditional curries",
                category: "Meat & Seafood",
                sellingPrice: 850.00,
                image: "https://via.placeholder.com/300x200?text=Mutton",
                popularity: 85
            },
            {
                id: 13,
                name: "Fresh Fish - Rohu",
                description: "Fresh rohu fish, perfect for Bengali cuisine",
                category: "Meat & Seafood",
                sellingPrice: 450.00,
                originalPrice: 500.00,
                image: "https://via.placeholder.com/300x200?text=Fresh+Fish",
                popularity: 88
            },
            {
                id: 14,
                name: "Fresh Prawns",
                description: "Large fresh prawns for seafood dishes",
                category: "Meat & Seafood",
                sellingPrice: 1200.00,
                image: "https://via.placeholder.com/300x200?text=Prawns",
                popularity: 82
            },
            {
                id: 15,
                name: "Fresh Eggs",
                description: "Farm fresh eggs, rich in protein",
                category: "Meat & Seafood",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Fresh+Eggs",
                popularity: 90
            },

            // BAKERY
            {
                id: 16,
                name: "Artisan Sourdough Bread",
                description: "Freshly baked sourdough bread with crispy crust",
                category: "Bakery",
                sellingPrice: 180.00,
                originalPrice: 220.00,
                image: "https://via.placeholder.com/300x200?text=Sourdough+Bread",
                popularity: 86
            },
            {
                id: 17,
                name: "Chocolate Croissants",
                description: "Buttery croissants filled with chocolate",
                category: "Bakery",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Chocolate+Croissants",
                popularity: 92
            },
            {
                id: 18,
                name: "Whole Wheat Bread",
                description: "Healthy whole wheat bread for sandwiches",
                category: "Bakery",
                sellingPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Whole+Wheat+Bread",
                popularity: 84
            },
            {
                id: 19,
                name: "Blueberry Muffins",
                description: "Fresh blueberry muffins with streusel topping",
                category: "Bakery",
                sellingPrice: 100.00,
                originalPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Blueberry+Muffins",
                popularity: 89
            },
            {
                id: 20,
                name: "Garlic Bread",
                description: "Crispy garlic bread with herbs and butter",
                category: "Bakery",
                sellingPrice: 80.00,
                image: "https://via.placeholder.com/300x200?text=Garlic+Bread",
                popularity: 87
            },

            // PACKAGED FOODS
            {
                id: 21,
                name: "Organic Honey",
                description: "Pure organic honey, great for tea and cooking",
                category: "Packaged Foods",
                sellingPrice: 350.00,
                originalPrice: 400.00,
                image: "https://via.placeholder.com/300x200?text=Organic+Honey",
                popularity: 88
            },
            {
                id: 22,
                name: "Premium Olive Oil",
                description: "Extra virgin olive oil for healthy cooking",
                category: "Packaged Foods",
                sellingPrice: 450.00,
                image: "https://via.placeholder.com/300x200?text=Olive+Oil",
                popularity: 85
            },
            {
                id: 23,
                name: "Organic Peanut Butter",
                description: "Natural peanut butter without preservatives",
                category: "Packaged Foods",
                sellingPrice: 280.00,
                originalPrice: 320.00,
                image: "https://via.placeholder.com/300x200?text=Peanut+Butter",
                popularity: 82
            },
            {
                id: 24,
                name: "Premium Coffee Beans",
                description: "Arabica coffee beans for rich coffee",
                category: "Packaged Foods",
                sellingPrice: 380.00,
                image: "https://via.placeholder.com/300x200?text=Coffee+Beans",
                popularity: 86
            },
            {
                id: 25,
                name: "Dark Chocolate",
                description: "70% dark chocolate for health benefits",
                category: "Packaged Foods",
                sellingPrice: 200.00,
                originalPrice: 250.00,
                image: "https://via.placeholder.com/300x200?text=Dark+Chocolate",
                popularity: 90
            },

            // PERSONAL CARE
            {
                id: 26,
                name: "Natural Face Cream",
                description: "Moisturizing face cream with natural ingredients",
                category: "Personal Care",
                sellingPrice: 280.00,
                originalPrice: 350.00,
                image: "https://via.placeholder.com/300x200?text=Face+Cream",
                popularity: 84
            },
            {
                id: 27,
                name: "Organic Shampoo",
                description: "Sulfate-free shampoo for healthy hair",
                category: "Personal Care",
                sellingPrice: 320.00,
                image: "https://via.placeholder.com/300x200?text=Organic+Shampoo",
                popularity: 87
            },
            {
                id: 28,
                name: "Natural Toothpaste",
                description: "Fluoride-free toothpaste with mint flavor",
                category: "Personal Care",
                sellingPrice: 150.00,
                originalPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Natural+Toothpaste",
                popularity: 82
            },
            {
                id: 29,
                name: "Hand Sanitizer",
                description: "Alcohol-based hand sanitizer for hygiene",
                category: "Personal Care",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Hand+Sanitizer",
                popularity: 89
            },
            {
                id: 30,
                name: "Body Lotion",
                description: "Hydrating body lotion with aloe vera",
                category: "Personal Care",
                sellingPrice: 200.00,
                originalPrice: 250.00,
                image: "https://via.placeholder.com/300x200?text=Body+Lotion",
                popularity: 85
            },

            // HOUSEHOLD
            {
                id: 31,
                name: "Eco-Friendly Dish Soap",
                description: "Biodegradable dish soap, safe for family and environment",
                category: "Household",
                sellingPrice: 120.00,
                originalPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Dish+Soap",
                popularity: 86
            },
            {
                id: 32,
                name: "Laundry Detergent",
                description: "Gentle laundry detergent for all fabrics",
                category: "Household",
                sellingPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Laundry+Detergent",
                popularity: 88
            },
            {
                id: 33,
                name: "All-Purpose Cleaner",
                description: "Multi-surface cleaner for home cleaning",
                category: "Household",
                sellingPrice: 150.00,
                originalPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=All+Purpose+Cleaner",
                popularity: 84
            },
            {
                id: 34,
                name: "Toilet Paper",
                description: "Soft and absorbent toilet paper",
                category: "Household",
                sellingPrice: 200.00,
                image: "https://via.placeholder.com/300x200?text=Toilet+Paper",
                popularity: 90
            },
            {
                id: 35,
                name: "Air Freshener",
                description: "Natural air freshener with lavender scent",
                category: "Household",
                sellingPrice: 100.00,
                originalPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Air+Freshener",
                popularity: 82
            },

            // STATIONERY
            {
                id: 36,
                name: "Premium Writing Pen",
                description: "Smooth writing pen with ergonomic design",
                category: "Stationery",
                sellingPrice: 85.00,
                originalPrice: 100.00,
                image: "https://via.placeholder.com/300x200?text=Writing+Pen",
                popularity: 78
            },
            {
                id: 37,
                name: "Notebook Set",
                description: "High-quality notebooks for students and professionals",
                category: "Stationery",
                sellingPrice: 120.00,
                image: "https://via.placeholder.com/300x200?text=Notebook+Set",
                popularity: 82
            },
            {
                id: 38,
                name: "Color Pencils",
                description: "Vibrant color pencils for art and drawing",
                category: "Stationery",
                sellingPrice: 150.00,
                originalPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Color+Pencils",
                popularity: 85
            },
            {
                id: 39,
                name: "Stapler",
                description: "Heavy-duty stapler for office use",
                category: "Stationery",
                sellingPrice: 200.00,
                image: "https://via.placeholder.com/300x200?text=Stapler",
                popularity: 80
            },
            {
                id: 40,
                name: "White Paper",
                description: "Premium white paper for printing and writing",
                category: "Stationery",
                sellingPrice: 180.00,
                originalPrice: 220.00,
                image: "https://via.placeholder.com/300x200?text=White+Paper",
                popularity: 83
            },

            // ELECTRONICS
            {
                id: 41,
                name: "Wireless Bluetooth Earbuds",
                description: "High-quality wireless earbuds with noise cancellation",
                category: "Electronics",
                sellingPrice: 2500.00,
                originalPrice: 3000.00,
                image: "https://via.placeholder.com/300x200?text=Bluetooth+Earbuds",
                popularity: 92
            },
            {
                id: 42,
                name: "USB-C Charging Cable",
                description: "Fast charging USB-C cable for all devices",
                category: "Electronics",
                sellingPrice: 350.00,
                image: "https://via.placeholder.com/300x200?text=USB+C+Cable",
                popularity: 88
            },
            {
                id: 43,
                name: "Wireless Mouse",
                description: "Ergonomic wireless mouse for comfortable use",
                category: "Electronics",
                sellingPrice: 450.00,
                originalPrice: 550.00,
                image: "https://via.placeholder.com/300x200?text=Wireless+Mouse",
                popularity: 85
            },
            {
                id: 44,
                name: "Phone Stand",
                description: "Adjustable phone stand for hands-free viewing",
                category: "Electronics",
                sellingPrice: 200.00,
                image: "https://via.placeholder.com/300x200?text=Phone+Stand",
                popularity: 82
            },
            {
                id: 45,
                name: "Power Bank",
                description: "10000mAh power bank for mobile charging",
                category: "Electronics",
                sellingPrice: 1200.00,
                originalPrice: 1500.00,
                image: "https://via.placeholder.com/300x200?text=Power+Bank",
                popularity: 89
            },

            // BABY CARE
            {
                id: 46,
                name: "Baby Diapers Pack",
                description: "Soft and absorbent diapers for babies",
                category: "Baby Care",
                sellingPrice: 450.00,
                originalPrice: 520.00,
                image: "https://via.placeholder.com/300x200?text=Baby+Diapers",
                popularity: 90
            },
            {
                id: 47,
                name: "Baby Wipes",
                description: "Gentle baby wipes for sensitive skin",
                category: "Baby Care",
                sellingPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Baby+Wipes",
                popularity: 87
            },
            {
                id: 48,
                name: "Baby Formula",
                description: "Nutritious baby formula for healthy growth",
                category: "Baby Care",
                sellingPrice: 850.00,
                originalPrice: 950.00,
                image: "https://via.placeholder.com/300x200?text=Baby+Formula",
                popularity: 85
            },
            {
                id: 49,
                name: "Baby Shampoo",
                description: "Tear-free baby shampoo for gentle cleaning",
                category: "Baby Care",
                sellingPrice: 220.00,
                image: "https://via.placeholder.com/300x200?text=Baby+Shampoo",
                popularity: 84
            },
            {
                id: 50,
                name: "Baby Food",
                description: "Organic baby food for healthy development",
                category: "Baby Care",
                sellingPrice: 150.00,
                originalPrice: 180.00,
                image: "https://via.placeholder.com/300x200?text=Baby+Food",
                popularity: 86
            },

            // FOOTWEAR
            {
                id: 51,
                name: "Comfortable Running Shoes",
                description: "Lightweight running shoes with cushioned sole",
                category: "Footwear",
                sellingPrice: 1800.00,
                originalPrice: 2200.00,
                image: "https://via.placeholder.com/300x200?text=Running+Shoes",
                popularity: 88
            },
            {
                id: 52,
                name: "Casual Sneakers",
                description: "Stylish casual sneakers for everyday wear",
                category: "Footwear",
                sellingPrice: 1200.00,
                originalPrice: 1500.00,
                image: "https://via.placeholder.com/300x200?text=Casual+Sneakers",
                popularity: 85
            },
            {
                id: 53,
                name: "Formal Shoes",
                description: "Elegant formal shoes for professional look",
                category: "Footwear",
                sellingPrice: 2500.00,
                image: "https://via.placeholder.com/300x200?text=Formal+Shoes",
                popularity: 82
            },
            {
                id: 54,
                name: "Sandals",
                description: "Comfortable sandals for summer wear",
                category: "Footwear",
                sellingPrice: 800.00,
                originalPrice: 950.00,
                image: "https://via.placeholder.com/300x200?text=Sandals",
                popularity: 87
            },
            {
                id: 55,
                name: "Sports Socks",
                description: "Moisture-wicking sports socks for comfort",
                category: "Footwear",
                sellingPrice: 150.00,
                image: "https://via.placeholder.com/300x200?text=Sports+Socks",
                popularity: 84
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
