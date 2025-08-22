using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize(Roles = "Admin")]
[Route("users")]
public class UserManagementController : Controller
{
    private readonly UserManager<AppUser> _userManager;
    private readonly RoleManager<Role> _roleManager;

    public UserManagementController(UserManager<AppUser> userManager, RoleManager<Role> roleManager)
    {
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index(string? search)
    {
        var users = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            users = users.Where(x =>
                (x.Email != null && x.Email.Contains(search)) ||
                (x.FullName != null && x.FullName.Contains(search)));
        }

        var list = await users.OrderBy(x => x.Email).Take(200).ToListAsync();
        var result = new List<UserListItemViewModel>();

        foreach (var user in list)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new UserListItemViewModel
            {
                Id = user.Id,
                Email = user.Email ?? string.Empty,
                FullName = user.FullName,
                IsLocked = user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTimeOffset.UtcNow,
                Roles = roles.ToList()
            });
        }

        return View(new UserManagementIndexViewModel
        {
            Search = search,
            Users = result
        });
    }

    [HttpGet("roles/{id}")]
    public async Task<IActionResult> Roles(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var roles = await _userManager.GetRolesAsync(user);
        var vm = new UpdateUserRolesViewModel
        {
            UserId = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            CurrentRoles = roles.ToList(),
            SelectedRoles = roles.ToList(),
            AvailableRoles = await _roleManager.Roles.Select(x => x.Name!).OrderBy(x => x).ToListAsync()
        };

        return View(vm);
    }

    [HttpPost("roles/{id}")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Roles(string id, UpdateUserRolesViewModel model)
    {
        if (id != model.UserId)
        {
            return BadRequest();
        }

        var user = await _userManager.FindByIdAsync(id);
        if (user is null)
        {
            return NotFound();
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        var selected = model.SelectedRoles.Distinct().ToList();

        var remove = currentRoles.Except(selected).ToArray();
        var add = selected.Except(currentRoles).ToArray();

        if (remove.Length > 0)
        {
            await _userManager.RemoveFromRolesAsync(user, remove);
        }

        if (add.Length > 0)
        {
            await _userManager.AddToRolesAsync(user, add);
        }

        TempData["Success"] = "User roles updated successfully.";
        return RedirectToAction(nameof(Index));
    }
}
