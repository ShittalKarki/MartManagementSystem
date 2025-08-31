import { Bell, Box, BriefcaseBusiness, LayoutDashboard, Layers3, LogOut, Menu, PackageSearch, Receipt, Settings, ShoppingCart, Sparkles, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NavLink, Outlet } from 'react-router-dom';
import { AuthUser } from '../services/api';

const adminNavItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Box },
  { to: '/categories', label: 'Categories', icon: Layers3 },
  { to: '/suppliers', label: 'Suppliers', icon: BriefcaseBusiness },
  { to: '/sales', label: 'Sales', icon: Receipt },
  { to: '/purchases', label: 'Purchases', icon: ShoppingCart },
  { to: '/inventory', label: 'Inventory', icon: PackageSearch },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reports', label: 'Reports', icon: Sparkles },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/activity-logs', label: 'Activity Logs', icon: Receipt }
];

type LayoutProps = {
  user: AuthUser;
  onLogout: () => Promise<void>;
};

export function Layout({ user, onLogout }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const showAdminOnly = user.roles.some((role) => role === 'Admin');
  const navItems = adminNavItems.filter((item) => {
    if (showAdminOnly) {
      return true;
    }

    return !['/users', '/reports', '/activity-logs'].includes(item.to);
  });

  return (
    <div className={`app-shell ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
      <aside className="sidebar">
        <div className="brand-row">
          <div>
            <div className="brand-kicker">Business ERP</div>
            <div className="brand-name">Mart Management</div>
          </div>
          <button className="icon-btn mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <Menu size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="secondary-action" onClick={() => navigate('/settings')}><Settings size={16} /> Settings</button>
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
            Smart search, reports, products, users...
          </div>
          <div className="topbar-actions">
            <button className="icon-btn"><Bell size={18} /></button>
            <div className="user-chip">
                <span className="user-avatar">{user.userName.charAt(0).toUpperCase()}</span>
              <div>
                  <div className="user-name">{user.userName}</div>
                  <div className="user-role">{user.roles[0] ?? 'User'}</div>
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
