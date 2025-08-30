// MartMS file
namespace MartManagement.Web.Helpers;

/// <summary>Maps role names to the default landing URL after sign-in.</summary>
public static class RoleRedirect
{
    public static string HomeAction(string role) => role switch
    {
        AppRoles.Customer => "/Shop",
        AppRoles.Staff => "/Dashboard",
        _ => "/Dashboard"
    };
}
