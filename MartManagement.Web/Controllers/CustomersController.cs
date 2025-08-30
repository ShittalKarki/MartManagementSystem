// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Admin)]
public class CustomersController : Controller
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public CustomersController(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IActionResult> Index(string? search)
    {
        var query = _db.Customers.Where(c => c.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(c => c.Name.Contains(search) || (c.Phone != null && c.Phone.Contains(search)));
        ViewBag.Search = search;
        return View(await query.OrderBy(c => c.Name).ToListAsync());
    }

    public async Task<IActionResult> Details(int id)
    {
        var customer = await _db.Customers
            .Include(c => c.Sales.OrderByDescending(s => s.SaleDate).Take(15))
            .FirstOrDefaultAsync(c => c.Id == id);
        return customer == null ? NotFound() : View(customer);
    }

    [HttpGet]
    public IActionResult Create() => View(new CustomerFormModel());

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CustomerFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        _db.Customers.Add(new Customer { Name = model.Name, Phone = model.Phone, Email = model.Email, Address = model.Address });
        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer created.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var c = await _db.Customers.FindAsync(id);
        return c == null ? NotFound() : View(new CustomerFormModel { Id = c.Id, Name = c.Name, Phone = c.Phone, Email = c.Email, Address = c.Address });
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(CustomerFormModel model)
    {
        if (!ModelState.IsValid) return View(model);
        var customer = await _db.Customers.FindAsync(model.Id);
        if (customer == null) return NotFound();
        customer.Name = model.Name;
        customer.Phone = model.Phone;
        customer.Email = model.Email;
        customer.Address = model.Address;
        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer updated.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await _db.Customers.FindAsync(id);
        if (customer == null) return NotFound();
        customer.IsActive = false;
        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer removed.";
        return RedirectToAction(nameof(Index));
    }

    public class CustomerFormModel
    {
        public int Id { get; set; }
        [Required, StringLength(150)] public string Name { get; set; } = string.Empty;
        public string? Phone { get; set; }
        [EmailAddress] public string? Email { get; set; }
        public string? Address { get; set; }
    }
}
