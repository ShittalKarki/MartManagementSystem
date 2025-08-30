// MartMS file
namespace MartManagement.Web.Models;

public class Product
{
    public int Id { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Barcode { get; set; }
    public string Unit { get; set; } = "pcs";
    public string? ImagePath { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal TaxPercent { get; set; } = 13m;
    public int StockQuantity { get; set; }
    /// <summary>Minimum quantity before low-stock alerts appear.</summary>
    public int ReorderLevel { get; set; } = 10;
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
