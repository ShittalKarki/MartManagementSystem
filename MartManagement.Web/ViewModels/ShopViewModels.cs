// MartMS
namespace MartManagement.Web.ViewModels;

public class CartItemViewModel
{
    public int ProductId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ImagePath { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TaxPercent { get; set; }
    public int Quantity { get; set; }
    public int StockAvailable { get; set; }
    public decimal LineSubtotal => UnitPrice * Quantity;
    public decimal LineTax => LineSubtotal * TaxPercent / 100m;
    public decimal LineTotal => LineSubtotal + LineTax;
}

public class CartSummaryViewModel
{
    public List<CartItemViewModel> Items { get; set; } = new();
    public int ItemCount { get; set; }
    public decimal Subtotal { get; set; }
    public decimal Tax { get; set; }
    public decimal Total { get; set; }
}

public class ShopFilterViewModel
{
    public string? Search { get; set; }
    public int? CategoryId { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string Sort { get; set; } = "name";
}

public class ShopHomeViewModel
{
    public ShopFilterViewModel Filter { get; set; } = new();
    public List<Product> Products { get; set; } = new();
    public List<Category> Categories { get; set; } = new();
    public List<Product> FeaturedProducts { get; set; } = new();
    public List<Product> BestSellers { get; set; } = new();
    public List<CategorySummaryViewModel> PopularCategories { get; set; } = new();
    public HashSet<int> PopularIds { get; set; } = new();
    public HashSet<int> BestSellerIds { get; set; } = new();
    public decimal? PriceRangeMax { get; set; }
    public bool ShowCatalogOnly { get; set; }
}

public class CategorySummaryViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int ProductCount { get; set; }
}

public class ProductDetailsViewModel
{
    public Product Product { get; set; } = null!;
    public List<Product> RelatedProducts { get; set; } = new();
    public bool IsPopular { get; set; }
    public bool IsBestSeller { get; set; }
}

public class SearchSuggestionViewModel
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string? ImagePath { get; set; }
    public string CategoryName { get; set; } = string.Empty;
}

public class CustomerProfileViewModel : ProfileViewModel
{
    public string? Phone { get; set; }
    public string? Address { get; set; }
    public int OrderCount { get; set; }
    public decimal TotalSpent { get; set; }
}

public class RegisterViewModel
{
    [Required, StringLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, StringLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Phone]
    public string? Phone { get; set; }

    public string? Address { get; set; }

    [Required, StringLength(100, MinimumLength = 6)]
    [DataType(DataType.Password)]
    public string Password { get; set; } = string.Empty;

    [DataType(DataType.Password), Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;
}

public class StaffDashboardViewModel
{
    public decimal SalesToday { get; set; }
    public int SalesCountToday { get; set; }
    public int LowStockCount { get; set; }
    public IReadOnlyList<RecentTransactionViewModel> RecentSales { get; set; } = Array.Empty<RecentTransactionViewModel>();
}
