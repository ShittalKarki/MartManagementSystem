using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Runtime.Intrinsics.X86;

namespace MartInventory.Api.Data
{
	public class AppDbContext : DbContext
	{
		public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

		public DbSet<Product> Products => Set<Product>();
		public DbSet<Category> Categories => Set<Category>();
		public DbSet<StockMovement> StockMovements => Set<StockMovement>();
		public DbSet<Vendor> Vendors => Set<Vendor>();
		public DbSet<Customer> Customers => Set<Customer>();
		public DbSet<PurchaseOrder> PurchaseOrders => Set<PurchaseOrder>();
		public DbSet<PurchaseOrderLine> PurchaseOrderLines => Set<PurchaseOrderLine>();
		public DbSet<SalesOrder> SalesOrders => Set<SalesOrder>();
		public DbSet<SalesOrderLine> SalesOrderLines => Set<SalesOrderLine>();
		public DbSet<InventoryAlert> InventoryAlerts => Set<InventoryAlert>();
		
		// Category hierarchy DbSets
		public DbSet<LineOfBusiness> LinesOfBusiness => Set<LineOfBusiness>();
		public DbSet<Department> Departments => Set<Department>();
		public DbSet<SubDepartment> SubDepartments => Set<SubDepartment>();
		public DbSet<ProductClass> ProductClasses => Set<ProductClass>();
		public DbSet<Subclass> Subclasses => Set<Subclass>();
		public DbSet<Merchandise> Merchandises => Set<Merchandise>();

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Product>().HasIndex(p => p.Sku).IsUnique();
			modelBuilder.Entity<Product>().HasIndex(p => p.Barcode);
			
			// Configure relationships for category hierarchy
			modelBuilder.Entity<Department>()
				.HasOne(d => d.LineOfBusiness)
				.WithMany()
				.HasForeignKey(d => d.LineOfBusinessId);
				
			modelBuilder.Entity<SubDepartment>()
				.HasOne(sd => sd.Department)
				.WithMany()
				.HasForeignKey(sd => sd.DepartmentId);
				
			modelBuilder.Entity<ProductClass>()
				.HasOne(pc => pc.SubDepartment)
				.WithMany()
				.HasForeignKey(pc => pc.SubDepartmentId);
				
			modelBuilder.Entity<Subclass>()
				.HasOne(sc => sc.ProductClass)
				.WithMany()
				.HasForeignKey(sc => sc.ProductClassId);
				
			modelBuilder.Entity<Merchandise>()
				.HasOne(m => m.Subclass)
				.WithMany()
				.HasForeignKey(m => m.SubclassId);
				
			// Configure relationships for orders
			modelBuilder.Entity<PurchaseOrder>()
				.HasOne(po => po.Vendor)
				.WithMany()
				.HasForeignKey(po => po.VendorId);
				
			modelBuilder.Entity<PurchaseOrderLine>()
				.HasOne(pol => pol.PurchaseOrder)
				.WithMany(po => po.Lines)
				.HasForeignKey(pol => pol.PurchaseOrderId);
				
			modelBuilder.Entity<PurchaseOrderLine>()
				.HasOne(pol => pol.Product)
				.WithMany()
				.HasForeignKey(pol => pol.ProductId);
				
			modelBuilder.Entity<SalesOrder>()
				.HasOne(so => so.Customer)
				.WithMany()
				.HasForeignKey(so => so.CustomerId);
				
			modelBuilder.Entity<SalesOrderLine>()
				.HasOne(sol => sol.SalesOrder)
				.WithMany(so => so.Lines)
				.HasForeignKey(sol => sol.SalesOrderId);
				
			modelBuilder.Entity<SalesOrderLine>()
				.HasOne(sol => sol.Product)
				.WithMany()
				.HasForeignKey(sol => sol.ProductId);
				
			// Configure relationships for inventory alerts
			modelBuilder.Entity<InventoryAlert>()
				.HasOne(ia => ia.Product)
				.WithMany()
				.HasForeignKey(ia => ia.ProductId);
				
			// Configure relationships for stock movements
			modelBuilder.Entity<StockMovement>()
				.HasOne(sm => sm.Product)
				.WithMany()
				.HasForeignKey(sm => sm.ProductId);

			base.OnModelCreating(modelBuilder);
		}
	}
}



