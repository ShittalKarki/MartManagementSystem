using MartInventory.Api.Data;
using MartInventory.Api.Models;
using MartInventory.Api.Services;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("purchases")]
public class PurchasesController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly InventoryService _inventoryService;

    public PurchasesController(ApplicationDbContext db, InventoryService inventoryService)
    {
        _db = db;
        _inventoryService = inventoryService;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var vm = new OrderHistoryViewModel
        {
            RecentPurchases = await _db.PurchaseOrders
                .Include(x => x.Vendor)
                .Include(x => x.Lines)
                .OrderByDescending(x => x.OrderedAt)
                .Take(20)
                .ToListAsync()
        };

        return View(vm);
    }

    [HttpGet("create")]
    public async Task<IActionResult> Create()
    {
        var vm = new CreatePurchaseViewModel
        {
            Products = await _db.Products.OrderBy(x => x.Name).ToListAsync(),
            Vendors = await _db.Vendors.OrderBy(x => x.Name).ToListAsync(),
            Lines = new List<OrderLineInputViewModel> { new() }
        };

        return View(vm);
    }

    [HttpPost("create")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreatePurchaseViewModel model)
    {
        model.Products = await _db.Products.OrderBy(x => x.Name).ToListAsync();
        model.Vendors = await _db.Vendors.OrderBy(x => x.Name).ToListAsync();

        if (model.Lines.Count == 0)
        {
            ModelState.AddModelError(string.Empty, "At least one item is required.");
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var order = new PurchaseOrder
        {
            VendorId = model.VendorId,
            InvoiceNumber = $"PO-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Lines = model.Lines.Select(x => new PurchaseOrderLine
            {
                ProductId = x.ProductId,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                LineTotal = x.Quantity * x.UnitPrice
            }).ToList()
        };

        await _inventoryService.CreatePurchaseAsync(order);
        TempData["Success"] = $"Purchase created. Invoice: {order.InvoiceNumber}";
        return RedirectToAction(nameof(Index));
    }

    [HttpGet("invoice/{id:int}")]
    public async Task<IActionResult> Invoice(int id)
    {
        var purchase = await _db.PurchaseOrders
            .Include(x => x.Vendor)
            .Include(x => x.Lines)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (purchase is null)
        {
            return NotFound();
        }

        return View(purchase);
    }
}
