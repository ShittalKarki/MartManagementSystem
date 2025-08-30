// MartMS file
namespace MartManagement.Web.Services;

public interface IActivityLogService
{
    Task LogAsync(int? userId, string action, string entityName, string? details = null);
}
