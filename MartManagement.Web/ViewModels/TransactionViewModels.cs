// MartMS
namespace MartManagement.Web.ViewModels;

public class SaleLineViewModel
{
    public int ProductId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal DiscountPercent { get; set; }
    public decimal TaxPercent { get; set; } = 13;
}

public class SaleCreateViewModel
{
    public int? CustomerId { get; set; }
    public decimal DiscountAmount { get; set; }
    public string? Notes { get; set; }
    public List<SaleLineViewModel> Lines { get; set; } = new() { new() };
    public IEnumerable<SelectListItem> Customers { get; set; } = Array.Empty<SelectListItem>();
    public IEnumerable<SelectListItem> Products { get; set; } = Array.Empty<SelectListItem>();
}

public class PurchaseLineViewModel
{
    public int ProductId { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal UnitPrice { get; set; }
    public decimal TaxPercent { get; set; } = 13;
}

public class PurchaseCreateViewModel
{
    [Required]
    public int SupplierId { get; set; }
    public string? Notes { get; set; }
    public List<PurchaseLineViewModel> Lines { get; set; } = new() { new() };
    public IEnumerable<SelectListItem> Suppliers { get; set; } = Array.Empty<SelectListItem>();
    public IEnumerable<SelectListItem> Products { get; set; } = Array.Empty<SelectListItem>();
}

public class StockAdjustViewModel
{
    [Required]
    public int ProductId { get; set; }

    [Required]
    public int Quantity { get; set; }

    [Required]
    public string AdjustmentType { get; set; } = "In";

    public string? Notes { get; set; }
    public IEnumerable<SelectListItem> Products { get; set; } = Array.Empty<SelectListItem>();
}

public class SalesReportViewModel
{
    public DateTime From { get; set; }
    public DateTime To { get; set; }
    public decimal TotalRevenue { get; set; }
    public int TotalTransactions { get; set; }
    public IReadOnlyList<ChartPointViewModel> DailyBreakdown { get; set; } = Array.Empty<ChartPointViewModel>();
}

public class ProductReportRowViewModel
{
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public int Stock { get; set; }
    public int ReorderLevel { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal StockValue { get; set; }
}
