// MartMS
namespace MartManagement.Web.Services;

public class SalesService : ISalesService
{
    private readonly AppDbContext _db;
    private readonly IActivityLogService _activityLog;

    public SalesService(AppDbContext db, IActivityLogService activityLog)
    {
        _db = db;
        _activityLog = activityLog;
    }

    public async Task<Sale> CreateSaleAsync(SaleCreateViewModel model, int? userId)
    {
        if (model.Lines == null || !model.Lines.Any(l => l.ProductId > 0 && l.Quantity > 0))
            throw new InvalidOperationException("Add at least one product line.");

        await using var tx = await _db.Database.BeginTransactionAsync();
        try
        {
            var lastId = await _db.Sales.MaxAsync(s => (int?)s.Id) ?? 0;
            var sale = new Sale
            {
                InvoiceNumber = InvoiceNumberGenerator.NextSale("INV", lastId),
                SaleDate = DateTime.UtcNow,
                CustomerId = model.CustomerId,
                CreatedByUserId = userId,
                Notes = model.Notes,
                DiscountAmount = model.DiscountAmount
            };

            decimal subtotal = 0;
            decimal taxTotal = 0;

            foreach (var line in model.Lines.Where(l => l.ProductId > 0 && l.Quantity > 0))
            {
                var product = await _db.Products.FirstAsync(p => p.Id == line.ProductId);
                if (product.StockQuantity < line.Quantity)
                    throw new InvalidOperationException($"Insufficient stock for {product.Name}.");

                var discountMultiplier = 1m - (line.DiscountPercent / 100m);
                var lineSubtotal = line.UnitPrice * line.Quantity * discountMultiplier;
                var tax = Math.Round(lineSubtotal * (line.TaxPercent / 100m), 2);
                var lineTotal = lineSubtotal + tax;

                sale.Items.Add(new SaleItem
                {
                    ProductId = product.Id,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    DiscountPercent = line.DiscountPercent,
                    TaxPercent = line.TaxPercent,
                    LineTotal = lineTotal
                });

                subtotal += line.UnitPrice * line.Quantity;
                taxTotal += tax;

                var prev = product.StockQuantity;
                product.StockQuantity -= line.Quantity;
                product.UpdatedAt = DateTime.UtcNow;

                _db.StockMovements.Add(new StockMovement
                {
                    ProductId = product.Id,
                    QuantityChange = -line.Quantity,
                    PreviousStock = prev,
                    NewStock = product.StockQuantity,
                    MovementType = StockMovementType.Sale,
                    Reference = sale.InvoiceNumber,
                    UserId = userId
                });
            }

            sale.Subtotal = subtotal;
            sale.TaxAmount = taxTotal;
            sale.TotalAmount = sale.Items.Sum(i => i.LineTotal) - model.DiscountAmount;
            if (sale.TotalAmount < 0) sale.TotalAmount = 0;

            _db.Sales.Add(sale);
            await _db.SaveChangesAsync();
            await tx.CommitAsync();

            await _activityLog.LogAsync(userId, "Create", "Sale", sale.InvoiceNumber);
            return sale;
        }
        catch
        {
            await tx.RollbackAsync();
            throw;
        }
    }

    public async Task<Sale?> GetByIdAsync(int id) =>
        await _db.Sales
            .Include(s => s.Customer)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .Include(s => s.CreatedByUser)
            .FirstOrDefaultAsync(s => s.Id == id);

    public async Task<PagedResult<Sale>> GetPagedAsync(string? search, DateTime? from, DateTime? to, int page, int pageSize)
    {
        var query = _db.Sales.Include(s => s.Customer).AsQueryable();
        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(s => s.InvoiceNumber.Contains(search) || (s.Customer != null && s.Customer.Name.Contains(search)));
        if (from.HasValue) query = query.Where(s => s.SaleDate >= from);
        if (to.HasValue) query = query.Where(s => s.SaleDate <= to.Value.AddDays(1));

        var total = await query.CountAsync();
        var items = await query.OrderByDescending(s => s.SaleDate)
            .Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        return new PagedResult<Sale> { Items = items, Page = page, PageSize = pageSize, TotalCount = total };
    }
}
