import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Layout } from './layouts/Layout';
import { CustomerLayout } from './layouts/CustomerLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { CategoriesPage } from './pages/CategoriesPage';
import { PurchasesPage } from './pages/PurchasesPage';
import { SalesPage } from './pages/SalesPage';
import { UsersPage } from './pages/UsersPage';
import { SuppliersPage } from './pages/SuppliersPage';
import { CustomersPage } from './pages/CustomersPage';
import { InventoryPage } from './pages/InventoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { ActivityLogsPage } from './pages/ActivityLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShopPage } from './pages/ShopPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrdersPage } from './pages/OrdersPage';
import { InvoicePage } from './pages/InvoicePage';
import { AuthUser, getCurrentUser, logout } from './services/api';

export default function App() {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);

  useEffect(() => {
    getCurrentUser().then(setUser).catch(() => setUser(null));
  }, []);

  const handleSignedIn = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (user === undefined) {
    return <div className="boot-screen">Loading mart workspace...</div>;
  }

  const isCustomerOnly = Boolean(user && user.roles.includes('Customer') && !user.roles.includes('Admin') && !user.roles.includes('Staff'));

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={isCustomerOnly ? '/shop' : '/'} replace /> : <LoginPage onSignedIn={handleSignedIn} />} />
      <Route path="/register" element={user ? <Navigate to={isCustomerOnly ? '/shop' : '/'} replace /> : <RegisterPage onRegistered={handleSignedIn} />} />
      {!user ? <Route path="*" element={<Navigate to="/login" replace />} /> : null}
      {user && isCustomerOnly ? (
        <Route path="/" element={<CustomerLayout user={user} onLogout={handleLogout} />}>
          <Route index element={<Navigate to="/shop" replace />} />
          <Route path="shop" element={<ShopPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="invoice" element={<InvoicePage />} />
          <Route path="*" element={<Navigate to="/shop" replace />} />
        </Route>
      ) : null}
      {user && !isCustomerOnly ? (
        <Route path="/" element={<Layout user={user} onLogout={handleLogout} />}>
          <Route index element={<DashboardPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="suppliers" element={<SuppliersPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="sales" element={<SalesPage />} />
          <Route path="purchases" element={<PurchasesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="activity-logs" element={<ActivityLogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="invoice" element={<InvoicePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : null}
    </Routes>
  );
}
