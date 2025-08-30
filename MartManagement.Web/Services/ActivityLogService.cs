// MartMS
namespace MartManagement.Web.Services;

public class ActivityLogService : IActivityLogService
{
    private readonly AppDbContext _db;

    public ActivityLogService(AppDbContext db) => _db = db;

    public async Task LogAsync(int? userId, string action, string entityName, string? details = null)
    {
        _db.ActivityLogs.Add(new ActivityLog
        {
            UserId = userId,
            Action = action,
            EntityName = entityName,
            Details = details
        });
        await _db.SaveChangesAsync();
    }
}
