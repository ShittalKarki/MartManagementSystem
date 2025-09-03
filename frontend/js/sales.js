/**
 * Sales specific JavaScript
 */

let sales = [];
let products = [];
let currentSale = null;
let editMode = false;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('saleDate').valueAsDate = new Date();
    loadSales();
    loadProductsForDropdown();
    document.getElementById('salesForm').addEventListener('submit', handleSaleSubmit);
});

async function loadSales() {
    try {
        sales = await apiRequest('orders/sales');
        displaySales(sales);
    } catch (error) {
        console.error('Error loading sales:', error);
        showToast('Failed to load sales', 'error');
    }
}

function displaySales(salesList) {
    const tableBody = document.getElementById('salesTableBody');
    tableBody.innerHTML = '';

    if (!salesList || salesList.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="no-data">No sales found</td>';
        tableBody.appendChild(row);
        return;
    }

    salesList.forEach(sale => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sale.invoiceNumber}</td>
            <td>${sale.customer ? sale.customer.name : 'Walk-in Customer'}</td>
            <td>${formatDate(sale.soldAt)}</td>
            <td>${sale.lines ? sale.lines.length : 0}</td>
            <td>NPR ${formatCurrency(sale.totalAmount)}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-view" onclick="viewSaleDetails(${sale.id})" title="View">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-edit" onclick="editSale(${sale.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-delete" onclick="deleteSale(${sale.id})" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

async function loadProductsForDropdown() {
    try {
        products = await loadProducts();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function resetSalesForm() {
    editMode = false;
    document.getElementById('salesForm').reset();
    document.getElementById('saleId').value = '';
    document.getElementById('saleDate').valueAsDate = new Date();
    document.getElementById('salesModalTitle').textContent = 'Create New Sale';
    document.getElementById('saleSubmitBtn').textContent = 'Complete Sale';
    document.getElementById('saleItemsContainer').innerHTML = '';
}

function showSalesModal() {
    resetSalesForm();
    addSaleItem();
    updateSaleTotals();
    document.getElementById('salesModal').style.display = 'block';
}

function closeSalesModal() {
    document.getElementById('salesModal').style.display = 'none';
    resetSalesForm();
}

function addSaleItem(productId = '', quantity = 1, unitPrice = '') {
    const container = document.getElementById('saleItemsContainer');
    const template = document.getElementById('saleItemTemplate');
    const clone = document.importNode(template.content, true);

    const productSelect = clone.querySelector('.product-select');
    const quantityInput = clone.querySelector('.item-quantity');
    const priceInput = clone.querySelector('.item-price');

    populateProductDropdown(productSelect, products);

    if (productId) {
        productSelect.value = productId;
        quantityInput.value = quantity;
        if (unitPrice !== '') {
            priceInput.value = unitPrice;
        } else {
            updateItemPrice(productSelect);
        }
        updateItemTotal(quantityInput);
    }

    container.appendChild(clone);
}

function updateItemPrice(select) {
    const row = select.closest('.item-row');
    const priceInput = row.querySelector('.item-price');
    const quantityInput = row.querySelector('.item-quantity');
    const totalInput = row.querySelector('.item-total');

    const option = select.options[select.selectedIndex];

    if (option && option.dataset.price) {
        priceInput.value = option.dataset.price;
        totalInput.value = (parseFloat(priceInput.value) * parseInt(quantityInput.value, 10)).toFixed(2);
        updateSaleTotals();
    } else {
        priceInput.value = '';
        totalInput.value = '';
        updateSaleTotals();
    }
}

function updateItemTotal(input) {
    const row = input.closest('.item-row');
    const priceInput = row.querySelector('.item-price');
    const totalInput = row.querySelector('.item-total');

    if (priceInput.value && input.value) {
        totalInput.value = (parseFloat(priceInput.value) * parseInt(input.value, 10)).toFixed(2);
        updateSaleTotals();
    }
}

function removeSaleItem(button) {
    const rows = document.querySelectorAll('#saleItemsContainer .item-row');
    if (rows.length <= 1) {
        showToast('A sale must have at least one item', 'error');
        return;
    }
    button.closest('.item-row').remove();
    updateSaleTotals();
}

function updateSaleTotals() {
    const rows = document.querySelectorAll('#saleItemsContainer .item-row');
    let subtotal = 0;

    rows.forEach(row => {
        const totalInput = row.querySelector('.item-total');
        if (totalInput.value) {
            subtotal += parseFloat(totalInput.value);
        }
    });

    const discountPercent = parseFloat(document.getElementById('saleDiscountPercent').value) || 0;
    const discountAmount = parseFloat(document.getElementById('saleDiscountAmount').value) || 0;
    const percentDiscount = subtotal * (discountPercent / 100);
    const totalDiscount = percentDiscount + discountAmount;
    const vatableAmount = subtotal - totalDiscount;
    const vat = vatableAmount * 0.13;
    const total = vatableAmount + vat;

    document.getElementById('saleSubtotal').textContent = `NPR ${formatCurrency(subtotal)}`;
    document.getElementById('saleVat').textContent = `NPR ${formatCurrency(vat)}`;
    document.getElementById('saleTotal').textContent = `NPR ${formatCurrency(total)}`;
}

function collectSaleLines() {
    const itemRows = document.querySelectorAll('#saleItemsContainer .item-row');
    const lines = [];
    let isValid = true;

    itemRows.forEach(row => {
        const productSelect = row.querySelector('.product-select');
        const quantity = parseInt(row.querySelector('.item-quantity').value, 10);
        const price = parseFloat(row.querySelector('.item-price').value);

        if (!productSelect.value || !quantity || !price) {
            isValid = false;
            return;
        }

        lines.push({
            productId: parseInt(productSelect.value, 10),
            quantity,
            unitPrice: price,
            discountPercent: 0,
            vatPercent: 13
        });
    });

    return { lines, isValid };
}

function buildSalePayload(saleId = null) {
    const dateValue = document.getElementById('saleDate').value;
    const customerName = document.getElementById('saleCustomer').value.trim() || 'Walk-in Customer';

    const payload = {
        soldAt: dateValue ? `${dateValue}T12:00:00Z` : new Date().toISOString(),
        customerName,
        orderDiscountPercent: parseFloat(document.getElementById('saleDiscountPercent').value) || 0,
        orderDiscountAmount: parseFloat(document.getElementById('saleDiscountAmount').value) || 0,
        lines: collectSaleLines().lines
    };

    if (saleId) {
        payload.id = parseInt(saleId, 10);
    }

    return payload;
}

async function handleSaleSubmit(event) {
    event.preventDefault();

    const { lines, isValid } = collectSaleLines();
    if (!isValid || lines.length === 0) {
        showToast('Please add at least one valid item', 'error');
        return;
    }

    const saleId = document.getElementById('saleId').value;
    const saleData = buildSalePayload(saleId || null);

    try {
        if (editMode && saleId) {
            await apiRequest(`orders/sale/${saleId}`, 'PUT', saleData);
            showToast('Sale updated successfully', 'success');
        } else {
            await apiRequest('orders/sale', 'POST', saleData);
            showToast('Sale completed successfully', 'success');
        }

        closeSalesModal();
        loadSales();
        loadProductsForDropdown();
    } catch (error) {
        console.error('Error saving sale:', error);
        if (!error.message || error.message === 'API request failed') {
            showToast(editMode ? 'Failed to update sale' : 'Failed to complete sale', 'error');
        }
    }
}

async function editSale(saleId) {
    try {
        await loadProductsForDropdown();
        const sale = await apiRequest(`orders/sale/${saleId}`);

        editMode = true;
        document.getElementById('saleId').value = sale.id;
        document.getElementById('salesModalTitle').textContent = `Edit Sale — ${sale.invoiceNumber}`;
        document.getElementById('saleSubmitBtn').textContent = 'Update Sale';

        document.getElementById('saleCustomer').value = sale.customer ? sale.customer.name : 'Walk-in Customer';
        document.getElementById('saleDate').value = formatDate(sale.soldAt);
        document.getElementById('saleDiscountPercent').value = 0;
        document.getElementById('saleDiscountAmount').value = sale.discountAmount || 0;

        document.getElementById('saleItemsContainer').innerHTML = '';
        sale.lines.forEach(line => {
            addSaleItem(line.productId, line.quantity, line.unitPrice);
        });

        updateSaleTotals();
        document.getElementById('salesModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading sale for edit:', error);
        showToast('Failed to load sale for editing', 'error');
    }
}

async function viewSaleDetails(saleId) {
    try {
        currentSale = await apiRequest(`orders/sale/${saleId}`);

        document.getElementById('detailsInvoiceNumber').textContent = currentSale.invoiceNumber;
        document.getElementById('detailsDate').textContent = formatDate(currentSale.soldAt);
        document.getElementById('detailsCustomer').textContent = currentSale.customer
            ? currentSale.customer.name
            : 'Walk-in Customer';

        const tableBody = document.getElementById('saleDetailsTableBody');
        tableBody.innerHTML = '';

        currentSale.lines.forEach(line => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${line.product ? line.product.name : 'Product'}</td>
                <td>NPR ${formatCurrency(line.unitPrice)}</td>
                <td>${line.quantity}</td>
                <td>NPR ${formatCurrency(line.lineTotal)}</td>
            `;
            tableBody.appendChild(row);
        });

        document.getElementById('detailsSubtotal').textContent = `NPR ${formatCurrency(currentSale.subtotal)}`;
        document.getElementById('detailsDiscount').textContent = `NPR ${formatCurrency(currentSale.discountAmount)}`;
        document.getElementById('detailsVat').textContent = `NPR ${formatCurrency(currentSale.vatAmount)}`;
        document.getElementById('detailsTotal').textContent = `NPR ${formatCurrency(currentSale.totalAmount)}`;

        document.getElementById('detailsEditBtn').onclick = () => {
            closeSaleDetailsModal();
            editSale(saleId);
        };

        document.getElementById('saleDetailsModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading sale details:', error);
        showToast('Failed to load sale details', 'error');
    }
}

function closeSaleDetailsModal() {
    document.getElementById('saleDetailsModal').style.display = 'none';
}

function printSaleDetails() {
    if (!currentSale) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Sale Invoice #${currentSale.invoiceNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
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
            <p><strong>Invoice #:</strong> ${currentSale.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(currentSale.soldAt)}</p>
            <p><strong>Customer:</strong> ${currentSale.customer ? currentSale.customer.name : 'Walk-in Customer'}</p>
            <table>
                <thead>
                    <tr><th>Product</th><th>Price</th><th>Qty</th><th>Total</th></tr>
                </thead>
                <tbody>
    `);

    currentSale.lines.forEach(line => {
        printWindow.document.write(`
            <tr>
                <td>${line.product ? line.product.name : 'Product'}</td>
                <td>NPR ${formatCurrency(line.unitPrice)}</td>
                <td>${line.quantity}</td>
                <td>NPR ${formatCurrency(line.lineTotal)}</td>
            </tr>
        `);
    });

    printWindow.document.write(`
                </tbody>
            </table>
            <div class="summary">
                <p><strong>Subtotal:</strong> NPR ${formatCurrency(currentSale.subtotal)}</p>
                <p><strong>Discount:</strong> NPR ${formatCurrency(currentSale.discountAmount)}</p>
                <p><strong>VAT (13%):</strong> NPR ${formatCurrency(currentSale.vatAmount)}</p>
                <p class="total"><strong>Total:</strong> NPR ${formatCurrency(currentSale.totalAmount)}</p>
            </div>
        </body>
        </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
}

async function deleteSale(saleId) {
    if (!confirm('Are you sure you want to delete this sale? Stock will be restored.')) {
        return;
    }

    try {
        await apiRequest(`orders/sale/${saleId}`, 'DELETE');
        loadSales();
        loadProductsForDropdown();
        showToast('Sale deleted successfully', 'success');
    } catch (error) {
        console.error('Error deleting sale:', error);
        if (!error.message || error.message === 'API request failed') {
            showToast('Failed to delete sale', 'error');
        }
    }
}
