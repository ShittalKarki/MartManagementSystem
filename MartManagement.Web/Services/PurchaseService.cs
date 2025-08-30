// MartMS
namespace MartManagement.Web.Services;

public class PurchaseService : IPurchaseService
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public PurchaseService(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<Purchase> CreatePurchaseAsync(PurchaseCreateViewModel model, int? userId)
    {
        if (model.Lines == null || !model.Lines.Any(l => l.ProductId > 0 && l.Quantity > 0))
            throw new InvalidOperationException("Add at least one product line.");

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var lastId = await _db.Purchases.MaxAsync(p => (int?)p.Id) ?? 0;
            var purchase = new Purchase
            {
                InvoiceNumber = InvoiceNumberGenerator.NextPurchase("PO", lastId),
                PurchaseDate = DateTime.UtcNow,
                SupplierId = model.SupplierId,
                CreatedByUserId = userId,
                Notes = model.Notes
            };

            decimal subtotal = 0;
            decimal taxTotal = 0;

            foreach (var line in model.Lines.Where(l => l.ProductId > 0 && l.Quantity > 0))
            {
                var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
                var lineSubtotal = line.UnitPrice * line.Quantity;
                var tax = Math.Round(lineSubtotal * (line.TaxPercent / 100m), 2);
                var lineTotal = lineSubtotal + tax;

                purchase.Items.Add(new PurchaseItem
                {
                    ProductId = product.Id,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    LineTotal = lineTotal
                });

                subtotal += lineSubtotal;
                taxTotal += tax;

                var prev = product.StockQuantity;
                product.StockQuantity += line.Quantity;
                product.PurchasePrice = line.UnitPrice;
                product.UpdatedAt = DateTime.UtcNow;

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    QuantityChange = line.Quantity,
                    PreviousStock = prev,
                    NewStock = product.StockQuantity,
                    MovementType = StockMovementType.Purchase,
                    Reference = purchase.InvoiceNumber,
                    UserId = userId
                });
            }

            purchase.Subtotal = subtotal;
            purchase.TaxAmount = taxTotal;
            purchase.TotalAmount = purchase.Items.Sum(i => i.LineTotal);

            _db.Purchases.Add(purchase);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _activityLog.LogAsync(userId, "Create", "Purchase", purchase.InvoiceNumber);
            return purchase;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<Purchase?> GetByIdAsync(int id) =>
        await _db.Purchases
            .Include(p => p.Supplier)
            .Include(p => p.Items).ThenInclude(i => i.Product)
            .Include(p => p.CreatedByUser)
            .FirstOrDefaultAsync(p => p.Id == id);

    public async Task<PagedResult<Purchase>> GetPagedAsync(string? search, int page, int pageSize)
    {
        var query = _db.Purchases.Include(p => p.Supplier).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.InvoiceNumber.Contains(search) || p.Supplier.Name.Contains(search));

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(p => p.PurchaseDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<Purchase> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }
}
