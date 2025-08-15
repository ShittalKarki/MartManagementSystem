using MartManagementSystem.Data;
using MartManagementSystem.Models;
using Microsoft.EntityFrameworkCore;

namespace MartManagementSystem.Services
{
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        private readonly IProductService _productService;

        public OrderService(ApplicationDbContext context, IProductService productService)
        {
            _context = context;
            _productService = productService;
        }

        public async Task<IEnumerable<Order>> GetAllOrdersAsync()
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Product)
                .OrderByDescending(o => o.OrderDate)
                .ToListAsync();
        }

        public async Task<Order?> GetOrderByIdAsync(int id)
        {
            return await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
        }

        public async Task<bool> PlaceOrderAsync(Order order)
        {
            // First load the product to verify stock
            var product = await _context.Products.FindAsync(order.ProductId);
            if (product == null || product.Stock < order.Quantity || order.Quantity <= 0)
            {
                return false;
            }

            // Deduct stock using productService
            bool stockDeducted = await _productService.DeductStockAsync(order.ProductId, order.Quantity);
            if (!stockDeducted)
            {
                return false;
            }

            order.OrderDate = DateTime.Now;
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> CancelOrderAsync(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return false;
            }

            // Restore product stock
            await _productService.RestoreStockAsync(order.ProductId, order.Quantity);

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<DashboardDto> GetDashboardAnalyticsAsync()
        {
            var totalProducts = await _context.Products.CountAsync();
            var totalCustomers = await _context.Customers.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();

            // Calculate total sales = Sum of (Order.Quantity * Order.Product.Price)
            var orders = await _context.Orders.Include(o => o.Product).ToListAsync();
            var totalSales = orders.Sum(o => o.Quantity * (o.Product?.Price ?? 0));

            var lowStockProducts = await _context.Products
                .Where(p => p.Stock < 10)
                .ToListAsync();

            var recentOrders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Product)
                .OrderByDescending(o => o.OrderDate)
                .Take(5)
                .ToListAsync();

            return new DashboardDto
            {
                TotalSales = totalSales,
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                TotalCustomers = totalCustomers,
                LowStockProducts = lowStockProducts,
                RecentOrders = recentOrders
            };
        }
    }
}
