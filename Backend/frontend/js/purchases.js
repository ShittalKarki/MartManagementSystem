/**
 * Purchases specific JavaScript
 */

// Global variables
let purchases = [];
let products = [];
let suppliers = [];
let currentPurchase = null;

document.addEventListener('DOMContentLoaded', function() {
    // Set default date to today
    document.getElementById('purchaseDate').valueAsDate = new Date();
    
    // Load purchases
    loadPurchases();
    
    // Load products for dropdown
    loadProductsForDropdown();
    
    // Load suppliers for dropdown
    loadSuppliersForDropdown();
    
    // Set up event listeners
    document.getElementById('purchaseForm').addEventListener('submit', handlePurchaseSubmit);
    
    // Add initial purchase item
    addPurchaseItem();
});

/**
 * Load purchases from API
 */
async function loadPurchases() {
    try {
        purchases = await apiRequest('purchases');
        displayPurchases(purchases);
    } catch (error) {
        console.error('Error loading purchases:', error);
        showToast('Failed to load purchases', 'error');
    }
}

/**
 * Display purchases in table
 * @param {Array} purchases - Purchases data
 */
function displayPurchases(purchases) {
    const tableBody = document.getElementById('purchasesTableBody');
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Check if there are any purchases
    if (!purchases || purchases.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">No purchases found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add purchases to table
    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${purchase.poNumber}</td>
            <td>${purchase.supplier ? purchase.supplier.name : 'Unknown Supplier'}</td>
            <td>${formatDate(purchase.date)}</td>
            <td>${purchase.items ? purchase.items.length : 0}</td>
            <td>NPR ${formatCurrency(purchase.totalAmount)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewPurchaseDetails(${purchase.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deletePurchase(${purchase.id})">
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
 * Load suppliers for dropdown
 */
async function loadSuppliersForDropdown() {
    try {
        suppliers = await apiRequest('suppliers');
        populateSupplierDropdown();
    } catch (error) {
        console.error('Error loading suppliers:', error);
    }
}

/**
 * Populate supplier dropdown
 */
function populateSupplierDropdown() {
    const select = document.getElementById('purchaseSupplier');
    
    // Clear existing options
    select.innerHTML = '<option value="">Select Supplier</option>';
    
    // Add suppliers
    suppliers.forEach(supplier => {
        const option = document.createElement('option');
        option.value = supplier.id;
        option.textContent = supplier.name;
        select.appendChild(option);
    });
}

/**
 * Show purchase modal for creating new purchase
 */
function showPurchaseModal() {
    // Reset form
    document.getElementById('purchaseForm').reset();
    document.getElementById('purchaseDate').valueAsDate = new Date();
    
    // Clear items container
    document.getElementById('purchaseItemsContainer').innerHTML = '';
    
    // Add initial item
    addPurchaseItem();
    
    // Reset totals
    updatePurchaseTotals();
    
    // Show modal
    document.getElementById('purchaseModal').style.display = 'block';
}

/**
 * Close purchase modal
 */
function closePurchaseModal() {
    document.getElementById('purchaseModal').style.display = 'none';
}

/**
 * Add purchase item row
 */
function addPurchaseItem() {
    const container = document.getElementById('purchaseItemsContainer');
    const template = document.getElementById('purchaseItemTemplate');
    const clone = document.importNode(template.content, true);
    
    // Populate product dropdown
    const productSelect = clone.querySelector('.product-select');
    populateProductDropdown(productSelect, products);
    
    container.appendChild(clone);
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
        // Set price (use cost price for purchases)
        priceInput.value = option.dataset.costPrice || option.dataset.price;
        
        // Update total
        totalInput.value = (parseFloat(priceInput.value) * parseInt(quantityInput.value)).toFixed(2);
        
        // Update purchase totals
        updatePurchaseTotals();
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
        
        // Update purchase totals
        updatePurchaseTotals();
    }
}

/**
 * Remove purchase item
 * @param {HTMLElement} button - Remove button
 */
function removePurchaseItem(button) {
    const row = button.closest('.item-row');
    row.remove();
    
    // Update purchase totals
    updatePurchaseTotals();
}

/**
 * Update purchase totals
 */
function updatePurchaseTotals() {
    const rows = document.querySelectorAll('.item-row');
    let subtotal = 0;
    
    // Calculate subtotal
    rows.forEach(row => {
        const totalInput = row.querySelector('.item-total');
        if (totalInput.value) {
            subtotal += parseFloat(totalInput.value);
        }
    });
    
    // Calculate VAT (13%)
    const vat = subtotal * 0.13;
    
    // Calculate total
    const total = subtotal + vat;
    
    // Update display
    document.getElementById('purchaseSubtotal').textContent = `NPR ${formatCurrency(subtotal)}`;
    document.getElementById('purchaseVat').textContent = `NPR ${formatCurrency(vat)}`;
    document.getElementById('purchaseTotal').textContent = `NPR ${formatCurrency(total)}`;
}

/**
 * Handle purchase form submission
 * @param {Event} event - Form submit event
 */
async function handlePurchaseSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const supplierId = document.getElementById('purchaseSupplier').value;
    const date = document.getElementById('purchaseDate').value;
    
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
    
    if (!supplierId) {
        showToast('Please select a supplier', 'error');
        return;
    }
    
    if (!isValid || items.length === 0) {
        showToast('Please add at least one valid item', 'error');
        return;
    }
    
    // Calculate totals
    let subtotal = 0;
    items.forEach(item => {
        subtotal += item.total;
    });
    
    const vat = subtotal * 0.13;
    const total = subtotal + vat;
    
    // Create purchase data
    const purchaseData = {
        supplierId: parseInt(supplierId),
        date: date,
        items: items,
        subtotal: subtotal,
        vat: vat,
        totalAmount: total
    };
    
    try {
        // Create purchase
        await apiRequest('purchases', 'POST', purchaseData);
        
        // Close modal
        closePurchaseModal();
        
        // Reload purchases
        loadPurchases();
        
        // Show success message
        showToast('Purchase completed successfully', 'success');
    } catch (error) {
        console.error('Error creating purchase:', error);
        showToast('Failed to complete purchase', 'error');
    }
}

/**
 * View purchase details
 * @param {number} purchaseId - Purchase ID
 */
async function viewPurchaseDetails(purchaseId) {
    try {
        // Get purchase details
        currentPurchase = await apiRequest(`purchases/${purchaseId}`);
        
        // Populate details
        document.getElementById('detailsPoNumber').textContent = currentPurchase.poNumber;
        document.getElementById('detailsDate').textContent = formatDate(currentPurchase.date);
        document.getElementById('detailsSupplier').textContent = currentPurchase.supplier ? currentPurchase.supplier.name : 'Unknown Supplier';
        
        // Populate items table
        const tableBody = document.getElementById('purchaseDetailsTableBody');
        tableBody.innerHTML = '';
        
        currentPurchase.items.forEach(item => {
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
        document.getElementById('detailsSubtotal').textContent = `NPR ${formatCurrency(currentPurchase.subtotal)}`;
        document.getElementById('detailsVat').textContent = `NPR ${formatCurrency(currentPurchase.vat)}`;
        document.getElementById('detailsTotal').textContent = `NPR ${formatCurrency(currentPurchase.totalAmount)}`;
        
        // Show modal
        document.getElementById('purchaseDetailsModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading purchase details:', error);
        showToast('Failed to load purchase details', 'error');
    }
}

/**
 * Close purchase details modal
 */
function closePurchaseDetailsModal() {
    document.getElementById('purchaseDetailsModal').style.display = 'none';
}

/**
 * Print purchase details
 */
function printPurchaseDetails() {
    if (!currentPurchase) return;
    
    // Create print window
    const printWindow = window.open('', '_blank');
    
    // Create print content
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Order #${currentPurchase.poNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .purchase-details { margin-bottom: 20px; }
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
                <h2>Purchase Order</h2>
            </div>
            
            <div class="purchase-details">
                <p><strong>PO #:</strong> ${currentPurchase.poNumber}</p>
                <p><strong>Date:</strong> ${formatDate(currentPurchase.date)}</p>
                <p><strong>Supplier:</strong> ${currentPurchase.supplier ? currentPurchase.supplier.name : 'Unknown Supplier'}</p>
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
    currentPurchase.items.forEach(item => {
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
                <p><strong>Subtotal:</strong> NPR ${formatCurrency(currentPurchase.subtotal)}</p>
                <p><strong>VAT (13%):</strong> NPR ${formatCurrency(currentPurchase.vat)}</p>
                <p class="total"><strong>Total:</strong> NPR ${formatCurrency(currentPurchase.totalAmount)}</p>
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
 * Delete purchase
 * @param {number} purchaseId - Purchase ID
 */
async function deletePurchase(purchaseId) {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this purchase?')) {
        return;
    }
    
    try {
        await apiRequest(`purchases/${purchaseId}`, 'DELETE');
        
        // Reload purchases
        loadPurchases();
        
        // Show success message
        showToast('Purchase deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting purchase:', error);
        showToast('Failed to delete purchase', 'error');
    }
}