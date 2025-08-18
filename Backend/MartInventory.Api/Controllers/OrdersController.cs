using MartInventory.Api.Data;
using MartInventory.Api.Hubs;
using MartInventory.Api.Models;
using MartInventory.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace MartInventory.Api.Controllers
{
	[ApiController]
	[Route("api/[controller]")]
	public class OrdersController : ControllerBase
	{
		private readonly AppDbContext _db;
		private readonly InventoryService _inventoryService;
		private readonly IHubContext<InventoryHub> _hub;

		public OrdersController(AppDbContext db, InventoryService inventoryService, IHubContext<InventoryHub> hub)
		{
			_db = db;
			_inventoryService = inventoryService;
			_hub = hub;
		}

		[HttpPost("purchase")]
		public async Task<ActionResult<PurchaseOrder>> CreatePurchase(PurchaseOrder po)
		{
			po.InvoiceNumber = $"PO-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
			var created = await _inventoryService.CreatePurchaseAsync(po);
			await BroadcastStockChangesAsync(created.Lines.Select(l => l.ProductId));
			return CreatedAtAction(nameof(GetPurchaseById), new { id = created.Id }, created);
		}

		[HttpGet("purchase/{id}")]
		public async Task<ActionResult<PurchaseOrder>> GetPurchaseById(int id)
		{
			var po = await _db.PurchaseOrders.Include(p => p.Lines).ThenInclude(l => l.Product).FirstOrDefaultAsync(p => p.Id == id);
			if (po == null) return NotFound();
			return po;
		}

		[HttpPost("sale")]
		public async Task<ActionResult<SalesOrder>> CreateSale(SalesOrder so)
		{
			so.InvoiceNumber = $"SO-{DateTime.UtcNow:yyyyMMddHHmmssfff}";
			var created = await _inventoryService.CreateSaleAsync(so);
			await BroadcastStockChangesAsync(created.Lines.Select(l => l.ProductId));
			return CreatedAtAction(nameof(GetSaleById), new { id = created.Id }, created);
		}

		[HttpGet("sale/{id}")]
		public async Task<ActionResult<SalesOrder>> GetSaleById(int id)
		{
			var so = await _db.SalesOrders.Include(p => p.Lines).ThenInclude(l => l.Product).FirstOrDefaultAsync(p => p.Id == id);
			if (so == null) return NotFound();
			return so;
		}

		[HttpGet("alerts")]
		public async Task<IEnumerable<InventoryAlert>> GetAlerts([FromQuery] bool unresolvedOnly = true)
		{
			var query = _db.InventoryAlerts.Include(a => a.Product).AsQueryable();
			if (unresolvedOnly) query = query.Where(a => !a.Resolved);
			return await query.OrderByDescending(a => a.CreatedAt).ToListAsync();
		}

		[HttpPost("alerts/{id}/resolve")]
		public async Task<IActionResult> ResolveAlert(int id)
		{
			var alert = await _db.InventoryAlerts.FindAsync(id);
			if (alert == null) return NotFound();
			alert.Resolved = true;
			await _db.SaveChangesAsync();
			return NoContent();
		}

		private async Task BroadcastStockChangesAsync(IEnumerable<int> productIds)
		{
			var products = await _db.Products.Where(p => productIds.Contains(p.Id)).Select(p => new { p.Id, p.Sku, p.Name, p.StockOnHand }).ToListAsync();
			await _hub.Clients.All.SendAsync("StockUpdated", products);
		}
	}
}



