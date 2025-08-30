// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.AdminOrStaff)]
public class ProductsController : Controller
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;
    private readonly IWebHostEnvironment _env;

    public ProductsController(AppDbContext db, IActivityLogService activityLog, IWebHostEnvironment env)
    {
        _db = db;
        _activityLog = activityLog;
        _env = env;
    }

    public async Task<IActionResult> Index(string? search, int? categoryId, int page = 1)
    {
        const int pageSize = 10;
        var query = _db.Products.Include(p => p.Category).Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.Contains(search) || p.Sku.Contains(search) || (p.Barcode != null && p.Barcode.Contains(search)));
        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId);

        var total = await query.CountAsync();
        var products = await query.OrderBy(p => p.Name).Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return View(new ProductListViewModel
        {
            Search = search,
            CategoryId = categoryId,
            Page = page,
            PageSize = pageSize,
            TotalCount = total,
            Products = products,
            Categories = await GetCategorySelectListAsync()
        });
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpGet]
    public async Task<IActionResult> Create() => View("Form", await BuildFormAsync(new ProductFormViewModel()));

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ProductFormViewModel model)
    {
        if (!await ValidateSkuAsync(model)) return View("Form", await BuildFormAsync(model));

        var product = MapToEntity(model);
        product.ImagePath = await SaveImageAsync(model.ImageFile);
        _db.Products.Add(product);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Create", "Product", product.Name);
        TempData["Success"] = "Product created.";
        return RedirectToAction(nameof(Index));
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        return View("Form", await BuildFormAsync(new ProductFormViewModel
        {
            Id = product.Id,
            Sku = product.Sku,
            Name = product.Name,
            Description = product.Description,
            Barcode = product.Barcode,
            Unit = product.Unit,
            PurchasePrice = product.PurchasePrice,
            SellingPrice = product.SellingPrice,
            TaxPercent = product.TaxPercent,
            StockQuantity = product.StockQuantity,
            ReorderLevel = product.ReorderLevel,
            CategoryId = product.CategoryId,
            IsActive = product.IsActive,
            ExistingImagePath = product.ImagePath
        }));
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(ProductFormViewModel model)
    {
        if (!await ValidateSkuAsync(model)) return View("Form", await BuildFormAsync(model));

        var product = await _db.Products.FindAsync(model.Id);
        if (product == null) return NotFound();

        product.Sku = model.Sku;
        product.Name = model.Name;
        product.Description = model.Description;
        product.Barcode = model.Barcode;
        product.Unit = model.Unit;
        product.PurchasePrice = model.PurchasePrice;
        product.SellingPrice = model.SellingPrice;
        product.TaxPercent = model.TaxPercent;
        product.StockQuantity = model.StockQuantity;
        product.ReorderLevel = model.ReorderLevel;
        product.CategoryId = model.CategoryId;
        product.IsActive = model.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        if (model.ImageFile != null)
            product.ImagePath = await SaveImageAsync(model.ImageFile);

        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Update", "Product", product.Name);
        TempData["Success"] = "Product updated.";
        return RedirectToAction(nameof(Index));
    }

    [Authorize(Roles = AppRoles.Admin)]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var product = await _db.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Delete", "Product", product.Name);
        TempData["Success"] = "Product removed.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Details(int id)
    {
        var product = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
        return product == null ? NotFound() : View(product);
    }

    private async Task<bool> ValidateSkuAsync(ProductFormViewModel model)
    {
        if (!ModelState.IsValid) return false;
        var exists = await _db.Products.AnyAsync(p => p.Sku == model.Sku && p.Id != model.Id);
        if (exists) ModelState.AddModelError(nameof(model.Sku), "SKU already exists.");
        return ModelState.IsValid;
    }

    private static Models.Product MapToEntity(ProductFormViewModel model) => new()
    {
        Sku = model.Sku,
        Name = model.Name,
        Description = model.Description,
        Barcode = model.Barcode,
        Unit = model.Unit,
        PurchasePrice = model.PurchasePrice,
        SellingPrice = model.SellingPrice,
        TaxPercent = model.TaxPercent,
        StockQuantity = model.StockQuantity,
        ReorderLevel = model.ReorderLevel,
        CategoryId = model.CategoryId,
        IsActive = model.IsActive
    };

    private async Task<string?> SaveImageAsync(IFormFile? file)
    {
        if (file == null || file.Length == 0) return null;
        var uploads = Path.Combine(_env.WebRootPath, "uploads", "products");
        Directory.CreateDirectory(uploads);
        var fileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
        var path = Path.Combine(uploads, fileName);
        await using var stream = System.IO.File.Create(path);
        await file.CopyToAsync(stream);
        return $"/uploads/products/{fileName}";
    }

    private async Task<ProductFormViewModel> BuildFormAsync(ProductFormViewModel model)
    {
        model.Categories = await GetCategorySelectListAsync(model.CategoryId);
        return model;
    }

    private async Task<IEnumerable<SelectListItem>> GetCategorySelectListAsync(int? selected = null) =>
        await _db.Categories.Where(c => c.IsActive).OrderBy(c => c.Name)
            .Select(c => new SelectListItem { Value = c.Id.ToString(), Text = c.Name, Selected = selected == c.Id })
            .ToListAsync();

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;
}
