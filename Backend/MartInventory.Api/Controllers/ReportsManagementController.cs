using MartInventory.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("reports")]
public class ReportsManagementController : Controller
{
    private readonly ApplicationDbContext _db;

    public ReportsManagementController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("")]
    public IActionResult Index()
    {
        return View();
    }

    [HttpGet("summary")]
    public async Task<IActionResult> Summary(DateTime? startDate, DateTime? endDate)
    {
        var start = (startDate ?? DateTime.UtcNow.AddDays(-6)).Date;
        var end = (endDate ?? DateTime.UtcNow).Date.AddDays(1);

        start = DateTime.SpecifyKind(start, DateTimeKind.Utc);
        end = DateTime.SpecifyKind(end, DateTimeKind.Utc);

        var sales = await _db.SalesOrders.Where(x => x.SoldAt >= start && x.SoldAt < end).ToListAsync();
        var purchases = await _db.PurchaseOrders.Where(x => x.OrderedAt >= start && x.OrderedAt < end).ToListAsync();

        var data = new
        {
            startDate = start,
            endDate = end.AddDays(-1),
            totalSales = sales.Sum(x => x.TotalAmount),
            totalPurchases = purchases.Sum(x => x.TotalAmount),
            salesOrders = sales.Count,
            purchaseOrders = purchases.Count,
            lowStockItems = await _db.Products.CountAsync(x => x.StockOnHand <= x.ReorderLevel)
        };

        return Json(data);
    }
}
