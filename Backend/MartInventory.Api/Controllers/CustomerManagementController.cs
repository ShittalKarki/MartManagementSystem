using MartInventory.Api.Data;
using MartInventory.Api.Helpers;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("customers")]
public class CustomerManagementController : Controller
{
    private readonly ApplicationDbContext _db;

    public CustomerManagementController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index(string? search, int page = 1)
    {
        var query = _db.Customers.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search) || (x.Phone != null && x.Phone.Contains(search)));
        }

        var vm = new EntityListViewModel<Customer>
        {
            Search = search,
            PagedItems = await PagedResult<Customer>.CreateAsync(query.OrderBy(x => x.Name), page, 10)
        };

        return View(vm);
    }

    [HttpGet("create")]
    [Authorize(Roles = "Admin")]
    public IActionResult Create() => View(new CustomerFormViewModel());

    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CustomerFormViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        _db.Customers.Add(new Customer
        {
            Name = model.Name.Trim(),
            Phone = model.Phone,
            Email = model.Email
        });

        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer created successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        return View(new CustomerFormViewModel
        {
            Id = entity.Id,
            Name = entity.Name,
            Phone = entity.Phone,
            Email = entity.Email
        });
    }

    [HttpPost("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, CustomerFormViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var entity = await _db.Customers.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Name = model.Name.Trim();
        entity.Phone = model.Phone;
        entity.Email = model.Email;

        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost("delete/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Customers.FindAsync(id);
        if (entity is null)
        {
            TempData["Error"] = "Customer not found.";
            return RedirectToAction(nameof(Index));
        }

        var inUse = await _db.SalesOrders.AnyAsync(x => x.CustomerId == id);
        if (inUse)
        {
            TempData["Error"] = "Cannot delete customer with sales history.";
            return RedirectToAction(nameof(Index));
        }

        _db.Customers.Remove(entity);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Customer deleted.";
        return RedirectToAction(nameof(Index));
    }
}
