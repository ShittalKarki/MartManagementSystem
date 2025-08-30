// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.AdminOrStaff)]
public class InventoryController : Controller
{
    private readonly IInventoryService _inventory;
    private readonly AppDbContext _db;

    public InventoryController(IInventoryService inventory, AppDbContext db)
    {
        _inventory = inventory;
        _db = db;
    }

    /// <summary>Stock overview with recent movements and low-stock highlights.</summary>
    public async Task<IActionResult> Index()
    {
        ViewBag.LowStock = await _inventory.GetLowStockAsync();
        ViewBag.Movements = await _inventory.GetMovementsAsync(null, 1, 15);
        return View(await _db.Products.Include(p => p.Category).Where(p => p.IsActive).OrderBy(p => p.Name).ToListAsync());
    }

    [HttpGet]
    public async Task<IActionResult> Adjust()
    {
        var model = new StockAdjustViewModel
        {
            Products = await _db.Products.Where(p => p.IsActive).OrderBy(p => p.Name)
                .Select(p => new SelectListItem($"{p.Name} (Stock: {p.StockQuantity})", p.Id.ToString()))
                .ToListAsync()
        };
        return View(model);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Adjust(StockAdjustViewModel model)
    {
        if (!ModelState.IsValid)
        {
            model.Products = await _db.Products.Where(p => p.IsActive).OrderBy(p => p.Name)
                .Select(p => new SelectListItem($"{p.Name} (Stock: {p.StockQuantity})", p.Id.ToString(), p.Id == model.ProductId))
                .ToListAsync();
            return View(model);
        }

        try
        {
            var change = model.AdjustmentType == "Out" ? -model.Quantity : model.Quantity;
            var type = model.AdjustmentType == "Out" ? StockMovementType.AdjustmentOut : StockMovementType.AdjustmentIn;
            await _inventory.AdjustStockAsync(model.ProductId, change, type, GetUserId(), model.Notes);
            TempData["Success"] = "Stock updated.";
            return RedirectToAction(nameof(Index));
        }
        catch (Exception ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            model.Products = await _db.Products.Where(p => p.IsActive).OrderBy(p => p.Name)
                .Select(p => new SelectListItem($"{p.Name}", p.Id.ToString())).ToListAsync();
            return View(model);
        }
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;
}
