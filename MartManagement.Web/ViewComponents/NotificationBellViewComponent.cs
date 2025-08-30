// MartMS
namespace MartManagement.Web.ViewComponents;

public class NotificationBellViewComponent : ViewComponent
{
    private readonly IDashboardService _dashboard;

    public NotificationBellViewComponent(IDashboardService dashboard) => _dashboard = dashboard;

    public async Task<IViewComponentResult> InvokeAsync() =>
        View(await _dashboard.GetNotificationsAsync());
}
