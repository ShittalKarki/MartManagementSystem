namespace MartInventory.Api.Models
{
	public class PurchaseOrder
	{
		public int Id { get; set; }
		public DateTime OrderedAt { get; set; } = DateTime.UtcNow;
		public int VendorId { get; set; }
		public Vendor Vendor { get; set; } = null!;
		public List<PurchaseOrderLine> Lines { get; set; } = new();
		public decimal TotalAmount { get; set; }
		public string Currency { get; set; } = "NPR";
		public string InvoiceNumber { get; set; } = string.Empty;
	}

	public class PurchaseOrderLine
	{
		public int Id { get; set; }
		public int PurchaseOrderId { get; set; }
		public PurchaseOrder PurchaseOrder { get; set; } = null!;
		public int ProductId { get; set; }
		public Product Product { get; set; } = null!;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public decimal LineTotal { get; set; }
	}

	public class SalesOrder
	{
		public int Id { get; set; }
		public DateTime SoldAt { get; set; } = DateTime.UtcNow;
		public int? CustomerId { get; set; }
		public Customer? Customer { get; set; }
		public List<SalesOrderLine> Lines { get; set; } = new();
		public decimal Subtotal { get; set; }
		public decimal DiscountAmount { get; set; }
		public decimal VatAmount { get; set; }
		public decimal TotalAmount { get; set; }
		public string Currency { get; set; } = "NPR";
		public string InvoiceNumber { get; set; } = string.Empty;
	}

	public class SalesOrderLine
	{
		public int Id { get; set; }
		public int SalesOrderId { get; set; }
		public SalesOrder SalesOrder { get; set; } = null!;
		public int ProductId { get; set; }
		public Product Product { get; set; } = null!;
		public int Quantity { get; set; }
		public decimal UnitPrice { get; set; }
		public decimal DiscountPercent { get; set; }
		public decimal VatPercent { get; set; }
		public decimal LineTotal { get; set; }
	}

	public class InventoryAlert
	{
		public int Id { get; set; }
		public int ProductId { get; set; }
		public Product Product { get; set; } = null!;
		public int StockOnHand { get; set; }
		public int ReorderLevel { get; set; }
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
		public bool Resolved { get; set; }
	}
}


