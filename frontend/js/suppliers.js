// Suppliers Page JavaScript

// Global variables
let suppliers = [];
let currentSupplierId = null;

document.addEventListener('DOMContentLoaded', function() {
    // Load suppliers data
    loadSuppliers();
    
    // Set up event listeners
    document.getElementById('supplierForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveSupplier();
    });
});

/**
 * Load suppliers from the API
 */
function loadSuppliers() {
    apiRequest('GET', '/api/suppliers')
        .then(data => {
            suppliers = data;
            renderSuppliersTable();
        })
        .catch(error => {
            console.error('Error loading suppliers:', error);
            showToast('error', 'Failed to load suppliers');
        });
}

/**
 * Render the suppliers table
 */
function renderSuppliersTable() {
    const tableBody = document.querySelector('#suppliersTable tbody');
    tableBody.innerHTML = '';
    
    if (suppliers.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No suppliers found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${supplier.name}</td>
            <td>${supplier.contactPerson || '-'}</td>
            <td>${supplier.phone || '-'}</td>
            <td>${supplier.email || '-'}</td>
            <td>${formatAddress(supplier) || '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info" onclick="viewSupplierDetails(${supplier.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="showEditSupplierModal(${supplier.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="showDeleteConfirmModal(${supplier.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Format address for display
 */
function formatAddress(supplier) {
    const addressParts = [];
    
    if (supplier.address) addressParts.push(supplier.address);
    
    const cityState = [];
    if (supplier.city) cityState.push(supplier.city);
    if (supplier.state) cityState.push(supplier.state);
    
    if (cityState.length > 0) {
        addressParts.push(cityState.join(', '));
    }
    
    if (supplier.postalCode) addressParts.push(supplier.postalCode);
    if (supplier.country) addressParts.push(supplier.country);
    
    return addressParts.join(', ');
}

/**
 * Show the add supplier modal
 */
function showAddSupplierModal() {
    // Reset the form
    document.getElementById('supplierForm').reset();
    document.getElementById('supplierId').value = '';
    document.getElementById('modalTitle').textContent = 'Add Supplier';
    
    // Show the modal
    document.getElementById('supplierModal').style.display = 'block';
}

/**
 * Show the edit supplier modal
 */
function showEditSupplierModal(supplierId) {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) {
        showToast('error', 'Supplier not found');
        return;
    }
    
    // Set the form values
    document.getElementById('supplierId').value = supplier.id;
    document.getElementById('supplierName').value = supplier.name || '';
    document.getElementById('contactPerson').value = supplier.contactPerson || '';
    document.getElementById('phone').value = supplier.phone || '';
    document.getElementById('email').value = supplier.email || '';
    document.getElementById('address').value = supplier.address || '';
    document.getElementById('city').value = supplier.city || '';
    document.getElementById('state').value = supplier.state || '';
    document.getElementById('postalCode').value = supplier.postalCode || '';
    document.getElementById('country').value = supplier.country || '';
    document.getElementById('notes').value = supplier.notes || '';
    
    // Update the modal title
    document.getElementById('modalTitle').textContent = 'Edit Supplier';
    
    // Show the modal
    document.getElementById('supplierModal').style.display = 'block';
}

/**
 * Hide the supplier modal
 */
function hideSupplierModal() {
    document.getElementById('supplierModal').style.display = 'none';
}

/**
 * Save the supplier (create or update)
 */
function saveSupplier() {
    const supplierId = document.getElementById('supplierId').value;
    
    const supplierData = {
        name: document.getElementById('supplierName').value,
        contactPerson: document.getElementById('contactPerson').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postalCode: document.getElementById('postalCode').value,
        country: document.getElementById('country').value,
        notes: document.getElementById('notes').value
    };
    
    // Validate required fields
    if (!supplierData.name) {
        showToast('error', 'Supplier name is required');
        return;
    }
    
    if (!supplierData.phone) {
        showToast('error', 'Phone number is required');
        return;
    }
    
    const method = supplierId ? 'PUT' : 'POST';
    const url = supplierId ? `/api/suppliers/${supplierId}` : '/api/suppliers';
    
    apiRequest(method, url, supplierData)
        .then(response => {
            hideSupplierModal();
            loadSuppliers(); // Reload the suppliers list
            showToast('success', supplierId ? 'Supplier updated successfully' : 'Supplier added successfully');
        })
        .catch(error => {
            console.error('Error saving supplier:', error);
            showToast('error', 'Failed to save supplier');
        });
}

/**
 * View supplier details
 */
function viewSupplierDetails(supplierId) {
    currentSupplierId = supplierId;
    const supplier = suppliers.find(s => s.id === supplierId);
    
    if (!supplier) {
        showToast('error', 'Supplier not found');
        return;
    }
    
    // Set supplier details
    document.getElementById('detailsSupplierName').textContent = supplier.name;
    document.getElementById('detailsContactPerson').textContent = supplier.contactPerson ? `Contact: ${supplier.contactPerson}` : '';
    document.getElementById('detailsPhone').textContent = supplier.phone ? `Phone: ${supplier.phone}` : '';
    document.getElementById('detailsEmail').textContent = supplier.email ? `Email: ${supplier.email}` : '';
    
    // Format and set address
    const formattedAddress = formatAddress(supplier);
    document.getElementById('detailsAddress').textContent = formattedAddress ? `Address: ${formattedAddress}` : '';
    
    // Load supplier statistics and recent purchases
    loadSupplierStats(supplierId);
    
    // Show the modal
    document.getElementById('supplierDetailsModal').style.display = 'block';
}

/**
 * Load supplier statistics and recent purchases
 */
function loadSupplierStats(supplierId) {
    apiRequest('GET', `/api/suppliers/${supplierId}/stats`)
        .then(data => {
            // Update supplier stats
            document.getElementById('detailsTotalPurchases').textContent = data.totalPurchases || 0;
            document.getElementById('detailsLastPurchase').textContent = data.lastPurchaseDate ? formatDate(data.lastPurchaseDate) : 'N/A';
            
            // Render recent purchases
            renderSupplierPurchases(data.recentPurchases || []);
        })
        .catch(error => {
            console.error('Error loading supplier stats:', error);
            document.getElementById('detailsTotalPurchases').textContent = '0';
            document.getElementById('detailsLastPurchase').textContent = 'N/A';
            document.getElementById('supplierPurchasesTable tbody').innerHTML = '<tr><td colspan="5" class="text-center">Failed to load purchases</td></tr>';
        });
}

/**
 * Render supplier purchases table
 */
function renderSupplierPurchases(purchases) {
    const tableBody = document.querySelector('#supplierPurchasesTable tbody');
    tableBody.innerHTML = '';
    
    if (purchases.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" class="text-center">No purchases found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    purchases.forEach(purchase => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${formatDate(purchase.date)}</td>
            <td>${purchase.reference}</td>
            <td>${purchase.itemCount}</td>
            <td>${formatCurrency(purchase.total)}</td>
            <td>${purchase.status}</td>
        `;
        
        tableBody.appendChild(row);
    });
}

/**
 * Hide the supplier details modal
 */
function hideSupplierDetailsModal() {
    document.getElementById('supplierDetailsModal').style.display = 'none';
}

/**
 * Edit the currently viewed supplier
 */
function editSupplier() {
    hideSupplierDetailsModal();
    showEditSupplierModal(currentSupplierId);
}

/**
 * Show delete confirmation modal
 */
function showDeleteConfirmModal(supplierId) {
    currentSupplierId = supplierId;
    document.getElementById('deleteConfirmModal').style.display = 'block';
}

/**
 * Hide delete confirmation modal
 */
function hideDeleteConfirmModal() {
    document.getElementById('deleteConfirmModal').style.display = 'none';
}

/**
 * Confirm and delete the supplier
 */
function confirmDeleteSupplier() {
    if (!currentSupplierId) {
        hideDeleteConfirmModal();
        return;
    }
    
    apiRequest('DELETE', `/api/suppliers/${currentSupplierId}`)
        .then(response => {
            hideDeleteConfirmModal();
            loadSuppliers(); // Reload the suppliers list
            showToast('success', 'Supplier deleted successfully');
        })
        .catch(error => {
            console.error('Error deleting supplier:', error);
            showToast('error', 'Failed to delete supplier');
            hideDeleteConfirmModal();
        });
}