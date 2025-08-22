/**
 * Sales specific JavaScript
 */

// Global variables
let sales = [];
let products = [];
let currentSale = null;

document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    document.getElementById('saleDate').valueAsDate = new Date();
    
    // Load sales
    loadSales();
    
    // Load products for dropdown
    loadProductsForDropdown();
    
    // Set up event listeners
    document.getElementById('salesForm').addEventListener('submit', handleSaleSubmit);
    
    // Add initial sale item
    addSaleItem();
});

/**
 * Load sales from API
 */
async function loadSales() {
    try {
        sales = await apiRequest('sales');
        displaySales(sales);
    } catch (error) {
        console.error('Error loading sales:', error);
        showToast('Failed to load sales', 'error');
    }
}

/**
 * Display sales in table
 * @param {Array} sales - Sales data
 */
function displaySales(sales) {
    const tableBody = document.getElementById('salesTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are any sales
    if (!sales || sales.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">No sales found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add sales to table
    sales.forEach(sale => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${sale.invoiceNumber}</td>
            <td>${sale.customer || 'Walk-in Customer'}</td>
            <td>${formatDate(sale.date)}</td>
            <td>${sale.items ? sale.items.length : 0}</td>
            <td>NPR ${formatCurrency(sale.totalAmount)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewSaleDetails(${sale.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteSale(${sale.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Load products for dropdown
 */
async function loadProductsForDropdown() {
    try {
        products = await loadProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

/**
 * Show sales modal for creating new sale
 */
function showSalesModal() {
    // Reset form
    document.getElementById('salesForm').reset();
    document.getElementById('saleDate').valueAsDate = new Date();
    
    // Clear items container
    document.getElementById('saleItemsContainer').innerHTML = '';
    
    // Add initial item
    addSaleItem();
    
    // Reset totals
    updateSaleTotals();
    
    // Show modal
    document.getElementById('salesModal').style.display = 'block';
}

/**
 * Close sales modal
 */
function closeSalesModal() {
    document.getElementById('salesModal').style.display = 'none';
}

/**
 * Add sale item row
 */
function addSaleItem() {
    const container = document.getElementById('saleItemsContainer');
    const template = document.getElementById('saleItemTemplate');
    const clone = document.importNode(template.content, true);
    
    // Populate product dropdown
    const productSelect = clone.querySelector('.product-select');
    populateProductDropdown(productSelect, products);
    
    container.appendChild(clone);
}

/**
 * Populate product dropdown
 * @param {HTMLElement} select - Select element
 * @param {Array} products - Products data
 */
function populateProductDropdown(select, products) {
    // Clear existing options
    select.innerHTML = '<option value="">Select Product</option>';
    
    // Add products
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        option.dataset.price = product.sellingPrice;
        option.dataset.stock = product.stock;
        select.appendChild(option);
    });
}

/**
 * Update item price when product is selected
 * @param {HTMLElement} select - Product select element
 */
function updateItemPrice(select) {
    const row = select.closest('.item-row');
    const priceInput = row.querySelector('.item-price');
    const quantityInput = row.querySelector('.item-quantity');
    const totalInput = row.querySelector('.item-total');
    
    // Get selected option
    const option = select.options[select.selectedIndex];
    
    if (option && option.dataset.price) {
        // Set price
        priceInput.value = option.dataset.price;
        
        // Update total
        totalInput.value = (parseFloat(priceInput.value) * parseInt(quantityInput.value)).toFixed(2);
        
        // Update sale totals
        updateSaleTotals();
    } else {
        priceInput.value = '';
        totalInput.value = '';
    }
}

/**
 * Update item total when quantity changes
 * @param {HTMLElement} input - Quantity input element
 */
function updateItemTotal(input) {
    const row = input.closest('.item-row');
    const priceInput = row.querySelector('.item-price');
    const totalInput = row.querySelector('.item-total');
    
    if (priceInput.value && input.value) {
        totalInput.value = (parseFloat(priceInput.value) * parseInt(input.value)).toFixed(2);
        
        // Update sale totals
        updateSaleTotals();
    }
}

/**
 * Remove sale item
 * @param {HTMLElement} button - Remove button
 */
function removeSaleItem(button) {
    const row = button.closest('.item-row');
    row.remove();
    
    // Update sale totals
    updateSaleTotals();
}

/**
 * Update sale totals
 */
function updateSaleTotals() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    
    // Calculate subtotal
    rows.forEach(row => {
        const totalInput = row.querySelector('.item-total');
        if (totalInput.value) {
            subtotal += parseFloat(totalInput.value);
        }
    });
    
    // Get discount
    const discountPercent = parseFloat(document.getElementById('saleDiscountPercent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('saleDiscountAmount').value) || 0;
    
    // Calculate discount
    const percentDiscount = subtotal * (discountPercent / 100);
    const totalDiscount = percentDiscount + discountAmount;
    
    // Calculate VAT (13%)
    const vatableAmount = subtotal - totalDiscount;
    const vat = vatableAmount * 0.13;
    
    // Calculate total
    const total = vatableAmount + vat;
    
    // Update display
    document.getElementById('saleSubtotal').textContent = `NPR ${formatCurrency(subtotal)}`;
    document.getElementById('saleVat').textContent = `NPR ${formatCurrency(vat)}`;
    document.getElementById('saleTotal').textContent = `NPR ${formatCurrency(total)}`;
}

/**
 * Handle sale form submission
 * @param {Event} event - Form submit event
 */
async function handleSaleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const customer = document.getElementById('saleCustomer').value;
    const date = document.getElementById('saleDate').value;
    const discountPercent = parseFloat(document.getElementById('saleDiscountPercent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('saleDiscountAmount').value) || 0;
    
    // Get items
    const itemRows = document.querySelectorAll('.item-row');
    const items = [];
    
    // Validate items
    let isValid = true;
    
    itemRows.forEach(row => {
        const productSelect = row.querySelector('.product-select');
        const quantity = parseInt(row.querySelector('.item-quantity').value);
        const price = parseFloat(row.querySelector('.item-price').value);
        
        if (!productSelect.value || !quantity || !price) {
            isValid = false;
            return;
        }
        
        items.push({
            productId: parseInt(productSelect.value),
            productName: productSelect.options[productSelect.selectedIndex].text,
            quantity: quantity,
            price: price,
            total: price * quantity
        });
    });
    
    if (!isValid || items.length === 0) {
        showToast('Please add at least one valid item', 'error');
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.total;
    });
    
    const percentDiscount = subtotal * (discountPercent / 100);
    const totalDiscount = percentDiscount + discountAmount;
    const vatableAmount = subtotal - totalDiscount;
    const vat = vatableAmount * 0.13;
    const total = vatableAmount + vat;
    
    // Create sale data
    const saleData = {
        customer: customer,
        date: date,
        items: items,
        subtotal: subtotal,
        discountPercent: discountPercent,
        discountAmount: discountAmount,
        totalDiscount: totalDiscount,
        vat: vat,
        totalAmount: total
    };
    
    try {
        // Create sale
        await apiRequest('sales', 'POST', saleData);
        
        // Close modal
        closeSalesModal();
        
        // Reload sales
        loadSales();
        
        // Show success message
        showToast('Sale completed successfully', 'success');
    } catch (error) {
        console.error('Error creating sale:', error);
        showToast('Failed to complete sale', 'error');
    }
}

/**
 * View sale details
 * @param {number} saleId - Sale ID
 */
async function viewSaleDetails(saleId) {
    try {
        // Get sale details
        currentSale = await apiRequest(`sales/${saleId}`);
        
        // Populate details
        document.getElementById('detailsInvoiceNumber').textContent = currentSale.invoiceNumber;
        document.getElementById('detailsDate').textContent = formatDate(currentSale.date);
        document.getElementById('detailsCustomer').textContent = currentSale.customer || 'Walk-in Customer';
        
        // Populate items table
        const tableBody = document.getElementById('saleDetailsTableBody');
        tableBody.innerHTML = '';
        
        currentSale.items.forEach(item => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${item.productName}</td>
                <td>NPR ${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>NPR ${formatCurrency(item.total)}</td>
            `;
            
            tableBody.appendChild(row);
        });
        
        // Update summary
        document.getElementById('detailsSubtotal').textContent = `NPR ${formatCurrency(currentSale.subtotal)}`;
        document.getElementById('detailsDiscount').textContent = `NPR ${formatCurrency(currentSale.totalDiscount)}`;
        document.getElementById('detailsVat').textContent = `NPR ${formatCurrency(currentSale.vat)}`;
        document.getElementById('detailsTotal').textContent = `NPR ${formatCurrency(currentSale.totalAmount)}`;
        
        // Show modal
        document.getElementById('saleDetailsModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading sale details:', error);
        showToast('Failed to load sale details', 'error');
    }
}

/**
 * Close sale details modal
 */
function closeSaleDetailsModal() {
    document.getElementById('saleDetailsModal').style.display = 'none';
}

/**
 * Print sale details
 */
function printSaleDetails() {
    if (!currentSale) return;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Create print content
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sale Invoice #${currentSale.invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .invoice-details { margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
                .summary { margin-top: 20px; text-align: right; }
                .total { font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Daily Deals Inventory System</h1>
                <h2>Sale Invoice</h2>
            </div>
            
            <div class="invoice-details">
                <p><strong>Invoice #:</strong> ${currentSale.invoiceNumber}</p>
                <p><strong>Date:</strong> ${formatDate(currentSale.date)}</p>
                <p><strong>Customer:</strong> ${currentSale.customer || 'Walk-in Customer'}</p>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `);
    
    // Add items
    currentSale.items.forEach(item => {
        printWindow.document.write(`
            <tr>
                <td>${item.productName}</td>
                <td>NPR ${formatCurrency(item.price)}</td>
                <td>${item.quantity}</td>
                <td>NPR ${formatCurrency(item.total)}</td>
            </tr>
        `);
    });
    
    // Add summary
    printWindow.document.write(`
                </tbody>
            </table>
            
            <div class="summary">
                <p><strong>Subtotal:</strong> NPR ${formatCurrency(currentSale.subtotal)}</p>
                <p><strong>Discount:</strong> NPR ${formatCurrency(currentSale.totalDiscount)}</p>
                <p><strong>VAT (13%):</strong> NPR ${formatCurrency(currentSale.vat)}</p>
                <p class="total"><strong>Total:</strong> NPR ${formatCurrency(currentSale.totalAmount)}</p>
            </div>
        </body>
        </html>
    `);
    
    // Print
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

/**
 * Delete sale
 * @param {number} saleId - Sale ID
 */
async function deleteSale(saleId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this sale?')) {
        return;
    }
    
    try {
        await apiRequest(`sales/${saleId}`, 'DELETE');
        
        // Reload sales
        loadSales();
        
        // Show success message
        showToast('Sale deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting sale:', error);
        showToast('Failed to delete sale', 'error');
    }
}