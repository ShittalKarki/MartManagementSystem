import { ArrowUpRight, CreditCard, PackageCheck, PackageX, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { CategoryScale, Chart as ChartJS, Filler, Legend, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { getDashboardStats, getLowStockProducts, getRecentStockMovements, Product } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const sampleLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function DashboardPage() {
  const [stats, setStats] = useState({ totalProducts: 0, totalCategories: 0, lowStockCount: 0, todaySales: 0, monthSales: 0, todayPurchases: 0 });
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recent, setRecent] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [statsData, lowStockData, recentData] = await Promise.all([
          getDashboardStats(),
          getLowStockProducts(),
          getRecentStockMovements()
        ]);

        setStats({
          totalProducts: statsData.totalProducts ?? 0,
          totalCategories: 0,
          lowStockCount: statsData.lowStockCount ?? lowStockData.length,
          todaySales: 0,
          monthSales: 0,
          todayPurchases: 0
        });
        setLowStock(lowStockData.slice(0, 4));
        setRecent(recentData.slice(0, 4));
      } catch {
        setStats({ totalProducts: 0, totalCategories: 0, lowStockCount: 0, todaySales: 0, monthSales: 0, todayPurchases: 0 });
      }
    };

    load();
  }, []);

  const chartData = {
    labels: sampleLabels,
    datasets: [
      {
        label: 'Revenue',
        data: [32000, 42000, 38000, 51000, 47000, 62000, 74000],
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.18)',
        fill: true,
        tension: 0.35
      }
    ]
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <div className="eyebrow">Business control center</div>
          <h1>Modern ERP dashboard for sales, stock, finance, and operations.</h1>
          <p>Track inventory, monitor revenue, follow up payments, and manage daily business flows from one polished workspace.</p>
          <div className="hero-actions">
            <button className="primary-btn"><ArrowUpRight size={16} /> Create Invoice</button>
            <button className="secondary-btn">View Reports</button>
          </div>
        </div>
        <div className="hero-glass">
          <div className="glass-stat">
            <span>Total Revenue</span>
            <strong>NPR 1.28M</strong>
            <small>+14.2% from last month</small>
          </div>
          <div className="glass-stat accent">
            <span>Pending Payments</span>
            <strong>NPR 240K</strong>
            <small>18 invoices waiting</small>
          </div>
        </div>
      </section>

      <section className="kpi-grid">
        <KpiCard title="Total Products" value={stats.totalProducts} icon={PackageCheck} tone="blue" />
        <KpiCard title="Low Stock" value={stats.lowStockCount} icon={PackageX} tone="amber" />
        <KpiCard title="Today Sales" value="NPR 78,450" icon={TrendingUp} tone="purple" />
        <KpiCard title="Today Purchases" value="NPR 32,000" icon={CreditCard} tone="green" />
      </section>

      <section className="dashboard-grid">
        <article className="panel panel-span-8">
          <div className="panel-header">
            <div>
              <h2>Revenue analytics</h2>
              <p>Weekly sales momentum and financial trend.</p>
            </div>
            <button className="ghost-btn">Export</button>
          </div>
          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(148,163,184,0.18)' } } } }} />
        </article>

        <article className="panel panel-span-4">
          <div className="panel-header">
            <div>
              <h2>Low stock alerts</h2>
              <p>Items nearing reorder level.</p>
            </div>
          </div>
          <div className="stack-list">
            {lowStock.map((item) => (
              <div key={item.id} className="list-row warning">
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.sku}</span>
                </div>
                <span>{item.stockOnHand} left</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-span-5">
          <div className="panel-header">
            <div>
              <h2>Recent transactions</h2>
              <p>Latest stock movement activity.</p>
            </div>
          </div>
          <div className="stack-list">
            {recent.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.product?.name ?? 'Inventory'}</strong>
                  <span>{item.reference}</span>
                </div>
                <span>{item.quantity > 0 ? '+' : ''}{item.quantity}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel panel-span-7">
          <div className="panel-header">
            <div>
              <h2>Notifications</h2>
              <p>Pending payments and operational reminders.</p>
            </div>
          </div>
          <div className="notification-card">
            <span className="dot purple" />
            <div>
              <strong>18 invoices due for follow-up</strong>
              <p>Auto reminders can be sent from the billing module.</p>
            </div>
          </div>
          <div className="notification-card">
            <span className="dot blue" />
            <div>
              <strong>2 suppliers awaiting purchase confirmation</strong>
              <p>Review purchase requests before dispatch.</p>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

function KpiCard({ title, value, icon: Icon, tone }: { title: string; value: string | number; icon: any; tone: 'blue' | 'amber' | 'purple' | 'green'; }) {
  return (
    <article className={`kpi-card tone-${tone}`}>
      <div className="kpi-icon"><Icon size={20} /></div>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
    </article>
  );
}
