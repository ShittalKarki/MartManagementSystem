// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class PurchasesController : Controller
{
    private readonly IPurchaseService _purchases;
    private readonly AppDbContext _db;

    public PurchasesController(IPurchaseService purchases, AppDbContext db)
    {
        _purchases = purchases;
        _db = db;
    }

    public async Task<IActionResult> Index(string? search, int page = 1)
    {
        var result = await _purchases.GetPagedAsync(search, page, 10);
        ViewBag.Search = search;
        ViewBag.Page = page;
        ViewBag.TotalPages = result.TotalPages;
        return View(result.Items);
    }

    [HttpGet]
    public async Task<IActionResult> Create() => View(await BuildCreateModelAsync(new PurchaseCreateViewModel()));

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(PurchaseCreateViewModel model)
    {
        if (!ModelState.IsValid) return View(await BuildCreateModelAsync(model));
        try
        {
            var purchase = await _purchases.CreatePurchaseAsync(model, GetUserId());
            TempData["Success"] = $"Purchase {purchase.InvoiceNumber} recorded.";
            return RedirectToAction(nameof(Details), new { id = purchase.Id });
        }
        catch (Exception ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return View(await BuildCreateModelAsync(model));
        }
    }

    public async Task<IActionResult> Details(int id)
    {
        var purchase = await _purchases.GetByIdAsync(id);
        return purchase == null ? NotFound() : View(purchase);
    }

    [HttpGet]
    public async Task<IActionResult> ProductInfo(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();
        return Json(new { product.PurchasePrice, product.TaxPercent, product.Name });
    }

    private async Task<PurchaseCreateViewModel> BuildCreateModelAsync(PurchaseCreateViewModel model)
    {
        model.Suppliers = await _db.Suppliers.Where(s => s.IsActive).OrderBy(s => s.Name)
            .Select(s => new SelectListItem(s.Name, s.Id.ToString(), model.SupplierId == s.Id)).ToListAsync();
        model.Products = await _db.Products.Where(p => p.IsActive).OrderBy(p => p.Name)
            .Select(p => new SelectListItem($"{p.Name} ({p.Sku})", p.Id.ToString())).ToListAsync();
        return model;
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;
}
