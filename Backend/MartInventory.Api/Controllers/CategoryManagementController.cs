using MartInventory.Api.Data;
using MartInventory.Api.Helpers;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("categories")]
public class CategoryManagementController : Controller
{
    private readonly ApplicationDbContext _db;

    public CategoryManagementController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index(string? search, int page = 1)
    {
        var query = _db.Categories.AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x => x.Name.Contains(search));
        }

        var vm = new EntityListViewModel<Category>
        {
            Search = search,
            PagedItems = await PagedResult<Category>.CreateAsync(query.OrderBy(x => x.Name), page, 10)
        };

        return View(vm);
    }

    [HttpGet("create")]
    [Authorize(Roles = "Admin")]
    public IActionResult Create() => View(new CategoryFormViewModel());

    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CategoryFormViewModel model)
    {
        if (await _db.Categories.AnyAsync(x => x.Name == model.Name))
        {
            ModelState.AddModelError(nameof(model.Name), "Category already exists.");
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        _db.Categories.Add(new Category { Name = model.Name.Trim(), Description = model.Description });
        await _db.SaveChangesAsync();

        TempData["Success"] = "Category created successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        return View(new CategoryFormViewModel
        {
            Id = entity.Id,
            Name = entity.Name,
            Description = entity.Description
        });
    }

    [HttpPost("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, CategoryFormViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        if (await _db.Categories.AnyAsync(x => x.Id != id && x.Name == model.Name))
        {
            ModelState.AddModelError(nameof(model.Name), "Category already exists.");
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var entity = await _db.Categories.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Name = model.Name.Trim();
        entity.Description = model.Description;

        await _db.SaveChangesAsync();
        TempData["Success"] = "Category updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost("delete/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Categories.FindAsync(id);
        if (entity is null)
        {
            TempData["Error"] = "Category not found.";
            return RedirectToAction(nameof(Index));
        }

        var inUse = await _db.Products.AnyAsync(x => x.CategoryId == id);
        if (inUse)
        {
            TempData["Error"] = "Cannot delete category because products are assigned to it.";
            return RedirectToAction(nameof(Index));
        }

        _db.Categories.Remove(entity);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Category deleted.";
        return RedirectToAction(nameof(Index));
    }
}
