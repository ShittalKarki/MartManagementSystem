// MartMS
namespace MartManagement.Web.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext db, IConfiguration config, ILogger logger)
    {
        await db.Database.MigrateAsync();

        Role? adminRole = null, staffRole = null, customerRole = null;

        if (!await db.Roles.AnyAsync())
        {
            adminRole = new Role { Name = AppRoles.Admin };
            staffRole = new Role { Name = AppRoles.Staff };
            customerRole = new Role { Name = AppRoles.Customer };
            db.Roles.AddRange(adminRole, staffRole, customerRole);
            await db.SaveChangesAsync();
        }
        else
        {
            adminRole = await db.Roles.FirstAsync(r => r.Name == AppRoles.Admin);
            staffRole = await db.Roles.FirstAsync(r => r.Name == AppRoles.Staff);
            customerRole = await db.Roles.FirstOrDefaultAsync(r => r.Name == AppRoles.Customer);
            if (customerRole == null)
            {
                customerRole = new Role { Name = AppRoles.Customer };
                db.Roles.Add(customerRole);
                await db.SaveChangesAsync();
            }
        }

        if (!await db.Users.AnyAsync(u => u.Username == "admin"))
        {
            var adminUser = new AppUser
            {
                Username = "admin",
                Email = "admin@mart.local",
                FullName = "System Administrator",
                RoleId = adminRole!.Id,
                IsActive = true
            };
            adminUser.PasswordHash = PasswordHelper.Hash(adminUser, "Admin@123");
            db.Users.Add(adminUser);
        }

        if (!await db.Users.AnyAsync(u => u.Username == "staff"))
        {
            var staffUser = new AppUser
            {
                Username = "staff",
                Email = "staff@mart.local",
                FullName = "Store Staff",
                RoleId = staffRole!.Id,
                IsActive = true
            };
            staffUser.PasswordHash = PasswordHelper.Hash(staffUser, "Staff@123");
            db.Users.Add(staffUser);
        }

        if (!await db.Users.AnyAsync(u => u.Username == "customer"))
        {
            var customerRecord = new Customer
            {
                Name = "Demo Customer",
                Email = "customer@mart.local",
                Phone = "9800000000",
                Address = "Kathmandu"
            };
            db.Customers.Add(customerRecord);
            await db.SaveChangesAsync();

            var customerUser = new AppUser
            {
                Username = "customer",
                Email = "customer@mart.local",
                FullName = "Demo Customer",
                RoleId = customerRole!.Id,
                CustomerId = customerRecord.Id,
                IsActive = true
            };
            customerUser.PasswordHash = PasswordHelper.Hash(customerUser, "Customer@123");
            db.Users.Add(customerUser);
            await db.SaveChangesAsync();
        }

        await db.SaveChangesAsync();

        if (await db.Products.AnyAsync())
            return;

        logger.LogInformation("Seeding sample catalog data (empty database).");

        var catGrocery = new Category { Name = "Grocery", Description = "Daily essentials" };
        var catBeverage = new Category { Name = "Beverages", Description = "Drinks" };
        var catCare = new Category { Name = "Personal Care", Description = "Hygiene items" };
        db.Categories.AddRange(catGrocery, catBeverage, catCare);
        await db.SaveChangesAsync();

        db.Suppliers.Add(new Supplier { Name = "Main Supplier", Phone = "9801111111" });
        db.Customers.Add(new Customer { Name = "Walk-in Customer", Phone = "N/A" });

        db.Products.AddRange(
            new Product { Sku = "GRO-001", Name = "Basmati Rice 5kg", CategoryId = catGrocery.Id, PurchasePrice = 650, SellingPrice = 780, StockQuantity = 40, ReorderLevel = 10, Unit = "bag" },
            new Product { Sku = "GRO-002", Name = "Sunflower Oil 1L", CategoryId = catGrocery.Id, PurchasePrice = 180, SellingPrice = 220, StockQuantity = 50, ReorderLevel = 15, Unit = "bottle" },
            new Product { Sku = "BEV-001", Name = "Mineral Water 1L", CategoryId = catBeverage.Id, PurchasePrice = 15, SellingPrice = 25, StockQuantity = 100, ReorderLevel = 20, Unit = "bottle" },
            new Product { Sku = "BEV-002", Name = "Orange Juice 1L", CategoryId = catBeverage.Id, PurchasePrice = 90, SellingPrice = 115, StockQuantity = 30, ReorderLevel = 10, Unit = "pack" },
            new Product { Sku = "PC-001", Name = "Herbal Soap", CategoryId = catCare.Id, PurchasePrice = 35, SellingPrice = 50, StockQuantity = 60, ReorderLevel = 15, Unit = "pcs" },
            new Product { Sku = "PC-002", Name = "Toothpaste", CategoryId = catCare.Id, PurchasePrice = 80, SellingPrice = 110, StockQuantity = 8, ReorderLevel = 12, Unit = "pcs" }
        );
        await db.SaveChangesAsync();
    }
}
