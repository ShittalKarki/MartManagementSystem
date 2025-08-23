using MartInventory.Api.Data;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ProductsController : ControllerBase
	{
		private readonly ApplicationDbContext _db;

		public ProductsController(ApplicationDbContext db)
		{
			_db = db;
		}

		[HttpGet]
	public async Task<ActionResult<IEnumerable<object>>> GetAll()
	{
		var list = await _db.Products
			.Include(p => p.Category)
			.Select(p => ToDto(p))
			.ToListAsync();
		return Ok(list);
	}
	
	[HttpGet("low-stock")]
	public async Task<ActionResult<IEnumerable<object>>> GetLowStockProducts()
	{
		var list = await _db.Products
			.Include(p => p.Category)
			.Where(p => p.StockOnHand <= p.ReorderLevel)
			.Select(p => ToDto(p))
			.ToListAsync();
		return Ok(list);
	}

		[HttpGet("{id}")]
	public async Task<ActionResult<object>> GetById(int id)
	{
		var product = await _db.Products.Include(p => p.Category).FirstOrDefaultAsync(p => p.Id == id);
		if (product == null) return NotFound();
		return Ok(ToDto(product));
	}

		[HttpPost]
		[Authorize(Roles = "Admin,Staff")]
		public async Task<ActionResult<object>> Create([FromBody] ProductFormViewModel model)
		{
			var product = new Product
			{
				Sku = model.Sku.Trim(),
				Name = model.Name.Trim(),
				Description = model.Description,
				Unit = model.Unit,
				Barcode = model.Barcode,
				PurchasePrice = model.PurchasePrice,
				SellingPrice = model.SellingPrice,
				VatPercent = model.VatPercent,
				StockOnHand = model.StockOnHand,
				ReorderLevel = model.ReorderLevel,
				CategoryId = model.CategoryId
			};

			_db.Products.Add(product);
			await _db.SaveChangesAsync();
			await _db.Entry(product).Reference(p => p.Category).LoadAsync();
			return CreatedAtAction(nameof(GetById), new { id = product.Id }, ToDto(product));
		}

		[HttpPut("{id}")]
		[Authorize(Roles = "Admin,Staff")]
		public async Task<ActionResult<object>> Update(int id, [FromBody] ProductFormViewModel model)
		{
			var product = await _db.Products.FindAsync(id);
			if (product == null) return NotFound();

			product.Sku = model.Sku.Trim();
			product.Name = model.Name.Trim();
			product.Description = model.Description;
			product.Unit = model.Unit;
			product.Barcode = model.Barcode;
			product.PurchasePrice = model.PurchasePrice;
			product.SellingPrice = model.SellingPrice;
			product.VatPercent = model.VatPercent;
			product.StockOnHand = model.StockOnHand;
			product.ReorderLevel = model.ReorderLevel;
			product.CategoryId = model.CategoryId;

			await _db.SaveChangesAsync();
			await _db.Entry(product).Reference(p => p.Category).LoadAsync();
			return Ok(ToDto(product));
		}

		[HttpDelete("{id}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> Delete(int id)
		{
			var product = await _db.Products.FindAsync(id);
			if (product == null) return NotFound();
			_db.Products.Remove(product);
			await _db.SaveChangesAsync();
			return NoContent();
		}

		private static object ToDto(Product p) => new
		{
			p.Id,
			p.Sku,
			p.Name,
			p.Description,
			p.Unit,
			p.CategoryId,
			Category = p.Category == null ? null : new { p.Category.Id, p.Category.Name },
			p.StockOnHand,
			p.ReorderLevel,
			p.PurchasePrice,
			p.SellingPrice,
			p.Barcode,
			p.VatPercent
		};
	}
}



