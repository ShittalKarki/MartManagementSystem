using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class CategoriesController : ControllerBase
	{
		private readonly ApplicationDbContext _db;

		public CategoriesController(ApplicationDbContext db)
		{
			_db = db;
		}

		[HttpGet]
		public async Task<ActionResult<IEnumerable<Category>>> GetAll()
		{
			return await _db.Categories.ToListAsync();
		}

		[HttpPost]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<Category>> Create(Category category)
		{
			_db.Categories.Add(category);
			await _db.SaveChangesAsync();
			return CreatedAtAction(nameof(GetAll), new { id = category.Id }, category);
		}

		[HttpPut("{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> Update(int id, Category category)
		{
			if (id != category.Id)
			{
				return BadRequest();
			}

			_db.Entry(category).State = EntityState.Modified;
			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpDelete("{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> Delete(int id)
		{
			var category = await _db.Categories.FindAsync(id);
			if (category is null)
			{
				return NotFound();
			}

			_db.Categories.Remove(category);
			await _db.SaveChangesAsync();
			return NoContent();
		}
	}
}


