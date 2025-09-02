// Models/Product.cs
using System.ComponentModel.DataAnnotations;

namespace MartManagementSystem.Models
{
    public class Product
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Product Name is required.")]
        [StringLength(150, MinimumLength = 2, ErrorMessage = "Product Name must be between 2 and 150 characters.")]
        public string Name { get; set; } = "";

        [Required(ErrorMessage = "Price is required.")]
        [Range(0.01, 10000.00, ErrorMessage = "Price must be between $0.01 and $10,000.00.")]
        public decimal Price { get; set; }

        [Required(ErrorMessage = "Stock quantity is required.")]
        [Range(0, 100000, ErrorMessage = "Stock cannot be negative.")]
        public int Stock { get; set; }
    }
}




