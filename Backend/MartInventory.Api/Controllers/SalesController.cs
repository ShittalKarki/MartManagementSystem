using MartInventory.Api.Data;
using MartInventory.Api.Models;
using MartInventory.Api.Services;
using MartInventory.Api.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers;

[Authorize]
[Route("sales")]
public class SalesController : Controller
{
    private readonly ApplicationDbContext _db;
    private readonly InventoryService _inventoryService;

    public SalesController(ApplicationDbContext db, InventoryService inventoryService)
    {
        _db = db;
        _inventoryService = inventoryService;
    }

    [HttpGet("")]
    public async Task<IActionResult> Index()
    {
        var vm = new OrderHistoryViewModel
        {
            RecentSales = await _db.SalesOrders
                .Include(x => x.Customer)
                .Include(x => x.Lines)
                .OrderByDescending(x => x.SoldAt)
                .Take(20)
                .ToListAsync()
        };

        return View(vm);
    }

    [HttpGet("create")]
    public async Task<IActionResult> Create()
    {
        var vm = new CreateSaleViewModel
        {
            Products = await _db.Products.OrderBy(x => x.Name).ToListAsync(),
            Customers = await _db.Customers.OrderBy(x => x.Name).ToListAsync(),
            Lines = new List<OrderLineInputViewModel> { new() }
        };

        return View(vm);
    }

    [HttpPost("create")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateSaleViewModel model)
    {
        model.Products = await _db.Products.OrderBy(x => x.Name).ToListAsync();
        model.Customers = await _db.Customers.OrderBy(x => x.Name).ToListAsync();

        if (model.Lines.Count == 0)
        {
            ModelState.AddModelError(string.Empty, "At least one item is required.");
        }

        if (!ModelState.IsValid)
        {
            return View(model);
        }

        var order = new SalesOrder
        {
            CustomerId = model.CustomerId,
            InvoiceNumber = $"SO-{DateTime.UtcNow:yyyyMMddHHmmssfff}",
            Lines = model.Lines.Select(x => new SalesOrderLine
            {
                ProductId = x.ProductId,
                Quantity = x.Quantity,
                UnitPrice = x.UnitPrice,
                DiscountPercent = x.DiscountPercent,
                VatPercent = x.VatPercent
            }).ToList()
        };

        try
        {
            await _inventoryService.CreateSaleAsync(order);
            TempData["Success"] = $"Sale created. Invoice: {order.InvoiceNumber}";
            return RedirectToAction(nameof(Index));
        }
        catch (InvalidOperationException ex)
        {
            ModelState.AddModelError(string.Empty, ex.Message);
            return View(model);
        }
    }

    [HttpGet("invoice/{id:int}")]
    public async Task<IActionResult> Invoice(int id)
    {
        var sale = await _db.SalesOrders
            .Include(x => x.Customer)
            .Include(x => x.Lines)
            .ThenInclude(x => x.Product)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (sale is null)
        {
            return NotFound();
        }

        return View(sale);
    }
}
