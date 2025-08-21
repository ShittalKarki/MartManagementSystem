using MartInventory.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.Sqlite;

namespace MartInventory.Api.Data
{
    public static class DbInitializer
    {
        public static async Task InitializeAsync(ApplicationDbContext context, UserManager<AppUser> userManager, RoleManager<Role> roleManager)
        {
            // Apply migrations for relational providers (SQL Server/SQLite/MySQL).
            if (context.Database.IsRelational())
            {
                if (context.Database.IsSqlite() && await NeedsSqliteResetAsync(context))
                {
                    await context.Database.EnsureDeletedAsync();
                }

                await context.Database.MigrateAsync();
            }
            else
            {
                await context.Database.EnsureCreatedAsync();
            }

            // Seed roles
            var roles = new[] { "Admin", "Staff", "Customer" };
            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new Role { Name = role });
                }
            }

            // Seed admin user
            const string adminEmail = "admin@mart.local";
            var admin = await userManager.FindByEmailAsync(adminEmail);
            if (admin == null)
            {
                admin = new AppUser
                {
                    UserName = adminEmail,
                    Email = adminEmail,
                    EmailConfirmed = true,
                    FullName = "System Admin"
                };
                var result = await userManager.CreateAsync(admin, "P@ssw0rd!23");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(admin, "Admin");
                }
            }

            const string staffEmail = "staff@mart.local";
            var staff = await userManager.FindByEmailAsync(staffEmail);
            if (staff == null)
            {
                staff = new AppUser
                {
                    UserName = staffEmail,
                    Email = staffEmail,
                    EmailConfirmed = true,
                    FullName = "Store Staff"
                };

                var result = await userManager.CreateAsync(staff, "P@ssw0rd!23");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(staff, "Staff");
                }
            }

            const string customerEmail = "customer@mart.local";
            var customerUser = await userManager.FindByEmailAsync(customerEmail);
            if (customerUser == null)
            {
                customerUser = new AppUser
                {
                    UserName = customerEmail,
                    Email = customerEmail,
                    EmailConfirmed = true,
                    FullName = "Demo Customer"
                };

                var result = await userManager.CreateAsync(customerUser, "P@ssw0rd!23");
                if (result.Succeeded)
                {
                    await userManager.AddToRoleAsync(customerUser, "Customer");
                }
            }

            // Seed demo categories and products if empty
            if (!await context.Categories.AnyAsync())
            {
                var cat1 = new Category { Name = "Beverages", Description = "Drinks and beverages" };
                var cat2 = new Category { Name = "Groceries", Description = "Grocery items" };
                context.Categories.AddRange(cat1, cat2);
                await context.SaveChangesAsync();

                context.Products.AddRange(
                    new Product { Sku = "BEV-001", Name = "Mineral Water", Unit = "bottle", PurchasePrice = 20, SellingPrice = 30, StockOnHand = 150, ReorderLevel = 20, CategoryId = cat1.Id },
                    new Product { Sku = "GRC-001", Name = "Cooking Oil 1L", Unit = "bottle", PurchasePrice = 200, SellingPrice = 250, StockOnHand = 80, ReorderLevel = 10, CategoryId = cat2.Id }
                );

                await context.SaveChangesAsync();
            }

            if (!await context.Vendors.AnyAsync())
            {
                context.Vendors.AddRange(
                    new Vendor
                    {
                        Name = "Everest Distributors",
                        ContactPerson = "Rajan Shah",
                        Phone = "9800000001",
                        Email = "sales@everestdist.local",
                        Address = "Kathmandu"
                    },
                    new Vendor
                    {
                        Name = "Himal Traders",
                        ContactPerson = "Anita KC",
                        Phone = "9800000002",
                        Email = "contact@himaltraders.local",
                        Address = "Lalitpur"
                    });
                await context.SaveChangesAsync();
            }

            if (!await context.Customers.AnyAsync())
            {
                context.Customers.AddRange(
                    new Customer { Name = "Walk-in Preferred", Phone = "9800000010", Email = "walkin@demo.local" },
                    new Customer { Name = "Aarav Store", Phone = "9800000011", Email = "aarav@demo.local" }
                );
                await context.SaveChangesAsync();
            }

            if (!await context.PurchaseOrders.AnyAsync())
            {
                var firstProduct = await context.Products.OrderBy(x => x.Id).FirstAsync();
                var firstVendor = await context.Vendors.OrderBy(x => x.Id).FirstAsync();

                var purchase = new PurchaseOrder
                {
                    OrderedAt = DateTime.UtcNow.AddDays(-2),
                    VendorId = firstVendor.Id,
                    InvoiceNumber = $"PO-SEED-{DateTime.UtcNow:yyyyMMdd}",
                    Lines = new List<PurchaseOrderLine>
                    {
                        new()
                        {
                            ProductId = firstProduct.Id,
                            Quantity = 20,
                            UnitPrice = firstProduct.PurchasePrice,
                            LineTotal = 20 * firstProduct.PurchasePrice
                        }
                    }
                };

                purchase.TotalAmount = purchase.Lines.Sum(x => x.LineTotal);
                context.PurchaseOrders.Add(purchase);

                firstProduct.StockOnHand += 20;
                context.StockMovements.Add(new StockMovement
                {
                    ProductId = firstProduct.Id,
                    Quantity = 20,
                    MovementType = StockMovementType.Purchase,
                    PreviousStock = firstProduct.StockOnHand - 20,
                    NewStock = firstProduct.StockOnHand,
                    Reference = purchase.InvoiceNumber,
                    UnitPrice = firstProduct.PurchasePrice,
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                });

                await context.SaveChangesAsync();
            }
        }

        private static async Task<bool> NeedsSqliteResetAsync(ApplicationDbContext context)
        {
            await using var connection = (SqliteConnection)context.Database.GetDbConnection();
            if (connection.State != System.Data.ConnectionState.Open)
            {
                await connection.OpenAsync();
            }

            var hasHistoryTableCmd = connection.CreateCommand();
            hasHistoryTableCmd.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='__EFMigrationsHistory';";
            var hasHistoryTable = Convert.ToInt32(await hasHistoryTableCmd.ExecuteScalarAsync()) > 0;
            if (hasHistoryTable)
            {
                var historyRowsCmd = connection.CreateCommand();
                historyRowsCmd.CommandText = "SELECT COUNT(*) FROM __EFMigrationsHistory;";
                var historyRows = Convert.ToInt32(await historyRowsCmd.ExecuteScalarAsync());
                if (historyRows > 0)
                {
                    return false;
                }
            }

            var hasAnyAppTableCmd = connection.CreateCommand();
            hasAnyAppTableCmd.CommandText = "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('AspNetRoles','AspNetUsers','Products','Categories');";
            var hasAnyAppTable = Convert.ToInt32(await hasAnyAppTableCmd.ExecuteScalarAsync()) > 0;

            return hasAnyAppTable;
        }
    }

}




