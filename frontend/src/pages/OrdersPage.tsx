import { useEffect, useState } from 'react';
import { getSales } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function OrdersPage() {
  const [sales, setSales] = useState<any[]>([]);

  useEffect(() => {
    getSales().then(setSales);
  }, []);

  return (
    <SectionPage kicker="Storefront" title="Orders" description="View recent customer orders and invoice links.">
      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>Invoice</th><th>Customer</th><th>Total</th><th>Date</th><th>Invoice</th></tr></thead>
          <tbody>{sales.map((sale) => <tr key={sale.id}><td>{sale.invoiceNumber}</td><td>{sale.customer?.name ?? 'Walk-in'}</td><td>{Number(sale.totalAmount).toLocaleString()}</td><td>{new Date(sale.soldAt).toLocaleString()}</td><td><a href={`/invoice?type=sale&id=${sale.id}`}>Open</a></td></tr>)}</tbody>
        </table>
      </div>
    </SectionPage>
  );
}