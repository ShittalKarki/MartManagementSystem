// Reports Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize date fields with default values (current month)
    initializeDateFields();
    
    // Load dropdown options
    loadProducts();
    loadCategories();
    loadSuppliers();
    
    // Set up form submission handler
    document.getElementById('reportForm').addEventListener('submit', function(e) {
        e.preventDefault();
        generateReport();
    });
});

/**
 * Initialize date fields with default values (current month)
 */
function initializeDateFields() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const startDateField = document.getElementById('startDate');
    const endDateField = document.getElementById('endDate');
    
    startDateField.value = formatDateForInput(firstDay);
    endDateField.value = formatDateForInput(today);
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Load products for dropdown
 */
function loadProducts() {
    apiRequest('GET', '/api/products')
        .then(products => {
            const salesProductSelect = document.getElementById('salesProduct');
            
            // Clear existing options except the first one
            while (salesProductSelect.options.length > 1) {
                salesProductSelect.remove(1);
            }
            
            // Add product options
            products.forEach(product => {
                const option = document.createElement('option');
                option.value = product.id;
                option.textContent = product.name;
                salesProductSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading products:', error);
            showToast('error', 'Failed to load products');
        });
}

/**
 * Load categories for dropdown
 */
function loadCategories() {
    apiRequest('GET', '/api/categories')
        .then(categories => {
            const categorySelect = document.getElementById('inventoryCategory');
            
            // Clear existing options except the first one
            while (categorySelect.options.length > 1) {
                categorySelect.remove(1);
            }
            
            // Add category options
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            showToast('error', 'Failed to load categories');
        });
}

/**
 * Load suppliers for dropdown
 */
function loadSuppliers() {
    apiRequest('GET', '/api/suppliers')
        .then(suppliers => {
            const supplierSelect = document.getElementById('purchasesSupplier');
            
            // Clear existing options except the first one
            while (supplierSelect.options.length > 1) {
                supplierSelect.remove(1);
            }
            
            // Add supplier options
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                supplierSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading suppliers:', error);
            showToast('error', 'Failed to load suppliers');
        });
}

/**
 * Show the appropriate report form based on report type
 */
function showReportForm(reportType) {
    // Set the report type
    document.getElementById('reportType').value = reportType;
    
    // Update form title
    let formTitle = 'Generate Report';
    switch(reportType) {
        case 'sales':
            formTitle = 'Generate Sales Report';
            break;
        case 'inventory':
            formTitle = 'Generate Inventory Report';
            break;
        case 'purchases':
            formTitle = 'Generate Purchase Report';
            break;
        case 'profit':
            formTitle = 'Generate Profit & Loss Report';
            break;
    }
    document.getElementById('reportFormTitle').textContent = formTitle;
    
    // Hide all report-specific fields
    const specificFields = document.querySelectorAll('.report-specific-fields');
    specificFields.forEach(field => {
        field.style.display = 'none';
    });
    
    // Show the appropriate fields for the selected report type
    const fieldId = reportType + 'ReportFields';
    const field = document.getElementById(fieldId);
    if (field) {
        field.style.display = 'block';
    }
    
    // Show the form container
    document.getElementById('reportFormContainer').style.display = 'block';
    
    // Hide results container if visible
    document.getElementById('reportResultsContainer').style.display = 'none';
}

/**
 * Hide the report form
 */
function hideReportForm() {
    document.getElementById('reportFormContainer').style.display = 'none';
}

/**
 * Generate the requested report
 */
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const format = document.getElementById('reportFormat').value;
    
    // Build the query parameters
    let params = `startDate=${startDate}&endDate=${endDate}&format=${format}`;
    
    // Add report-specific parameters
    switch(reportType) {
        case 'sales':
            const salesProduct = document.getElementById('salesProduct').value;
            const salesGroupBy = document.getElementById('salesGroupBy').value;
            if (salesProduct) params += `&productId=${salesProduct}`;
            params += `&groupBy=${salesGroupBy}`;
            break;
            
        case 'inventory':
            const inventoryReportType = document.getElementById('inventoryReportType').value;
            const inventoryCategory = document.getElementById('inventoryCategory').value;
            params += `&reportType=${inventoryReportType}`;
            if (inventoryCategory) params += `&categoryId=${inventoryCategory}`;
            break;
            
        case 'purchases':
            const purchasesSupplier = document.getElementById('purchasesSupplier').value;
            const purchasesGroupBy = document.getElementById('purchasesGroupBy').value;
            if (purchasesSupplier) params += `&supplierId=${purchasesSupplier}`;
            params += `&groupBy=${purchasesGroupBy}`;
            break;
            
        case 'profit':
            const profitGroupBy = document.getElementById('profitGroupBy').value;
            const profitIncludeChart = document.getElementById('profitIncludeChart').value;
            params += `&groupBy=${profitGroupBy}&includeChart=${profitIncludeChart === 'yes'}`;
            break;
    }
    
    // Show loading state
    document.getElementById('reportResults').innerHTML = '<div class="loading">Generating report...</div>';
    document.getElementById('reportResultsContainer').style.display = 'block';
    
    // Set the report results title
    let resultsTitle = 'Report Results';
    switch(reportType) {
        case 'sales':
            resultsTitle = 'Sales Report';
            break;
        case 'inventory':
            resultsTitle = 'Inventory Report';
            break;
        case 'purchases':
            resultsTitle = 'Purchase Report';
            break;
        case 'profit':
            resultsTitle = 'Profit & Loss Report';
            break;
    }
    document.getElementById('reportResultsTitle').textContent = resultsTitle;
    
    // Make the API request
    apiRequest('GET', `/api/reports/${reportType}?${params}`)
        .then(data => {
            // Hide the form
            hideReportForm();
            
            // Display the report results
            displayReportResults(reportType, data);
        })
        .catch(error => {
            console.error('Error generating report:', error);
            showToast('error', 'Failed to generate report');
            document.getElementById('reportResults').innerHTML = '<div class="error">Failed to generate report. Please try again.</div>';
        });
}

/**
 * Display the report results based on report type and data
 */
function displayReportResults(reportType, data) {
    const resultsContainer = document.getElementById('reportResults');
    let html = '';
    
    // Add report header with date range
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    html += `<div class="report-header">
                <h4>${getReportTitle(reportType)}</h4>
                <p>Period: ${formatDate(startDate)} to ${formatDate(endDate)}</p>
            </div>`;
    
    // Generate report content based on report type
    switch(reportType) {
        case 'sales':
            html += generateSalesReportHtml(data);
            break;
        case 'inventory':
            html += generateInventoryReportHtml(data);
            break;
        case 'purchases':
            html += generatePurchasesReportHtml(data);
            break;
        case 'profit':
            html += generateProfitReportHtml(data);
            break;
    }
    
    resultsContainer.innerHTML = html;
    
    // Initialize charts if needed
    if (reportType === 'profit' && document.getElementById('profitIncludeChart').value === 'yes') {
        initializeCharts(data);
    }
}

/**
 * Get the report title based on report type
 */
function getReportTitle(reportType) {
    switch(reportType) {
        case 'sales':
            return 'Sales Report';
        case 'inventory':
            const inventoryReportType = document.getElementById('inventoryReportType').value;
            switch(inventoryReportType) {
                case 'stock_levels':
                    return 'Current Stock Levels Report';
                case 'stock_movements':
                    return 'Stock Movements Report';
                case 'low_stock':
                    return 'Low Stock Items Report';
                case 'valuation':
                    return 'Inventory Valuation Report';
                default:
                    return 'Inventory Report';
            }
        case 'purchases':
            return 'Purchase Report';
        case 'profit':
            return 'Profit & Loss Report';
        default:
            return 'Report';
    }
}

/**
 * Generate HTML for sales report
 */
function generateSalesReportHtml(data) {
    let html = '<table class="report-table">';
    
    // Table header
    html += '<thead><tr>';
    const groupBy = document.getElementById('salesGroupBy').value;
    
    if (groupBy === 'product') {
        html += '<th>Product</th><th>Quantity Sold</th><th>Total Sales</th>';
    } else {
        html += `<th>${capitalizeFirstLetter(groupBy)}</th><th>Orders</th><th>Items Sold</th><th>Total Sales</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    // Table rows
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            html += '<tr>';
            
            if (groupBy === 'product') {
                html += `<td>${item.name}</td>`;
                html += `<td>${item.quantity}</td>`;
                html += `<td>${formatCurrency(item.total)}</td>`;
            } else {
                html += `<td>${item.period}</td>`;
                html += `<td>${item.orders}</td>`;
                html += `<td>${item.quantity}</td>`;
                html += `<td>${formatCurrency(item.total)}</td>`;
            }
            
            html += '</tr>';
        });
    } else {
        html += '<tr><td colspan="4">No data available for the selected period</td></tr>';
    }
    
    html += '</tbody></table>';
    
    // Summary section
    if (data.summary) {
        html += `<div class="report-summary">
                    <div class="summary-row">
                        <span>Total Orders:</span>
                        <span>${data.summary.totalOrders}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Items Sold:</span>
                        <span>${data.summary.totalQuantity}</span>
                    </div>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(data.summary.subtotal)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Discount:</span>
                        <span>${formatCurrency(data.summary.totalDiscount)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total VAT:</span>
                        <span>${formatCurrency(data.summary.totalVat)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Sales:</span>
                        <span>${formatCurrency(data.summary.total)}</span>
                    </div>
                </div>`;
    }
    
    return html;
}

/**
 * Generate HTML for inventory report
 */
function generateInventoryReportHtml(data) {
    const inventoryReportType = document.getElementById('inventoryReportType').value;
    let html = '<table class="report-table">';
    
    // Table header
    html += '<thead><tr>';
    
    switch(inventoryReportType) {
        case 'stock_levels':
            html += '<th>Product</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Status</th>';
            break;
        case 'stock_movements':
            html += '<th>Date</th><th>Product</th><th>Type</th><th>Quantity</th><th>Reference</th>';
            break;
        case 'low_stock':
            html += '<th>Product</th><th>Category</th><th>Current Stock</th><th>Min Stock</th><th>Status</th>';
            break;
        case 'valuation':
            html += '<th>Product</th><th>Category</th><th>Quantity</th><th>Cost Price</th><th>Total Value</th>';
            break;
    }
    
    html += '</tr></thead><tbody>';
    
    // Table rows
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            html += '<tr>';
            
            switch(inventoryReportType) {
                case 'stock_levels':
                    html += `<td>${item.productName}</td>`;
                    html += `<td>${item.categoryName}</td>`;
                    html += `<td>${item.currentStock}</td>`;
                    html += `<td>${item.minStock}</td>`;
                    html += `<td><span class="stock-status ${getStockStatusClass(item.currentStock, item.minStock)}">${getStockStatusText(item.currentStock, item.minStock)}</span></td>`;
                    break;
                case 'stock_movements':
                    html += `<td>${formatDate(item.date)}</td>`;
                    html += `<td>${item.productName}</td>`;
                    html += `<td>${formatMovementType(item.type)}</td>`;
                    html += `<td>${item.quantity}</td>`;
                    html += `<td>${formatMovementReference(item.type, item.reference)}</td>`;
                    break;
                case 'low_stock':
                    html += `<td>${item.productName}</td>`;
                    html += `<td>${item.categoryName}</td>`;
                    html += `<td>${item.currentStock}</td>`;
                    html += `<td>${item.minStock}</td>`;
                    html += `<td><span class="stock-status ${getStockStatusClass(item.currentStock, item.minStock)}">${getStockStatusText(item.currentStock, item.minStock)}</span></td>`;
                    break;
                case 'valuation':
                    html += `<td>${item.productName}</td>`;
                    html += `<td>${item.categoryName}</td>`;
                    html += `<td>${item.quantity}</td>`;
                    html += `<td>${formatCurrency(item.costPrice)}</td>`;
                    html += `<td>${formatCurrency(item.totalValue)}</td>`;
                    break;
            }
            
            html += '</tr>';
        });
    } else {
        const colSpan = inventoryReportType === 'stock_movements' ? 5 : 5;
        html += `<tr><td colspan="${colSpan}">No data available for the selected criteria</td></tr>`;
    }
    
    html += '</tbody></table>';
    
    // Summary section for valuation report
    if (inventoryReportType === 'valuation' && data.summary) {
        html += `<div class="report-summary">
                    <div class="summary-row">
                        <span>Total Products:</span>
                        <span>${data.summary.totalProducts}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Items:</span>
                        <span>${data.summary.totalQuantity}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Inventory Value:</span>
                        <span>${formatCurrency(data.summary.totalValue)}</span>
                    </div>
                </div>`;
    }
    
    return html;
}

/**
 * Generate HTML for purchases report
 */
function generatePurchasesReportHtml(data) {
    let html = '<table class="report-table">';
    
    // Table header
    html += '<thead><tr>';
    const groupBy = document.getElementById('purchasesGroupBy').value;
    
    if (groupBy === 'product') {
        html += '<th>Product</th><th>Quantity Purchased</th><th>Total Cost</th>';
    } else if (groupBy === 'supplier') {
        html += '<th>Supplier</th><th>Orders</th><th>Items Purchased</th><th>Total Cost</th>';
    } else {
        html += `<th>${capitalizeFirstLetter(groupBy)}</th><th>Orders</th><th>Items Purchased</th><th>Total Cost</th>`;
    }
    
    html += '</tr></thead><tbody>';
    
    // Table rows
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            html += '<tr>';
            
            if (groupBy === 'product') {
                html += `<td>${item.name}</td>`;
                html += `<td>${item.quantity}</td>`;
                html += `<td>${formatCurrency(item.total)}</td>`;
            } else if (groupBy === 'supplier') {
                html += `<td>${item.name}</td>`;
                html += `<td>${item.orders}</td>`;
                html += `<td>${item.quantity}</td>`;
                html += `<td>${formatCurrency(item.total)}</td>`;
            } else {
                html += `<td>${item.period}</td>`;
                html += `<td>${item.orders}</td>`;
                html += `<td>${item.quantity}</td>`;
                html += `<td>${formatCurrency(item.total)}</td>`;
            }
            
            html += '</tr>';
        });
    } else {
        html += '<tr><td colspan="4">No data available for the selected period</td></tr>';
    }
    
    html += '</tbody></table>';
    
    // Summary section
    if (data.summary) {
        html += `<div class="report-summary">
                    <div class="summary-row">
                        <span>Total Orders:</span>
                        <span>${data.summary.totalOrders}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Items Purchased:</span>
                        <span>${data.summary.totalQuantity}</span>
                    </div>
                    <div class="summary-row">
                        <span>Subtotal:</span>
                        <span>${formatCurrency(data.summary.subtotal)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total VAT:</span>
                        <span>${formatCurrency(data.summary.totalVat)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Cost:</span>
                        <span>${formatCurrency(data.summary.total)}</span>
                    </div>
                </div>`;
    }
    
    return html;
}

/**
 * Generate HTML for profit & loss report
 */
function generateProfitReportHtml(data) {
    let html = '';
    
    // Add chart container if chart is enabled
    if (document.getElementById('profitIncludeChart').value === 'yes') {
        html += '<div class="chart-container" id="profitChart"></div>';
    }
    
    html += '<table class="report-table">';
    
    // Table header
    html += '<thead><tr>';
    const groupBy = document.getElementById('profitGroupBy').value;
    html += `<th>${capitalizeFirstLetter(groupBy)}</th><th>Sales</th><th>Cost of Goods</th><th>Gross Profit</th><th>Margin %</th>`;
    html += '</tr></thead><tbody>';
    
    // Table rows
    if (data.items && data.items.length > 0) {
        data.items.forEach(item => {
            const margin = item.sales > 0 ? (item.profit / item.sales) * 100 : 0;
            
            html += '<tr>';
            html += `<td>${item.period}</td>`;
            html += `<td>${formatCurrency(item.sales)}</td>`;
            html += `<td>${formatCurrency(item.costs)}</td>`;
            html += `<td>${formatCurrency(item.profit)}</td>`;
            html += `<td>${margin.toFixed(2)}%</td>`;
            html += '</tr>';
        });
    } else {
        html += '<tr><td colspan="5">No data available for the selected period</td></tr>';
    }
    
    html += '</tbody></table>';
    
    // Summary section
    if (data.summary) {
        const totalMargin = data.summary.totalSales > 0 ? (data.summary.totalProfit / data.summary.totalSales) * 100 : 0;
        
        html += `<div class="report-summary">
                    <div class="summary-row">
                        <span>Total Sales:</span>
                        <span>${formatCurrency(data.summary.totalSales)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Cost of Goods:</span>
                        <span>${formatCurrency(data.summary.totalCosts)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Total Gross Profit:</span>
                        <span>${formatCurrency(data.summary.totalProfit)}</span>
                    </div>
                    <div class="summary-row">
                        <span>Average Margin:</span>
                        <span>${totalMargin.toFixed(2)}%</span>
                    </div>
                </div>`;
    }
    
    return html;
}

/**
 * Initialize charts for profit & loss report
 */
function initializeCharts(data) {
    // This is a placeholder for chart initialization
    // In a real implementation, you would use a charting library like Chart.js
    console.log('Chart would be initialized with data:', data);
}

/**
 * Format movement type for display
 */
function formatMovementType(type) {
    switch(type) {
        case 'sale':
            return 'Sale';
        case 'purchase':
            return 'Purchase';
        case 'adjustment':
            return 'Adjustment';
        case 'return':
            return 'Return';
        default:
            return type;
    }
}

/**
 * Format movement reference for display
 */
function formatMovementReference(type, reference) {
    switch(type) {
        case 'sale':
            return `Sale #${reference}`;
        case 'purchase':
            return `Purchase #${reference}`;
        case 'adjustment':
            return `Adjustment #${reference}`;
        case 'return':
            return `Return #${reference}`;
        default:
            return reference;
    }
}

/**
 * Get stock status class based on current and minimum stock
 */
function getStockStatusClass(currentStock, minStock) {
    if (currentStock <= 0) {
        return 'out-of-stock';
    } else if (currentStock < minStock) {
        return 'low-stock';
    } else {
        return 'normal-stock';
    }
}

/**
 * Get stock status text based on current and minimum stock
 */
function getStockStatusText(currentStock, minStock) {
    if (currentStock <= 0) {
        return 'Out of Stock';
    } else if (currentStock < minStock) {
        return 'Low Stock';
    } else {
        return 'Normal';
    }
}

/**
 * Capitalize the first letter of a string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Print the current report
 */
function printReport() {
    window.print();
}

/**
 * Download the current report
 */
function downloadReport() {
    const reportType = document.getElementById('reportType').value;
    const format = document.getElementById('reportFormat').value;
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    // Build the query parameters
    let params = `startDate=${startDate}&endDate=${endDate}&format=${format}&download=true`;
    
    // Add report-specific parameters
    switch(reportType) {
        case 'sales':
            const salesProduct = document.getElementById('salesProduct').value;
            const salesGroupBy = document.getElementById('salesGroupBy').value;
            if (salesProduct) params += `&productId=${salesProduct}`;
            params += `&groupBy=${salesGroupBy}`;
            break;
            
        case 'inventory':
            const inventoryReportType = document.getElementById('inventoryReportType').value;
            const inventoryCategory = document.getElementById('inventoryCategory').value;
            params += `&reportType=${inventoryReportType}`;
            if (inventoryCategory) params += `&categoryId=${inventoryCategory}`;
            break;
            
        case 'purchases':
            const purchasesSupplier = document.getElementById('purchasesSupplier').value;
            const purchasesGroupBy = document.getElementById('purchasesGroupBy').value;
            if (purchasesSupplier) params += `&supplierId=${purchasesSupplier}`;
            params += `&groupBy=${purchasesGroupBy}`;
            break;
            
        case 'profit':
            const profitGroupBy = document.getElementById('profitGroupBy').value;
            params += `&groupBy=${profitGroupBy}`;
            break;
    }
    
    // Create a download link
    const downloadUrl = `${API_BASE_URL}/api/reports/${reportType}/download?${params}`;
    
    // Create a temporary link and trigger the download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `${reportType}_report_${startDate}_to_${endDate}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}