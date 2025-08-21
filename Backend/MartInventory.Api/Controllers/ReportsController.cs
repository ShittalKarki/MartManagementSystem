using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ReportsController : ControllerBase
	{
		private readonly AppDbContext _db;

		public ReportsController(AppDbContext db)
		{
			_db = db;
		}

		[HttpGet("purchases/daily")]
		public async Task<ActionResult<DailyPurchasesReport>> GetDailyPurchasesReport([FromQuery] DateTime? date)
		{
			var reportDate = date ?? DateTime.Today;
			var startDate = reportDate.Date;
			var endDate = startDate.AddDays(1);

			var purchases = await _db.PurchaseOrders
				.Include(p => p.Lines)
				.ThenInclude(l => l.Product)
				.Where(p => p.PurchasedAt >= startDate && p.PurchasedAt < endDate)
				.ToListAsync();

			var report = new DailyPurchasesReport
			{
				Date = reportDate,
				TotalPurchases = purchases.Sum(p => p.TotalAmount),
				TotalOrders = purchases.Count,
				TotalItems = purchases.Sum(p => p.Lines.Sum(l => l.Quantity)),
				CategoryPurchases = purchases
					.SelectMany(p => p.Lines)
					.GroupBy(l => l.Product.CategoryId)
					.Select(g => new CategoryPurchases
					{
						CategoryId = g.Key,
						CategoryName = g.First().Product.Category.Name,
						TotalPurchases = g.Sum(l => l.LineTotal)
					})
					.ToList()
			};

			return report;
		}

		[HttpGet("stock/low")]
		public async Task<ActionResult<LowStockReport>> GetLowStockReport()
		{
			var lowStockProducts = await _db.Products
				.Include(p => p.Category)
				.Where(p => p.StockOnHand <= p.ReorderLevel)
				.ToListAsync();

			var report = new LowStockReport
			{
				GeneratedAt = DateTime.Now,
				TotalLowStockItems = lowStockProducts.Count,
				LowStockProducts = lowStockProducts.Select(p => new LowStockProduct
				{
					ProductId = p.Id,
					ProductName = p.Name,
					CategoryId = p.CategoryId,
					CategoryName = p.Category.Name,
					CurrentStock = p.StockOnHand,
					ReorderLevel = p.ReorderLevel,
					RequiredQuantity = p.ReorderLevel - p.StockOnHand
				}).ToList()
			};

			return report;
		}

		[HttpGet("sales/daily")]
		public async Task<ActionResult<DailySalesReport>> GetDailySalesReport([FromQuery] DateTime? date)
		{
			var reportDate = date ?? DateTime.Today;
			var startDate = reportDate.Date;
			var endDate = startDate.AddDays(1);

			var sales = await _db.SalesOrders
				.Include(s => s.Lines)
				.ThenInclude(l => l.Product)
				.Where(s => s.SoldAt >= startDate && s.SoldAt < endDate)
				.ToListAsync();

			var report = new DailySalesReport
			{
				Date = reportDate,
				TotalSales = sales.Sum(s => s.TotalAmount),
				TotalOrders = sales.Count,
				TotalItems = sales.Sum(s => s.Lines.Sum(l => l.Quantity)),
				TotalDiscount = sales.Sum(s => s.DiscountAmount),
				TotalVat = sales.Sum(s => s.VatAmount),
				CategorySales = sales
					.SelectMany(s => s.Lines)
					.GroupBy(l => l.Product.CategoryId)
					.Select(g => new CategorySales
					{
						CategoryId = g.Key,
						CategoryName = g.First().Product.Category.Name,
						TotalSales = g.Sum(l => l.LineTotal)
					})
					.ToList()
			};

			return report;
		}

		[HttpGet("stock")]
		public async Task<ActionResult<StockReport>> GetStockReport([FromQuery] int? categoryId)
		{
			var query = _db.Products.AsQueryable();

			if (categoryId.HasValue)
			{
				query = query.Where(p => p.CategoryId == categoryId.Value);
			}

			var products = await query
				.Include(p => p.Category)
				.ToListAsync();

			var report = new StockReport
			{
				GeneratedAt = DateTime.Now,
				TotalProducts = products.Count,
				TotalStock = products.Sum(p => p.StockOnHand),
				TotalStockValue = products.Sum(p => p.StockOnHand * p.PurchasePrice),
				LowStockItems = products.Where(p => p.StockOnHand <= p.ReorderLevel).Count(),
				CategoryStock = products
					.GroupBy(p => p.CategoryId)
					.Select(g => new CategoryStock
					{
						CategoryId = g.Key,
						CategoryName = g.First().Category.Name,
						TotalItems = g.Count(),
						TotalStock = g.Sum(p => p.StockOnHand),
						TotalValue = g.Sum(p => p.StockOnHand * p.PurchasePrice)
					})
					.ToList()
			};

			return report;
		}
	}

	public class DailyPurchasesReport
	{
		public DateTime Date { get; set; }
		public decimal TotalPurchases { get; set; }
		public int TotalOrders { get; set; }
		public int TotalItems { get; set; }
		public List<CategoryPurchases> CategoryPurchases { get; set; } = new();
	}

	public class CategoryPurchases
	{
		public int CategoryId { get; set; }
		public string CategoryName { get; set; } = string.Empty;
		public decimal TotalPurchases { get; set; }
	}

	public class LowStockReport
	{
		public DateTime GeneratedAt { get; set; }
		public int TotalLowStockItems { get; set; }
		public List<LowStockProduct> LowStockProducts { get; set; } = new();
	}

	public class LowStockProduct
	{
		public int ProductId { get; set; }
		public string ProductName { get; set; } = string.Empty;
		public int CategoryId { get; set; }
		public string CategoryName { get; set; } = string.Empty;
		public int CurrentStock { get; set; }
		public int ReorderLevel { get; set; }
		public int RequiredQuantity { get; set; }
	}

	public class DailySalesReport
	{
		public DateTime Date { get; set; }
		public decimal TotalSales { get; set; }
		public int TotalOrders { get; set; }
		public int TotalItems { get; set; }
		public decimal TotalDiscount { get; set; }
		public decimal TotalVat { get; set; }
		public List<CategorySales> CategorySales { get; set; } = new();
	}

	public class CategorySales
	{
		public int CategoryId { get; set; }
		public string CategoryName { get; set; } = string.Empty;
		public decimal TotalSales { get; set; }
	}

	public class StockReport
	{
		public DateTime GeneratedAt { get; set; }
		public int TotalProducts { get; set; }
		public int TotalStock { get; set; }
		public decimal TotalStockValue { get; set; }
		public int LowStockItems { get; set; }
		public List<CategoryStock> CategoryStock { get; set; } = new();
	}

	public class CategoryStock
	{
		public int CategoryId { get; set; }
		public string CategoryName { get; set; } = string.Empty;
		public int TotalItems { get; set; }
		public int TotalStock { get; set; }
		public decimal TotalValue { get; set; }
	}
}