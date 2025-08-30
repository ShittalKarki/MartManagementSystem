// MartMS
namespace MartManagement.Web.Controllers;

public abstract class AppControllerBase : Controller
{
    protected int? CurrentUserId =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    protected void SetBreadcrumb(string title, string? parentTitle = null, string? parentUrl = null)
    {
        ViewData["PageTitle"] = title;
        if (parentTitle != null)
            ViewData["BreadcrumbParent"] = parentTitle;
        if (parentUrl != null)
            ViewData["BreadcrumbParentUrl"] = parentUrl;
    }
}
