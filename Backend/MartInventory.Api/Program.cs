using MartInventory.Api.Data;
using MartInventory.Api.Hubs;
using MartInventory.Api.Models;
using MartInventory.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Npgsql;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

var useMySql = builder.Configuration.GetValue<bool>("UseMySql");
var useInMemoryDatabase = builder.Configuration.GetValue<bool>("UseInMemoryDatabase");
var mysql = builder.Configuration.GetConnectionString("MySql");
var neonConnection = builder.Configuration.GetConnectionString("Neon")
	?? Environment.GetEnvironmentVariable("DATABASE_URL")
	?? builder.Configuration["DatabaseUrl"];

builder.Services.AddOpenApi();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
	if (!string.IsNullOrWhiteSpace(neonConnection))
	{
		options.UseNpgsql(NormalizePostgresConnectionString(neonConnection));
	}
	else
	if (useMySql && !string.IsNullOrWhiteSpace(mysql))
	{
		options.UseMySql(mysql, ServerVersion.AutoDetect(mysql));
	}
	else if (useInMemoryDatabase)
	{
		var dbPath = Path.Combine(builder.Environment.ContentRootPath, "mart.db");
		options.UseSqlite($"Data Source={dbPath}");
	}
	else
	{
		options.UseSqlServer(builder.Configuration.GetConnectionString("Default"));
	}
});

builder.Services.AddIdentity<AppUser, Role>(options =>
{
	options.Password.RequireDigit = true;
	options.Password.RequiredLength = 8;
	options.Password.RequireNonAlphanumeric = false;
	options.Password.RequireUppercase = true;
	options.User.RequireUniqueEmail = true;
})
	.AddEntityFrameworkStores<ApplicationDbContext>()
	.AddDefaultTokenProviders();

builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.AddScoped<JwtTokenService>();

var jwtKey = builder.Configuration["Jwt:Key"] ?? "DevelopmentOnlyFallbackKey_ChangeMe_1234567890";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "MartInventory.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "MartInventory.Client";

builder.Services.AddAuthentication(options =>
{
	options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
	options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
	.AddJwtBearer(options =>
	{
		options.RequireHttpsMetadata = false;
		options.SaveToken = true;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = jwtIssuer,
			ValidAudience = jwtAudience,
			IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
			ClockSkew = TimeSpan.Zero,
			RoleClaimType = System.Security.Claims.ClaimTypes.Role,
			NameClaimType = System.Security.Claims.ClaimTypes.Name
		};
	});

builder.Services.AddAuthorization();

builder.Services.ConfigureApplicationCookie(opts =>
{
	opts.LoginPath = "/Account/Login";
	opts.AccessDeniedPath = "/Account/AccessDenied";
	opts.Cookie.HttpOnly = true;
	opts.ExpireTimeSpan = TimeSpan.FromDays(14);
});

builder.Services.AddScoped<InventoryService>();
builder.Services.AddSignalR();
builder.Services.AddControllersWithViews();
builder.Services.AddCors(options =>
{
	options.AddPolicy("Frontend", policy =>
		policy.WithOrigins("http://localhost:5173")
			.AllowAnyHeader()
			.AllowAnyMethod()
			.AllowCredentials());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}
else
{
	app.UseExceptionHandler("/Account/AccessDenied");
}

using (var scope = app.Services.CreateScope())
{
	var services = scope.ServiceProvider;
	var db = services.GetRequiredService<ApplicationDbContext>();
	var userManager = services.GetRequiredService<UserManager<AppUser>>();
	var roleManager = services.GetRequiredService<RoleManager<Role>>();

	await DbInitializer.InitializeAsync(db, userManager, roleManager);
}

app.UseCors("Frontend");
app.UseStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
	name: "default",
	pattern: "{controller=Dashboard}/{action=Index}/{id?}");

app.MapControllers();
app.MapHub<InventoryHub>("/hubs/inventory");

app.Run();

static string NormalizePostgresConnectionString(string connectionString)
{
	if (!connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase) &&
		!connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase))
	{
		return connectionString;
	}

	var uri = new Uri(connectionString);
	var builder = new NpgsqlConnectionStringBuilder
	{
		Host = uri.Host,
		Port = uri.IsDefaultPort ? 5432 : uri.Port,
		Database = uri.AbsolutePath.Trim('/'),
		Username = Uri.UnescapeDataString(uri.UserInfo.Split(':', 2)[0]),
		Password = uri.UserInfo.Contains(':')
			? Uri.UnescapeDataString(uri.UserInfo.Split(':', 2)[1])
			: string.Empty,
		SslMode = SslMode.Require,
		Pooling = true,
		IncludeErrorDetail = true
	};

	return builder.ConnectionString;
}
