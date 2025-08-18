namespace MartInventory.Api.Models
{
	public class Product
	{
		public int Id { get; set; }
		public string Sku { get; set; } = string.Empty;
		public string Name { get; set; } = string.Empty;
		public string? Description { get; set; }
		public string Unit { get; set; } = "pcs";
		public string? Barcode { get; set; }
		public decimal PurchasePrice { get; set; }
		public decimal SellingPrice { get; set; }
		public int StockOnHand { get; set; }
		public int ReorderLevel { get; set; } = 10;
		public int MerchandiseId { get; set; }
		public Merchandise Merchandise { get; set; } = null!;
	}
}



