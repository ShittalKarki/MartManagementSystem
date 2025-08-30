// MartMS
namespace MartManagement.Web.Services;

public class ReportService : IReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db) => _db = db;

    public async Task<SalesReportViewModel> GetSalesReportAsync(DateTime from, DateTime to)
    {
        var end = to.Date.AddDays(1);
        var sales = await _db.Sales
            .Where(s => s.SaleDate >= from.Date && s.SaleDate < end)
            .OrderBy(s => s.SaleDate)
            .ToListAsync();

        return new SalesReportViewModel
        {
            From = from,
            To = to,
            TotalRevenue = sales.Sum(s => s.TotalAmount),
            TotalTransactions = sales.Count,
            DailyBreakdown = sales.GroupBy(s => s.SaleDate.Date)
                .Select(g => new ChartPointViewModel { Label = g.Key.ToString("dd MMM"), Value = g.Sum(x => x.TotalAmount) })
                .ToList()
        };
    }

    public async Task<IReadOnlyList<ProductReportRowViewModel>> GetProductReportAsync() =>
        await _db.Products.Include(p => p.Category)
            .Where(p => p.IsActive)
            .OrderBy(p => p.Name)
            .Select(p => new ProductReportRowViewModel
            {
                Sku = p.Sku,
                Name = p.Name,
                Category = p.Category.Name,
                Stock = p.StockQuantity,
                ReorderLevel = p.ReorderLevel,
                PurchasePrice = p.PurchasePrice,
                SellingPrice = p.SellingPrice,
                StockValue = p.PurchasePrice * p.StockQuantity
            })
            .ToListAsync();

    public async Task<byte[]> ExportSalesExcelAsync(DateTime from, DateTime to)
    {
        var end = to.Date.AddDays(1);
        var sales = await _db.Sales
            .Include(s => s.Customer)
            .Where(s => s.SaleDate >= from.Date && s.SaleDate < end)
            .OrderBy(s => s.SaleDate)
            .ToListAsync();

        using var workbook = new XLWorkbook();
        var sheet = workbook.Worksheets.Add("Sales");
        sheet.Cell(1, 1).Value = "Invoice";
        sheet.Cell(1, 2).Value = "Date";
        sheet.Cell(1, 3).Value = "Customer";
        sheet.Cell(1, 4).Value = "Subtotal";
        sheet.Cell(1, 5).Value = "Tax";
        sheet.Cell(1, 6).Value = "Total";

        var row = 2;
        foreach (var sale in sales)
        {
            sheet.Cell(row, 1).Value = sale.InvoiceNumber;
            sheet.Cell(row, 2).Value = sale.SaleDate.ToString("yyyy-MM-dd HH:mm");
            sheet.Cell(row, 3).Value = sale.Customer?.Name ?? "Walk-in";
            sheet.Cell(row, 4).Value = sale.Subtotal;
            sheet.Cell(row, 5).Value = sale.TaxAmount;
            sheet.Cell(row, 6).Value = sale.TotalAmount;
            row++;
        }

        using var stream = new MemoryStream();
        workbook.SaveAs(stream);
        return stream.ToArray();
    }
}
