using MartInventory.Api.Models;

namespace MartInventory.Api.ViewModels;

public class DashboardViewModel
{
    public int TotalProducts { get; set; }
    public int TotalCategories { get; set; }
    public int LowStockCount { get; set; }
    public decimal TodaySales { get; set; }
    public decimal MonthSales { get; set; }
    public decimal TodayPurchases { get; set; }
    public List<StockMovement> RecentMovements { get; set; } = new();
    public List<string> Last7DaysLabels { get; set; } = new();
    public List<decimal> Last7DaysSales { get; set; } = new();
}
