using Microsoft.AspNetCore.Identity;

namespace MartInventory.Api.Models
{
    public class AppUser : IdentityUser
    {
        // Additional profile fields can go here
        public string? FullName { get; set; }
    }
}
