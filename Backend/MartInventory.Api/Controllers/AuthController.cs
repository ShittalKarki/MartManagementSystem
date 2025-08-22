using MartInventory.Api.Models;
using MartInventory.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace MartInventory.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly JwtTokenService _tokenService;

    public AuthController(UserManager<AppUser> userManager, JwtTokenService tokenService)
    {
        _userManager = userManager;
        _tokenService = tokenService;
    }

    public sealed record LoginRequest(string Email, string Password, bool RememberMe = false);

    public sealed record RegisterRequest(string FullName, string Email, string Password);

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Unauthorized(new { message = "Invalid login attempt." });
        }

        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            return Unauthorized(new { message = "Invalid login attempt." });
        }

        var roles = await _userManager.GetRolesAsync(user);
        var token = await _tokenService.CreateTokenAsync(user, roles);
        return Ok(new AuthResponse(user.Id, user.UserName ?? user.Email ?? string.Empty, user.Email ?? string.Empty, user.FullName, roles.ToArray(), token));
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest request)
    {
        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            return Conflict(new { message = "An account already exists for this email address." });
        }

        var user = new AppUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = string.Join(" ", result.Errors.Select(error => error.Description)) });
        }

        await _userManager.AddToRoleAsync(user, "Customer");
        var roles = await _userManager.GetRolesAsync(user);
        var token = await _tokenService.CreateTokenAsync(user, roles);
        return Ok(new AuthResponse(user.Id, user.UserName ?? user.Email ?? string.Empty, user.Email ?? string.Empty, user.FullName, roles.ToArray(), token));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        return Ok(new { message = "Signed out." });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<AuthResponse?>> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new AuthResponse(user.Id, user.UserName ?? user.Email ?? string.Empty, user.Email ?? string.Empty, user.FullName, roles.ToArray(), null));
    }

    public sealed record AuthResponse(string Id, string UserName, string Email, string? FullName, string[] Roles, string? Token);
}
