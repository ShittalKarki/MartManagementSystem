// MartMS
namespace MartManagement.Web.Services;

public interface IDashboardService
{
    Task<DashboardViewModel> GetAdminDashboardAsync();
    Task<StaffDashboardViewModel> GetStaffDashboardAsync();
    Task<NotificationSummaryViewModel> GetNotificationsAsync();
}
