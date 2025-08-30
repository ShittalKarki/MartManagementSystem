// MartMS
namespace MartManagement.Web.ViewModels;

public class ProductFormViewModel
{
    public int Id { get; set; }

    [Required, StringLength(50)]
    public string Sku { get; set; } = string.Empty;

    [Required, StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(500)]
    public string? Description { get; set; }

    [StringLength(50)]
    public string? Barcode { get; set; }

    [Required]
    public string Unit { get; set; } = "pcs";

    [Range(0, double.MaxValue)]
    public decimal PurchasePrice { get; set; }

    [Range(0.01, double.MaxValue)]
    public decimal SellingPrice { get; set; }

    [Range(0, 100)]
    public decimal TaxPercent { get; set; } = 13;

    [Range(0, int.MaxValue)]
    public int StockQuantity { get; set; }

    [Range(0, int.MaxValue)]
    public int ReorderLevel { get; set; } = 10;

    [Required]
    public int CategoryId { get; set; }

    public bool IsActive { get; set; } = true;
    public IFormFile? ImageFile { get; set; }
    public string? ExistingImagePath { get; set; }
    public IEnumerable<SelectListItem> Categories { get; set; } = Array.Empty<SelectListItem>();
}

public class ProductListViewModel
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public int TotalCount { get; set; }
    public IEnumerable<SelectListItem> Categories { get; set; } = Array.Empty<SelectListItem>();
    public IReadOnlyList<Models.Product> Products { get; set; } = Array.Empty<Models.Product>();
}
