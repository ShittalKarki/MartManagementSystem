using MartInventory.Api.Data;
using MartInventory.Api.Helpers;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("suppliers")]
public class SupplierManagementController : Controller
{
    private readonly ApplicationDbContext _db;

    public SupplierManagementController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index(string? search, int page = 1)
    {
        var query = _db.Vendors.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search) || (x.Phone != null && x.Phone.Contains(search)));
        }

        var vm = new EntityListViewModel<Vendor>
        {
            Search = search,
            PagedItems = await PagedResult<Vendor>.CreateAsync(query.OrderBy(x => x.Name), page, 10)
        };

        return View(vm);
    }

    [HttpGet("create")]
    [Authorize(Roles = "Admin")]
    public IActionResult Create() => View(new VendorFormViewModel());

    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(VendorFormViewModel model)
    {
        if (!ModelState.IsValid)
        {
            return View(model);
        }

        _db.Vendors.Add(new Vendor
        {
            Name = model.Name.Trim(),
            ContactPerson = model.ContactPerson,
            Phone = model.Phone,
            Email = model.Email,
            Address = model.Address
        });

        await _db.SaveChangesAsync();
        TempData["Success"] = "Supplier created successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id)
    {
        var entity = await _db.Vendors.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        return View(new VendorFormViewModel
        {
            Id = entity.Id,
            Name = entity.Name,
            ContactPerson = entity.ContactPerson,
            Phone = entity.Phone,
            Email = entity.Email,
            Address = entity.Address
        });
    }

    [HttpPost("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, VendorFormViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var entity = await _db.Vendors.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Name = model.Name.Trim();
        entity.ContactPerson = model.ContactPerson;
        entity.Phone = model.Phone;
        entity.Email = model.Email;
        entity.Address = model.Address;

        await _db.SaveChangesAsync();
        TempData["Success"] = "Supplier updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost("delete/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Vendors.FindAsync(id);
        if (entity is null)
        {
            TempData["Error"] = "Supplier not found.";
            return RedirectToAction(nameof(Index));
        }

        var inUse = await _db.PurchaseOrders.AnyAsync(x => x.VendorId == id);
        if (inUse)
        {
            TempData["Error"] = "Cannot delete supplier with purchase history.";
            return RedirectToAction(nameof(Index));
        }

        _db.Vendors.Remove(entity);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Supplier deleted.";
        return RedirectToAction(nameof(Index));
    }
}
