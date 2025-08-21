// Purchases page JavaScript functionality

// Common utility functions
// Function to format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Function to format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to show toast notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    // Set message
    toastMessage.textContent = message;
    
    // Set icon and style based on type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
        toastIcon.classList.add('success');
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
        toastIcon.classList.add('error');
    } else {
        toastIcon.className = 'fas fa-info-circle';
    }
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Function to confirm action
function confirmAction(message) {
    return confirm(message);
}

// Function to validate form
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        if (input.hasAttribute('required') && !input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        } else {
            input.classList.remove('error');
        }
    });
    
    return isValid;
}

// Add event listener to remove error class on input
document.addEventListener('input', function(e) {
    if (e.target.classList.contains('error')) {
        e.target.classList.remove('error');
    }
});

// Modal functions
function showPurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    modal.style.display = 'block';
    document.getElementById('purchaseForm').reset();
    document.getElementById('totalAmount').value = '';
    setTodayDate();
}

function closePurchaseModal() {
    const modal = document.getElementById('purchaseModal');
    modal.style.display = 'none';
}

// Close modal when clicking outside of it
window.onclick = function(event) {
    const modal = document.getElementById('purchaseModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Purchase page specific functionality
// Sample data for purchases
let purchases = [
    { id: 1, supplier: "1", product: "1", quantity: 100, unitPrice: 5.99, totalAmount: 599.00, date: "2025-08-15" },
    { id: 2, supplier: "2", product: "2", quantity: 50, unitPrice: 12.50, totalAmount: 625.00, date: "2025-08-16" },
    { id: 3, supplier: "3", product: "3", quantity: 75, unitPrice: 8.75, totalAmount: 656.25, date: "2025-08-17" }
];

// DOM elements
const purchaseForm = document.getElementById('purchaseForm');
const purchasesTable = document.getElementById('purchasesTable').getElementsByTagName('tbody')[0];
const totalAmountInput = document.getElementById('totalAmount');
const quantityInput = document.getElementById('quantity');
const unitPriceInput = document.getElementById('unitPrice');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    renderPurchases();
    setupEventListeners();
    setTodayDate(); // Set today's date by default
});

// Set up event listeners
function setupEventListeners() {
    purchaseForm.addEventListener('submit', handleFormSubmit);
    
    // Calculate total amount when quantity or unit price changes
    quantityInput.addEventListener('input', calculateTotal);
    unitPriceInput.addEventListener('input', calculateTotal);
}

// Set today's date in the form
function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('purchaseDate').value = today;
}

// Calculate total amount
function calculateTotal() {
    const quantity = parseFloat(quantityInput.value) || 0;
    const unitPrice = parseFloat(unitPriceInput.value) || 0;
    const total = quantity * unitPrice;
    totalAmountInput.value = total.toFixed(2);
}

// Handle form submission
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm(purchaseForm)) {
        showToast('Please fill in all required fields.', 'error');
        return;
    }
    
    // Get form data
    const formData = new FormData(purchaseForm);
    const purchase = {
        id: purchases.length > 0 ? Math.max(...purchases.map(p => p.id)) + 1 : 1,
        supplier: formData.get('supplier'),
        product: formData.get('product'),
        quantity: parseInt(formData.get('quantity')),
        unitPrice: parseFloat(formData.get('unitPrice')),
        totalAmount: parseFloat(totalAmountInput.value),
        date: formData.get('purchaseDate')
    };
    
    // Add to purchases array
    purchases.push(purchase);
    
    // Update UI
    renderPurchases();
    closePurchaseModal();
    
    // Show success message
    showToast('Purchase added successfully!', 'success');
}

// Render purchases table
function renderPurchases() {
    // Clear existing rows
    purchasesTable.innerHTML = '';
    
    // Add rows for each purchase
    purchases.forEach(purchase => {
        const row = purchasesTable.insertRow();
        
        row.innerHTML = `
            <td>${purchase.id}</td>
            <td>${getSupplierName(purchase.supplier)}</td>
            <td>${getProductName(purchase.product)}</td>
            <td>${purchase.quantity}</td>
            <td>${formatCurrency(purchase.unitPrice)}</td>
            <td>${formatCurrency(purchase.totalAmount)}</td>
            <td>${formatDate(purchase.date)}</td>
            <td>
                <button class="btn btn-primary" onclick="editPurchase(${purchase.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn btn-danger" onclick="deletePurchase(${purchase.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </td>
        `;
    });
}

// Get supplier name by ID
function getSupplierName(supplierId) {
    const suppliers = {
        '1': 'ABC Supplier',
        '2': 'XYZ Distributors',
        '3': 'Global Traders'
    };
    return suppliers[supplierId] || supplierId;
}

// Get product name by ID
function getProductName(productId) {
    const products = {
        '1': 'Product A',
        '2': 'Product B',
        '3': 'Product C'
    };
    return products[productId] || productId;
}

// Edit purchase
function editPurchase(id) {
    const purchase = purchases.find(p => p.id === id);
    if (!purchase) return;
    
    // Show form
    showPurchaseModal();
    
    // Fill form with purchase data
    document.getElementById('supplier').value = purchase.supplier;
    document.getElementById('product').value = purchase.product;
    document.getElementById('quantity').value = purchase.quantity;
    document.getElementById('unitPrice').value = purchase.unitPrice;
    document.getElementById('totalAmount').value = purchase.totalAmount;
    document.getElementById('purchaseDate').value = purchase.date;
    
    // Change form submit behavior to update instead of add
    purchaseForm.onsubmit = function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm(purchaseForm)) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }
        
        // Update purchase data
        purchase.supplier = document.getElementById('supplier').value;
        purchase.product = document.getElementById('product').value;
        purchase.quantity = parseInt(document.getElementById('quantity').value);
        purchase.unitPrice = parseFloat(document.getElementById('unitPrice').value);
        purchase.totalAmount = parseFloat(document.getElementById('totalAmount').value);
        purchase.date = document.getElementById('purchaseDate').value;
        
        // Update UI
        renderPurchases();
        closePurchaseModal();
        
        // Show success message
        showToast('Purchase updated successfully!', 'success');
        
        // Reset form submit behavior
        purchaseForm.onsubmit = handleFormSubmit;
    };
}

// Delete purchase
function deletePurchase(id) {
    if (confirmAction('Are you sure you want to delete this purchase?')) {
        purchases = purchases.filter(purchase => purchase.id !== id);
        renderPurchases();
        showToast('Purchase deleted successfully!', 'success');
    }
}