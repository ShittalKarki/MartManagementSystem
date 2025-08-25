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
		private readonly ApplicationDbContext _db;

		public StockMovementController(ApplicationDbContext db)
		{
			_db = db;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<object>>> GetAll()
		{
			var list = await _db.StockMovements
				.Include(sm => sm.Product)
				.OrderByDescending(sm => sm.CreatedAt)
				.Select(sm => ToDto(sm))
				.ToListAsync();
			return Ok(list);
		}

		[HttpGet("product/{productId}")]
		public async Task<ActionResult<IEnumerable<object>>> GetByProduct(int productId)
		{
			var list = await _db.StockMovements
				.Include(sm => sm.Product)
				.Where(sm => sm.ProductId == productId)
				.OrderByDescending(sm => sm.CreatedAt)
				.Select(sm => ToDto(sm))
				.ToListAsync();
			return Ok(list);
		}

		[HttpGet("recent")]
		public async Task<ActionResult<IEnumerable<object>>> GetRecent(int count = 20)
		{
			var list = await _db.StockMovements
				.Include(sm => sm.Product)
				.OrderByDescending(sm => sm.CreatedAt)
				.Take(count)
				.Select(sm => ToDto(sm))
				.ToListAsync();
			return Ok(list);
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

			await _db.Entry(stockMovement).Reference(x => x.Product).LoadAsync();
			return CreatedAtAction(nameof(GetByProduct), new { productId = request.ProductId }, ToDto(stockMovement));
		}

		private static object ToDto(StockMovement sm) => new
		{
			sm.Id,
			sm.ProductId,
			Product = sm.Product == null ? null : new { sm.Product.Id, sm.Product.Name, sm.Product.Sku },
			sm.Quantity,
			sm.MovementType,
			sm.PreviousStock,
			sm.NewStock,
			sm.Reference,
			sm.UnitPrice,
			sm.CreatedAt,
			sm.Notes
		};
	}

	public class StockAdjustmentRequest
	{
		public int ProductId { get; set; }
		public int Quantity { get; set; } // Can be positive or negative
		public string? Notes { get; set; }
	}
}