# Project Overview - Mart Management System

## Objective

Mart Management System is a diploma-level, submission-ready ASP.NET Core MVC application designed to manage day-to-day retail operations: stock, purchasing, sales billing, customer/supplier records, and role-based administration.

## Architecture

- Presentation Layer: Razor Views + Bootstrap 5 + JavaScript
- Application Layer: MVC Controllers + ViewModels + Services
- Data Layer: Entity Framework Core with ApplicationDbContext
- Security: ASP.NET Core Identity with role-based authorization

## Main Components

- Controllers
  - API controllers for integration endpoints (`/api/*`)
  - MVC controllers for admin workflows (`/products`, `/sales`, `/reports`, etc.)
- Data
  - `ApplicationDbContext` as the single EF Core context
  - `DbInitializer` for startup migration + demo seed
- Services
  - `InventoryService` handles transactional stock logic for purchases and sales
- ViewModels
  - Form and listing models with validation attributes
- Helpers
  - `PagedResult<T>` for reusable pagination logic

## Functional Flow

1. User logs in with Identity cookies.
2. Role check controls access to admin actions.
3. Dashboard summarizes KPIs and trend chart.
4. CRUD modules maintain master data (product/category/supplier/customer).
5. Purchase flow increases stock and records stock movement.
6. Sales flow validates stock, decreases inventory, and creates invoice.
7. Reports summarize performance and provide CSV export.
8. User management allows admin to assign roles.

## Data Model Summary

- Identity: `ApplicationUser`, Identity roles/claims tables
- Master data: `Product`, `Category`, `Vendor`, `Customer`
- Transactions: `PurchaseOrder`, `PurchaseOrderLine`, `SalesOrder`, `SalesOrderLine`
- Inventory: `StockMovement`, `InventoryAlert`

## Non-Functional Highlights

- Clean naming and layered structure
- Async database operations throughout
- Model validation and anti-forgery on forms
- Reusable Bootstrap-based responsive UI shell
- Migration-ready EF Core setup for SQL Server and SQLite

## Suggested Next Enhancements

- Add product image persistence field and upload UI binding
- Add monthly trend charts in reports page
- Add PDF invoice export
- Add activity log table for audit trail
- Add integration tests for purchase/sale stock transactions
