/**
 * Dashboard specific JavaScript
 */

document.addEventListener('DOMContentLoaded', function() {
    // Load dashboard data
    loadDashboardData();
    
    // Load alerts
    loadAlerts();
});

/**
 * Load dashboard data
 */
async function loadDashboardData() {
    try {
        // Get dashboard stats
        const stats = await apiRequest('dashboard/stats');
        
        // Update stats on the page
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('lowStockCount').textContent = stats.lowStockCount || 0;
        document.getElementById('todaySales').textContent = formatCurrency(stats.todaySales || 0);
        document.getElementById('todayPurchases').textContent = formatCurrency(stats.todayPurchases || 0);
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

/**
 * Load alerts
 */
async function loadAlerts() {
    try {
        // Get alerts
        const alerts = await apiRequest('dashboard/alerts');
        
        // Display alerts
        displayAlerts(alerts);
    } catch (error) {
        console.error('Error loading alerts:', error);
    }
}

/**
 * Display alerts in the alerts list
 * @param {Array} alerts - Alerts data
 */
function displayAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    
    // Clear existing alerts
    alertsList.innerHTML = '';
    
    // Check if there are any alerts
    if (!alerts || alerts.length === 0) {
        alertsList.innerHTML = '<div class="no-data">No alerts to display</div>';
        return;
    }
    
    // Add alerts to the list
    alerts.forEach(alert => {
        const alertItem = document.createElement('div');
        alertItem.className = `alert-item ${alert.type === 'warning' ? 'warning' : 'danger'}`;
        
        alertItem.innerHTML = `
            <i class="fas ${alert.type === 'warning' ? 'fa-exclamation-triangle' : 'fa-exclamation-circle'}"></i>
            <div class="alert-message">${alert.message}</div>
            <div class="alert-date">${formatDate(alert.date)}</div>
        `;
        
        alertsList.appendChild(alertItem);
    });
}