// MartMS file
namespace MartManagement.Web.Models;

public enum StockMovementType
{
    Purchase = 1,
    Sale = 2,
    AdjustmentIn = 3,
    AdjustmentOut = 4,
    Return = 5
}

public class StockMovement
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public int QuantityChange { get; set; }
    public int PreviousStock { get; set; }
    public int NewStock { get; set; }
    public StockMovementType MovementType { get; set; }
    public string? Reference { get; set; }
    public string? Notes { get; set; }
    public int? UserId { get; set; }
    public AppUser? User { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
