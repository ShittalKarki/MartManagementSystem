// MartMS
namespace MartManagement.Web.Controllers;

public class AccountController : Controller
{
    private readonly AppDbContext _db;

    public AccountController(AppDbContext db) => _db = db;

    [AllowAnonymous]
    [HttpGet]
    public IActionResult Login(string? returnUrl = null)
    {
        if (User.Identity?.IsAuthenticated == true)
        {
            var role = User.FindFirst(ClaimTypes.Role)?.Value ?? AppRoles.Admin;
            return Redirect(RoleRedirect.HomeAction(role));
        }

        ViewData["ReturnUrl"] = returnUrl;
        return View(new LoginViewModel());
    }

    [AllowAnonymous]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Login(LoginViewModel model, string? returnUrl = null)
    {
        if (!ModelState.IsValid)
            return View(model);

        var user = await _db.Users.Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Username == model.Username && u.IsActive);

        if (user == null || !PasswordHelper.Verify(user, model.Password))
        {
            ModelState.AddModelError(string.Empty, "Invalid username or password.");
            return View(model);
        }

        user.LastLoginAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        await SignInUserAsync(user, model.RememberMe);

        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            return LocalRedirect(returnUrl);

        return Redirect(RoleRedirect.HomeAction(user.Role.Name));
    }

    [AllowAnonymous]
    [HttpGet]
    public IActionResult Register() => View(new RegisterViewModel());

    [AllowAnonymous]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        if (await _db.Users.AnyAsync(u => u.Username == model.Username))
        {
            ModelState.AddModelError(nameof(model.Username), "Username is already taken.");
            return View(model);
        }

        if (await _db.Users.AnyAsync(u => u.Email == model.Email))
        {
            ModelState.AddModelError(nameof(model.Email), "Email is already registered.");
            return View(model);
        }

        var customerRole = await _db.Roles.FirstAsync(r => r.Name == AppRoles.Customer);
        var customer = new Customer
        {
            Name = model.FullName,
            Email = model.Email,
            Phone = model.Phone,
            Address = model.Address
        };
        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        var user = new AppUser
        {
            Username = model.Username,
            Email = model.Email,
            FullName = model.FullName,
            RoleId = customerRole.Id,
            CustomerId = customer.Id,
            IsActive = true
        };
        user.PasswordHash = PasswordHelper.Hash(user, model.Password);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        user.Role = customerRole;
        await SignInUserAsync(user, rememberMe: false);
        TempData["Success"] = "Welcome! Your account is ready.";
        return RedirectToAction("Index", "Shop");
    }

    [Authorize]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return RedirectToAction(nameof(Login));
    }

    [AllowAnonymous]
    public IActionResult AccessDenied() => View();

    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff},{AppRoles.Customer}")]
    [HttpGet]
    public async Task<IActionResult> Profile()
    {
        var user = await GetCurrentUserAsync();
        if (user == null) return RedirectToAction(nameof(Login));

        if (user.Role.Name == AppRoles.Customer)
        {
            var customer = user.CustomerId.HasValue
                ? await _db.Customers.FindAsync(user.CustomerId)
                : null;

            var orderStats = user.CustomerId.HasValue
                ? await _db.Sales.Where(s => s.CustomerId == user.CustomerId)
                    .GroupBy(_ => 1)
                    .Select(g => new { Count = g.Count(), Total = g.Sum(s => s.TotalAmount) })
                    .FirstOrDefaultAsync()
                : null;

            ViewData["UseCustomerLayout"] = true;
            return View("ProfileCustomer", new CustomerProfileViewModel
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Username = user.Username,
                Phone = customer?.Phone,
                Address = customer?.Address,
                OrderCount = orderStats?.Count ?? 0,
                TotalSpent = orderStats?.Total ?? 0
            });
        }

        return View(new ProfileViewModel
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Username = user.Username
        });
    }

    [Authorize(Roles = $"{AppRoles.Admin},{AppRoles.Staff},{AppRoles.Customer}")]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Profile(ProfileViewModel model)
    {
        if (!ModelState.IsValid)
        {
            if (User.IsInRole(AppRoles.Customer) && model is CustomerProfileViewModel cpFail)
            {
                ViewData["UseCustomerLayout"] = true;
                if (cpFail.OrderCount == 0 && cpFail.TotalSpent == 0)
                    await EnrichCustomerProfileAsync(cpFail);
                return View("ProfileCustomer", cpFail);
            }
            return View(model);
        }

        var user = await GetCurrentUserAsync();
        if (user == null) return RedirectToAction(nameof(Login));

        user.FullName = model.FullName;
        user.Email = model.Email;
        if (!string.IsNullOrWhiteSpace(model.NewPassword))
            user.PasswordHash = PasswordHelper.Hash(user, model.NewPassword);

        if (user.CustomerId.HasValue)
        {
            var customer = await _db.Customers.FindAsync(user.CustomerId);
            if (customer != null)
            {
                customer.Name = model.FullName;
                customer.Email = model.Email;
                if (model is CustomerProfileViewModel customerModel)
                {
                    customer.Phone = customerModel.Phone;
                    customer.Address = customerModel.Address;
                }
            }
        }

        await _db.SaveChangesAsync();
        TempData["Success"] = "Profile updated successfully.";

        if (User.IsInRole(AppRoles.Customer))
            return RedirectToAction(nameof(Profile));

        return RedirectToAction(nameof(Profile));
    }

    [Authorize(Roles = AppRoles.Customer)]
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> ProfileCustomer(CustomerProfileViewModel model) =>
        await Profile(model);

    private async Task EnrichCustomerProfileAsync(CustomerProfileViewModel model)
    {
        var user = await GetCurrentUserAsync();
        if (user?.CustomerId == null) return;
        var stats = await _db.Sales.Where(s => s.CustomerId == user.CustomerId)
            .GroupBy(_ => 1)
            .Select(g => new { Count = g.Count(), Total = g.Sum(s => s.TotalAmount) })
            .FirstOrDefaultAsync();
        model.OrderCount = stats?.Count ?? 0;
        model.TotalSpent = stats?.Total ?? 0;
    }

    private async Task SignInUserAsync(AppUser user, bool rememberMe)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.GivenName, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.Name)
        };
        if (user.CustomerId.HasValue)
            claims.Add(new Claim("CustomerId", user.CustomerId.Value.ToString()));

        var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity),
            new AuthenticationProperties
            {
                IsPersistent = rememberMe,
                ExpiresUtc = rememberMe ? DateTimeOffset.UtcNow.AddDays(14) : DateTimeOffset.UtcNow.AddHours(8)
            });
    }

    private async Task<AppUser?> GetCurrentUserAsync()
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            return null;
        return await _db.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
    }
}
