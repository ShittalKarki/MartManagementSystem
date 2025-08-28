using MartInventory.Api.Helpers;
using MartInventory.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace MartInventory.Api.ViewModels;

public class CategoryFormViewModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(300)]
    public string? Description { get; set; }
}

public class VendorFormViewModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(150)]
    public string? ContactPerson { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    [EmailAddress]
    [StringLength(120)]
    public string? Email { get; set; }

    [StringLength(300)]
    public string? Address { get; set; }
}

public class CustomerFormViewModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(150)]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [EmailAddress]
    [StringLength(120)]
    public string? Email { get; set; }
}

public class EntityListViewModel<T>
{
    public string? Search { get; set; }
    public PagedResult<T> PagedItems { get; set; } = new();
}
