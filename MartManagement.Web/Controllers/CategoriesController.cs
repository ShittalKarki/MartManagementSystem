// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class CategoriesController : Controller
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public CategoriesController(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IActionResult> Index(string? search)
    {
        var query = _db.Categories.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search));

        ViewBag.Search = search;
        return View(await query.OrderBy(c => c.Name).ToListAsync());
    }

    [HttpGet]
    public IActionResult Create() => View(new CategoryFormModel());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CategoryFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        if (await _db.Categories.AnyAsync(c => c.Name == model.Name))
        {
            ModelState.AddModelError(nameof(model.Name), "Category name already exists.");
            return View(model);
        }

        var category = new Category { Name = model.Name, Description = model.Description };
        _db.Categories.Add(category);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Create", "Category", category.Name);
        TempData["Success"] = "Category created.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var c = await _db.Categories.FindAsync(id);
        return c == null ? NotFound() : View(new CategoryFormModel { Id = c.Id, Name = c.Name, Description = c.Description, IsActive = c.IsActive });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(CategoryFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var category = await _db.Categories.FindAsync(model.Id);
        if (category == null) return NotFound();

        category.Name = model.Name;
        category.Description = model.Description;
        category.IsActive = model.IsActive;
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Update", "Category", category.Name);
        TempData["Success"] = "Category updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _db.Categories.FindAsync(id);
        if (category == null) return NotFound();
        if (await _db.Products.AnyAsync(p => p.CategoryId == id && p.IsActive))
        {
            TempData["Error"] = "Cannot delete category with active products.";
            return RedirectToAction(nameof(Index));
        }

        _db.Categories.Remove(category);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Category deleted.";
        return RedirectToAction(nameof(Index));
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    public class CategoryFormModel
    {
        public int Id { get; set; }

        [Required, StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(300)]
        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;
    }
}
