using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Data
{
	public class AppDbContext : DbContext
	{
		public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

		public DbSet<Product> Products => Set<Product>();
		public DbSet<LineOfBusiness> LinesOfBusiness => Set<LineOfBusiness>();
		public DbSet<Department> Departments => Set<Department>();
		public DbSet<SubDepartment> SubDepartments => Set<SubDepartment>();
		public DbSet<ProductClass> ProductClasses => Set<ProductClass>();
		public DbSet<Subclass> Subclasses => Set<Subclass>();
		public DbSet<Merchandise> Merchandises => Set<Merchandise>();
		public DbSet<Vendor> Vendors => Set<Vendor>();
		public DbSet<Customer> Customers => Set<Customer>();
		public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
		public DbSet<PurchaseOrderLine> PurchaseOrderLines => Set<PurchaseOrderLine>();
		public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
		public DbSet<SalesOrderLine> SalesOrderLines => Set<SalesOrderLine>();
		public DbSet<InventoryAlert> InventoryAlerts => Set<InventoryAlert>();

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Product>().HasIndex(p => p.Sku).IsUnique();
			modelBuilder.Entity<Product>().HasIndex(p => p.Barcode);
			base.OnModelCreating(modelBuilder);
		}
	}
}



