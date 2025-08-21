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
	public class StockMovementController : ControllerBase
	{
		private readonly AppDbContext _db;

		public StockMovementController(AppDbContext db)
		{
			_db = db;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<StockMovement>>> GetAll()
		{
			return await _db.StockMovements
				.Include(sm => sm.Product)
				.OrderByDescending(sm => sm.CreatedAt)
				.ToListAsync();
		}

		[HttpGet("product/{productId}")]
		public async Task<ActionResult<IEnumerable<StockMovement>>> GetByProduct(int productId)
		{
			return await _db.StockMovements
				.Include(sm => sm.Product)
				.Where(sm => sm.ProductId == productId)
				.OrderByDescending(sm => sm.CreatedAt)
				.ToListAsync();
		}

		[HttpGet("recent")]
		public async Task<ActionResult<IEnumerable<StockMovement>>> GetRecent(int count = 20)
		{
			return await _db.StockMovements
				.Include(sm => sm.Product)
				.OrderByDescending(sm => sm.CreatedAt)
				.Take(count)
				.ToListAsync();
		}

		[HttpPost("adjust")]
		public async Task<ActionResult<StockMovement>> AdjustStock(StockAdjustmentRequest request)
		{
			var product = await _db.Products.FindAsync(request.ProductId);
			if (product == null) return NotFound("Product not found");

			var stockMovement = new StockMovement
			{
				ProductId = request.ProductId,
				Quantity = request.Quantity,
				MovementType = StockMovementType.Adjustment,
				PreviousStock = product.StockOnHand,
				NewStock = product.StockOnHand + request.Quantity,
				Reference = "Manual Adjustment",
				UnitPrice = product.PurchasePrice,
				Notes = request.Notes
			};

			// Update product stock
			product.StockOnHand += request.Quantity;

			// Add stock movement to database
			_db.StockMovements.Add(stockMovement);
			await _db.SaveChangesAsync();

			return CreatedAtAction(nameof(GetByProduct), new { productId = request.ProductId }, stockMovement);
		}
	}

	public class StockAdjustmentRequest
	{
		public int ProductId { get; set; }
		public int Quantity { get; set; } // Can be positive or negative
		public string? Notes { get; set; }
	}
}