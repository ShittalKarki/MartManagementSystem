using System.ComponentModel.DataAnnotations;
using MartInventory.Api.Models;

namespace MartInventory.Api.ViewModels;

public class OrderLineInputViewModel
{
    [Required]
    public int ProductId { get; set; }

    [Range(1, 100000)]
    public int Quantity { get; set; }

    [Range(0, 9999999)]
    public decimal UnitPrice { get; set; }

    [Range(0, 100)]
    public decimal DiscountPercent { get; set; }

    [Range(0, 100)]
    public decimal VatPercent { get; set; } = 13;
}

public class CreateSaleViewModel
{
    public int? CustomerId { get; set; }
    public List<OrderLineInputViewModel> Lines { get; set; } = new();
    public List<Product> Products { get; set; } = new();
    public List<Customer> Customers { get; set; } = new();
}

public class CreatePurchaseViewModel
{
    [Required]
    public int VendorId { get; set; }

    public List<OrderLineInputViewModel> Lines { get; set; } = new();
    public List<Product> Products { get; set; } = new();
    public List<Vendor> Vendors { get; set; } = new();
}

public class OrderHistoryViewModel
{
    public List<SalesOrder> RecentSales { get; set; } = new();
    public List<PurchaseOrder> RecentPurchases { get; set; } = new();
}
