using MartManagementSystem.Models;

namespace MartManagementSystem.Services
{
    public interface IProductService
    {
        Task<IEnumerable<Product>> GetAllProductsAsync();
        Task<Product?> GetProductByIdAsync(int id);
        Task CreateProductAsync(Product product);
        Task UpdateProductAsync(Product product);
        Task DeleteProductAsync(int id);
        Task<bool> DeductStockAsync(int productId, int quantity);
        Task RestoreStockAsync(int productId, int quantity);
    }
}
