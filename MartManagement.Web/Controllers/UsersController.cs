// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Policy = "AdminOnly")]
public class UsersController : Controller
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public UsersController(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<IActionResult> Index() =>
        View(await _db.Users.Include(u => u.Role).OrderBy(u => u.Username).ToListAsync());

    [HttpGet]
    public async Task<IActionResult> Create() => View("Form", await BuildFormAsync(new UserFormViewModel()));

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(UserFormViewModel model)
    {
        if (!await ValidateUserAsync(model)) return View("Form", await BuildFormAsync(model));

        var user = new Models.AppUser
        {
            Username = model.Username,
            Email = model.Email,
            FullName = model.FullName,
            RoleId = model.RoleId,
            IsActive = model.IsActive
        };
        user.PasswordHash = PasswordHelper.Hash(user, model.Password ?? "Change@123");
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        await _activityLog.LogAsync(GetUserId(), "Create", "User", user.Username);
        TempData["Success"] = "User created.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet]
    public async Task<IActionResult> Edit(int id)
    {
        var user = await _db.Users.FindAsync(id);
        if (user == null) return NotFound();
        return View("Form", await BuildFormAsync(new UserFormViewModel
        {
            Id = user.Id, Username = user.Username, Email = user.Email,
            FullName = user.FullName, RoleId = user.RoleId, IsActive = user.IsActive
        }));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(UserFormViewModel model)
    {
        if (!await ValidateUserAsync(model)) return View("Form", await BuildFormAsync(model));

        var user = await _db.Users.FindAsync(model.Id);
        if (user == null) return NotFound();

        user.Username = model.Username;
        user.Email = model.Email;
        user.FullName = model.FullName;
        user.RoleId = model.RoleId;
        user.IsActive = model.IsActive;
        if (!string.IsNullOrWhiteSpace(model.Password))
            user.PasswordHash = PasswordHelper.Hash(user, model.Password);

        await _db.SaveChangesAsync();
        TempData["Success"] = "User updated.";
        return RedirectToAction(nameof(Index));
    }

    private async Task<bool> ValidateUserAsync(UserFormViewModel model)
    {
        if (!ModelState.IsValid) return false;
        if (await _db.Users.AnyAsync(u => u.Username == model.Username && u.Id != model.Id))
            ModelState.AddModelError(nameof(model.Username), "Username already taken.");
        if (model.Id == 0 && string.IsNullOrWhiteSpace(model.Password))
            ModelState.AddModelError(nameof(model.Password), "Password is required for new users.");
        return ModelState.IsValid;
    }

    private async Task<UserFormViewModel> BuildFormAsync(UserFormViewModel model)
    {
        model.RoleId = model.RoleId == 0 ? (await _db.Roles.FirstAsync()).Id : model.RoleId;
        ViewBag.Roles = await _db.Roles
            .Where(r => r.Name == AppRoles.Admin || r.Name == AppRoles.Staff)
            .Select(r => new SelectListItem(r.Name, r.Id.ToString(), r.Id == model.RoleId))
            .ToListAsync();
        return model;
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var id) ? id : null;
}
