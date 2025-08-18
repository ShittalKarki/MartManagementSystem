using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Services
{
	public class InventoryService
	{
		private readonly AppDbContext _db;

		public InventoryService(AppDbContext db)
		{
			_db = db;
		}

		public async Task<PurchaseOrder> CreatePurchaseAsync(PurchaseOrder po)
		{
			foreach (var line in po.Lines)
			{
				var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
				product.StockOnHand += line.Quantity;
				line.LineTotal = line.UnitPrice * line.Quantity;
			}
			po.TotalAmount = po.Lines.Sum(l => l.LineTotal);
			_db.PurchaseOrders.Add(po);
			await _db.SaveChangesAsync();
			await EvaluateAlertsAsync(po.Lines.Select(l => l.ProductId));
			return po;
		}

		public async Task<SalesOrder> CreateSaleAsync(SalesOrder so)
		{
			foreach (var line in so.Lines)
			{
				var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
				product.StockOnHand -= line.Quantity;
				var discountMultiplier = 1m - (line.DiscountPercent / 100m);
				line.LineTotal = Math.Round(line.UnitPrice * line.Quantity * discountMultiplier, 2);
			}
			so.Subtotal = so.Lines.Sum(l => l.UnitPrice * l.Quantity);
			so.TotalAmount = so.Lines.Sum(l => l.LineTotal);
			so.DiscountAmount = so.Subtotal - so.TotalAmount;
			_db.SalesOrders.Add(so);
			await _db.SaveChangesAsync();
			await EvaluateAlertsAsync(so.Lines.Select(l => l.ProductId));
			return so;
		}

		private async Task EvaluateAlertsAsync(IEnumerable<int> productIds)
		{
			var products = await _db.Products.Where(p => productIds.Contains(p.Id)).ToListAsync();
			foreach (var p in products)
			{
				if (p.StockOnHand <= p.ReorderLevel)
				{
					_db.InventoryAlerts.Add(new InventoryAlert
					{
						ProductId = p.Id,
						StockOnHand = p.StockOnHand,
						ReorderLevel = p.ReorderLevel
					});
				}
			}
			await _db.SaveChangesAsync();
		}
	}
}



