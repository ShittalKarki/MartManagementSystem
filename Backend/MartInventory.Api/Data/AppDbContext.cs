using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;

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

		protected override void OnModelCreating(ModelBuilder modelBuilder)
		{
			modelBuilder.Entity<Product>().HasIndex(p => p.Sku).IsUnique();
			modelBuilder.Entity<Product>().HasIndex(p => p.Barcode);
			base.OnModelCreating(modelBuilder);
		}
	}
}



