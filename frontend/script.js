// Global variables
let connection;
let products = [];
let vendors = [];
let customers = [];
let categories = [];
let currentTab = 'dashboard';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Load Categories
async function loadCategories() {
    try {
        const response = await fetch(`${API_BASE}/categories`);
        if (response.ok) {
            categories = await response.json();
            populateCategoryDropdowns();
        }
    } catch (error) {
        console.error('Error loading categories:', error);
        showToast('Failed to load categories', 'error');
    }
}

// Populate category dropdowns
function populateCategoryDropdowns() {
    const categorySelects = document.querySelectorAll('.category-select');
    categorySelects.forEach(select => {
        select.innerHTML = '<option value="">Select Category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    });
}

// Generate Daily Sales Report
async function generateDailySalesReport() {
    // Get the selected date from the date picker
    const reportDate = document.getElementById('salesReportDate').value;
    
    try {
        const response = await fetch(`${API_BASE}/reports/sales/daily?date=${reportDate}`);
        if (response.ok) {
            const reportData = await response.json();
            displayDailySalesReport(reportData);
        } else {
            showToast('Failed to generate sales report', 'error');
        }
    } catch (error) {
        console.error('Error generating sales report:', error);
        showToast('Failed to generate sales report', 'error');
    }
}

// Generate Stock Report
async function generateStockReport() {
    // Get the selected category from the dropdown
    const categoryId = document.getElementById('stockReportCategory').value;
    
    try {
        const url = categoryId ? 
            `${API_BASE}/reports/stock?categoryId=${categoryId}` : 
            `${API_BASE}/reports/stock`;
            
        const response = await fetch(url);
        if (response.ok) {
            const reportData = await response.json();
            displayStockReport(reportData);
        } else {
            showToast('Failed to generate stock report', 'error');
        }
    } catch (error) {
        console.error('Error generating stock report:', error);
        showToast('Failed to generate stock report', 'error');
    }
}

// Display Daily Sales Report
function displayDailySalesReport(report) {
    const reportResults = document.getElementById('reportResults');
    
    // Clear previous report
    reportResults.innerHTML = '';
    
    // Create report container
    const reportContainer = document.createElement('div');
    reportContainer.className = 'report-container';
    
    // Create report header
    const header = document.createElement('div');
    header.className = 'report-header';
    header.innerHTML = `
        <h3>Daily Sales Report - ${new Date(report.date).toLocaleDateString()}</h3>
        <button class="btn btn-sm" onclick="printReport()"><i class="fas fa-print"></i> Print</button>
    `;
    
    // Create summary section
    const summary = document.createElement('div');
    summary.className = 'report-summary';
    summary.innerHTML = `
        <div class="summary-item">
            <span class="label">Total Sales:</span>
            <span class="value">NPR ${report.totalSales.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="label">Orders:</span>
            <span class="value">${report.totalOrders}</span>
        </div>
        <div class="summary-item">
            <span class="label">Items Sold:</span>
            <span class="value">${report.totalItems}</span>
        </div>
        <div class="summary-item">
            <span class="label">Total Discount:</span>
            <span class="value">NPR ${report.totalDiscount.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="label">Total VAT:</span>
            <span class="value">NPR ${report.totalVat.toFixed(2)}</span>
        </div>
    `;
    
    // Create category breakdown
    const categorySection = document.createElement('div');
    categorySection.className = 'category-breakdown';
    categorySection.innerHTML = '<h4>Sales by Category</h4>';
    
    const categoryTable = document.createElement('table');
    categoryTable.className = 'report-table';
    categoryTable.innerHTML = `
        <thead>
            <tr>
                <th>Category</th>
                <th>Sales Amount</th>
                <th>Percentage</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const categoryTbody = categoryTable.querySelector('tbody');
    
    report.categorySales.forEach(category => {
        const percentage = (category.totalSales / report.totalSales * 100).toFixed(1);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.categoryName}</td>
            <td>NPR ${category.totalSales.toFixed(2)}</td>
            <td>${percentage}%</td>
        `;
        categoryTbody.appendChild(row);
    });
    
    categorySection.appendChild(categoryTable);
    
    // Append all sections to the report container
    reportContainer.appendChild(header);
    reportContainer.appendChild(summary);
    reportContainer.appendChild(categorySection);
    
    // Append the report container to the results div
    reportResults.appendChild(reportContainer);
}

// Display Stock Report
function displayStockReport(report) {
    const reportResults = document.getElementById('reportResults');
    
    // Clear previous report
    reportResults.innerHTML = '';
    
    // Create report container
    const reportContainer = document.createElement('div');
    reportContainer.className = 'report-container';
    
    // Create report header
    const header = document.createElement('div');
    header.className = 'report-header';
    header.innerHTML = `
        <h3>Stock Report - ${new Date(report.generatedAt).toLocaleDateString()}</h3>
        <button class="btn btn-sm" onclick="printReport()"><i class="fas fa-print"></i> Print</button>
    `;
    
    // Create summary section
    const summary = document.createElement('div');
    summary.className = 'report-summary';
    summary.innerHTML = `
        <div class="summary-item">
            <span class="label">Total Products:</span>
            <span class="value">${report.totalProducts}</span>
        </div>
        <div class="summary-item">
            <span class="label">Total Stock:</span>
            <span class="value">${report.totalStock} units</span>
        </div>
        <div class="summary-item">
            <span class="label">Stock Value:</span>
            <span class="value">NPR ${report.totalStockValue.toFixed(2)}</span>
        </div>
        <div class="summary-item">
            <span class="label">Low Stock Items:</span>
            <span class="value">${report.lowStockItems}</span>
        </div>
    `;
    
    // Create category breakdown
    const categorySection = document.createElement('div');
    categorySection.className = 'category-breakdown';
    categorySection.innerHTML = '<h4>Stock by Category</h4>';
    
    const categoryTable = document.createElement('table');
    categoryTable.className = 'report-table';
    categoryTable.innerHTML = `
        <thead>
            <tr>
                <th>Category</th>
                <th>Items</th>
                <th>Stock Quantity</th>
                <th>Stock Value</th>
            </tr>
        </thead>
        <tbody></tbody>
    `;
    
    const categoryTbody = categoryTable.querySelector('tbody');
    
    report.categoryStock.forEach(category => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.categoryName}</td>
            <td>${category.totalItems}</td>
            <td>${category.totalStock}</td>
            <td>NPR ${category.totalValue.toFixed(2)}</td>
        `;
        categoryTbody.appendChild(row);
    });
    
    categorySection.appendChild(categoryTable);
    
    // Append all sections to the report container
    reportContainer.appendChild(header);
    reportContainer.appendChild(summary);
    reportContainer.appendChild(categorySection);
    
    // Append the report container to the results div
    reportResults.appendChild(reportContainer);
}

// Print Report
function printReport() {
    window.print();
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSignalR();
    setupEventListeners();
    loadDashboardData();
    loadProducts();
    loadVendors();
    loadCustomers();
    loadCategories();
    
    // Set default date for sales report to today
    const salesReportDateEl = document.getElementById('salesReportDate');
    if (salesReportDateEl) {
        salesReportDateEl.valueAsDate = new Date();
    }
    
    // Set up refresh interval for dashboard data (every 5 minutes)
    setInterval(loadDashboardData, 5 * 60 * 1000);
    
    // Set up event listener for stock adjustment form
    const stockAdjustmentForm = document.getElementById('stockAdjustmentForm');
    if (stockAdjustmentForm) {
        stockAdjustmentForm.addEventListener('submit', handleStockAdjustment);
    }
});

// SignalR Connection
function initializeSignalR() {
    connection = new signalR.HubConnectionBuilder()
        .withUrl('http://localhost:5000/hubs/inventory')
        .build();

    connection.on('StockUpdated', function(updatedProducts) {
        console.log('Stock updated:', updatedProducts);
        showToast('Stock levels updated in real-time', 'info');
        loadProducts();
        loadDashboardData();
    });

    connection.start()
        .then(() => {
            console.log('SignalR Connected');
            showToast('Connected to real-time updates', 'success');
        })
        .catch(err => {
            console.error('SignalR Connection Error:', err);
            showToast('Real-time connection failed', 'error');
        });
}

// Event Listeners
function setupEventListeners() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
    document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseSubmit);
    document.getElementById('salesForm').addEventListener('submit', handleSalesSubmit);

    window.addEventListener('click', function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Tab Navigation
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabName).classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    currentTab = tabName;

    switch(tabName) {
        case 'products':
            loadProducts();
            break;
        case 'purchase':
            loadPurchaseOrders();
            break;
        case 'sales':
            loadSalesOrders();
            break;
        case 'reports':
            loadReports();
            break;
        case 'inventory':
            loadStockMovements();
            break;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Get today's date in YYYY-MM-DD format for API calls
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch all required dashboard data in parallel
        const [productsRes, alertsRes, todaySalesRes, todayPurchasesRes] = await Promise.all([
            fetch(`${API_BASE}/products`),
            fetch(`${API_BASE}/products/low-stock`),
            fetch(`${API_BASE}/reports/sales/daily?date=${today}`),
            fetch(`${API_BASE}/reports/purchases/daily?date=${today}`)
        ]);

        // Update product metrics
        if (productsRes.ok) {
            const productsData = await productsRes.json();
            document.getElementById('totalProducts').textContent = productsData.length;
        }
        
        // Update low stock alerts
        if (alertsRes.ok) {
            const lowStockData = await alertsRes.json();
            document.getElementById('lowStockCount').textContent = lowStockData.length;
            displayAlerts(lowStockData);
        }
        
        // Update today's sales
        if (todaySalesRes.ok) {
            const salesData = await todaySalesRes.json();
            document.getElementById('todaySales').textContent = salesData.totalSales.toFixed(2);
        }
        
        // Update today's purchases
        if (todayPurchasesRes.ok) {
            const purchasesData = await todayPurchasesRes.json();
            document.getElementById('todayPurchases').textContent = purchasesData.totalAmount.toFixed(2);
        }
        
        // Update dashboard charts if they exist
        updateDashboardCharts();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function displayAlerts(lowStockProducts) {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    if (lowStockProducts.length === 0) {
        alertsList.innerHTML = '<p class="no-alerts">No low stock alerts</p>';
        return;
    }

    lowStockProducts.forEach(product => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-item';
        alertDiv.innerHTML = `
            <h4>${product.name}</h4>
            <p>Current Stock: ${product.stockOnHand} | Reorder Level: ${product.reorderLevel}</p>
            <button class="btn btn-sm btn-primary" onclick="orderProduct(${product.id})">Order More</button>
        `;
        alertsList.appendChild(alertDiv);
    });
}

// Function to handle ordering more of a product
function orderProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        showPurchaseModal(product);
    }
}

// Update dashboard charts
function updateDashboardCharts() {
    // This function will be used to update any charts or visualizations on the dashboard
    // For now, it's a placeholder for future chart implementations
    console.log('Dashboard charts updated');
}

// Product Functions
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        if (response.ok) {
            products = await response.json();
            displayProducts(products);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

function displayProducts(productsToShow) {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';

    productsToShow.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.sku}</td>
            <td>${product.name}</td>
            <td>${product.merchandise?.name || 'N/A'}</td>
            <td class="${product.stockOnHand <= product.reorderLevel ? 'low-stock' : ''}">${product.stockOnHand}</td>
            <td>NPR ${product.purchasePrice}</td>
            <td>NPR ${product.sellingPrice}</td>
            <td>
                <button class="btn btn-sm btn-info" onclick="editProduct(${product.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const productData = {
        sku: formData.get('sku'),
        name: formData.get('name'),
        description: formData.get('description'),
        purchasePrice: parseFloat(formData.get('purchasePrice')),
        sellingPrice: parseFloat(formData.get('sellingPrice')),
        stockOnHand: parseInt(formData.get('stockOnHand')),
        reorderLevel: parseInt(formData.get('reorderLevel'))
    };

    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showToast('Product created successfully', 'success');
            closeModal('productModal');
            event.target.reset();
            loadProducts();
            loadDashboardData();
        } else {
            showToast('Failed to create product', 'error');
        }
    } catch (error) {
        console.error('Error creating product:', error);
        showToast('Failed to create product', 'error');
    }
}

// Modal Functions
function showProductModal() {
    document.getElementById('productModal').style.display = 'block';
}

function showPurchaseModal(preSelectedProduct = null) {
    document.getElementById('purchaseModal').style.display = 'block';
    populateProductSelects();
    
    // If a product is pre-selected (from low stock alert)
    if (preSelectedProduct) {
        // Add a purchase item with the pre-selected product
        addPurchaseItem();
        
        // Get the last added purchase item row
        const purchaseItems = document.querySelectorAll('.purchase-item');
        const lastItem = purchaseItems[purchaseItems.length - 1];
        
        if (lastItem) {
            // Set the product dropdown to the pre-selected product
            const productSelect = lastItem.querySelector('.product-select');
            if (productSelect) {
                productSelect.value = preSelectedProduct.id;
                
                // Trigger the change event to update price
                const event = new Event('change');
                productSelect.dispatchEvent(event);
                
                // Set a suggested quantity based on reorder level
                const quantityInput = lastItem.querySelector('.quantity-input');
                if (quantityInput) {
                    // Calculate suggested order quantity (reorder level - current stock + buffer)
                    const buffer = 5; // Additional buffer stock
                    const suggestedQuantity = preSelectedProduct.reorderLevel - preSelectedProduct.stockOnHand + buffer;
                    quantityInput.value = suggestedQuantity > 0 ? suggestedQuantity : 1;
                    
                    // Trigger change to update totals
                    quantityInput.dispatchEvent(new Event('change'));
                }
            }
        }
    }
    if (document.querySelectorAll('.purchase-item').length === 0) {
        addPurchaseItem();
    }
}

function showSalesModal() {
    document.getElementById('salesModal').style.display = 'block';
    populateProductSelects();
    if (document.querySelectorAll('.sales-item').length === 0) {
        addSalesItem();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Utility Functions
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Inventory Management Functions
async function loadStockMovements() {
    try {
        const response = await fetch(`${API_BASE}/stockmovement`);
        if (response.ok) {
            const movements = await response.json();
            displayStockMovements(movements);
        } else {
            showToast('Failed to load stock movements', 'error');
        }
    } catch (error) {
        console.error('Error loading stock movements:', error);
        showToast('Failed to load stock movements', 'error');
    }
}

function displayStockMovements(movements) {
    const tableBody = document.getElementById('stockMovementTableBody');
    tableBody.innerHTML = '';
    
    if (movements.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="7" class="text-center">No stock movements found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    movements.forEach(movement => {
        const row = document.createElement('tr');
        
        // Format the date
        const date = new Date(movement.createdAt).toLocaleString();
        
        // Determine movement type class for styling
        let typeClass = '';
        switch(movement.movementType) {
            case 'Purchase':
                typeClass = 'text-success';
                break;
            case 'Sale':
                typeClass = 'text-danger';
                break;
            case 'Adjustment':
                typeClass = 'text-warning';
                break;
            default:
                typeClass = '';
        }
        
        row.innerHTML = `
            <td>${date}</td>
            <td>${movement.product ? movement.product.name : 'Unknown Product'}</td>
            <td class="${typeClass}">${movement.movementType}</td>
            <td>${Math.abs(movement.quantity)}</td>
            <td>${movement.previousStock}</td>
            <td>${movement.newStock}</td>
            <td>${movement.reference || '-'}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

function showStockAdjustmentModal() {
    document.getElementById('stockAdjustmentModal').style.display = 'block';
    populateProductSelectForAdjustment();
}

function populateProductSelectForAdjustment() {
    const select = document.getElementById('adjustmentProduct');
    select.innerHTML = '<option value="">Select Product</option>';
    
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = `${product.name} (${product.sku})`;
        option.dataset.stock = product.stockOnHand;
        select.appendChild(option);
    });
    
    // Add event listener to update current stock display
    select.addEventListener('change', function() {
        const selectedOption = this.options[this.selectedIndex];
        const currentStockInput = document.getElementById('currentStock');
        
        if (selectedOption.value) {
            currentStockInput.value = selectedOption.dataset.stock;
        } else {
            currentStockInput.value = '';
        }
    });
}

async function handleStockAdjustment(event) {
    event.preventDefault();
    
    const form = event.target;
    const productId = form.productId.value;
    const quantity = parseInt(form.quantity.value);
    const adjustmentType = form.adjustmentType.value;
    const reason = form.reason.value;
    
    // Calculate the actual quantity (positive for add, negative for remove)
    const adjustedQuantity = adjustmentType === 'add' ? quantity : -quantity;
    
    const adjustmentData = {
        productId,
        quantity: adjustedQuantity,
        reason
    };
    
    try {
        const response = await fetch(`${API_BASE}/stockmovement/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(adjustmentData)
        });
        
        if (response.ok) {
            showToast('Stock adjusted successfully', 'success');
            closeModal('stockAdjustmentModal');
            form.reset();
            loadStockMovements();
            loadProducts(); // Refresh products to update stock levels
            loadDashboardData(); // Update dashboard data
        } else {
            const errorData = await response.json();
            showToast(errorData.message || 'Failed to adjust stock', 'error');
        }
    } catch (error) {
        console.error('Error adjusting stock:', error);
        showToast('Failed to adjust stock', 'error');
    }
}

// Placeholder functions for other features
function loadVendors() {}
function loadCustomers() {}
function loadPurchaseOrders() {}
function loadSalesOrders() {}
function loadReports() {}
function addPurchaseItem() {}
function addSalesItem() {}
function handlePurchaseSubmit() {}
function handleSalesSubmit() {}
function populateProductSelects() {}
function populateVendorSelect() {}
function populateCustomerSelect() {}
function editProduct() {}
function deleteProduct() {}
function resolveAlert() {}
