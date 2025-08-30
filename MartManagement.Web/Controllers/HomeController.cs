// MartMS
namespace MartManagement.Web.Controllers;

public class HomeController : Controller
{
    /// <summary>Entry route: send authenticated users to their role home, others to login.</summary>
    [AllowAnonymous]
    public IActionResult Index()
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value ?? AppRoles.Admin;
            return Redirect(RoleRedirect.HomeAction(userRole));
        }

        return RedirectToAction("Login", "Account");
    }

    [AllowAnonymous]
    public IActionResult Error() => View();
}
