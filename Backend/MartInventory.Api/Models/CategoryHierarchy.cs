namespace MartInventory.Api.Models
{
	public class LineOfBusiness
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
	}

	public class Department
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public int LineOfBusinessId { get; set; }
		public LineOfBusiness LineOfBusiness { get; set; } = null!;
	}

	public class SubDepartment
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public int DepartmentId { get; set; }
		public Department Department { get; set; } = null!;
	}

	public class ProductClass
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public int SubDepartmentId { get; set; }
		public SubDepartment SubDepartment { get; set; } = null!;
	}

	public class Subclass
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public int ProductClassId { get; set; }
		public ProductClass ProductClass { get; set; } = null!;
	}

	public class Merchandise
	{
		public int Id { get; set; }
		public string Name { get; set; } = string.Empty;
		public int SubclassId { get; set; }
		public Subclass Subclass { get; set; } = null!;
	}
}



