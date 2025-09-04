/**
 * Common JavaScript functions for Daily Deals Inventory Management System
 */

// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Set active navigation item based on current page
document.addEventListener('DOMContentLoaded', function() {
    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop();
    const pageName = currentPage.split('.')[0];
    
    // Set active navigation item
    const navItem = document.getElementById(`nav-${pageName}`);
    if (navItem) {
        navItem.classList.add('active');
    }
});

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');
    
    // Set icon and class based on type
    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle success';
    } else {
        toastIcon.className = 'fas fa-exclamation-circle error';
    }
    
    // Set message
    toastMessage.textContent = message;
    
    // Show toast
    toast.classList.add('show');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date to format
 * @returns {string} Formatted date
 */
function formatDate(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format currency (NPR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted amount
 */
function formatCurrency(amount) {
    return parseFloat(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

/**
 * Make API request
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request data
 * @returns {Promise} Promise with response data
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}/${endpoint}`;
    
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        
        if (!response.ok) {
            let message = 'API request failed';
            const errorText = await response.text();
            if (errorText) {
                try {
                    const errorData = JSON.parse(errorText);
                    if (errorData.errors) {
                        const details = Object.values(errorData.errors).flat().join(' ');
                        message = details || errorData.title || message;
                    } else {
                        message = errorData.message || errorData.title || errorData.detail || message;
                    }
                } catch {
                    message = errorText;
                }
            }
            throw new Error(message);
        }
        
        // PUT/DELETE often return 204 No Content with an empty body
        if (response.status === 204) {
            return null;
        }
        
        const text = await response.text();
        if (!text) {
            return null;
        }
        
        return JSON.parse(text);
    } catch (error) {
        console.error('API request error:', error);
        showToast(error.message, 'error');
        throw error;
    }
}

/**
 * Load categories for dropdowns
 * @returns {Promise} Promise with categories data
 */
async function loadCategories() {
    try {
        return await apiRequest('categories');
    } catch (error) {
        console.error('Error loading categories:', error);
        return [];
    }
}

/**
 * Populate category dropdown
 * @param {string} selectId - ID of select element
 * @param {Array} categories - Categories data
 */
function populateCategoryDropdown(selectId, categories) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '<option value="">Select Category</option>';
    
    // Add categories
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

/**
 * Load products
 * @returns {Promise} Promise with products data
 */
async function loadProducts() {
    try {
        return await apiRequest('products');
    } catch (error) {
        console.error('Error loading products:', error);
        return [];
    }
}

/**
 * Populate product dropdown
 * @param {string} selectId - ID of select element
 * @param {Array} products - Products data
 */
function populateProductDropdown(selectOrId, products) {
    const select = typeof selectOrId === 'string'
        ? document.getElementById(selectOrId)
        : selectOrId;
    if (!select) return;
    
    // Clear existing options
    select.innerHTML = '<option value="">Select Product</option>';
    
    // Add products
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.id;
        option.textContent = product.name;
        option.dataset.price = product.sellingPrice;
        option.dataset.stock = product.stockOnHand;
        select.appendChild(option);
    });
}