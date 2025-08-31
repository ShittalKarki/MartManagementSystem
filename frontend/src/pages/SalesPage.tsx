import { useEffect, useMemo, useRef, useState } from 'react';
import { getProducts, getCustomers, createSale, Product } from '../services/api';

export function SalesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Array<{ id: number; name: string }>>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const customerSuggest = useMemo(() => customers.filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase())).slice(0,6), [customers, customerQuery]);
  const productSuggest = useMemo(() => products.filter(p => p.name.toLowerCase().includes(productQuery.toLowerCase()) || p.sku.toLowerCase().includes(productQuery.toLowerCase())).slice(0,6), [products, productQuery]);
  const customerRef = useRef<HTMLDivElement | null>(null);
  const [lines, setLines] = useState<{ productId: number | null; quantity: number; unitPrice: number; discountPercent: number; vatPercent: number }[]>([
    { productId: null, quantity: 1, unitPrice: 0, discountPercent: 0, vatPercent: 0 }
  ]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recentSales, setRecentSales] = useState<any[]>([]);

  useEffect(() => { getProducts().then(setProducts); getCustomers().then(setCustomers); }, []);
  useEffect(() => { import('../services/api').then(m => m.getSales()).then(setRecentSales); }, []);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + (l.unitPrice * l.quantity), 0), [lines]);
  const total = useMemo(() => lines.reduce((s, l) => {
    const discounted = l.unitPrice * l.quantity * (1 - (l.discountPercent/100));
    return s + discounted;
  }, 0), [lines]);

  function updateLine(index: number, changes: Partial<typeof lines[0]>) {
    setLines(prev => prev.map((l,i) => i===index ? { ...l, ...changes } : l));
  }

  function addLine() { setLines(prev => [...prev, { productId: null, quantity: 1, unitPrice: 0, discountPercent: 0, vatPercent: 0 }]); }
  function removeLine(i:number) { setLines(prev => prev.filter((_,idx)=>idx!==i)); }

  async function handleSubmit(e?: any) {
    if (e) e.preventDefault();
    if (!customerId) { setMessage('Select a customer'); return; }
    if (lines.length === 0) { setMessage('Add at least one line'); return; }
    const payload = {
      customerId,
      lines: lines.map(l => ({ productId: l.productId!, quantity: l.quantity, unitPrice: l.unitPrice, discountPercent: l.discountPercent, vatPercent: l.vatPercent }))
    };
    setBusy(true); setMessage(null);
    try {
      const created = await createSale(payload);
      setMessage(`Sale created: ${created.invoiceNumber ?? created.invoiceNumber ?? 'OK'}`);
      setLines([{ productId: null, quantity: 1, unitPrice: 0, discountPercent: 0, vatPercent: 0 }]);
      setCustomerId(null);
    } catch (err: any) {
      setMessage(err?.response?.data?.title ?? err?.message ?? 'Error creating sale');
    } finally { setBusy(false); }
  }

  async function handleDeleteSale(id: number) {
    if (!confirm('Delete this sale and revert stock?')) return;
    try {
      await (await import('../services/api')).deleteSale(id);
      setRecentSales(prev => prev.filter(s => s.id !== id));
      setMessage('Sale deleted and stock reverted.');
    } catch (err: any) {
      setMessage(err?.response?.data?.title ?? err?.message ?? 'Error deleting sale');
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">Billing engine</div>
          <h1>Sales</h1>
          <p>Create invoices, charge customers, and update stock automatically.</p>
        </div>
      </div>

      <form className="panel product-form" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <h2>Create Invoice</h2>
            <p>Select customer and add invoice lines below.</p>
          </div>
          <div className="form-actions">
            <button type="button" className="ghost-btn" onClick={addLine}>Add line</button>
            <button className="primary-btn" type="submit" disabled={busy}>{busy? 'Saving...' : 'Create Sale'}</button>
          </div>
        </div>

        <label>
          <span>Customer</span>
          <div style={{ position: 'relative' }} ref={customerRef}>
            <input value={customerQuery} onChange={e => setCustomerQuery(e.target.value)} placeholder="Search customers by name" />
            {customerQuery && customerSuggest.length > 0 && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: '44px', zIndex: 40, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: 8 }}>
                {customerSuggest.map(c => (
                  <div key={c.id} style={{ padding: 8, cursor: 'pointer' }} onClick={() => { setCustomerId(c.id); setCustomerQuery(c.name); }}>
                    {c.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </label>

        <div className="form-grid">
          <div className="span-2"><strong>Item</strong></div>
          <div><strong>Qty</strong></div>
          <div><strong>Unit Price</strong></div>
        </div>

        {lines.map((line, i) => (
          <div key={i} className="form-grid">
            <div>
              <div style={{ position: 'relative' }}>
                <input value={productQuery} onChange={e => setProductQuery(e.target.value)} placeholder="Search products by name or SKU" />
                {productQuery && productSuggest.length > 0 && (
                  <div style={{ position: 'absolute', left: 0, right: 0, top: '44px', zIndex: 40, background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: 8 }}>
                    {productSuggest.map(p => (
                      <div key={p.id} style={{ padding: 8, cursor: 'pointer' }} onClick={() => { updateLine(i, { productId: p.id, unitPrice: p.sellingPrice }); setProductQuery(''); }}>
                        {p.name} — {p.sku}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div style={{ marginTop: 8 }}>
                <input type="number" value={line.discountPercent} min={0} max={100} onChange={e=>updateLine(i,{discountPercent: Number(e.target.value)})} placeholder="Discount %" />
                <input type="number" value={line.vatPercent} min={0} max={100} onChange={e=>updateLine(i,{vatPercent: Number(e.target.value)})} placeholder="VAT %" />
              </div>
            </div>
            <div>
              <input type="number" value={line.quantity} min={1} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} />
            </div>
            <div>
              <input type="number" value={line.unitPrice} min={0} step="0.01" onChange={e => updateLine(i, { unitPrice: Number(e.target.value) })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" className="ghost-btn" onClick={() => removeLine(i)}>Remove</button>
            </div>
          </div>
        ))}

        <div className="panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="eyebrow">Summary</div>
            <div>Subtotal: {subtotal.toFixed(2)}</div>
            <div>Total: {total.toFixed(2)}</div>
          </div>
          <div>
            {message ? <div className="form-error">{message}</div> : null}
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-header">
          <div><h2>Recent Sales</h2></div>
        </div>
        <div className="stack-list">
          {recentSales.map(s => (
            <div key={s.id} className="list-row">
              <div>
                <strong>{s.invoiceNumber}</strong>
                <span>{s.customer?.name ?? 'Walk-in'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost-btn" onClick={() => window.open(`/invoice?type=sale&id=${s.id}`, '_blank')}>View</button>
                <button className="ghost-btn danger" onClick={() => handleDeleteSale(s.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
