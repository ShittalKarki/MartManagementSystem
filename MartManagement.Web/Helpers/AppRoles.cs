// MartMS file
namespace MartManagement.Web.Helpers;

/// <summary>Application role names used for authorization policies.</summary>
public static class AppRoles
{
    public const string Admin = "Admin";
    public const string Staff = "Staff";
    public const string Customer = "Customer";

    /// <summary>Comma-separated list for policies that allow both store staff and administrators.</summary>
    public const string AdminOrStaff = "Admin,Staff";
}
