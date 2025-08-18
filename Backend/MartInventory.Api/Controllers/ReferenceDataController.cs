using MartInventory.Api.Data;
using MartInventory.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class ReferenceDataController : ControllerBase
	{
		private readonly AppDbContext _db;

		public ReferenceDataController(AppDbContext db)
		{
			_db = db;
		}

		[HttpGet("categories")]
		public async Task<object> GetCategoryHierarchy()
		{
			var lobs = await _db.LinesOfBusiness.ToListAsync();
			var depts = await _db.Departments.ToListAsync();
			var subDepts = await _db.SubDepartments.ToListAsync();
			var classes = await _db.ProductClasses.ToListAsync();
			var subclasses = await _db.Subclasses.ToListAsync();
			var merch = await _db.Merchandises.ToListAsync();
			return new { lobs, depts, subDepts, classes, subclasses, merch };
		}

		[HttpGet("vendors")]
		public Task<List<Vendor>> Vendors() => _db.Vendors.ToListAsync();

		[HttpGet("customers")]
		public Task<List<Customer>> Customers() => _db.Customers.ToListAsync();
	}
}



