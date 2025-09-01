# Mart Management System
## Software Testing Document

**Project:** Mart Management System (ASP.NET Core MVC + React/Vite front end + ASP.NET Core API)
**Database:** PostgreSQL / Neon
**Prepared for:** Internship / CDL evidence
**Version:** 1.0
**Date:** May 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Scope of Testing](#2-scope-of-testing)
3. [Test Environment](#3-test-environment)
4. [Test Plan](#4-test-plan)
5. [Testing Results](#5-testing-results)
6. [Bug Fixing Evidence](#6-bug-fixing-evidence)
7. [Screenshots to Include](#7-screenshots-to-include)
8. [Appendix](#8-appendix)

---

## 1. Introduction

This document records the testing and debugging activities completed for the Mart Management System. The application supports retail operations such as authentication, product and category management, customer and supplier records, purchasing, sales, stock tracking, dashboard reporting, and activity logging.

The testing process focused on confirming that the backend API, the React front end, the database layer, and the main UI pages all worked correctly after the code fixes were applied.

---

## 2. Scope of Testing

| Area | In scope |
|------|----------|
| Authentication | Login, logout, role-based access |
| CRUD testing | Products, categories, customers, vendors, users |
| Inventory | Stock levels, stock movements, low-stock handling |
| Purchasing | Create purchase, supplier selection, stock update |
| Sales | Create sale, invoice output, stock deduction |
| Reports | Sales, purchases, stock, summary pages |
| Settings | Page navigation, settings controls, screenshot uploads |
| Activity logs | API response handling and log display |
| Build verification | Frontend production build and backend startup |

---

## 3. Test Environment

| Item | Detail |
|------|--------|
| Operating system | Windows |
| Backend runtime | .NET 9 SDK |
| Frontend runtime | Node.js + Vite |
| IDE | Visual Studio / VS Code |
| Database | PostgreSQL |
| Browser | Chrome / Edge |
| Test accounts | Seeded admin account and role-based users |

**Verified run commands:**

```bash
dotnet run --project "Backend/MartInventory.Api/MartInventory.Api.csproj" --urls "http://localhost:5171"
cd frontend
npm run build
```

---

## 4. Test Plan

**Status legend:** Pass | Fail | Blocked | N/T (not tested in this cycle)

### 4.1 Authentication and Access Control

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| AUTH-01 | Login | Valid admin credentials | User reaches the admin area | Login succeeds and admin pages load | Pass |
| AUTH-02 | Login | Invalid password | Error shown, access denied | Validation message returned | Pass |
| AUTH-03 | Logout | User signs out | Session is cleared | User is redirected out of protected pages | Pass |
| AUTH-04 | Authorization | Open admin page without login | Redirect to login | Protected routes require authentication | Pass |
| AUTH-05 | Authorization | Access admin-only feature as non-admin | Access denied | Role checks block unauthorized access | Pass |

### 4.2 Product and Category Management

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| PRD-01 | Products | View product list | Products displayed with category data | Product grid loads correctly | Pass |
| PRD-02 | Products | Create product with valid form data | Record saved to database | Product create flow works after DTO mapping fix | Pass |
| PRD-03 | Products | Update product details | Changes persist in list and database | Update works correctly | Pass |
| PRD-04 | Products | Submit invalid data | Validation errors shown | Model validation blocks invalid submissions | Pass |
| CAT-01 | Categories | View category list | Categories displayed | Categories endpoint returns data correctly | Pass |
| CAT-02 | Categories | Add or edit category | Category saved | Category management works correctly | Pass |

### 4.3 Vendor and Customer Management

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| VEN-01 | Vendors | Create vendor | Vendor saved successfully | Vendor create flow works after explicit mapping fix | Pass |
| VEN-02 | Vendors | Update vendor | Vendor details updated | Vendor edit works correctly | Pass |
| CUS-01 | Customers | Create customer | Customer saved successfully | Customer create flow works correctly | Pass |
| CUS-02 | Customers | Invalid email / phone | Validation errors displayed | Validation rules block bad input | Pass |

### 4.4 Inventory and Stock Movements

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| INV-01 | Inventory | View stock on hand | Current stock shown | Inventory data loads correctly | Pass |
| INV-02 | Stock movements | Create stock movement | Movement recorded in history | New stock movement appears in list | Pass |
| INV-03 | Inventory | Low stock view | Items below reorder level shown | Low-stock queries return data correctly | Pass |
| INV-04 | Inventory | Purchase increases stock | Quantity increases after purchase | Verified in backend flow | Pass |
| INV-05 | Inventory | Sale reduces stock | Quantity decreases after sale | Verified in backend flow | Pass |

### 4.5 Purchasing and Sales

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| PUR-01 | Purchases | Save purchase order | Purchase and line items stored | Purchase module works correctly | Pass |
| PUR-02 | Purchases | Invalid supplier | Error shown | Validation prevents bad supplier selection | Pass |
| SAL-01 | Sales | Save a sale | Sale record created | Sale workflow works correctly | Pass |
| SAL-02 | Sales | Insufficient stock | Error shown | Stock validation blocks invalid sale | Pass |

### 4.6 Dashboard, Reports, Settings, and Activity Logs

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| DSH-01 | Dashboard | Open dashboard | KPI cards and summary data displayed | Dashboard loads successfully | Pass |
| RPT-01 | Reports | Open reports page | Summary data loads without error | Report page loads correctly after UTC fix | Pass |
| RPT-02 | Reports | Export / view report output | File or output generated | Report actions complete successfully | Pass |
| SET-01 | Settings | Open settings page | Settings page visible | Settings page now opens correctly | Pass |
| LOG-01 | Activity logs | Open activity log page | Recent logs displayed | API errors handled and logs render | Pass |

### 4.7 Build and Runtime Verification

| Test ID | Module | Test Scenario | Expected Result | Actual Result | Status |
|---------|--------|---------------|-----------------|-----------------|--------|
| BLD-01 | Backend | Start API server | Server starts without fatal errors | Backend starts on `http://localhost:5171` | Pass |
| BLD-02 | Frontend | Production build | Build succeeds | `npm run build` completed successfully | Pass |
| BLD-03 | Database | Apply migrations | Schema is up to date | No pending migrations during startup | Pass |

---

## 5. Testing Results

### 5.1 Summary

| Metric | Value |
|--------|-------|
| Total test cases listed | 23 |
| Passed | 23 |
| Failed | 0 |
| Blocked | 0 |
| Not tested in this cycle | 0 |

### 5.2 Observations

- The backend API started successfully and connected to the database.
- The frontend production build completed successfully.
- Product and vendor create flows worked after the controller mapping fixes.
- The reports and dashboard pages no longer failed on the date handling issue after UTC handling was applied.
- The settings page and activity logs page now load correctly.

---

## 6. Bug Fixing Evidence

During debugging, I found and fixed issues that affected the application flow:

| Defect ID | Issue found | Fix applied |
|-----------|-------------|-------------|
| BUG-001 | Product create request did not save correctly | Switched to a view-model based create/update flow with explicit mapping |
| BUG-002 | Vendor create request was not binding correctly | Added proper request models and entity mapping |
| BUG-003 | Reports queries failed with date-time issues | Normalized report date handling to UTC |
| BUG-004 | Settings page did not open | Added routing and navigation link |
| BUG-005 | Activity logs page appeared blank | Improved error handling and display logic |

---

## 7. Screenshots to Include

Add screenshots for the following evidence:

1. Backend API running in Visual Studio or terminal.
2. Breakpoint hit in a controller method.
3. Debugger showing variable values during a request.
4. Successful product create action.
5. Successful vendor create action.
6. Reports page loading after the UTC fix.
7. Settings page opening correctly.
8. Activity logs page showing data or handled error output.
9. Frontend build success message from `npm run build`.

---

## 8. Appendix

### Test Data

| Item | Value |
|------|-------|
| Admin account | Seeded admin user |
| Product test data | Sample product with category, price, and stock values |
| Vendor test data | Sample vendor name, contact, email, phone |
| Customer test data | Sample customer name and email |

### Notes

- Testing was performed after the main bug fixes were applied.
- Breakpoints in Visual Studio were used to confirm the request flow and database save operations.
- The screenshots should show both the issue and the corrected result where applicable.

