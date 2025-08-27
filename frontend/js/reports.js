// Reports.js

document.addEventListener("DOMContentLoaded", () => {
    const reportFormContainer = document.getElementById("reportFormContainer");
    const reportResultsContainer = document.getElementById("reportResultsContainer");
    const reportResults = document.getElementById("reportResults");
    const reportResultsTitle = document.getElementById("reportResultsTitle");

    function setDefaultDates() {
        const today = new Date();
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 6);
        const startDate = document.getElementById('startDate');
        const endDate = document.getElementById('endDate');
        if (startDate && endDate) {
            startDate.value = formatDate(weekAgo);
            endDate.value = formatDate(today);
        }
    }

    async function populateFilters() {
        try {
            const [products, categories, customers, vendors] = await Promise.all([
                apiRequest('products'),
                apiRequest('categories'),
                apiRequest('referenceData/customers'),
                apiRequest('referenceData/vendors')
            ]);

            populateProductDropdown('productSelect', products);
            populateCategoryDropdown('categorySelect', categories);

            const customerSelect = document.getElementById('customerSelect');
            const vendorSelect = document.getElementById('vendorSelect');
            if (customerSelect) {
                customerSelect.innerHTML = '<option value="">All Customers</option>';
                customers.forEach(c => {
                    const o = document.createElement('option');
                    o.value = c.id; o.textContent = c.name; customerSelect.appendChild(o);
                });
            }
            if (vendorSelect) {
                vendorSelect.innerHTML = '<option value="">All Vendors</option>';
                vendors.forEach(v => {
                    const o = document.createElement('option');
                    o.value = v.id; o.textContent = v.name; vendorSelect.appendChild(o);
                });
            }
        } catch (e) {
            // handled in apiRequest
        }
    }

    // Show Report Form
    window.showReportForm = function (type) {
        document.getElementById('reportModal').classList.remove('hidden');
        reportResultsContainer.classList.add('hidden');

        const titleMap = {
            sales: "Sales Report",
            inventory: "Inventory Report",
            purchases: "Purchase Report",
            profit: "Profit & Loss Report"
        };
        document.getElementById("reportFormTitle").textContent = `Generate ${titleMap[type]}`;
        document.getElementById("reportType").value = type;

        // Toggle filters
        document.getElementById('dateRangeRow').style.display = (type === 'inventory') ? 'none' : 'flex';
        document.getElementById('productFilter').style.display = (type === 'sales' || type === 'purchases') ? 'block' : 'none';
        document.getElementById('customerFilter').style.display = (type === 'sales') ? 'block' : 'none';
        document.getElementById('vendorFilter').style.display = (type === 'purchases') ? 'block' : 'none';
        document.getElementById('categoryFilter').style.display = (type === 'inventory') ? 'block' : 'none';

        setDefaultDates();
        populateFilters();
    };

    // Hide Report Form
    window.hideReportForm = function () {
        document.getElementById('reportModal').classList.add('hidden');
    };

    function buildQuery(params) {
        const query = Object.entries(params)
            .filter(([_, v]) => v !== undefined && v !== null && v !== '')
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
        return query ? `?${query}` : '';
    }

    function renderTable(headers, rows) {
        let html = '<table class="report-table"><thead><tr>';
        headers.forEach(h => { html += `<th>${h}</th>`; });
        html += '</tr></thead><tbody>';
        rows.forEach(r => {
            html += '<tr>' + r.map(c => `<td>${c}</td>`).join('') + '</tr>';
        });
        html += '</tbody></table>';
        return html;
    }

    // Handle Form Submit
    document.getElementById("reportForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const type = document.getElementById("reportType").value;
        const start = document.getElementById('startDate')?.value;
        const end = document.getElementById('endDate')?.value;
        const productId = document.getElementById('productSelect')?.value;
        const customerId = document.getElementById('customerSelect')?.value;
        const vendorId = document.getElementById('vendorSelect')?.value;
        const categoryId = document.getElementById('categorySelect')?.value;

        reportResultsTitle.textContent = {
            sales: 'Sales Report',
            purchases: 'Purchase Report',
            inventory: 'Inventory Report',
            profit: 'Profit & Loss Report'
        }[type];

        try {
            let headers = [];
            let rows = [];
            if (type === 'sales') {
                const q = buildQuery({ start, end, productId, customerId });
                const data = await apiRequest(`reports/sales/summary${q}`);
                headers = ['Date', 'Invoice', 'Customer', 'Product', 'Category', 'Qty', 'Unit Price', 'Disc %', 'Line Total'];
                rows = data.details.map(d => [
                    formatDate(d.date), d.invoiceNumber, d.customerName, d.productName, d.categoryName,
                    d.quantity, d.unitPrice, d.discountPercent, d.lineTotal
                ]);
            } else if (type === 'purchases') {
                const q = buildQuery({ start, end, productId, vendorId });
                const data = await apiRequest(`reports/purchases/summary${q}`);
                headers = ['Date', 'Invoice', 'Vendor', 'Product', 'Category', 'Qty', 'Unit Price', 'Line Total'];
                rows = data.details.map(d => [
                    formatDate(d.date), d.invoiceNumber, d.vendorName, d.productName, d.categoryName,
                    d.quantity, d.unitPrice, d.lineTotal
                ]);
            } else if (type === 'inventory') {
                const q = buildQuery({ categoryId });
                const data = await apiRequest(`reports/stock${q}`);
                headers = ['Category', 'Items', 'Stock', 'Value'];
                rows = data.categoryStock.map(c => [c.categoryName, c.totalItems, c.totalStock, c.totalValue]);
            } else if (type === 'profit') {
                const q = buildQuery({ start, end });
                const data = await apiRequest(`reports/profit/summary${q}`);
                headers = ['Start', 'End', 'Revenue', 'COGS', 'Gross Profit'];
                rows = [[formatDate(data.startDate), formatDate(data.endDate), data.revenue, data.costOfGoodsSold, data.grossProfit]];
            }

            reportResults.innerHTML = renderTable(headers, rows);
            reportResultsContainer.classList.remove('hidden');
            document.getElementById('reportModal').classList.add('hidden');
        } catch (err) {
            // toast shown in apiRequest
        }
    });

    // Print Report
    window.printReport = function () {
        const printContent = document.getElementById("reportResults").innerHTML;
        const w = window.open("", "", "width=900,height=650");
        w.document.write("<html><head><title>Print Report</title></head><body>");
        w.document.write(printContent);
        w.document.write("</body></html>");
        w.document.close();
        w.print();
    };

    // Download Report via API CSV endpoints
    window.downloadReport = function () {
        const type = document.getElementById('reportType').value;
        const start = document.getElementById('startDate')?.value;
        const end = document.getElementById('endDate')?.value;
        const productId = document.getElementById('productSelect')?.value;
        const customerId = document.getElementById('customerSelect')?.value;
        const vendorId = document.getElementById('vendorSelect')?.value;
        const categoryId = document.getElementById('categorySelect')?.value;

        let endpoint = '';
        if (type === 'sales') {
            endpoint = `reports/sales/csv${buildQuery({ start, end, productId, customerId })}`;
        } else if (type === 'purchases') {
            endpoint = `reports/purchases/csv${buildQuery({ start, end, productId, vendorId })}`;
        } else if (type === 'inventory') {
            endpoint = `reports/inventory/csv${buildQuery({ categoryId })}`;
        } else if (type === 'profit') {
            endpoint = `reports/profit/csv${buildQuery({ start, end })}`;
        }

        if (!endpoint) return;

        const url = `${API_BASE_URL}/${endpoint}`;
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };
});
