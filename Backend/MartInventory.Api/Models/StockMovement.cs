using System;

namespace MartInventory.Api.Models
{
	public enum StockMovementType
	{
		Purchase,
		Sale,
		Adjustment,
		Return
	}

	public class StockMovement
	{
		public int Id { get; set; }
		public int ProductId { get; set; }
		public Product Product { get; set; } = null!;
		public int Quantity { get; set; } // Positive for additions, negative for reductions
		public StockMovementType MovementType { get; set; }
		public int PreviousStock { get; set; }
		public int NewStock { get; set; }
		public string Reference { get; set; } = string.Empty; // Reference to PO or SO number
		public decimal UnitPrice { get; set; }
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
		public string? Notes { get; set; }
	}
}