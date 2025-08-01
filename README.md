# Mart Management System

Professional mart ERP platform with an ASP.NET Core Web API backend, JWT authentication, Entity Framework Core, PostgreSQL support, and a modern React frontend for admin/staff operations and customer shopping.

## Stack

- ASP.NET Core Web API / Identity backend with JWT authentication (.NET 9 in current codebase; structure compatible with .NET 8 migration)
- C# + Entity Framework Core (Code First)
- PostgreSQL, SQL Server, and SQLite (development toggle)
- React + Vite + TypeScript + modern CSS

## Implemented Modules

- Authentication and authorization with JWT + role-based access control
- Roles for Admin, Staff, and Customer
- Dashboard with KPI cards, revenue analytics, low-stock alerts, and recent activity
- Product management with search/filter/pagination
- Category management CRUD
- Supplier management CRUD
- Customer management CRUD
- Purchase workflow with multi-line entry and stock-in automation
- Sales workflow with multi-line entry, tax/discount inputs, stock-out checks, and invoice viewing
- Inventory management with stock adjustments and movement history
- Reports summary screen + CSV export endpoints
- User management and role assignment
- React frontend with separate admin/staff and customer layouts

## Project Structure

```text
MartManagementSystem/
   Backend/
      MartInventory.Api/
         Controllers/
         Data/
         Helpers/
         Hubs/
         Migrations/
         Models/
         Services/
         ViewModels/
         Views/
         wwwroot/
         Program.cs
   frontend/
      src/
      package.json
      vite.config.ts
```

## Setup

1. Open terminal at project root.
2. Build backend:

```powershell
dotnet build "Backend/MartInventory.Api/MartInventory.Api.csproj"
```

3. Run backend:

```powershell
dotnet run --project "Backend/MartInventory.Api/MartInventory.Api.csproj"
```

4. Install frontend deps and run React app:

```powershell
cd frontend
npm install
npm run dev
```

5. Open:

- Backend API: http://localhost:5171
- React frontend: http://localhost:5173

## Default Login Credentials

- Admin
   - Email: admin@mart.local
   - Password: P@ssw0rd!23
- Staff
   - Email: staff@mart.local
   - Password: P@ssw0rd!23
- Customer
   - Email: customer@mart.local
   - Password: P@ssw0rd!23

## Database Configuration

Development currently uses SQLite for quick run (`UseInMemoryDatabase = true` in appsettings.Development.json).

PostgreSQL can be enabled by pointing `ConnectionStrings:Default` at your database and disabling the SQLite toggle.

For SQL Server:

1. Set `UseInMemoryDatabase` to `false`.
2. Set `ConnectionStrings:Default` in appsettings.Development.json.
3. Run migration update.

## Entity Framework Migrations

Migration files are included in `Backend/MartInventory.Api/Migrations`.

Common commands:

```powershell
dotnet ef migrations add <MigrationName> --project "Backend/MartInventory.Api/MartInventory.Api.csproj" --startup-project "Backend/MartInventory.Api/MartInventory.Api.csproj"
dotnet ef database update --project "Backend/MartInventory.Api/MartInventory.Api.csproj" --startup-project "Backend/MartInventory.Api/MartInventory.Api.csproj"
```

## Key Notes

- If build fails with MSB3027/MSB3021, stop running API process and build again.
- Use the explicit project path in `dotnet run --project ...` to avoid wrong working-directory issues.
- SQLite path is now fixed to project content root, so data file is stable across terminal locations.
- The React app is the preferred UI entry point going forward.

## Documentation

- Project overview: `docs/ProjectOverview.md`
- **Household**: Cleaning and personal care products
- **Stationery**: Office supplies and educational materials

---

**Built with ❤️ for the Daily Deals business community**
