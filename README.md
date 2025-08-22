# Mart Management System

A full-stack **ASP.NET Core MVC** application for retail mart operations: products, inventory, purchases, sales/billing, customers, suppliers, reports, and role-based user management.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | ASP.NET Core MVC 9, C# |
| ORM | Entity Framework Core 9 |
| Database | SQL Server (LocalDB by default) |
| Frontend | Razor Views, Bootstrap 5, JavaScript, Chart.js |
| Export | ClosedXML (Excel) |

## Project Structure

```
MartManagementSystem/
├── MartManagement.Web/          # Main MVC application (run this)
│   ├── Controllers/
│   ├── Models/
│   ├── ViewModels/
│   ├── Views/
│   ├── Services/
│   ├── Data/
│   ├── Migrations/
│   ├── Helpers/
│   ├── Middleware/
│   └── wwwroot/
├── Backend/MartInventory.Api/   # Legacy Web API (optional)
└── frontend/                    # Legacy static HTML (optional)
```

## Prerequisites

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [SQL Server](https://www.microsoft.com/sql-server) or **SQL Server LocalDB** (included with Visual Studio)

## Setup Instructions

### 1. Clone and open

```bash
git clone <your-repo-url>
cd MartManagementSystem
```

### 2. Configure database connection

Edit `MartManagement.Web/appsettings.json`:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=MartManagementDb;Trusted_Connection=True;MultipleActiveResultSets=true;TrustServerCertificate=True"
}
```

For full SQL Server, use:

```json
"DefaultConnection": "Server=YOUR_SERVER;Database=MartManagementDb;User Id=sa;Password=YOUR_PASSWORD;TrustServerCertificate=True"
```

### 3. Apply database migrations

```bash
cd MartManagement.Web
dotnet ef database update
```

On first run, the app applies migrations and creates **default roles + admin account** only. Optional demo catalog: set `"SeedDemoData": true` in `appsettings.json`.

### 4. Run the application

```bash
dotnet run --project MartManagement.Web
```

Open the URL shown in the console (typically `https://localhost:7xxx`).

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| **Admin** | `admin` | `Admin@123` |
| **Staff** | `staff` | `Staff@123` |
| **Customer** | `customer` | `Customer@123` |

> Change these passwords after deployment.

## Roles (simplified for demo)

| Role | What they can do |
|------|------------------|
| **Admin** | Full store management: products, categories, inventory, purchases, suppliers, reports, users, sales |
| **Staff** | Daily operations: create sales/billing, view products, update stock — no user or catalog management |
| **Customer** | Online shop: browse products, cart checkout, order history, profile |

## Features

- **Authentication**: Cookie-based login, customer registration, role-based navigation (Admin / Staff / Customer)
- **Dashboard**: Admin KPIs + chart; Staff quick billing; Customer order portal
- **Products**: CRUD, image upload, search, pagination, barcode field
- **Categories / Suppliers / Customers**: Full CRUD with validation
- **Sales & Billing**: Multi-line invoices, tax & discount, printable invoice, stock deduction
- **Purchases**: Supplier orders, automatic stock increase
- **Inventory**: Stock levels, adjustments, movement history, low-stock alerts
- **Reports**: Sales analytics, product stock report, Excel export
- **Users** (Admin): Manage admin and staff accounts only
- **Customer shop**: Session cart, checkout creates invoice and reduces stock
- **UI**: Clean responsive layout — admin/staff sidebar + separate customer shop navbar

## EF Core Commands Reference

```bash
cd MartManagement.Web

# Add a new migration after model changes
dotnet ef migrations add MigrationName

# Update database
dotnet ef database update

# Remove last migration (if not applied)
dotnet ef migrations remove
```

## Building for Submission

```bash
dotnet build MartManagement.Web/MartManagement.Web.csproj
dotnet run --project MartManagement.Web
```

## Security Notes

- Passwords are hashed with ASP.NET Core `PasswordHasher`
- Anti-forgery tokens on all POST forms
- EF Core parameterized queries (SQL injection protection)
- Admin-only areas protected with authorization policies

## License

MIT — suitable for academic / diploma project submission.
