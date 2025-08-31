import { ShoppingCart, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { addToCart } from '../services/cart';
import { Category, getCategories, getProducts, Product } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    Promise.all([getProducts(), getCategories()]).then(([items, categoryItems]) => {
      setProducts(items);
      setCategories(categoryItems);
    });
  }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesQuery = [product.name, product.sku, product.barcode ?? ''].join(' ').toLowerCase().includes(query.toLowerCase());
    const matchesCategory = !categoryId || String(product.categoryId) === categoryId;
    return matchesQuery && matchesCategory;
  }), [products, query, categoryId]);

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    setMessage(`${product.name} added to cart.`);
  };

  return (
    <SectionPage kicker="Storefront" title="Shop" description="Browse products and add them to a customer cart.">
      <div className="panel filter-panel">
        <div className="filter-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" /></div>
        <div className="filter-input compact">
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </div>
      </div>

      {message ? <div className="panel"><strong>{message}</strong></div> : null}

      <div className="dashboard-grid">
        {filtered.map((product) => (
          <article key={product.id} className="panel">
            <div className="panel-header">
              <div>
                <h2>{product.name}</h2>
                <p>{product.sku}</p>
              </div>
              <button className="ghost-btn" onClick={() => handleAddToCart(product)}><ShoppingCart size={16} /> Add</button>
            </div>
            <div className="stack-list">
              <div className="list-row"><span>Category</span><strong>{product.category?.name ?? '-'}</strong></div>
              <div className="list-row"><span>Price</span><strong>{Number(product.sellingPrice).toLocaleString()}</strong></div>
              <div className="list-row"><span>Stock</span><strong>{product.stockOnHand}</strong></div>
            </div>
          </article>
        ))}
      </div>
    </SectionPage>
  );
}