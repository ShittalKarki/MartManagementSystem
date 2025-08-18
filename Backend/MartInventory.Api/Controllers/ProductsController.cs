using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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
			return await _db.Products.Include(p => p.Merchandise).ToListAsync();
		}

		[HttpGet("{id}")]
		public async Task<ActionResult<Product>> GetById(int id)
		{
			var product = await _db.Products.Include(p => p.Merchandise).FirstOrDefaultAsync(p => p.Id == id);
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
			_db.Entry(product).State = EntityState.Modified;
			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpDelete("{id}")]
		public async Task<IActionResult> Delete(int id)
		{
			var product = await _db.Products.FindAsync(id);
			if (product == null) return NotFound();
			_db.Products.Remove(product);
			await _db.SaveChangesAsync();
			return NoContent();
		}
	}
}



