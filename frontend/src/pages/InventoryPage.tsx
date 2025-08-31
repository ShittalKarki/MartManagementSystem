import { PackageCheck, PackageX, RotateCw, Search } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import api, { Product, getLowStockProducts, getProducts, getStockMovements } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const [allProducts, lowStockItems, stockMovements] = await Promise.all([getProducts(), getLowStockProducts(), getStockMovements()]);
    setProducts(allProducts);
    setLowStock(lowStockItems);
    setMovements(stockMovements);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProducts = useMemo(() => products.filter((product) => [product.name, product.sku].join(' ').toLowerCase().includes(query.toLowerCase())), [products, query]);

  const handleAdjust = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    await api.post('/stockmovement/adjust', { productId: Number(productId), quantity, notes });
    setProductId('');
    setQuantity(1);
    setNotes('');
    setMessage('Stock updated successfully.');
    await load();
  };

  return (
    <SectionPage kicker="Warehouse" title="Inventory" description="Monitor stock levels and record manual stock adjustments.">
      <section className="kpi-grid">
        <article className="kpi-card tone-blue"><div className="kpi-icon"><PackageCheck size={20} /></div><div><span>Products</span><strong>{products.length}</strong></div></article>
        <article className="kpi-card tone-amber"><div className="kpi-icon"><PackageX size={20} /></div><div><span>Low Stock</span><strong>{lowStock.length}</strong></div></article>
        <article className="kpi-card tone-green"><div className="kpi-icon"><RotateCw size={20} /></div><div><span>Movements</span><strong>{movements.length}</strong></div></article>
      </section>

      <div className="panel product-workspace">
        <div className="panel-header"><div><h2>Manual Adjustment</h2><p>Adjust stock with a reason for audit tracking.</p></div></div>
        <form className="product-form" onSubmit={handleAdjust}>
          <div className="form-grid">
            <label><span>Product</span><select value={productId} onChange={(event) => setProductId(event.target.value)} required><option value="">Select product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} ({product.sku})</option>)}</select></label>
            <label><span>Quantity</span><input type="number" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} required /></label>
            <label className="span-2"><span>Reason</span><input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Damaged goods, counted difference, etc." /></label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">Adjust Stock</button>
            {message ? <div className="form-success">{message}</div> : null}
          </div>
        </form>
      </div>

      <div className="panel filter-panel">
        <div className="filter-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></div>
      </div>

      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>SKU</th><th>Product</th><th>Stock</th><th>Threshold</th></tr></thead>
          <tbody>{filteredProducts.map((product) => <tr key={product.id}><td>{product.sku}</td><td>{product.name}</td><td>{product.stockOnHand}</td><td>{product.reorderLevel}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="panel">
        <div className="panel-header"><div><h2>Recent Movements</h2></div></div>
        <div className="stack-list">
          {movements.slice(0, 8).map((movement) => (
            <div key={movement.id} className="list-row">
              <div><strong>{movement.product?.name ?? 'Product'}</strong><span>{movement.reference}</span></div>
              <span>{movement.quantity}</span>
            </div>
          ))}
        </div>
      </div>
    </SectionPage>
  );
}