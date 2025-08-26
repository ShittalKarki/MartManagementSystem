using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MartManagementSystem.Models;
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

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
