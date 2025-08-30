// MartMS
namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.AdminOrStaff)]
public class DashboardController : Controller
{
    private readonly IDashboardService _dashboard;

    public DashboardController(IDashboardService dashboard) => _dashboard = dashboard;

    public async Task<IActionResult> Index()
    {
        if (User.IsInRole(AppRoles.Customer))
            return RedirectToAction("Index", "Shop");

        if (User.IsInRole(AppRoles.Staff))
        {
            ViewData["PageTitle"] = "Staff Dashboard";
            return View("Staff", await _dashboard.GetStaffDashboardAsync());
        }

        ViewData["PageTitle"] = "Admin Dashboard";
        return View("Admin", await _dashboard.GetAdminDashboardAsync());
    }
}
