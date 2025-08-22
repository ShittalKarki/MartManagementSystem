using MartInventory.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[ApiController]
[Route("api/activitylogs")]
[Authorize(Roles = "Admin")]
public class ActivityLogsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ActivityLogsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int take = 50)
    {
        var logs = await _db.ActivityLogs
            .OrderByDescending(log => log.CreatedAt)
            .Take(Math.Clamp(take, 1, 200))
            .Select(log => new
            {
                log.Id,
                log.Action,
                log.EntityName,
                log.EntityId,
                log.PerformedByUserId,
                log.CreatedAt,
                log.Details
            })
            .ToListAsync();

        return Ok(logs);
    }
}