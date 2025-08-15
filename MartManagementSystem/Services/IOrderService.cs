using MartManagementSystem.Models;

namespace MartManagementSystem.Services
{
    public interface IOrderService
    {
        Task<IEnumerable<Order>> GetAllOrdersAsync();
        Task<Order?> GetOrderByIdAsync(int id);
        Task<bool> PlaceOrderAsync(Order order);
        Task<bool> CancelOrderAsync(int id);
        Task<DashboardDto> GetDashboardAnalyticsAsync();
    }

    public class DashboardDto
    {
        public decimal TotalSales { get; set; }
        public int TotalOrders { get; set; }
        public int TotalProducts { get; set; }
        public int TotalCustomers { get; set; }
        public IEnumerable<Product> LowStockProducts { get; set; } = new List<Product>();
        public IEnumerable<Order> RecentOrders { get; set; } = new List<Order>();
    }
}
