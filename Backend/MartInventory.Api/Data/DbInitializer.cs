using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Data
{
	public static class DbInitializer
	{
		public static async Task InitializeAsync(AppDbContext db)
		{
			var created = await db.Database.EnsureCreatedAsync();
			var schemaReady = true;
			try
			{
				_ = db.LinesOfBusiness.Take(1).Any();
			}
			catch
			{
				schemaReady = false;
			}

			if (!created && !schemaReady)
			{
				await db.Database.EnsureDeletedAsync();
				await db.Database.EnsureCreatedAsync();
			}
			if (!db.LinesOfBusiness.Any())
			{
				var lobGrocery = new LineOfBusiness { Name = "Grocery & Food" };
				var lobElectronics = new LineOfBusiness { Name = "Electronics & Appliances" };
				db.LinesOfBusiness.AddRange(lobGrocery, lobElectronics);
				await db.SaveChangesAsync();

				var deptFood = new Department { Name = "Food Items", LineOfBusinessId = lobGrocery.Id };
				var deptPersonal = new Department { Name = "Personal Care", LineOfBusinessId = lobGrocery.Id };
				var deptCleaning = new Department { Name = "Cleaning", LineOfBusinessId = lobGrocery.Id };
				var deptAppliances = new Department { Name = "Appliances", LineOfBusinessId = lobElectronics.Id };
				db.Departments.AddRange(deptFood, deptPersonal, deptCleaning, deptAppliances);
				await db.SaveChangesAsync();

				var subDeptBakery = new SubDepartment { Name = "Bakery", DepartmentId = deptFood.Id };
				var subDeptMeat = new SubDepartment { Name = "Meat & Seafood", DepartmentId = deptFood.Id };
				var subDeptHygiene = new SubDepartment { Name = "Hygiene", DepartmentId = deptPersonal.Id };
				db.SubDepartments.AddRange(subDeptBakery, subDeptMeat, subDeptHygiene);
				await db.SaveChangesAsync();

				var clsBread = new ProductClass { Name = "Bread", SubDepartmentId = subDeptBakery.Id };
				var clsChicken = new ProductClass { Name = "Chicken", SubDepartmentId = subDeptMeat.Id };
				var clsSoap = new ProductClass { Name = "Soap", SubDepartmentId = subDeptHygiene.Id };
				db.ProductClasses.AddRange(clsBread, clsChicken, clsSoap);
				await db.SaveChangesAsync();

				var sclsBrown = new Subclass { Name = "Brown Bread", ProductClassId = clsBread.Id };
				var sclsWhite = new Subclass { Name = "White Bread", ProductClassId = clsBread.Id };
				var sclsBroiler = new Subclass { Name = "Broiler", ProductClassId = clsChicken.Id };
				var sclsBath = new Subclass { Name = "Bath", ProductClassId = clsSoap.Id };
				db.Subclasses.AddRange(sclsBrown, sclsWhite, sclsBroiler, sclsBath);
				await db.SaveChangesAsync();

				var merch1 = new Merchandise { Name = "Whole Wheat Loaf", SubclassId = sclsBrown.Id };
				var merch2 = new Merchandise { Name = "Classic White Loaf", SubclassId = sclsWhite.Id };
				var merch3 = new Merchandise { Name = "Chicken Breast", SubclassId = sclsBroiler.Id };
				var merch4 = new Merchandise { Name = "Herbal Soap", SubclassId = sclsBath.Id };
				db.Merchandises.AddRange(merch1, merch2, merch3, merch4);
				await db.SaveChangesAsync();

				var catBakery = new Category { Name = "Bakery" };
				var catMeat = new Category { Name = "Meat & Seafood" };
				var catPersonal = new Category { Name = "Personal Care" };
				db.Categories.AddRange(catBakery, catMeat, catPersonal);
				await db.SaveChangesAsync();

				db.Products.AddRange(
					new Product { Sku = "BREAD-WHEAT-001", Name = "Whole Wheat Bread", CategoryId = catBakery.Id, MerchandiseId = merch1.Id, PurchasePrice = 60, SellingPrice = 80, StockOnHand = 50, ReorderLevel = 20 },
					new Product { Sku = "BREAD-WHITE-001", Name = "White Bread", CategoryId = catBakery.Id, MerchandiseId = merch2.Id, PurchasePrice = 50, SellingPrice = 70, StockOnHand = 60, ReorderLevel = 20 },
					new Product { Sku = "MEAT-CHICK-001", Name = "Chicken Breast (kg)", Unit = "kg", CategoryId = catMeat.Id, MerchandiseId = merch3.Id, PurchasePrice = 350, SellingPrice = 450, StockOnHand = 30, ReorderLevel = 10 },
					new Product { Sku = "SOAP-HERB-001", Name = "Herbal Soap", CategoryId = catPersonal.Id, MerchandiseId = merch4.Id, PurchasePrice = 30, SellingPrice = 45, StockOnHand = 100, ReorderLevel = 25 }
				);
				await db.SaveChangesAsync();

				db.Vendors.AddRange(
					new Vendor { Name = "Kathmandu Wholesale Foods", Phone = "+977-1-5550000" },
					new Vendor { Name = "Nepal Fresh Meats", Phone = "+977-1-5551111" }
				);
				db.Customers.AddRange(
					new Customer { Name = "Walk-in Customer" }
				);
				await db.SaveChangesAsync();
			}
		}
	}
}



