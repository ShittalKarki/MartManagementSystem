// MartMS
namespace MartManagement.Web.Services;

public interface IPurchaseService
{
    Task<Purchase> CreatePurchaseAsync(PurchaseCreateViewModel model, int? userId);
    Task<Purchase?> GetByIdAsync(int id);
    Task<PagedResult<Purchase>> GetPagedAsync(string? search, int page, int pageSize);
}
