// Global variables
let connection;
let products = [];
let vendors = [];
let customers = [];
let currentTab = 'dashboard';

// API Base URL
const API_BASE = 'http://localhost:5000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSignalR();
    setupEventListeners();
    loadDashboardData();
    loadProducts();
    loadVendors();
    loadCustomers();
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
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        const [productsRes, alertsRes] = await Promise.all([
            fetch(`${API_BASE}/products`),
            fetch(`${API_BASE}/orders/alerts`)
        ]);

        if (productsRes.ok) {
            const productsData = await productsRes.json();
            document.getElementById('totalProducts').textContent = productsData.length;
            
            const lowStockCount = productsData.filter(p => p.stockOnHand <= p.reorderLevel).length;
            document.getElementById('lowStockCount').textContent = lowStockCount;
        }

        if (alertsRes.ok) {
            const alerts = await alertsRes.json();
            displayAlerts(alerts);
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    }
}

function displayAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    alertsList.innerHTML = '';

    if (alerts.length === 0) {
        alertsList.innerHTML = '<p class="no-alerts">No low stock alerts</p>';
        return;
    }

    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert-item';
        alertDiv.innerHTML = `
            <h4>${alert.product.name}</h4>
            <p>Current Stock: ${alert.stockOnHand} | Reorder Level: ${alert.reorderLevel}</p>
            <button class="btn btn-sm btn-primary" onclick="resolveAlert(${alert.id})">Resolve</button>
        `;
        alertsList.appendChild(alertDiv);
    });
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

function showPurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'block';
    populateProductSelects();
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
