// MartMS
namespace MartManagement.Web.ViewModels;

public class DashboardViewModel
{
    public int TotalProducts { get; set; }
    public int TotalCustomers { get; set; }
    public int TotalSuppliers { get; set; }
    public decimal TotalSalesToday { get; set; }
    public decimal TotalSalesMonth { get; set; }
    public decimal TotalPurchasesMonth { get; set; }
    public int SalesCountToday { get; set; }
    public int LowStockCount { get; set; }
    public decimal InventoryValue { get; set; }
    public IReadOnlyList<Product> LowStockProducts { get; set; } = Array.Empty<Product>();
    public IReadOnlyList<RecentTransactionViewModel> RecentTransactions { get; set; } = Array.Empty<RecentTransactionViewModel>();
    public IReadOnlyList<ChartPointViewModel> SalesLast7Days { get; set; } = Array.Empty<ChartPointViewModel>();
    public IReadOnlyList<ChartPointViewModel> MonthlySales { get; set; } = Array.Empty<ChartPointViewModel>();
    public IReadOnlyList<TopProductViewModel> TopSellingProducts { get; set; } = Array.Empty<TopProductViewModel>();
}

public class RecentTransactionViewModel
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public string PartyName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public DateTime Date { get; set; }
    public string Type { get; set; } = string.Empty;
}

public class ChartPointViewModel
{
    public string Label { get; set; } = string.Empty;
    public decimal Value { get; set; }
}

public class TopProductViewModel
{
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int QuantitySold { get; set; }
    public decimal Revenue { get; set; }
}

public class NotificationSummaryViewModel
{
    public int LowStockCount { get; set; }
    public IReadOnlyList<string> LowStockNames { get; set; } = Array.Empty<string>();
}
