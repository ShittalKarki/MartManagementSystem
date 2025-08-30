// MartMS file
using System.Security.Claims;
using MartManagement.Web.Data;
using MartManagement.Web.Helpers;
using MartManagement.Web.Models;
using MartManagement.Web.Services;
using MartManagement.Web.ViewModels;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MartManagement.Web.Controllers;

[Authorize(Roles = AppRoles.Customer)]
public class ShopController : Controller
{
    private readonly AppDbContext _db;
    private readonly CartService _cart;
    private readonly ISalesService _sales;
    private readonly ShopCatalogService _catalog;

    public ShopController(AppDbContext db, CartService cart, ISalesService sales, ShopCatalogService catalog)
    {
        _db = db;
        _cart = cart;
        _sales = sales;
        _catalog = catalog;
    }

    public async Task<IActionResult> Index(string? search, int? categoryId, decimal? minPrice, decimal? maxPrice, string? sort, bool catalog = false)
    {
        SetCartViewBag();
        var filter = new ShopFilterViewModel
        {
            Search = search,
            CategoryId = categoryId,
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Sort = string.IsNullOrWhiteSpace(sort) ? "name" : sort
        };

        var hasFilters = catalog || !string.IsNullOrWhiteSpace(search) || categoryId.HasValue ||
                         minPrice.HasValue || maxPrice.HasValue || (sort != null && sort != "name");

        var model = new ShopHomeViewModel
        {
            Filter = filter,
            ShowCatalogOnly = hasFilters,
            Categories = await _db.Categories.Where(c => c.IsActive).OrderBy(c => c.Name).ToListAsync(),
            PriceRangeMax = await _db.Products.Where(p => p.IsActive).MaxAsync(p => (decimal?)p.SellingPrice) ?? 1000m
        };

        model.PopularIds = await _catalog.GetPopularProductIdsAsync();
        model.BestSellerIds = await _catalog.GetBestSellerIdsAsync();

        if (hasFilters)
        {
            model.Products = await _catalog.QueryProductsAsync(filter);
        }
        else
        {
            model.FeaturedProducts = await _catalog.GetFeaturedProductsAsync();
            model.BestSellers = await _db.Products
                .Include(p => p.Category)
                .Where(p => p.IsActive && p.StockQuantity > 0 && model.BestSellerIds.Contains(p.Id))
                .ToListAsync();
            model.BestSellers = model.BestSellers
                .OrderBy(p => model.BestSellerIds.ToList().IndexOf(p.Id))
                .ToList();
            if (!model.BestSellers.Any())
                model.BestSellers = model.FeaturedProducts.Take(4).ToList();
            model.PopularCategories = await _catalog.GetCategorySummariesAsync();
            model.Products = await _catalog.QueryProductsAsync(new ShopFilterViewModel { Sort = "newest" });
            model.Products = model.Products.Take(8).ToList();
        }

        return View(model);
    }

    public async Task<IActionResult> Details(int id)
    {
        SetCartViewBag();
        var product = await _db.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive);

        if (product == null) return NotFound();

        var popularIds = await _catalog.GetPopularProductIdsAsync();
        var bestSellerIds = await _catalog.GetBestSellerIdsAsync();

        var model = new ProductDetailsViewModel
        {
            Product = product,
            RelatedProducts = await _catalog.GetRelatedProductsAsync(product.Id, product.CategoryId),
            IsPopular = popularIds.Contains(product.Id),
            IsBestSeller = bestSellerIds.Contains(product.Id)
        };

        return View(model);
    }

    [HttpGet]
    public async Task<IActionResult> SearchSuggestions(string? q)
    {
        var results = await _catalog.SearchSuggestionsAsync(q);
        return Json(results);
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddToCart(int productId, int quantity = 1, string? returnUrl = null)
    {
        try
        {
            await _cart.AddAsync(productId, quantity);
            if (IsAjaxRequest())
                return Json(new { success = true, message = "Added to cart!", cart = _cart.GetSummary() });
            TempData["Success"] = "Added to cart.";
        }
        catch (Exception ex)
        {
            if (IsAjaxRequest())
                return Json(new { success = false, message = ex.Message });
            TempData["Error"] = ex.Message;
        }

        return RedirectToLocal(returnUrl, nameof(Index));
    }

    [HttpGet]
    public IActionResult CartData() => Json(_cart.GetSummary());

    public IActionResult Cart()
    {
        SetCartViewBag();
        return View(_cart.GetSummary());
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult UpdateCart(int productId, int quantity)
    {
        _cart.UpdateQuantity(productId, quantity);
        if (IsAjaxRequest())
            return Json(new { success = true, cart = _cart.GetSummary() });
        return RedirectToAction(nameof(Cart));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public IActionResult RemoveFromCart(int productId)
    {
        _cart.Remove(productId);
        if (IsAjaxRequest())
            return Json(new { success = true, cart = _cart.GetSummary() });
        return RedirectToAction(nameof(Cart));
    }

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Checkout()
    {
        var cart = _cart.GetCart();
        if (!cart.Any())
        {
            if (IsAjaxRequest())
                return Json(new { success = false, message = "Your cart is empty." });
            TempData["Error"] = "Your cart is empty.";
            return RedirectToAction(nameof(Cart));
        }

        var customerId = await GetCustomerIdAsync();
        if (!customerId.HasValue)
        {
            TempData["Error"] = "Customer profile not linked.";
            return RedirectToAction(nameof(Cart));
        }

        try
        {
            var sale = await _sales.CreateSaleAsync(new SaleCreateViewModel
            {
                CustomerId = customerId,
                Lines = cart.Select(c => new SaleLineViewModel
                {
                    ProductId = c.ProductId,
                    Quantity = c.Quantity,
                    UnitPrice = c.UnitPrice,
                    TaxPercent = c.TaxPercent
                }).ToList()
            }, GetUserId());

            _cart.Clear();
            if (IsAjaxRequest())
                return Json(new { success = true, message = $"Order placed! Invoice {sale.InvoiceNumber}", orderId = sale.Id, redirectUrl = Url.Action(nameof(OrderDetails), new { id = sale.Id }) });

            TempData["Success"] = $"Order placed! Invoice {sale.InvoiceNumber}";
            return RedirectToAction(nameof(OrderDetails), new { id = sale.Id });
        }
        catch (Exception ex)
        {
            if (IsAjaxRequest())
                return Json(new { success = false, message = ex.Message });
            TempData["Error"] = ex.Message;
            return RedirectToAction(nameof(Cart));
        }
    }

    public async Task<IActionResult> Orders()
    {
        SetCartViewBag();
        var customerId = await GetCustomerIdAsync();
        if (!customerId.HasValue) return RedirectToAction(nameof(Index));

        var orders = await _db.Sales
            .Where(s => s.CustomerId == customerId)
            .OrderByDescending(s => s.SaleDate)
            .ToListAsync();

        return View(orders);
    }

    public async Task<IActionResult> OrderDetails(int id)
    {
        SetCartViewBag();
        var customerId = await GetCustomerIdAsync();
        var sale = await _db.Sales
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.CustomerId == customerId);

        if (sale == null) return NotFound();
        return View(sale);
    }

    public async Task<IActionResult> Invoice(int id)
    {
        var customerId = await GetCustomerIdAsync();
        var sale = await _db.Sales
            .Include(s => s.Customer)
            .Include(s => s.Items).ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(s => s.Id == id && s.CustomerId == customerId);

        if (sale == null) return NotFound();
        return View(sale);
    }

    private void SetCartViewBag()
    {
        ViewBag.CartCount = _cart.ItemCount;
        ViewBag.CartSummary = _cart.GetSummary();
    }

    private int? GetUserId() =>
        int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private async Task<int?> GetCustomerIdAsync()
    {
        if (int.TryParse(User.FindFirstValue("CustomerId"), out var cid))
            return cid;

        var userId = GetUserId();
        if (!userId.HasValue) return null;
        return await _db.Users.Where(u => u.Id == userId).Select(u => u.CustomerId).FirstOrDefaultAsync();
    }

    private bool IsAjaxRequest() =>
        Request.Headers.XRequestedWith == "XMLHttpRequest";

    private IActionResult RedirectToLocal(string? returnUrl, string fallbackAction)
    {
        if (!string.IsNullOrEmpty(returnUrl) && Url.IsLocalUrl(returnUrl))
            return LocalRedirect(returnUrl);
        return RedirectToAction(fallbackAction);
    }
}
