using MartManagementSystem.Data;
using MartManagementSystem.Models;
using MartManagementSystem.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();

// Use SQL Server instead of InMemory
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Register custom services
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ICustomerService, CustomerService>();
builder.Services.AddScoped<IOrderService, OrderService>();

var app = builder.Build();

// Auto-create database and seed data
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ApplicationDbContext>();
        context.Database.EnsureCreated();

        // Seed products
        if (!context.Products.Any())
        {
            context.Products.AddRange(
                new Product { Name = "Premium Coffee Beans", Price = 18.50m, Stock = 45 },
                new Product { Name = "Organic Green Tea", Price = 7.20m, Stock = 8 },
                new Product { Name = "Whole Wheat Bread", Price = 3.49m, Stock = 20 },
                new Product { Name = "Greek Yogurt (1kg)", Price = 5.99m, Stock = 15 },
                new Product { Name = "Almond Milk 1L", Price = 4.25m, Stock = 5 }
            );
        }

        // Seed customers
        if (!context.Customers.Any())
        {
            context.Customers.AddRange(
                new Customer { FullName = "John Doe", Email = "john.doe@example.com" },
                new Customer { FullName = "Jane Smith", Email = "jane.smith@example.com" },
                new Customer { FullName = "Michael Brown", Email = "michael.b@example.com" }
            );
        }

        context.SaveChanges();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred seeding the DB.");
    }
}

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
}
app.UseStaticFiles();
app.UseRouting();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
