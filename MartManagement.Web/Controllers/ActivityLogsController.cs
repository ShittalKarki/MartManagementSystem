// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Policy = "AdminOnly")]
public class ActivityLogsController : Controller
{
    private readonly AppDbContext _db;

    public ActivityLogsController(AppDbContext db) => _db = db;

    public async Task<IActionResult> Index() =>
        View(await _db.ActivityLogs.Include(a => a.User).OrderByDescending(a => a.CreatedAt).Take(100).ToListAsync());
}
