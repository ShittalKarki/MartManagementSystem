using MartInventory.Api.Data;
using MartInventory.Api.Helpers;
using MartInventory.Api.Models;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("products")]
public class ProductManagementController : Controller
{
    private readonly ApplicationDbContext _db;

    public ProductManagementController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index(string? search, int? categoryId, int page = 1)
    {
        var query = _db.Products
            .Include(x => x.Category)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(x =>
                x.Name.Contains(search) ||
                x.Sku.Contains(search) ||
                (x.Barcode != null && x.Barcode.Contains(search)));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.CategoryId == categoryId.Value);
        }

        var vm = new ProductIndexViewModel
        {
            Search = search,
            CategoryId = categoryId,
            Categories = await _db.Categories.OrderBy(x => x.Name).ToListAsync(),
            PagedProducts = await PagedResult<Product>.CreateAsync(query.OrderBy(x => x.Name), page, 10)
        };

        return View(vm);
    }

    [HttpGet("create")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create()
    {
        await LoadCategoryDropDown();
        return View(new ProductFormViewModel());
    }

    [HttpPost("create")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(ProductFormViewModel model)
    {
        if (await _db.Products.AnyAsync(x => x.Sku == model.Sku))
        {
            ModelState.AddModelError(nameof(model.Sku), "SKU already exists.");
        }

        if (!ModelState.IsValid)
        {
            await LoadCategoryDropDown();
            return View(model);
        }

        var entity = new Product
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

        _db.Products.Add(entity);
        await _db.SaveChangesAsync();

        TempData["Success"] = "Product created successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Edit(int id)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        var model = new ProductFormViewModel
        {
            Id = entity.Id,
            Sku = entity.Sku,
            Name = entity.Name,
            Description = entity.Description,
            Unit = entity.Unit,
            Barcode = entity.Barcode,
            PurchasePrice = entity.PurchasePrice,
            SellingPrice = entity.SellingPrice,
            VatPercent = entity.VatPercent,
            StockOnHand = entity.StockOnHand,
            ReorderLevel = entity.ReorderLevel,
            CategoryId = entity.CategoryId
        };

        await LoadCategoryDropDown();
        return View(model);
    }

    [HttpPost("edit/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(int id, ProductFormViewModel model)
    {
        if (id != model.Id)
        {
            return BadRequest();
        }

        if (await _db.Products.AnyAsync(x => x.Id != id && x.Sku == model.Sku))
        {
            ModelState.AddModelError(nameof(model.Sku), "SKU already exists.");
        }

        if (!ModelState.IsValid)
        {
            await LoadCategoryDropDown();
            return View(model);
        }

        var entity = await _db.Products.FindAsync(id);
        if (entity is null)
        {
            return NotFound();
        }

        entity.Sku = model.Sku.Trim();
        entity.Name = model.Name.Trim();
        entity.Description = model.Description;
        entity.Unit = model.Unit;
        entity.Barcode = model.Barcode;
        entity.PurchasePrice = model.PurchasePrice;
        entity.SellingPrice = model.SellingPrice;
        entity.VatPercent = model.VatPercent;
        entity.StockOnHand = model.StockOnHand;
        entity.ReorderLevel = model.ReorderLevel;
        entity.CategoryId = model.CategoryId;

        await _db.SaveChangesAsync();
        TempData["Success"] = "Product updated successfully.";
        return RedirectToAction(nameof(Index));
    }

    [HttpPost("delete/{id:int}")]
    [Authorize(Roles = "Admin")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await _db.Products.FindAsync(id);
        if (entity is null)
        {
            TempData["Error"] = "Product not found.";
            return RedirectToAction(nameof(Index));
        }

        _db.Products.Remove(entity);
        await _db.SaveChangesAsync();
        TempData["Success"] = "Product deleted.";
        return RedirectToAction(nameof(Index));
    }

    private async Task LoadCategoryDropDown()
    {
        var categories = await _db.Categories
            .OrderBy(x => x.Name)
            .Select(x => new SelectListItem(x.Name, x.Id.ToString()))
            .ToListAsync();

        ViewBag.Categories = categories;
    }
}
