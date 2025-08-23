/* MartMS */
/**
 * Inventory specific JavaScript
 */

// Global variables
let stockMovements = [];
let products = [];

document.addEventListener('DOMContentLoaded', function() {
    // Set up tab switching
    setupTabs();
    
    // Load stock movements
    loadStockMovements();
    
    // Load low stock products
    loadLowStockProducts();
    
    // Set up event listeners
    document.getElementById('stockAdjustmentForm').addEventListener('submit', handleStockAdjustment);
});

/**
 * Set up tab switching
 */
function setupTabs() {
    const tabItems = document.querySelectorAll('.tab-item');
    
    tabItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all tabs
            tabItems.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked tab
            this.classList.add('active');
            
            // Hide all tab panes
            document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            
            // Show selected tab pane
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

/**
 * Load stock movements from API
 */
async function loadStockMovements() {
    try {
        stockMovements = await apiRequest('inventory/movements');
        displayStockMovements(stockMovements);
    } catch (error) {
        console.error('Error loading stock movements:', error);
        showToast('Failed to load stock movements', 'error');
    }
}

/**
 * Display stock movements in table
 * @param {Array} movements - Stock movements data
 */
function displayStockMovements(movements) {
    const tableBody = document.getElementById('stockMovementsTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are any movements
    if (!movements || movements.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">No stock movements found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add movements to table
    movements.forEach(movement => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(movement.date)}</td>
            <td>${movement.productName}</td>
            <td>${formatMovementType(movement.type)}</td>
            <td>${movement.quantity}</td>
            <td>${formatReference(movement.referenceType, movement.referenceId)}</td>
            <td>${movement.notes || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Format movement type
 * @param {string} type - Movement type
 * @returns {string} Formatted type
 */
function formatMovementType(type) {
    switch (type) {
        case 'purchase':
            return '<span class="badge badge-success">Purchase</span>';
        case 'sale':
            return '<span class="badge badge-primary">Sale</span>';
        case 'adjustment_add':
            return '<span class="badge badge-info">Adjustment (+)</span>';
        case 'adjustment_remove':
            return '<span class="badge badge-warning">Adjustment (-)</span>';
        default:
            return type;
    }
}

/**
 * Format reference
 * @param {string} type - Reference type
 * @param {number} id - Reference ID
 * @returns {string} Formatted reference
 */
function formatReference(type, id) {
    switch (type) {
        case 'purchase':
            return `Purchase #${id}`;
        case 'sale':
            return `Sale #${id}`;
        case 'adjustment':
            return `Adjustment #${id}`;
        default:
            return '-';
    }
}

/**
 * Load low stock products from API
 */
async function loadLowStockProducts() {
    try {
        const lowStockProducts = await apiRequest('inventory/low-stock');
        displayLowStockProducts(lowStockProducts);
    } catch (error) {
        console.error('Error loading low stock products:', error);
        showToast('Failed to load low stock products', 'error');
    }
}

/**
 * Display low stock products in table
 * @param {Array} products - Low stock products data
 */
function displayLowStockProducts(products) {
    const tableBody = document.getElementById('lowStockTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are any products
    if (!products || products.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">No low stock products found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add products to table
    products.forEach(product => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category ? product.category.name : '-'}</td>
            <td>${product.stock}</td>
            <td>${product.minStock}</td>
            <td>${getStockStatusBadge(product.stock, product.minStock)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="showStockAdjustmentModal(${product.id})">
                        <i class="fas fa-edit"></i> Adjust
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Get stock status badge
 * @param {number} stock - Current stock
 * @param {number} minStock - Minimum stock
 * @returns {string} Stock status badge
 */
function getStockStatusBadge(stock, minStock) {
    if (stock <= 0) {
        return '<span class="stock-status out">Out of Stock</span>';
    } else if (stock <= minStock) {
        return '<span class="stock-status low">Low Stock</span>';
    } else {
        return '<span class="stock-status normal">Normal</span>';
    }
}

/**
 * Show stock adjustment modal
 * @param {number} productId - Product ID (optional)
 */
async function showStockAdjustmentModal(productId = null) {
    try {
        // Load products if not already loaded
        if (products.length === 0) {
            products = await loadProducts();
        }
        
        // Populate product dropdown
        populateProductSelectForAdjustment(productId);
        
        // Reset form
        document.getElementById('stockAdjustmentForm').reset();
        document.getElementById('currentStock').value = '';
        
        // Pre-select product if provided
        if (productId) {
            document.getElementById('adjustmentProduct').value = productId;
            updateCurrentStock();
        }
        
        // Show modal
        document.getElementById('stockAdjustmentModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

/**
 * Close stock adjustment modal
 */
function closeStockAdjustmentModal() {
    document.getElementById('stockAdjustmentModal').style.display = 'none';
}

/**
 * Populate product select for adjustment
 * @param {number} selectedProductId - Selected product ID (optional)
 */
function populateProductSelectForAdjustment(selectedProductId = null) {
    const select = document.getElementById('adjustmentProduct');
    
    // Clear existing options
    select.innerHTML = '<option value="">Select Product</option>';
    
    // Add products
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        option.dataset.stock = product.stock;
        
        // Select product if it matches the selected ID
        if (selectedProductId && product.id === selectedProductId) {
            option.selected = true;
        }
        
        select.appendChild(option);
    });
}

/**
 * Update current stock display
 */
function updateCurrentStock() {
    const select = document.getElementById('adjustmentProduct');
    const currentStockInput = document.getElementById('currentStock');
    
    // Get selected option
    const option = select.options[select.selectedIndex];
    
    if (option && option.dataset.stock) {
        currentStockInput.value = option.dataset.stock;
    } else {
        currentStockInput.value = '';
    }
}

/**
 * Handle stock adjustment form submission
 * @param {Event} event - Form submit event
 */
async function handleStockAdjustment(event) {
    event.preventDefault();
    
    // Get form values
    const productId = document.getElementById('adjustmentProduct').value;
    const type = document.getElementById('adjustmentType').value;
    const quantity = parseInt(document.getElementById('adjustmentQuantity').value);
    const reason = document.getElementById('adjustmentReason').value;
    const notes = document.getElementById('adjustmentNotes').value;
    
    // Validate form
    if (!productId || !type || !quantity || !reason) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Create adjustment data
    const adjustmentData = {
        productId: parseInt(productId),
        type: type,
        quantity: quantity,
        reason: reason,
        notes: notes
    };
    
    try {
        // Create adjustment
        await apiRequest('inventory/adjustments', 'POST', adjustmentData);
        
        // Close modal
        closeStockAdjustmentModal();
        
        // Reload stock movements and low stock products
        loadStockMovements();
        loadLowStockProducts();
        
        // Reload products to update stock values
        products = await loadProducts();
        
        // Show success message
        showToast('Stock adjustment completed successfully', 'success');
    } catch (error) {
        console.error('Error creating stock adjustment:', error);
        showToast('Failed to complete stock adjustment', 'error');
    }
}