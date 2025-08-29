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
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				foreach (var line in po.Lines)
				{
					var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
					line.LineTotal = line.UnitPrice * line.Quantity;

					_db.StockMovements.Add(new StockMovement
					{
						ProductId = line.ProductId,
						Quantity = line.Quantity,
						MovementType = StockMovementType.Purchase,
						PreviousStock = product.StockOnHand,
						NewStock = product.StockOnHand + line.Quantity,
						Reference = po.InvoiceNumber,
						UnitPrice = line.UnitPrice
					});

					product.StockOnHand += line.Quantity;
				}

				po.TotalAmount = po.Lines.Sum(l => l.LineTotal);
				_db.PurchaseOrders.Add(po);
				await _db.SaveChangesAsync();
				await EvaluateAlertsAsync(po.Lines.Select(l => l.ProductId));
				await transaction.CommitAsync();
				return po;
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		public async Task<SalesOrder> CreateSaleAsync(SalesOrder so)
		{
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				if (so.SoldAt == default)
					so.SoldAt = DateTime.UtcNow;

				so.CustomerId = await ResolveCustomerIdAsync(so.CustomerName);

				foreach (var line in so.Lines)
				{
					await ApplySaleLineAsync(line, so.InvoiceNumber);
				}

				CalculateSaleTotals(so);
				_db.SalesOrders.Add(so);
				await _db.SaveChangesAsync();
				await EvaluateAlertsAsync(so.Lines.Select(l => l.ProductId));
				await transaction.CommitAsync();
				return so;
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		public async Task<SalesOrder> UpdateSaleAsync(int id, SalesOrder updated)
		{
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				var existing = await _db.SalesOrders
					.Include(s => s.Lines)
					.FirstOrDefaultAsync(s => s.Id == id)
					?? throw new KeyNotFoundException($"Sale {id} was not found.");

				var affectedProductIds = existing.Lines.Select(l => l.ProductId).ToList();

				foreach (var line in existing.Lines)
				{
					var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
					product.StockOnHand += line.Quantity;
				}

				_db.SalesOrderLines.RemoveRange(existing.Lines);
				await _db.SaveChangesAsync();

				updated.Lines ??= new List<SalesOrderLine>();
				foreach (var line in updated.Lines)
				{
					line.SalesOrderId = id;
					await ApplySaleLineAsync(line, existing.InvoiceNumber);
					affectedProductIds.Add(line.ProductId);
				}

				CalculateSaleTotals(updated);

				existing.SoldAt = updated.SoldAt == default ? existing.SoldAt : updated.SoldAt;
				existing.CustomerId = await ResolveCustomerIdAsync(updated.CustomerName);
				existing.Subtotal = updated.Subtotal;
				existing.DiscountAmount = updated.DiscountAmount;
				existing.VatAmount = updated.VatAmount;
				existing.TotalAmount = updated.TotalAmount;

				_db.SalesOrderLines.AddRange(updated.Lines);
				await _db.SaveChangesAsync();
				await EvaluateAlertsAsync(affectedProductIds.Distinct());
				await transaction.CommitAsync();

				existing.Lines = updated.Lines;
				return existing;
			}
			catch
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		public async Task DeleteSaleAsync(int id)
		{
			var so = await _db.SalesOrders
				.Include(s => s.Lines)
				.FirstOrDefaultAsync(s => s.Id == id)
				?? throw new KeyNotFoundException($"Sale {id} was not found.");

			foreach (var line in so.Lines)
			{
				var product = await _db.Products.FindAsync(line.ProductId);
				if (product != null)
					product.StockOnHand += line.Quantity;
			}

			_db.SalesOrders.Remove(so);
			await _db.SaveChangesAsync();
		}

		private async Task ApplySaleLineAsync(SalesOrderLine line, string invoiceReference)
		{
			var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);

			if (product.StockOnHand < line.Quantity)
			{
				throw new InvalidOperationException(
					$"Insufficient stock for product {product.Name}. Available: {product.StockOnHand}, Requested: {line.Quantity}");
			}

			var discountMultiplier = 1m - (line.DiscountPercent / 100m);
			line.LineTotal = Math.Round(line.UnitPrice * line.Quantity * discountMultiplier, 2);

			_db.StockMovements.Add(new StockMovement
			{
				ProductId = line.ProductId,
				Quantity = -line.Quantity,
				MovementType = StockMovementType.Sale,
				PreviousStock = product.StockOnHand,
				NewStock = product.StockOnHand - line.Quantity,
				Reference = invoiceReference,
				UnitPrice = line.UnitPrice
			});

			product.StockOnHand -= line.Quantity;
		}

		private static void CalculateSaleTotals(SalesOrder so)
		{
			foreach (var line in so.Lines)
			{
				var discountMultiplier = 1m - (line.DiscountPercent / 100m);
				line.LineTotal = Math.Round(line.UnitPrice * line.Quantity * discountMultiplier, 2);
			}

			var subtotal = so.Lines.Sum(l => l.UnitPrice * l.Quantity);
			var lineDiscount = subtotal - so.Lines.Sum(l => l.LineTotal);
			var orderDiscount = Math.Round(subtotal * (so.OrderDiscountPercent / 100m), 2) + so.OrderDiscountAmount;
			var totalDiscount = lineDiscount + orderDiscount;
			var vatableAmount = subtotal - totalDiscount;

			so.Subtotal = subtotal;
			so.DiscountAmount = totalDiscount;
			so.VatAmount = Math.Round(vatableAmount * 0.13m, 2);
			so.TotalAmount = vatableAmount + so.VatAmount;
		}

		private async Task<int?> ResolveCustomerIdAsync(string? customerName)
		{
			if (string.IsNullOrWhiteSpace(customerName) ||
			    customerName.Equals("Walk-in Customer", StringComparison.OrdinalIgnoreCase))
			{
				return null;
			}

			var trimmed = customerName.Trim();
			var customer = await _db.Customers.FirstOrDefaultAsync(c => c.Name == trimmed);
			if (customer == null)
			{
				customer = new Customer { Name = trimmed };
				_db.Customers.Add(customer);
				await _db.SaveChangesAsync();
			}

			return customer.Id;
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
