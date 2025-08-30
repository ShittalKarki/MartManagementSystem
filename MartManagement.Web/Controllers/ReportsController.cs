// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class ReportsController : Controller
{
    private readonly IReportService _reports;

    public ReportsController(IReportService reports) => _reports = reports;

    public async Task<IActionResult> Index(DateTime? from, DateTime? to)
    {
        var start = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to ?? DateTime.UtcNow.Date;
        var model = await _reports.GetSalesReportAsync(start, end);
        ViewBag.From = start.ToString("yyyy-MM-dd");
        ViewBag.To = end.ToString("yyyy-MM-dd");
        return View(model);
    }

    public async Task<IActionResult> Products() => View(await _reports.GetProductReportAsync());

    public async Task<IActionResult> ExportSales(DateTime? from, DateTime? to)
    {
        var start = from ?? DateTime.UtcNow.Date.AddDays(-30);
        var end = to ?? DateTime.UtcNow.Date;
        var bytes = await _reports.ExportSalesExcelAsync(start, end);
        return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            $"sales-report-{start:yyyyMMdd}-{end:yyyyMMdd}.xlsx");
    }
}
