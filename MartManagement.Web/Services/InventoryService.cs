// MartMS
namespace MartManagement.Web.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public InventoryService(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task AdjustStockAsync(int productId, int quantityChange, StockMovementType type, int? userId, string? notes = null)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId)
            ?? throw new InvalidOperationException("Product not found.");

        if (type is StockMovementType.AdjustmentOut or StockMovementType.Sale)
        {
            if (product.StockQuantity + quantityChange < 0)
                throw new InvalidOperationException($"Insufficient stock for {product.Name}.");
        }

        var previous = product.StockQuantity;
        product.StockQuantity += quantityChange;
        product.UpdatedAt = DateTime.UtcNow;

        _db.StockMovements.Add(new StockMovement
        {
            ProductId = productId,
            QuantityChange = quantityChange,
            PreviousStock = previous,
            NewStock = product.StockQuantity,
            MovementType = type,
            Notes = notes,
            UserId = userId,
            Reference = type.ToString()
        });

        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(userId, "Stock Adjust", "Product", $"{product.Name}: {previous} -> {product.StockQuantity}");
    }

    public async Task<IReadOnlyList<Product>> GetLowStockAsync() =>
        await _db.Products.Include(p => p.Category)
            .Where(p => p.IsActive && p.StockQuantity <= p.ReorderLevel)
            .OrderBy(p => p.StockQuantity)
            .ToListAsync();

    public async Task<IReadOnlyList<StockMovement>> GetMovementsAsync(int? productId, int page, int pageSize)
    {
        var query = _db.StockMovements.Include(m => m.Product).Include(m => m.User).AsQueryable();
        if (productId.HasValue)
            query = query.Where(m => m.ProductId == productId);

        return await query.OrderByDescending(m => m.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }
}
