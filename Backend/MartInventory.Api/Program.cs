using MartInventory.Api.Data;
using MartInventory.Api.Hubs;
using MartInventory.Api.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("Default") ?? "Data Source=mart.db"));
builder.Services.AddScoped<InventoryService>();
builder.Services.AddSignalR();
builder.Services.AddControllers();
builder.Services.AddRazorPages();
builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowAll", policy =>
		policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
	app.MapOpenApi();
}

app.UseCors("AllowAll");

// Serve static files from the frontend directory
var frontendPath = Path.GetFullPath(Path.Combine(builder.Environment.ContentRootPath, "..", "frontend"));
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(frontendPath),
    RequestPath = ""
});

// Also serve static files from wwwroot if it exists
app.UseStaticFiles();

app.MapControllers();
app.MapRazorPages();
app.MapGet("/", context => {
    context.Response.Redirect("/login.html");
    return Task.CompletedTask;
});
app.MapHub<InventoryHub>("/hubs/inventory");

using (var scope = app.Services.CreateScope())
{
	var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
	await DbInitializer.InitializeAsync(db);
}

app.Run();
