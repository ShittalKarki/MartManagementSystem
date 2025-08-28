using System.ComponentModel.DataAnnotations;

namespace MartInventory.Api.ViewModels;

public class UserListItemViewModel
{
    public string Id { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? FullName { get; set; }
    public bool IsLocked { get; set; }
    public List<string> Roles { get; set; } = new();
}

public class UserManagementIndexViewModel
{
    public string? Search { get; set; }
    public List<UserListItemViewModel> Users { get; set; } = new();
}

public class UpdateUserRolesViewModel
{
    [Required]
    public string UserId { get; set; } = string.Empty;

    public string? Email { get; set; }
    public string? FullName { get; set; }
    public List<string> CurrentRoles { get; set; } = new();
    public List<string> AvailableRoles { get; set; } = new();
    public List<string> SelectedRoles { get; set; } = new();
}
