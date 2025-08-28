using MartInventory.Api.Data;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ReferenceDataController : ControllerBase
	{
		private readonly ApplicationDbContext _db;

		public ReferenceDataController(ApplicationDbContext db)
		{
			_db = db;
		}

		[HttpGet("categories")]
		public async Task<object> GetCategoryHierarchy()
		{
			var categories = await _db.Categories
				.OrderBy(c => c.Name)
				.ToListAsync();
			return new { categories };
		}

		[HttpGet("vendors")]
		public Task<List<Vendor>> Vendors() => _db.Vendors.ToListAsync();

		[HttpPost("vendors")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<Vendor>> CreateVendor([FromBody] VendorFormViewModel model)
		{
			var vendor = new Vendor
			{
				Name = model.Name.Trim(),
				ContactPerson = model.ContactPerson,
				Phone = model.Phone,
				Email = model.Email,
				Address = model.Address
			};

			_db.Vendors.Add(vendor);
			await _db.SaveChangesAsync();
			return CreatedAtAction(nameof(Vendors), new { id = vendor.Id }, vendor);
		}

		[HttpPut("vendors/{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> UpdateVendor(int id, [FromBody] VendorFormViewModel model)
		{
			var vendor = await _db.Vendors.FindAsync(id);
			if (vendor is null)
			{
				return NotFound();
			}

			vendor.Name = model.Name.Trim();
			vendor.ContactPerson = model.ContactPerson;
			vendor.Phone = model.Phone;
			vendor.Email = model.Email;
			vendor.Address = model.Address;

			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpDelete("vendors/{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> DeleteVendor(int id)
		{
			var vendor = await _db.Vendors.FindAsync(id);
			if (vendor is null)
			{
				return NotFound();
			}

			_db.Vendors.Remove(vendor);
			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpGet("customers")]
		public Task<List<Customer>> Customers() => _db.Customers.ToListAsync();

		[HttpPost("customers")]
		[Authorize(Roles = "Admin")]
		public async Task<ActionResult<Customer>> CreateCustomer([FromBody] CustomerFormViewModel model)
		{
			var customer = new Customer
			{
				Name = model.Name.Trim(),
				Phone = model.Phone,
				Email = model.Email
			};

			_db.Customers.Add(customer);
			await _db.SaveChangesAsync();
			return CreatedAtAction(nameof(Customers), new { id = customer.Id }, customer);
		}

		[HttpPut("customers/{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> UpdateCustomer(int id, [FromBody] CustomerFormViewModel model)
		{
			var customer = await _db.Customers.FindAsync(id);
			if (customer is null)
			{
				return NotFound();
			}

			customer.Name = model.Name.Trim();
			customer.Phone = model.Phone;
			customer.Email = model.Email;

			await _db.SaveChangesAsync();
			return NoContent();
		}

		[HttpDelete("customers/{id:int}")]
		[Authorize(Roles = "Admin")]
		public async Task<IActionResult> DeleteCustomer(int id)
		{
			var customer = await _db.Customers.FindAsync(id);
			if (customer is null)
			{
				return NotFound();
			}

			_db.Customers.Remove(customer);
			await _db.SaveChangesAsync();
			return NoContent();
		}
	}
}



