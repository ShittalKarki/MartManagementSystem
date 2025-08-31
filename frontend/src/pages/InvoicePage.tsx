import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPurchases, getSales } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function InvoicePage() {
  const [params] = useSearchParams();
  const type = params.get('type') ?? 'sale';
  const id = Number(params.get('id') ?? 0);
  const [saleItems, setSaleItems] = useState<any[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

  useEffect(() => {
    getSales().then(setSaleItems);
    getPurchases().then(setPurchaseItems);
  }, []);

  const invoice = useMemo(() => {
    if (type === 'purchase') {
      return purchaseItems.find((item) => item.id === id);
    }

    return saleItems.find((item) => item.id === id);
  }, [type, id, saleItems, purchaseItems]);

  if (!invoice) {
    return (
      <SectionPage kicker="Invoice" title="Invoice" description="Open an invoice from sales, purchases, or customer orders.">
        <div className="panel">Select an invoice from Sales, Purchases, or Orders.</div>
      </SectionPage>
    );
  }

  const lines = type === 'purchase' ? invoice.lines ?? invoice.Lines ?? [] : invoice.lines ?? invoice.Lines ?? [];
  const customerName = invoice.customer?.name ?? invoice.Customer?.name ?? 'Walk-in';
  const vendorName = invoice.vendor?.name ?? invoice.Vendor?.name ?? 'Vendor';
  const total = Number(invoice.totalAmount ?? invoice.TotalAmount ?? 0);

  return (
    <SectionPage kicker="Invoice" title={invoice.invoiceNumber ?? invoice.InvoiceNumber ?? 'Invoice'} description="Printable order summary.">
      <div className="panel">
        <div className="panel-header">
          <div>
            <h2>{type === 'purchase' ? vendorName : customerName}</h2>
            <p>{new Date(invoice.soldAt ?? invoice.SoldAt ?? invoice.orderedAt ?? invoice.OrderedAt ?? Date.now()).toLocaleString()}</p>
          </div>
          <strong>Total: {total.toLocaleString()}</strong>
        </div>

        <table className="erp-table">
          <thead><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Line Total</th></tr></thead>
          <tbody>
            {lines.map((line: any, index: number) => (
              <tr key={index}>
                <td>{line.productName ?? line.ProductName ?? line.product?.name ?? line.Product?.name ?? 'Product'}</td>
                <td>{line.quantity ?? line.Quantity}</td>
                <td>{Number(line.unitPrice ?? line.UnitPrice ?? 0).toLocaleString()}</td>
                <td>{Number(line.lineTotal ?? line.LineTotal ?? 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPage>
  );
}