// MartMS
namespace MartManagement.Web.Services;

public class ShopCatalogService
{
    private readonly AppDbContext _db;

    public ShopCatalogService(AppDbContext db) => _db = db;

    public async Task<HashSet<int>> GetBestSellerIdsAsync(int take = 8)
    {
        var ids = await _db.SaleItems
            .GroupBy(i => i.ProductId)
            .OrderByDescending(g => g.Sum(x => x.Quantity))
            .Take(take)
            .Select(g => g.Key)
            .ToListAsync();
        return ids.ToHashSet();
    }

    public async Task<HashSet<int>> GetPopularProductIdsAsync(int take = 6)
    {
        var ids = await _db.SaleItems
            .GroupBy(i => i.ProductId)
            .OrderByDescending(g => g.Count())
            .Take(take)
            .Select(g => g.Key)
            .ToListAsync();
        return ids.ToHashSet();
    }

    public async Task<List<Product>> GetFeaturedProductsAsync(int take = 4)
    {
        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity > 0)
            .OrderByDescending(p => p.ImagePath != null)
            .ThenByDescending(p => p.CreatedAt)
            .Take(take)
            .ToListAsync();
    }

    public async Task<List<CategorySummaryViewModel>> GetCategorySummariesAsync()
    {
        return await _db.Categories
            .Where(c => c.IsActive)
            .Select(c => new CategorySummaryViewModel
            {
                Id = c.Id,
                Name = c.Name,
                Description = c.Description,
                ProductCount = c.Products.Count(p => p.IsActive && p.StockQuantity > 0)
            })
            .Where(c => c.ProductCount > 0)
            .OrderByDescending(c => c.ProductCount)
            .Take(6)
            .ToListAsync();
    }

    public async Task<List<Product>> QueryProductsAsync(ShopFilterViewModel filter)
    {
        var query = _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity > 0);

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var term = filter.Search.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                p.Sku.Contains(term) ||
                (p.Description != null && p.Description.Contains(term)));
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(p => p.CategoryId == filter.CategoryId);

        if (filter.MinPrice.HasValue)
            query = query.Where(p => p.SellingPrice >= filter.MinPrice);

        if (filter.MaxPrice.HasValue)
            query = query.Where(p => p.SellingPrice <= filter.MaxPrice);

        query = filter.Sort switch
        {
            "price_asc" => query.OrderBy(p => p.SellingPrice),
            "price_desc" => query.OrderByDescending(p => p.SellingPrice),
            "newest" => query.OrderByDescending(p => p.CreatedAt),
            "name" => query.OrderBy(p => p.Name),
            _ => query.OrderBy(p => p.Name)
        };

        if (filter.Sort == "popular")
        {
            var popularIds = await GetPopularProductIdsAsync(50);
            var list = await query.ToListAsync();
            return list
                .OrderByDescending(p => popularIds.Contains(p.Id))
                .ThenBy(p => p.Name)
                .ToList();
        }

        return await query.ToListAsync();
    }

    public async Task<List<SearchSuggestionViewModel>> SearchSuggestionsAsync(string? term, int take = 8)
    {
        if (string.IsNullOrWhiteSpace(term) || term.Length < 2)
            return new List<SearchSuggestionViewModel>();

        term = term.Trim();
        return await _db.Products
            .Where(p => p.IsActive && p.StockQuantity > 0 &&
                        (p.Name.Contains(term) || p.Sku.Contains(term)))
            .OrderBy(p => p.Name)
            .Take(take)
            .Select(p => new SearchSuggestionViewModel
            {
                Id = p.Id,
                Name = p.Name,
                Sku = p.Sku,
                Price = p.SellingPrice,
                ImagePath = p.ImagePath,
                CategoryName = p.Category.Name
            })
            .ToListAsync();
    }

    public async Task<List<Product>> GetRelatedProductsAsync(int productId, int categoryId, int take = 4)
    {
        return await _db.Products
            .Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity > 0 && p.CategoryId == categoryId && p.Id != productId)
            .OrderByDescending(p => p.StockQuantity)
            .Take(take)
            .ToListAsync();
    }
}
