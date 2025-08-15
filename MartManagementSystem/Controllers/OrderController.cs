// Controllers/OrderController.cs
using Microsoft.AspNetCore.Mvc;
using MartManagementSystem.Models;
using MartManagementSystem.Services;

namespace MartManagementSystem.Controllers
{
    public class OrderController : Controller
    {
        private readonly IOrderService _orderService;
        private readonly IProductService _productService;
        private readonly ICustomerService _customerService;

        public OrderController(IOrderService orderService, IProductService productService, ICustomerService customerService)
        {
            _orderService = orderService;
            _productService = productService;
            _customerService = customerService;
        }

        public async Task<IActionResult> Index()
        {
            var orders = await _orderService.GetAllOrdersAsync();
            return View(orders);
        }

        [HttpGet]
        public async Task<IActionResult> Create()
        {
            ViewBag.Customers = await _customerService.GetAllCustomersAsync();
            ViewBag.Products = await _productService.GetAllProductsAsync();
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(Order order)
        {
            // Try to place the order
            bool success = await _orderService.PlaceOrderAsync(order);
            if (success)
            {
                return RedirectToAction(nameof(Index));
            }

            // If we failed, populate ViewBag and return validation error
            var product = await _productService.GetProductByIdAsync(order.ProductId);
            if (product == null)
            {
                ModelState.AddModelError("", "Selected product does not exist.");
            }
            else if (product.Stock < order.Quantity)
            {
                ModelState.AddModelError("Quantity", $"Insufficient stock. Only {product.Stock} items of '{product.Name}' are available.");
            }
            else if (order.Quantity <= 0)
            {
                ModelState.AddModelError("Quantity", "Quantity must be greater than zero.");
            }
            else
            {
                ModelState.AddModelError("", "Unable to place the order. Please verify your details.");
            }

            ViewBag.Customers = await _customerService.GetAllCustomersAsync();
            ViewBag.Products = await _productService.GetAllProductsAsync();
            return View(order);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Delete(int id)
        {
            bool success = await _orderService.CancelOrderAsync(id);
            if (!success)
            {
                TempData["ErrorMessage"] = "Could not cancel the order.";
            }
            else
            {
                TempData["SuccessMessage"] = "Order cancelled successfully and stock restored.";
            }
            return RedirectToAction(nameof(Index));
        }
    }
}