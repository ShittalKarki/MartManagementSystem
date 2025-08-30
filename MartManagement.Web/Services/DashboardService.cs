// MartMS
namespace MartManagement.Web.Services;

/// <summary>Aggregates KPI and chart data for admin and staff dashboards.</summary>
public class DashboardService : IDashboardService
{
    private readonly AppDbContext _db;

    public DashboardService(AppDbContext db) => _db = db;

    public async Task<DashboardViewModel> GetAdminDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = new DateTime(today.Year, today.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var sevenDaysAgo = today.AddDays(-6);

        var totalProducts = await _db.Products.CountAsync(p => p.IsActive);
        var totalCustomers = await _db.Customers.CountAsync(c => c.IsActive);
        var totalSuppliers = await _db.Suppliers.CountAsync(s => s.IsActive);

        var todaySalesQuery = _db.Sales.Where(s => s.SaleDate >= today);
        var todaySales = await todaySalesQuery.SumAsync(s => (decimal?)s.TotalAmount) ?? 0;
        var salesCountToday = await todaySalesQuery.CountAsync();

        var monthSales = await _db.Sales
            .Where(s => s.SaleDate >= monthStart)
            .SumAsync(s => (decimal?)s.TotalAmount) ?? 0;

        var monthPurchases = await _db.Purchases
            .Where(p => p.PurchaseDate >= monthStart)
            .SumAsync(p => (decimal?)p.TotalAmount) ?? 0;

        var inventoryValue = await _db.Products
            .Where(p => p.IsActive)
            .SumAsync(p => (decimal?)(p.PurchasePrice * p.StockQuantity)) ?? 0;

        var lowStock = await _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity <= p.ReorderLevel)
            .OrderBy(p => p.StockQuantity)
            .Take(8)
            .ToListAsync();

        var recentSales = await _db.Sales
            .Include(s => s.Customer)
            .OrderByDescending(s => s.SaleDate)
            .Take(6)
            .Select(s => new RecentTransactionViewModel
            {
                Id = s.Id,
                InvoiceNumber = s.InvoiceNumber,
                PartyName = s.Customer != null ? s.Customer.Name : "Walk-in",
                Amount = s.TotalAmount,
                Date = s.SaleDate,
                Type = "Sale"
            })
            .ToListAsync();

        var recentPurchases = await _db.Purchases
            .Include(p => p.Supplier)
            .OrderByDescending(p => p.PurchaseDate)
            .Take(6)
            .Select(p => new RecentTransactionViewModel
            {
                Id = p.Id,
                InvoiceNumber = p.InvoiceNumber,
                PartyName = p.Supplier.Name,
                Amount = p.TotalAmount,
                Date = p.PurchaseDate,
                Type = "Purchase"
            })
            .ToListAsync();

        var salesByDay = await _db.Sales
            .Where(s => s.SaleDate >= sevenDaysAgo)
            .GroupBy(s => s.SaleDate.Date)
            .Select(g => new { Date = g.Key, Total = g.Sum(x => x.TotalAmount) })
            .ToListAsync();

        var salesLast7Days = Enumerable.Range(0, 7)
            .Select(i => sevenDaysAgo.AddDays(i))
            .Select(d => new ChartPointViewModel
            {
                Label = d.ToString("ddd"),
                Value = salesByDay.FirstOrDefault(x => x.Date == d)?.Total ?? 0
            })
            .ToList();

        var sixMonthsAgo = monthStart.AddMonths(-5);
        var monthlyRaw = await _db.Sales
            .Where(s => s.SaleDate >= sixMonthsAgo)
            .GroupBy(s => new { s.SaleDate.Year, s.SaleDate.Month })
            .Select(g => new { g.Key.Year, g.Key.Month, Total = g.Sum(x => x.TotalAmount) })
            .ToListAsync();

        var monthlySales = Enumerable.Range(0, 6)
            .Select(i => sixMonthsAgo.AddMonths(i))
            .Select(d => new ChartPointViewModel
            {
                Label = d.ToString("MMM yy"),
                Value = monthlyRaw.FirstOrDefault(x => x.Year == d.Year && x.Month == d.Month)?.Total ?? 0
            })
            .ToList();

        var topSelling = await _db.SaleItems
            .Include(i => i.Product)
            .GroupBy(i => new { i.ProductId, i.Product.Name, i.Product.Sku })
            .Select(g => new TopProductViewModel
            {
                Name = g.Key.Name,
                Sku = g.Key.Sku,
                QuantitySold = g.Sum(x => x.Quantity),
                Revenue = g.Sum(x => x.LineTotal)
            })
            .OrderByDescending(x => x.QuantitySold)
            .Take(5)
            .ToListAsync();

        return new DashboardViewModel
        {
            TotalProducts = totalProducts,
            TotalCustomers = totalCustomers,
            TotalSuppliers = totalSuppliers,
            TotalSalesToday = todaySales,
            TotalSalesMonth = monthSales,
            TotalPurchasesMonth = monthPurchases,
            SalesCountToday = salesCountToday,
            InventoryValue = inventoryValue,
            LowStockCount = await _db.Products.CountAsync(p => p.IsActive && p.StockQuantity <= p.ReorderLevel),
            LowStockProducts = lowStock,
            RecentTransactions = recentSales.OrderByDescending(t => t.Date).Take(8).ToList(),
            SalesLast7Days = salesLast7Days,
            MonthlySales = monthlySales,
            TopSellingProducts = topSelling
        };
    }

    public async Task<StaffDashboardViewModel> GetStaffDashboardAsync()
    {
        var today = DateTime.UtcNow.Date;
        var todaySales = await _db.Sales.Where(s => s.SaleDate >= today).ToListAsync();

        var recent = await _db.Sales
            .Include(s => s.Customer)
            .OrderByDescending(s => s.SaleDate)
            .Take(6)
            .Select(s => new RecentTransactionViewModel
            {
                Id = s.Id,
                InvoiceNumber = s.InvoiceNumber,
                PartyName = s.Customer != null ? s.Customer.Name : "Walk-in",
                Amount = s.TotalAmount,
                Date = s.SaleDate,
                Type = "Sale"
            })
            .ToListAsync();

        return new StaffDashboardViewModel
        {
            SalesToday = todaySales.Sum(s => s.TotalAmount),
            SalesCountToday = todaySales.Count,
            LowStockCount = await _db.Products.CountAsync(p => p.IsActive && p.StockQuantity <= p.ReorderLevel),
            RecentSales = recent
        };
    }

    public async Task<NotificationSummaryViewModel> GetNotificationsAsync()
    {
        var lowStock = await _db.Products
            .Where(p => p.IsActive && p.StockQuantity <= p.ReorderLevel)
            .OrderBy(p => p.StockQuantity)
            .Take(5)
            .Select(p => p.Name)
            .ToListAsync();

        var count = await _db.Products.CountAsync(p => p.IsActive && p.StockQuantity <= p.ReorderLevel);

        return new NotificationSummaryViewModel
        {
            LowStockCount = count,
            LowStockNames = lowStock
        };
    }
}
