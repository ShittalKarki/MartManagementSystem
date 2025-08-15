using Microsoft.AspNetCore.Mvc;
using MartManagementSystem.Services;

namespace MartManagementSystem.Controllers
{
    public class HomeController : Controller
    {
        private readonly IOrderService _orderService;

        public HomeController(IOrderService orderService)
        {
            _orderService = orderService;
        }

        public async Task<IActionResult> Index()
        {
            var analytics = await _orderService.GetDashboardAnalyticsAsync();
            return View(analytics);
        }
    }
}
