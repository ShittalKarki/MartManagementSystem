using MartInventory.Api.Data;
using MartInventory.Api.Models;
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
		private readonly AppDbContext _db;

		public ProductsController(AppDbContext db)
		{
			_db = db;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<Product>>> GetAll()
		{
			return await _db.Products.Include(p => p.Category).Include(p => p.Merchandise).ToListAsync();
		}
	
	[HttpGet("low-stock")]
	public async Task<ActionResult<IEnumerable<Product>>> GetLowStockProducts()
	{
		return await _db.Products
			.Include(p => p.Category)
			.Where(p => p.StockOnHand <= p.ReorderLevel)
			.ToListAsync();
	}

		[HttpGet("{id}")]
		public async Task<ActionResult<Product>> GetById(int id)
		{
			var product = await _db.Products.Include(p => p.Category).Include(p => p.Merchandise).FirstOrDefaultAsync(p => p.Id == id);
			if (product == null) return NotFound();
			return product;
		}

		[HttpPost]
		public async Task<ActionResult<Product>> Create(Product product)
		{
			_db.Products.Add(product);
			await _db.SaveChangesAsync();
			return CreatedAtAction(nameof(GetById), new { id = product.Id }, product);
		}

		[HttpPut("{id}")]
		public async Task<IActionResult> Update(int id, Product product)
		{
			if (id != product.Id) return BadRequest();
			
			var existingProduct = await _db.Products.FindAsync(id);
			if (existingProduct == null) return NotFound();
			
			existingProduct.Name = product.Name;
			existingProduct.Sku = product.Sku;
			existingProduct.Description = product.Description;
			existingProduct.Unit = product.Unit;
			existingProduct.Barcode = product.Barcode;
			existingProduct.PurchasePrice = product.PurchasePrice;
			existingProduct.SellingPrice = product.SellingPrice;
			existingProduct.VatPercent = product.VatPercent;
			existingProduct.StockOnHand = product.StockOnHand;
			existingProduct.ReorderLevel = product.ReorderLevel;
			existingProduct.CategoryId = product.CategoryId;
			existingProduct.MerchandiseId = product.MerchandiseId;
			
			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			var product = await _db.Products.FindAsync(id);
			if (product == null) return NotFound();

			try
			{
				_db.Products.Remove(product);
				await _db.SaveChangesAsync();
				return NoContent();
			}
			catch (DbUpdateException)
			{
				return Conflict(new { message = "Cannot delete this product because it is referenced by other records." });
			}
		}
	}
}



