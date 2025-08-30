// MartMS
namespace MartManagement.Web.Services;

public interface ISalesService
{
    Task<Sale> CreateSaleAsync(SaleCreateViewModel model, int? userId);
    Task<Sale?> GetByIdAsync(int id);
    Task<PagedResult<Sale>> GetPagedAsync(string? search, DateTime? from, DateTime? to, int page, int pageSize);
}
