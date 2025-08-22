using MartInventory.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<Role> _roleManager;

    public UsersController(UserManager<AppUser> userManager, RoleManager<Role> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<object>>> GetAll()
    {
        var users = await _userManager.Users.OrderBy(user => user.Email).ToListAsync();
        var result = new List<object>();

        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.UserName,
                user.Email,
                user.FullName,
                Roles = roles.ToArray(),
                IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd > DateTimeOffset.UtcNow
            });
        }

        return Ok(result);
    }

    public sealed record UpdateRolesRequest(string[] Roles);

    [HttpPut("{id}/roles")]
    public async Task<IActionResult> UpdateRoles(string id, [FromBody] UpdateRolesRequest request)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var selectedRoles = request.Roles.Distinct(StringComparer.OrdinalIgnoreCase).ToArray();
        var existingRoles = await _roleManager.Roles.Select(role => role.Name ?? string.Empty).ToListAsync();
        var invalidRoles = selectedRoles.Where(role => !existingRoles.Contains(role, StringComparer.OrdinalIgnoreCase)).ToArray();
        if (invalidRoles.Length > 0)
        {
            return BadRequest(new { message = $"Unknown roles: {string.Join(", ", invalidRoles)}" });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var toRemove = currentRoles.Except(selectedRoles).ToArray();
        var toAdd = selectedRoles.Except(currentRoles).ToArray();

        if (toRemove.Length > 0)
        {
            await _userManager.RemoveFromRolesAsync(user, toRemove);
        }

        if (toAdd.Length > 0)
        {
            await _userManager.AddToRolesAsync(user, toAdd);
        }

        return NoContent();
    }
}