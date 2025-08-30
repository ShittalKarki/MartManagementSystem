// MartMS file
namespace MartManagement.Web.Helpers;

public static class InvoiceNumberGenerator
{
    public static string NextSale(string prefix, int lastId) =>
        $"{prefix}-{DateTime.UtcNow:yyyyMMdd}-{lastId + 1:D4}";

    public static string NextPurchase(string prefix, int lastId) =>
        $"{prefix}-{DateTime.UtcNow:yyyyMMdd}-{lastId + 1:D4}";
}
