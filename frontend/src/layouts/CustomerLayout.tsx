import { LogOut, Menu, ShoppingBag, ShoppingCart, ReceiptText, Sparkles, UserRound } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthUser } from '../services/api';

const navItems = [
  { to: '/shop', label: 'Shop', icon: ShoppingBag },
  { to: '/cart', label: 'Cart', icon: ShoppingCart },
  { to: '/checkout', label: 'Checkout', icon: Sparkles },
  { to: '/orders', label: 'Orders', icon: ReceiptText },
  { to: '/invoice', label: 'Invoice', icon: UserRound }
];

type LayoutProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function CustomerLayout({ user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className={`app-shell customer-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <aside className="sidebar customer-sidebar">
        <div className="brand-row">
          <div>
            <div className="brand-kicker">Customer Store</div>
            <div className="brand-name">Mart Shopping</div>
          </div>
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <Menu size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/shop'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="secondary-action" onClick={onLogout}><LogOut size={16} /> Logout</button>
        </div>
      </aside>

      <div className="content-shell">
        <header className="topbar">
          <button className="icon-btn" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle sidebar">
            <Menu size={18} />
          </button>
          <div className="search-pill">
            <span className="search-dot" />
            Welcome back, {user.fullName ?? user.userName}
          </div>
          <div className="topbar-actions">
            <div className="user-chip">
              <span className="user-avatar">{(user.fullName ?? user.userName).charAt(0).toUpperCase()}</span>
              <div>
                <div className="user-name">{user.fullName ?? user.userName}</div>
                <div className="user-role">{user.roles[0] ?? 'Customer'}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="page-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}