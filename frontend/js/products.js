/**
 * Products specific JavaScript
 */

// Global variables
let products = [];
let categories = [];
let merchandises = [];
let editMode = false;

document.addEventListener('DOMContentLoaded', function() {
    // Load products
    loadProducts();
    
    // Load categories for dropdown
    loadCategoriesForDropdown();
    
    // Load merchandises for dropdown
    loadMerchandisesForDropdown();
    
    // Set up event listeners
    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
});

/**
 * Load products from API
 */
async function loadProducts() {
    try {
        products = await apiRequest('products');
        console.log('Products loaded from API:', products);
        displayProducts(products);
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

/**
 * Display products in table
 * @param {Array} products - Products data
 */
function displayProducts(products) {
    console.log('Displaying products:', products);
    const tableBody = document.getElementById('productsTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are any products
    if (!products || products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="no-data">No products found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add products to table
    products.forEach((product, index) => {
        console.log(`Processing product ${index}:`, product);
        const row = document.createElement('tr');
        
        // Check if stock is below reorder level
        const stockClass = product.stockOnHand <= product.reorderLevel ? 'low-stock' : '';
        
        row.innerHTML = `
            <td>${product.sku || '-'}</td>
            <td>${product.name}</td>
            <td>${product.category ? product.category.name : '-'}</td>
            <td class="${stockClass}">${product.stockOnHand}</td>
            <td>NPR ${formatCurrency(product.purchasePrice)}</td>
            <td>NPR ${formatCurrency(product.sellingPrice)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-edit" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Load categories for dropdown
 */
async function loadCategoriesForDropdown() {
    try {
        categories = await loadCategories();
        populateCategoryDropdown('productCategory', categories);
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

/**
 * Load merchandises for dropdown
 */
async function loadMerchandisesForDropdown() {
    try {
        const refData = await apiRequest('referencedata/categories');
        merchandises = refData.merch;
        populateMerchandiseDropdown('productMerchandise', merchandises);
    } catch (error) {
        console.error('Error loading merchandises:', error);
    }
}

/**
 * Populate merchandise dropdown
 */
function populateMerchandiseDropdown(selectId, merchandises) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = '<option value="">Select Merchandise</option>';
    merchandises.forEach(merch => {
        const option = document.createElement('option');
        option.value = merch.id;
        option.textContent = merch.name;
        select.appendChild(option);
    });
}

/**
 * Show product modal for adding new product
 */
function showProductModal() {
    // Reset form
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('productModalTitle').textContent = 'Add New Product';
    
    // Set edit mode to false
    editMode = false;
    
    // Show modal
    document.getElementById('productModal').style.display = 'block';
}

/**
 * Close product modal
 */
function closeProductModal() {
    document.getElementById('productModal').style.display = 'none';
}

/**
 * Edit product
 * @param {number} productId - Product ID
 */
function editProduct(productId) {
    // Find product
    const product = products.find(p => p.id === productId);
    
    if (!product) {
        showToast('Product not found', 'error');
        return;
    }
    
    // Set form values
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productSku').value = product.sku || '';
    document.getElementById('productCategory').value = product.categoryId || '';
    document.getElementById('productMerchandise').value = product.merchandiseId || '';
    document.getElementById('productDescription').value = product.description || '';
    document.getElementById('productPurchasePrice').value = product.purchasePrice;
    document.getElementById('productSellingPrice').value = product.sellingPrice;
    document.getElementById('productStock').value = product.stockOnHand;
    document.getElementById('productReorderLevel').value = product.reorderLevel;
    document.getElementById('productVat').value = product.vatPercent || 13;
    
    // Set edit mode to true
    editMode = true;
    
    // Update modal title
    document.getElementById('productModalTitle').textContent = 'Edit Product';
    
    // Show modal
    document.getElementById('productModal').style.display = 'block';
}

/**
 * Delete product
 * @param {number} productId - Product ID
 */
async function deleteProduct(productId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        await apiRequest(`products/${productId}`, 'DELETE');
        
        // Reload products
        loadProducts();
        
        // Show success message
        showToast('Product deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting product:', error);
        if (!error.message || error.message === 'API request failed') {
            showToast('Failed to delete product', 'error');
        }
    }
}

/**
 * Handle product form submission
 * @param {Event} event - Form submit event
 */
async function handleProductSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const productId = document.getElementById('productId').value;
    const categoryId = parseInt(document.getElementById('productCategory').value, 10);
    const merchandiseId = parseInt(document.getElementById('productMerchandise').value, 10);
    
    const productData = {
        name: document.getElementById('productName').value.trim(),
        sku: document.getElementById('productSku').value.trim(),
        categoryId,
        merchandiseId,
        description: document.getElementById('productDescription').value.trim(),
        purchasePrice: parseFloat(document.getElementById('productPurchasePrice').value),
        sellingPrice: parseFloat(document.getElementById('productSellingPrice').value),
        stockOnHand: parseInt(document.getElementById('productStock').value, 10) || 0,
        reorderLevel: parseInt(document.getElementById('productReorderLevel').value, 10) || 0,
        vatPercent: parseFloat(document.getElementById('productVat').value) || 0,
        unit: 'pcs'
    };
    
    console.log('Saving product with data:', productData);
    
    try {
        if (editMode) {
            productData.id = parseInt(productId, 10);
            await apiRequest(`products/${productId}`, 'PUT', productData);
            showToast('Product updated successfully', 'success');
        } else {
            // Create new product
            await apiRequest('products', 'POST', productData);
            showToast('Product added successfully', 'success');
        }
        
        // Close modal
        closeProductModal();
        
        // Reload products
        loadProducts();
    } catch (error) {
        console.error('Error saving product:', error);
        if (!error.message || error.message === 'API request failed') {
            showToast('Failed to save product', 'error');
        }
    }
}
