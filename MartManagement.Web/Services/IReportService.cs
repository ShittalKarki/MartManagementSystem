// MartMS
namespace MartManagement.Web.Services;

public interface IReportService
{
    Task<SalesReportViewModel> GetSalesReportAsync(DateTime from, DateTime to);
    Task<IReadOnlyList<ProductReportRowViewModel>> GetProductReportAsync();
    Task<byte[]> ExportSalesExcelAsync(DateTime from, DateTime to);
}
