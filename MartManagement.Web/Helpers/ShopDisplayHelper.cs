// MartMS
namespace MartManagement.Web.Helpers;

public static class ShopDisplayHelper
{
    public const int NewProductDays = 30;

    public static bool IsNew(Product product) =>
        (DateTime.UtcNow - product.CreatedAt).TotalDays <= NewProductDays;

    public static string StockBadgeClass(Product product) =>
        product.StockQuantity <= 0 ? "out"
        : product.StockQuantity <= product.ReorderLevel ? "low"
        : "in";

    public static string StockBadgeText(Product product) =>
        product.StockQuantity <= 0 ? "Out of stock"
        : product.StockQuantity <= product.ReorderLevel ? "Low stock"
        : "In stock";

    public static decimal? GetCompareAtPrice(Product product)
    {
        if (product.Id % 3 != 0) return null;
        var compare = Math.Round(product.SellingPrice * 1.12m, 0);
        return compare > product.SellingPrice ? compare : null;
    }

    public static int? GetDiscountPercent(Product product)
    {
        var compare = GetCompareAtPrice(product);
        if (!compare.HasValue || compare <= product.SellingPrice) return null;
        return (int)Math.Round((1 - product.SellingPrice / compare.Value) * 100);
    }

    public static string PlaceholderGradient(int productId)
    {
        var hues = new[] { "#0d9488", "#0891b2", "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b" };
        return hues[productId % hues.Length];
    }
}
