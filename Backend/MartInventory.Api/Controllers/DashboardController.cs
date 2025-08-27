using MartInventory.Api.Data;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
public class DashboardController : Controller
{
    private readonly ApplicationDbContext _db;

    public DashboardController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> Index()
    {
        var today = DateTime.UtcNow.Date;
        var monthStart = DateTime.SpecifyKind(new DateTime(today.Year, today.Month, 1), DateTimeKind.Utc);

        var vm = new DashboardViewModel
        {
            TotalProducts = await _db.Products.CountAsync(),
            TotalCategories = await _db.Categories.CountAsync(),
            LowStockCount = await _db.Products.CountAsync(x => x.StockOnHand <= x.ReorderLevel),
            TodaySales = await _db.SalesOrders.Where(x => x.SoldAt >= DateTime.SpecifyKind(today, DateTimeKind.Utc)).SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            MonthSales = await _db.SalesOrders.Where(x => x.SoldAt >= monthStart).SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            TodayPurchases = await _db.PurchaseOrders.Where(x => x.OrderedAt >= DateTime.SpecifyKind(today, DateTimeKind.Utc)).SumAsync(x => (decimal?)x.TotalAmount) ?? 0,
            RecentMovements = await _db.StockMovements
                .Include(x => x.Product)
                .OrderByDescending(x => x.CreatedAt)
                .Take(10)
                .ToListAsync()
        };

        var salesByDay = await _db.SalesOrders
            .Where(x => x.SoldAt >= DateTime.SpecifyKind(today.AddDays(-6), DateTimeKind.Utc))
            .GroupBy(x => x.SoldAt.Date)
            .Select(g => new { Date = g.Key, Total = g.Sum(x => x.TotalAmount) })
            .ToListAsync();

        for (var i = 6; i >= 0; i--)
        {
            var day = today.AddDays(-i);
            vm.Last7DaysLabels.Add(day.ToString("dd MMM"));
            vm.Last7DaysSales.Add(salesByDay.FirstOrDefault(x => x.Date == day)?.Total ?? 0);
        }

        return View(vm);
    }
}
