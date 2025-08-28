using System.ComponentModel.DataAnnotations;
using MartInventory.Api.Helpers;
using MartInventory.Api.Models;

namespace MartInventory.Api.ViewModels;

public class ProductFormViewModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(32)]
    public string Sku { get; set; } = string.Empty;

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [Required]
    [StringLength(20)]
    public string Unit { get; set; } = "pcs";

    [StringLength(64)]
    public string? Barcode { get; set; }

    [Range(0, 9999999)]
    public decimal PurchasePrice { get; set; }

    [Range(0, 9999999)]
    public decimal SellingPrice { get; set; }

    [Range(0, 100)]
    public decimal VatPercent { get; set; } = 13;

    [Range(0, 9999999)]
    public int StockOnHand { get; set; }

    [Range(0, 9999999)]
    public int ReorderLevel { get; set; } = 10;

    [Required]
    public int CategoryId { get; set; }
}

public class ProductIndexViewModel
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public PagedResult<Product> PagedProducts { get; set; } = new();
    public List<Category> Categories { get; set; } = new();
}
