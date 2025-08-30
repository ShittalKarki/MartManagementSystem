// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.AdminOrStaff)]
public class SalesController : Controller
{
    private readonly ISalesService _sales;
    private readonly AppDbContext _db;

    public SalesController(ISalesService sales, AppDbContext db)
    {
        _sales = sales;
        _db = db;
    }

    public async Task<IActionResult> Index(string? search, DateTime? from, DateTime? to, int page = 1)
    {
        var result = await _sales.GetPagedAsync(search, from, to, page, 10);
        ViewBag.Search = search;
        ViewBag.From = from?.ToString("yyyy-MM-dd");
        ViewBag.To = to?.ToString("yyyy-MM-dd");
        ViewBag.Page = page;
        ViewBag.TotalPages = result.TotalPages;
        return View(result.Items);
    }

    [HttpGet]
    public async Task<IActionResult> Create() => View(await BuildCreateModelAsync(new SaleCreateViewModel()));

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(SaleCreateViewModel model)
    {
        try
        {
            var sale = await _sales.CreateSaleAsync(model, GetUserId());
            TempData["Success"] = $"Sale recorded successfully ({sale.InvoiceNumber}).";
            return RedirectToAction(nameof(Invoice), new { id = sale.Id });
        }
        catch (Exception ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return View(await BuildCreateModelAsync(model));
        }
    }

    public async Task<IActionResult> Details(int id)
    {
        var sale = await _sales.GetByIdAsync(id);
        return sale == null ? NotFound() : View(sale);
    }

    public async Task<IActionResult> Invoice(int id)
    {
        var sale = await _sales.GetByIdAsync(id);
        return sale == null ? NotFound() : View(sale);
    }

    [HttpGet]
    public async Task<IActionResult> ProductInfo(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        return Json(new { product.SellingPrice, product.TaxPercent, product.StockQuantity, product.Name });
    }

    private async Task<SaleCreateViewModel> BuildCreateModelAsync(SaleCreateViewModel model)
    {
        model.Customers = await _db.Customers.Where(c => c.IsActive).OrderBy(c => c.Name)
            .Select(c => new SelectListItem(c.Name, c.Id.ToString(), model.CustomerId == c.Id)).ToListAsync();
        model.Products = await _db.Products.Where(p => p.IsActive).OrderBy(p => p.Name)
            .Select(p => new SelectListItem($"{p.Name} ({p.Sku})", p.Id.ToString())).ToListAsync();
        return model;
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;
}
