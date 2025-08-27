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
		private readonly ApplicationDbContext _db;

		private static DateTime EnsureUtc(DateTime dt) => dt.Kind == DateTimeKind.Utc ? dt : DateTime.SpecifyKind(dt, DateTimeKind.Utc);

		public ReportsController(ApplicationDbContext db)
		{
			_db = db;
		}

		[HttpGet("purchases/daily")]
		public async Task<ActionResult<DailyPurchasesReport>> GetDailyPurchasesReport([FromQuery] DateTime? date)
		{
			var reportDate = date ?? DateTime.UtcNow.Date;
			var startDate = EnsureUtc(reportDate.Date);
			var endDate = EnsureUtc(startDate.AddDays(1));

			var purchases = await _db.PurchaseOrders
				.Include(p => p.Lines)
				.ThenInclude(l => l.Product)
				.ThenInclude(p => p.Category)
				.Where(p => p.OrderedAt >= startDate && p.OrderedAt < endDate)
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
				GeneratedAt = DateTime.UtcNow,
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
			var reportDate = date ?? DateTime.UtcNow.Date;
			var startDate = EnsureUtc(reportDate.Date);
			var endDate = EnsureUtc(startDate.AddDays(1));

			var sales = await _db.SalesOrders
				.Include(s => s.Lines)
				.ThenInclude(l => l.Product)
				.ThenInclude(p => p.Category)
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
				GeneratedAt = DateTime.UtcNow,
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

		[HttpGet("sales/summary")]
		public async Task<ActionResult<SalesSummaryReport>> GetSalesSummary(
			[FromQuery] DateTime? start,
			[FromQuery] DateTime? end,
			[FromQuery] int? productId,
			[FromQuery] int? customerId)
		{
			var startDate = EnsureUtc((start ?? DateTime.UtcNow.AddDays(-6)).Date);
			var endDate = EnsureUtc(((end ?? DateTime.UtcNow).Date).AddDays(1));

			var query = _db.SalesOrders
				.Include(s => s.Customer)
				.Include(s => s.Lines)
					.ThenInclude(l => l.Product)
					.ThenInclude(p => p.Category)
				.Where(s => s.SoldAt >= startDate && s.SoldAt < endDate)
				.AsQueryable();

			if (customerId.HasValue)
				query = query.Where(s => s.CustomerId == customerId);

			if (productId.HasValue)
				query = query.Where(s => s.Lines.Any(l => l.ProductId == productId));

			var sales = await query.ToListAsync();

			var details = sales.SelectMany(s => s.Lines.Select(l => new SalesDetailRow
			{
				Date = s.SoldAt,
				InvoiceNumber = s.InvoiceNumber,
				CustomerName = s.Customer != null ? s.Customer.Name : "Walk-in",
				ProductId = l.ProductId,
				ProductName = l.Product.Name,
				CategoryName = l.Product.Category.Name,
				Quantity = l.Quantity,
				UnitPrice = l.UnitPrice,
				DiscountPercent = l.DiscountPercent,
				LineTotal = l.LineTotal
			})).ToList();

			var report = new SalesSummaryReport
			{
				StartDate = startDate,
				EndDate = endDate.AddDays(-1),
				TotalOrders = sales.Count,
				TotalItems = details.Sum(d => d.Quantity),
				Subtotal = sales.Sum(s => s.Subtotal),
				TotalDiscount = sales.Sum(s => s.DiscountAmount),
				TotalVat = sales.Sum(s => s.VatAmount),
				TotalSales = sales.Sum(s => s.TotalAmount),
				Details = details
			};

			return report;
		}

		[HttpGet("purchases/summary")]
		public async Task<ActionResult<PurchasesSummaryReport>> GetPurchasesSummary(
			[FromQuery] DateTime? start,
			[FromQuery] DateTime? end,
			[FromQuery] int? productId,
			[FromQuery] int? vendorId)
		{
			var startDate = (start ?? DateTime.Today.AddDays(-6)).Date;
			var endDate = (end ?? DateTime.Today).Date.AddDays(1);

			var query = _db.PurchaseOrders
				.Include(p => p.Vendor)
				.Include(p => p.Lines)
					.ThenInclude(l => l.Product)
					.ThenInclude(p => p.Category)
				.Where(p => p.OrderedAt >= startDate && p.OrderedAt < endDate)
				.AsQueryable();

			if (vendorId.HasValue)
				query = query.Where(p => p.VendorId == vendorId);

			if (productId.HasValue)
				query = query.Where(p => p.Lines.Any(l => l.ProductId == productId));

			var purchases = await query.ToListAsync();

			var details = purchases.SelectMany(p => p.Lines.Select(l => new PurchaseDetailRow
			{
				Date = p.OrderedAt,
				InvoiceNumber = p.InvoiceNumber,
				VendorName = p.Vendor.Name,
				ProductId = l.ProductId,
				ProductName = l.Product.Name,
				CategoryName = l.Product.Category.Name,
				Quantity = l.Quantity,
				UnitPrice = l.UnitPrice,
				LineTotal = l.LineTotal
			})).ToList();

			var report = new PurchasesSummaryReport
			{
				StartDate = startDate,
				EndDate = endDate.AddDays(-1),
				TotalOrders = purchases.Count,
				TotalItems = details.Sum(d => d.Quantity),
				TotalPurchases = purchases.Sum(p => p.TotalAmount),
				Details = details
			};

			return report;
		}

		[HttpGet("profit/summary")]
		public async Task<ActionResult<ProfitSummaryReport>> GetProfitSummary(
			[FromQuery] DateTime? start,
			[FromQuery] DateTime? end)
		{
			var startDate = (start ?? DateTime.Today.AddDays(-6)).Date;
			var endDate = (end ?? DateTime.Today).Date.AddDays(1);

			var sales = await _db.SalesOrders
				.Include(s => s.Lines)
					.ThenInclude(l => l.Product)
				.Where(s => s.SoldAt >= startDate && s.SoldAt < endDate)
				.ToListAsync();

			var revenue = sales.Sum(s => s.TotalAmount);
			var cogs = sales.SelectMany(s => s.Lines)
				.Sum(l => l.Quantity * l.Product.PurchasePrice);

			var report = new ProfitSummaryReport
			{
				StartDate = startDate,
				EndDate = endDate.AddDays(-1),
				Revenue = revenue,
				CostOfGoodsSold = cogs,
				GrossProfit = revenue - cogs
			};

			return report;
		}

		[HttpGet("sales/csv")]
		public async Task<IActionResult> DownloadSalesCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int? productId, [FromQuery] int? customerId)
		{
			var summary = await GetSalesSummary(start, end, productId, customerId);
			var data = summary.Value!;
			var csv = new System.Text.StringBuilder();
			csv.AppendLine("Date,Invoice,Customer,Product,Category,Quantity,UnitPrice,DiscountPercent,LineTotal");
			foreach (var d in data.Details)
			{
				csv.AppendLine(string.Join(',',
					Escape(d.Date.ToString("yyyy-MM-dd")),
					Escape(d.InvoiceNumber),
					Escape(d.CustomerName),
					Escape(d.ProductName),
					Escape(d.CategoryName),
					d.Quantity.ToString(),
					d.UnitPrice.ToString("0.##"),
					d.DiscountPercent.ToString("0.##"),
					d.LineTotal.ToString("0.##")));
			}
			return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"sales_{data.StartDate:yyyyMMdd}_{data.EndDate:yyyyMMdd}.csv");
		}

		[HttpGet("purchases/csv")]
		public async Task<IActionResult> DownloadPurchasesCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end, [FromQuery] int? productId, [FromQuery] int? vendorId)
		{
			var summary = await GetPurchasesSummary(start, end, productId, vendorId);
			var data = summary.Value!;
			var csv = new System.Text.StringBuilder();
			csv.AppendLine("Date,Invoice,Vendor,Product,Category,Quantity,UnitPrice,LineTotal");
			foreach (var d in data.Details)
			{
				csv.AppendLine(string.Join(',',
					Escape(d.Date.ToString("yyyy-MM-dd")),
					Escape(d.InvoiceNumber),
					Escape(d.VendorName),
					Escape(d.ProductName),
					Escape(d.CategoryName),
					d.Quantity.ToString(),
					d.UnitPrice.ToString("0.##"),
					d.LineTotal.ToString("0.##")));
			}
			return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"purchases_{data.StartDate:yyyyMMdd}_{data.EndDate:yyyyMMdd}.csv");
		}

		[HttpGet("inventory/csv")]
		public async Task<IActionResult> DownloadInventoryCsv([FromQuery] int? categoryId)
		{
			var report = await GetStockReport(categoryId);
			var data = report.Value!;
			var csv = new System.Text.StringBuilder();
			csv.AppendLine("Category,Product,StockOnHand,ReorderLevel,PurchasePrice,TotalValue");
			var products = await _db.Products.Include(p => p.Category)
				.Where(p => !categoryId.HasValue || p.CategoryId == categoryId.Value)
				.ToListAsync();
			foreach (var p in products)
			{
				var totalValue = p.StockOnHand * p.PurchasePrice;
				csv.AppendLine(string.Join(',',
					Escape(p.Category.Name),
					Escape(p.Name),
					p.StockOnHand.ToString(),
					p.ReorderLevel.ToString(),
					p.PurchasePrice.ToString("0.##"),
					totalValue.ToString("0.##")));
			}
			return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "inventory.csv");
		}

		[HttpGet("profit/csv")]
		public async Task<IActionResult> DownloadProfitCsv([FromQuery] DateTime? start, [FromQuery] DateTime? end)
		{
			var summary = await GetProfitSummary(start, end);
			var data = summary.Value!;
			var csv = new System.Text.StringBuilder();
			csv.AppendLine("StartDate,EndDate,Revenue,COGS,GrossProfit");
			csv.AppendLine(string.Join(',',
				Escape(data.StartDate.ToString("yyyy-MM-dd")),
				Escape(data.EndDate.ToString("yyyy-MM-dd")),
				data.Revenue.ToString("0.##"),
				data.CostOfGoodsSold.ToString("0.##"),
				data.GrossProfit.ToString("0.##")));
			return File(System.Text.Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", $"profit_{data.StartDate:yyyyMMdd}_{data.EndDate:yyyyMMdd}.csv");
		}

		private static string Escape(string input)
		{
			if (input.Contains(',') || input.Contains('"') || input.Contains('\n'))
			{
				return "\"" + input.Replace("\"", "\"\"") + "\"";
			}
			return input;
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

	public class SalesSummaryReport
	{
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public int TotalOrders { get; set; }
		public int TotalItems { get; set; }
		public decimal Subtotal { get; set; }
		public decimal TotalDiscount { get; set; }
		public decimal TotalVat { get; set; }
		public decimal TotalSales { get; set; }
		public List<SalesDetailRow> Details { get; set; } = new();
	}

	public class SalesDetailRow
	{
		public DateTime Date { get; set; }
		public string InvoiceNumber { get; set; } = string.Empty;
		public string CustomerName { get; set; } = string.Empty;
		public int ProductId { get; set; }
		public string ProductName { get; set; } = string.Empty;
		public string CategoryName { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public decimal DiscountPercent { get; set; }
		public decimal LineTotal { get; set; }
	}

	public class PurchasesSummaryReport
	{
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public int TotalOrders { get; set; }
		public int TotalItems { get; set; }
		public decimal TotalPurchases { get; set; }
		public List<PurchaseDetailRow> Details { get; set; } = new();
	}

	public class PurchaseDetailRow
	{
		public DateTime Date { get; set; }
		public string InvoiceNumber { get; set; } = string.Empty;
		public string VendorName { get; set; } = string.Empty;
		public int ProductId { get; set; }
		public string ProductName { get; set; } = string.Empty;
		public string CategoryName { get; set; } = string.Empty;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public decimal LineTotal { get; set; }
	}

	public class ProfitSummaryReport
	{
		public DateTime StartDate { get; set; }
		public DateTime EndDate { get; set; }
		public decimal Revenue { get; set; }
		public decimal CostOfGoodsSold { get; set; }
		public decimal GrossProfit { get; set; }
	}
}