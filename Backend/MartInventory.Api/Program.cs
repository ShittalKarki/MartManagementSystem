using MartInventory.Api.Data;
using MartInventory.Api.Hubs;
using MartInventory.Api.Services;
using Microsoft.EntityFrameworkCore;
using MySql.EntityFrameworkCore.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Server=localhost;Database=mart_management_system;Uid=root;Pwd=your_password_here;";
    options.UseMySQL(connectionString);
});
builder.Services.AddScoped<InventoryService>();
builder.Services.AddSignalR();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowAll", policy =>
		policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowAll");
app.MapControllers();
app.MapHub<InventoryHub>("/hubs/inventory");

// Only initialize the database when not running migrations
if (args.Length == 0 || !args.Contains("--migrate"))
{
	using (var scope = app.Services.CreateScope())
	{
		var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
		await DbInitializer.InitializeAsync(db);
	}
}

app.Run();
