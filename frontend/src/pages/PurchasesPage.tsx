import { useEffect, useMemo, useState } from 'react';
import { getProducts, getVendors, createPurchase, Product } from '../services/api';

export function PurchasesPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Array<{ id: number; name: string }>>([]);
  const [vendorId, setVendorId] = useState<number | null>(null);
  const [lines, setLines] = useState<{ productId: number | null; quantity: number; unitPrice: number }[]>([
    { productId: null, quantity: 1, unitPrice: 0 }
  ]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  useEffect(() => { getProducts().then(setProducts); getVendors().then(setVendors); }, []);
  useEffect(() => { import('../services/api').then(m => m.getPurchases()).then(setRecentPurchases); }, []);

  const total = useMemo(() => lines.reduce((s, l) => s + (l.unitPrice * l.quantity), 0), [lines]);

  function updateLine(index: number, changes: Partial<typeof lines[0]>) {
    setLines(prev => prev.map((l,i) => i===index ? { ...l, ...changes } : l));
  }
  function addLine() { setLines(prev => [...prev, { productId: null, quantity: 1, unitPrice: 0 }]); }
  function removeLine(i:number) { setLines(prev => prev.filter((_,idx)=>idx!==i)); }

  async function handleSubmit(e?: any) {
    if (e) e.preventDefault();
    if (!vendorId) { setMessage('Select a vendor'); return; }
    if (lines.length === 0) { setMessage('Add at least one line'); return; }
    const payload = { vendorId, lines: lines.map(l => ({ productId: l.productId!, quantity: l.quantity, unitPrice: l.unitPrice })) };
    setBusy(true); setMessage(null);
    try {
      const created = await createPurchase(payload);
      setMessage(`Purchase created: ${created.invoiceNumber ?? 'OK'}`);
      setLines([{ productId: null, quantity: 1, unitPrice: 0 }]);
      setVendorId(null);
    } catch (err: any) {
      setMessage(err?.response?.data?.title ?? err?.message ?? 'Error creating purchase');
    } finally { setBusy(false); }
  }

  async function handleDeletePurchase(id: number) {
    if (!confirm('Delete this purchase and revert stock?')) return;
    try {
      await (await import('../services/api')).deletePurchase(id);
      setRecentPurchases(prev => prev.filter(p => p.id !== id));
      setMessage('Purchase deleted and stock adjusted.');
    } catch (err: any) {
      setMessage(err?.response?.data?.title ?? err?.message ?? 'Error deleting purchase');
    }
  }

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">Procurement</div>
          <h1>Purchases</h1>
          <p>Create purchase orders and receive stock into inventory.</p>
        </div>
      </div>

      <form className="panel product-form" onSubmit={handleSubmit}>
        <div className="panel-header">
          <div>
            <h2>Create Purchase Order</h2>
            <p>Select vendor and add lines below.</p>
          </div>
          <div className="form-actions">
            <button type="button" className="ghost-btn" onClick={addLine}>Add line</button>
            <button className="primary-btn" type="submit" disabled={busy}>{busy? 'Saving...' : 'Create Purchase'}</button>
          </div>
        </div>

        <label>
          <span>Vendor</span>
          <select value={vendorId ?? ''} onChange={e => setVendorId(Number(e.target.value) || null)}>
            <option value="">-- Select vendor --</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </label>

        <div className="form-grid">
          <div className="span-2"><strong>Item</strong></div>
          <div><strong>Qty</strong></div>
          <div><strong>Unit Price</strong></div>
        </div>

        {lines.map((line, i) => (
          <div key={i} className="form-grid">
            <div>
              <select value={line.productId ?? ''} onChange={e => {
                const id = Number(e.target.value) || null;
                const prod = products.find(p => p.id === id);
                updateLine(i, { productId: id, unitPrice: prod ? prod.purchasePrice : 0 });
              }}>
                <option value="">-- Select product --</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name} — {p.sku}</option>)}
              </select>
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
            <div>Total: {total.toFixed(2)}</div>
          </div>
          <div>
            {message ? <div className="form-error">{message}</div> : null}
          </div>
        </div>
      </form>

      <div className="panel">
        <div className="panel-header">
          <div><h2>Recent Purchases</h2></div>
        </div>
        <div className="stack-list">
          {recentPurchases.map(p => (
            <div key={p.id} className="list-row">
              <div>
                <strong>{p.invoiceNumber}</strong>
                <span>{p.vendor?.name ?? 'Vendor'}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="ghost-btn" onClick={() => window.open(`/invoice?type=purchase&id=${p.id}`, '_blank')}>View</button>
                <button className="ghost-btn danger" onClick={() => handleDeletePurchase(p.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
