// MartMS
namespace MartManagement.Web.Services;

/// <summary>Session-backed shopping cart for customer checkout.</summary>
public class CartService
{
    private const string SessionKey = "MartCart";
    private readonly IHttpContextAccessor _http;
    private readonly AppDbContext _db;

    public CartService(IHttpContextAccessor http, AppDbContext db)
    {
        _http = http;
        _db = db;
    }

    public List<CartItemViewModel> GetCart()
    {
        var session = _http.HttpContext?.Session;
        if (session == null) return new List<CartItemViewModel>();
        var json = session.GetString(SessionKey);
        return string.IsNullOrEmpty(json)
            ? new List<CartItemViewModel>()
            : JsonSerializer.Deserialize<List<CartItemViewModel>>(json) ?? new List<CartItemViewModel>();
    }

    public void SaveCart(List<CartItemViewModel> cart) =>
        _http.HttpContext?.Session.SetString(SessionKey, JsonSerializer.Serialize(cart));

    public async Task AddAsync(int productId, int quantity)
    {
        var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.IsActive)
            ?? throw new InvalidOperationException("Product not found.");

        if (quantity < 1) quantity = 1;
        var cartItems = GetCart();
        var existingLine = cartItems.FirstOrDefault(c => c.ProductId == productId);
        if (existingLine != null)
            existingLine.Quantity = Math.Min(existingLine.Quantity + quantity, product.StockQuantity);
        else
        {
            cartItems.Add(new CartItemViewModel
            {
                ProductId = product.Id,
                Name = product.Name,
                ImagePath = product.ImagePath,
                UnitPrice = product.SellingPrice,
                TaxPercent = product.TaxPercent,
                Quantity = Math.Min(quantity, product.StockQuantity),
                StockAvailable = product.StockQuantity
            });
        }
        SaveCart(cartItems);
    }

    public void UpdateQuantity(int productId, int quantity)
    {
        var cart = GetCart();
        var item = cart.FirstOrDefault(c => c.ProductId == productId);
        if (item == null) return;
        if (quantity <= 0) cart.Remove(item);
        else item.Quantity = Math.Min(quantity, item.StockAvailable);
        SaveCart(cart);
    }

    public void Remove(int productId)
    {
        var cart = GetCart();
        cart.RemoveAll(c => c.ProductId == productId);
        SaveCart(cart);
    }

    public void Clear() => _http.HttpContext?.Session.Remove(SessionKey);

    public int ItemCount => GetCart().Sum(c => c.Quantity);

    public CartSummaryViewModel GetSummary()
    {
        var items = GetCart();
        var subtotal = items.Sum(i => i.LineSubtotal);
        var tax = items.Sum(i => i.LineTax);
        return new CartSummaryViewModel
        {
            Items = items,
            ItemCount = items.Sum(i => i.Quantity),
            Subtotal = subtotal,
            Tax = tax,
            Total = subtotal + tax
        };
    }
}
