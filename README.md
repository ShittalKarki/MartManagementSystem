# Daily Deals - Inventory Management System

A comprehensive web-based inventory management system designed specifically for marts and retail stores in Nepal. The system provides real-time inventory tracking, purchase and sales management, automated alerts, and professional invoicing capabilities.

## 🌟 Features

### Core Inventory Management
- **Product Management**: Complete CRUD operations for products with SKU and barcode support
- **Category Hierarchy**: Sophisticated product categorization following retail standards:
  - Line of Business (LOB)
  - Department
  - Sub-Department
  - Product Class
  - Subclass
  - Merchandise
- **Stock Control**: Real-time stock tracking with reorder level alerts
- **Multi-unit Support**: Flexible unit management (pcs, kg, liters, etc.)

### Purchase Management
- **Wholesale Purchases**: Create purchase orders from vendors/warehouses
- **Vendor Management**: Maintain vendor information and contact details
- **Automated Stock Updates**: Inventory automatically updates when purchases are recorded
- **Purchase Invoices**: Generate professional purchase invoices with unique numbers

### Sales Management
- **Retail & Bulk Sales**: Handle both individual and bulk customer orders
- **Customer Management**: Track customer information and purchase history
- **Discount System**: Flexible discount percentages for bulk orders and promotions
- **Sales Invoices**: Professional sales invoices with discount calculations
- **NPR Currency**: Native support for Nepali Rupees

### Real-time Features
- **Live Updates**: SignalR integration for real-time stock updates
- **Low Stock Alerts**: Automatic notifications when products reach reorder levels
- **Dashboard Monitoring**: Real-time statistics and alerts display

### Professional Interface
- **Modern Design**: Clean, professional interface with light color schemes
- **Responsive Layout**: Fully responsive design for all device sizes
- **Intuitive Navigation**: Tab-based interface for easy access to all features
- **Visual Feedback**: Toast notifications and loading states

## 🏗️ Architecture

### Backend (ASP.NET Core Web API)
- **Framework**: .NET 9.0
- **Database**: SQLite with Entity Framework Core
- **Real-time**: SignalR for live updates
- **API Documentation**: Swagger/OpenAPI integration
- **CORS**: Configured for frontend integration

### Frontend (HTML/CSS/JavaScript)
- **Vanilla JavaScript**: No framework dependencies
- **Modern CSS**: CSS Grid, Flexbox, and custom properties
- **Responsive Design**: Mobile-first approach
- **SignalR Client**: Real-time communication with backend

## 📁 Project Structure

```
├── Backend/
│   └── MartInventory.Api/
│       ├── Controllers/          # API endpoints
│       ├── Data/                 # Database context and initializer
│       ├── Models/               # Entity models
│       ├── Services/             # Business logic
│       ├── Hubs/                 # SignalR hubs
│       └── Program.cs            # Application configuration
├── frontend/
│   ├── login.html               # Login page with role selection
│   ├── login-styles.css         # Login page styling
│   ├── login-script.js          # Login page functionality
│   ├── index.html               # Manager dashboard interface
│   ├── styles.css               # Manager dashboard styling
│   ├── script.js                # Manager dashboard logic
│   ├── customer-dashboard.html  # Customer shopping interface
│   ├── customer-styles.css      # Customer dashboard styling
│   └── customer-script.js       # Customer dashboard functionality
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites
- .NET 9.0 SDK
- Modern web browser
- Code editor (VS Code, Visual Studio, etc.)

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend/MartInventory.Api
   ```

2. Restore NuGet packages:
   ```bash
   dotnet restore
   ```

3. Build the project:
   ```bash
   dotnet build
   ```

4. Run the application:
   ```bash
   dotnet run
   ```

5. Access the API at: `http://localhost:5000`
6. Access Swagger documentation at: `http://localhost:5000/swagger`

### Frontend Setup

#### Manager Dashboard
1. Open the `frontend/index.html` file in a web browser
2. The application will automatically connect to the backend API
3. Ensure the backend is running for full functionality

#### Customer Dashboard
1. Open the `frontend/login.html` file in a web browser
2. Choose "Customer" role or "Continue as Guest"
3. Browse products by category, search, and add items to cart
4. Complete checkout process with delivery information

#### Login System
- **Customer Access**: Browse products, manage cart, place orders
- **Manager Access**: Full inventory management capabilities
- **Guest Mode**: Browse and order without account creation

## 📊 Database Schema

### Core Entities
- **Products**: SKU, name, description, prices, stock levels
- **Category Hierarchy**: Complete product categorization system
- **Vendors**: Supplier information and contact details
- **Customers**: Customer profiles and contact information

### Transaction Entities
- **Purchase Orders**: Wholesale purchases with line items
- **Sales Orders**: Customer sales with discount support
- **Inventory Alerts**: Low stock notifications and tracking

## 🔌 API Endpoints

### Products
- `GET /api/products` - Get all products
- `GET /api/products/{id}` - Get product by ID
- `POST /api/products` - Create new product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Orders
- `POST /api/orders/purchase` - Create purchase order
- `GET /api/orders/purchase/{id}` - Get purchase order
- `POST /api/orders/sale` - Create sales order
- `GET /api/orders/sale/{id}` - Get sales order
- `GET /api/orders/alerts` - Get inventory alerts
- `POST /api/orders/alerts/{id}/resolve` - Resolve alert

### Reference Data
- `GET /api/referencedata/categories` - Get category hierarchy
- `GET /api/referencedata/vendors` - Get all vendors
- `GET /api/referencedata/customers` - Get all customers

## 🎨 UI Features

### Dashboard
- **Statistics Cards**: Total products, low stock alerts, daily sales/purchases
- **Recent Alerts**: Live low stock notifications
- **Quick Actions**: Fast access to common operations

### Product Management
- **Data Tables**: Sortable product listings
- **Search & Filter**: Easy product discovery
- **Bulk Operations**: Efficient product management

### Purchase & Sales
- **Dynamic Forms**: Add/remove line items dynamically
- **Auto-calculations**: Automatic totals and discounts
- **Invoice Generation**: Professional invoice numbers

## 🔒 Security Features

- **CORS Configuration**: Secure cross-origin requests
- **Input Validation**: Server-side data validation
- **Error Handling**: Comprehensive error management
- **Logging**: Application activity logging

## 📱 Responsive Design

- **Mobile-First**: Optimized for mobile devices
- **Tablet Support**: Responsive layouts for tablets
- **Desktop Experience**: Full-featured desktop interface
- **Touch-Friendly**: Optimized for touch interactions

## 🚀 Deployment

### Backend Deployment
- **Self-Hosted**: Run on Windows/Linux servers
- **Container Support**: Docker containerization ready
- **Database**: SQLite for development, SQL Server for production

### Frontend Deployment
- **Static Hosting**: Deploy to any web server
- **CDN Ready**: Optimized for content delivery networks
- **PWA Ready**: Progressive web app capabilities

## 🔧 Configuration

### Backend Configuration
- **Database Connection**: Configure in `appsettings.json`
- **CORS Policy**: Customize allowed origins
- **Logging Levels**: Adjust logging verbosity

### Frontend Configuration
- **API Endpoint**: Update API base URL in `script.js`
- **SignalR Hub**: Configure real-time connection URL

## 📈 Future Enhancements

- **Barcode Scanner Integration**: Hardware barcode scanner support
- **Print Services**: Physical invoice printing
- **Advanced Analytics**: Sales trends and inventory reports
- **Multi-location Support**: Multiple store management
- **User Management**: Role-based access control
- **Backup & Recovery**: Automated data backup systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🎯 Use Cases

### Perfect For:
- **Retail Stores**: Small to medium-sized retail operations
- **Grocery Stores**: Food and household item management
- **Electronics Shops**: Appliance and gadget inventory
- **Department Stores**: Multi-category retail management
- **Wholesale Operations**: Bulk purchase and sales tracking

### Industries:
- **Retail**: General retail operations
- **Food & Beverage**: Grocery and food service
- **Electronics**: Consumer electronics and appliances
- **Household**: Cleaning and personal care products
- **Stationery**: Office supplies and educational materials

---

**Built with ❤️ for the Daily Deals business community**
