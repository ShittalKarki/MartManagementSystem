// MartMS
namespace MartManagement.Web.Services;

public interface IInventoryService
{
    Task AdjustStockAsync(int productId, int quantityChange, StockMovementType type, int? userId, string? notes = null);
    Task<IReadOnlyList<Product>> GetLowStockAsync();
    Task<IReadOnlyList<StockMovement>> GetMovementsAsync(int? productId, int page, int pageSize);
}
