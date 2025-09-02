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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
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

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<bool> CancelOrderAsync(int id)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
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

                await transaction.CommitAsync();
                return true;
            }
            catch
            {
                await transaction.RollbackAsync();
                return false;
            }
        }

        public async Task<DashboardDto> GetDashboardAnalyticsAsync()
        {
            var totalProducts = await _context.Products.CountAsync();
            var totalCustomers = await _context.Customers.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();

            // Calculate total sales = Sum of (Order.Quantity * Order.Product.Price)
            var orders = await _context.Orders
                .Include(o => o.Customer)
                .Include(o => o.Product)
                .ToListAsync();
            var totalSales = orders.Sum(o => o.Quantity * (o.Product?.Price ?? 0));

            // Advanced Analytics Calculations
            var avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0m;

            var topSellingGroup = orders
                .Where(o => o.Product != null)
                .GroupBy(o => o.Product!.Name)
                .Select(g => new { Name = g.Key, Qty = g.Sum(o => o.Quantity) })
                .OrderByDescending(x => x.Qty)
                .FirstOrDefault();
            var topSellingProduct = topSellingGroup != null ? $"{topSellingGroup.Name} ({topSellingGroup.Qty} units)" : "N/A";

            var topCustomerGroup = orders
                .Where(o => o.Customer != null)
                .GroupBy(o => o.Customer!.FullName)
                .Select(g => new { Name = g.Key, Revenue = g.Sum(o => o.Quantity * (o.Product?.Price ?? 0)) })
                .OrderByDescending(x => x.Revenue)
                .FirstOrDefault();
            var topCustomerName = topCustomerGroup != null ? topCustomerGroup.Name : "N/A";
            var topCustomerRevenue = topCustomerGroup != null ? topCustomerGroup.Revenue : 0m;

            // Generate daily sales totals for the last 7 calendar days
            var lastSevenDaysSales = new List<decimal>();
            var today = DateTime.Today;
            for (int i = 6; i >= 0; i--)
            {
                var date = today.AddDays(-i);
                var daySales = orders
                    .Where(o => o.OrderDate.Date == date)
                    .Sum(o => o.Quantity * (o.Product?.Price ?? 0));
                lastSevenDaysSales.Add(daySales);
            }

            var lowStockProducts = await _context.Products
                .Where(p => p.Stock < 10)
                .ToListAsync();

            var recentOrders = orders
                .OrderByDescending(o => o.OrderDate)
                .Take(5)
                .ToList();

            return new DashboardDto
            {
                TotalSales = totalSales,
                TotalOrders = totalOrders,
                TotalProducts = totalProducts,
                TotalCustomers = totalCustomers,
                AverageOrderValue = avgOrderValue,
                TopSellingProduct = topSellingProduct,
                TopCustomerName = topCustomerName,
                TopCustomerRevenue = topCustomerRevenue,
                LastSevenDaysSales = lastSevenDaysSales,
                LowStockProducts = lowStockProducts,
                RecentOrders = recentOrders
            };
        }
    }
}
