// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class SuppliersController : Controller
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public SuppliersController(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IActionResult> Index(string? search)
    {
        var query = _db.Suppliers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.Name.Contains(search) || (s.Phone != null && s.Phone.Contains(search)));
        ViewBag.Search = search;
        return View(await query.OrderBy(s => s.Name).ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var supplier = await _db.Suppliers
            .Include(s => s.Purchases.OrderByDescending(p => p.PurchaseDate).Take(10))
            .FirstOrDefaultAsync(s => s.Id == id);
        return supplier == null ? NotFound() : View(supplier);
    }

    [HttpGet]
    public IActionResult Create() => View(new SupplierFormModel());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(SupplierFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var supplier = Map(model);
        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Create", "Supplier", supplier.Name);
        TempData["Success"] = "Supplier created.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var s = await _db.Suppliers.FindAsync(id);
        return s == null ? NotFound() : View(MapToForm(s));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(SupplierFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var supplier = await _db.Suppliers.FindAsync(model.Id);
        if (supplier == null) return NotFound();
        Apply(model, supplier);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Supplier updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    [Authorize(Policy = "AdminOnly")]
    public async Task<IActionResult> Delete(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id);
        if (supplier == null) return NotFound();
        supplier.IsActive = false;
        await _db.SaveChangesAsync();
        TempData["Success"] = "Supplier deactivated.";
        return RedirectToAction(nameof(Index));
    }

    private static Supplier Map(SupplierFormModel m) => new()
    {
        Name = m.Name, ContactPerson = m.ContactPerson, Phone = m.Phone, Email = m.Email, Address = m.Address, IsActive = m.IsActive
    };

    private static void Apply(SupplierFormModel m, Supplier s)
    {
        s.Name = m.Name; s.ContactPerson = m.ContactPerson; s.Phone = m.Phone;
        s.Email = m.Email; s.Address = m.Address; s.IsActive = m.IsActive;
    }

    private static SupplierFormModel MapToForm(Supplier s) => new()
    {
        Id = s.Id, Name = s.Name, ContactPerson = s.ContactPerson, Phone = s.Phone, Email = s.Email, Address = s.Address, IsActive = s.IsActive
    };

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;

    public class SupplierFormModel
    {
        public int Id { get; set; }
        [Required, StringLength(150)] public string Name { get; set; } = string.Empty;
        public string? ContactPerson { get; set; }
        public string? Phone { get; set; }
        [EmailAddress] public string? Email { get; set; }
        public string? Address { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
