// MartMS
namespace MartManagement.Web.Helpers;

public static class PasswordHelper
{
    private static readonly PasswordHasher<AppUser> Hasher = new();

    public static string Hash(AppUser user, string password) => Hasher.HashPassword(user, password);

    public static bool Verify(AppUser user, string password)
    {
        var result = Hasher.VerifyHashedPassword(user, user.PasswordHash, password);
        return result == PasswordVerificationResult.Success
            || result == PasswordVerificationResult.SuccessRehashNeeded;
    }
}
