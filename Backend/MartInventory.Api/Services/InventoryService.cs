using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MartInventory.Api.Services
{
	public class InventoryService
	{
		private readonly ApplicationDbContext _db;

		public InventoryService(ApplicationDbContext db)
		{
			_db = db;
		}

		public async Task<PurchaseOrder> CreatePurchaseAsync(PurchaseOrder po)
	{
		// Create a transaction to ensure all operations succeed or fail together
		using var transaction = await _db.Database.BeginTransactionAsync();
		try
		{
			// Process each line item
			foreach (var line in po.Lines)
			{
				// Get the product
				var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
				
				// Calculate line total
				line.LineTotal = line.UnitPrice * line.Quantity;
				
				// Create stock movement record
				var stockMovement = new StockMovement
				{
					ProductId = line.ProductId,
					Quantity = line.Quantity,
					MovementType = StockMovementType.Purchase,
					PreviousStock = product.StockOnHand,
					NewStock = product.StockOnHand + line.Quantity,
					Reference = $"PO-{po.Id}",
					UnitPrice = line.UnitPrice
				};
				
				// Update product stock
				product.StockOnHand += line.Quantity;
				
				// Add stock movement to database
				_db.StockMovements.Add(stockMovement);
			}
			
			// Calculate total amount
			po.TotalAmount = po.Lines.Sum(l => l.LineTotal);
			
			// Add purchase order to database
			_db.PurchaseOrders.Add(po);
			
			// Save changes
			await _db.SaveChangesAsync();
			
			// Evaluate low stock alerts
			await EvaluateAlertsAsync(po.Lines.Select(l => l.ProductId));
			
			// Commit transaction
			await transaction.CommitAsync();
			
			return po;
		}
		catch (Exception)
		{
			// Rollback transaction on error
			await transaction.RollbackAsync();
			throw;
		}
	}

		public async Task<SalesOrder> CreateSaleAsync(SalesOrder so)
		{
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				foreach (var line in so.Lines)
				{
					var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
					if (product.StockOnHand < line.Quantity)
					{
						throw new InvalidOperationException($"Insufficient stock for product {product.Name}. Available: {product.StockOnHand}, Requested: {line.Quantity}");
					}

					var discountMultiplier = 1m - (line.DiscountPercent / 100m);
					line.LineTotal = Math.Round(line.UnitPrice * line.Quantity * discountMultiplier, 2);

					var stockMovement = new StockMovement
					{
						ProductId = line.ProductId,
						Quantity = -line.Quantity,
						MovementType = StockMovementType.Sale,
						PreviousStock = product.StockOnHand,
						NewStock = product.StockOnHand - line.Quantity,
						Reference = $"SO-{so.Id}",
						UnitPrice = line.UnitPrice
					};

					product.StockOnHand -= line.Quantity;
					_db.StockMovements.Add(stockMovement);
				}

				so.Subtotal = so.Lines.Sum(l => l.UnitPrice * l.Quantity);
				so.TotalAmount = so.Lines.Sum(l => l.LineTotal);
				so.DiscountAmount = so.Subtotal - so.TotalAmount;
				so.VatAmount = so.Lines.Sum(l => Math.Round(l.LineTotal * (l.VatPercent / 100m), 2));

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

		public async Task CancelSaleAsync(int salesOrderId)
		{
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				var sale = await _db.SalesOrders.Include(s => s.Lines).FirstOrDefaultAsync(s => s.Id == salesOrderId);
				if (sale == null) throw new InvalidOperationException("Sale not found");

				foreach (var line in sale.Lines)
				{
					var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
					var prev = product.StockOnHand;
					product.StockOnHand += line.Quantity; // revert stock
					_db.StockMovements.Add(new StockMovement
					{
						ProductId = line.ProductId,
						Quantity = line.Quantity,
						MovementType = StockMovementType.Return,
						PreviousStock = prev,
						NewStock = product.StockOnHand,
						Reference = $"CANCEL-{sale.InvoiceNumber}",
						UnitPrice = line.UnitPrice
					});
				}

				_db.SalesOrderLines.RemoveRange(sale.Lines);
				_db.SalesOrders.Remove(sale);
				await _db.SaveChangesAsync();
				await EvaluateAlertsAsync(sale.Lines.Select(l => l.ProductId));
				await transaction.CommitAsync();
			}
			catch (Exception)
			{
				await transaction.RollbackAsync();
				throw;
			}
		}

		public async Task CancelPurchaseAsync(int purchaseOrderId)
		{
			using var transaction = await _db.Database.BeginTransactionAsync();
			try
			{
				var po = await _db.PurchaseOrders.Include(p => p.Lines).FirstOrDefaultAsync(p => p.Id == purchaseOrderId);
				if (po == null) throw new InvalidOperationException("Purchase not found");

				foreach (var line in po.Lines)
				{
					var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
					var prev = product.StockOnHand;
					product.StockOnHand -= line.Quantity; // remove stock
					_db.StockMovements.Add(new StockMovement
					{
						ProductId = line.ProductId,
						Quantity = -line.Quantity,
						MovementType = StockMovementType.Adjustment,
						PreviousStock = prev,
						NewStock = product.StockOnHand,
						Reference = $"CANCEL-{po.InvoiceNumber}",
						UnitPrice = line.UnitPrice
					});
				}

				_db.PurchaseOrderLines.RemoveRange(po.Lines);
				_db.PurchaseOrders.Remove(po);
				await _db.SaveChangesAsync();
				await EvaluateAlertsAsync(po.Lines.Select(l => l.ProductId));
				await transaction.CommitAsync();
			}
			catch (Exception)
			{
				await transaction.RollbackAsync();
				throw;
			}
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



