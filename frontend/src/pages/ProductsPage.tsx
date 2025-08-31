import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Category,
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  Product,
  ProductPayload,
  updateProduct
} from '../services/api';

const emptyForm: ProductPayload = {
  sku: '',
  name: '',
  description: '',
  unit: 'pcs',
  barcode: '',
  purchasePrice: 0,
  sellingPrice: 0,
  vatPercent: 13,
  stockOnHand: 0,
  reorderLevel: 10,
  categoryId: 0
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<ProductPayload>(emptyForm);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [items, cats] = await Promise.all([getProducts(), getCategories()]);
    setProducts(items);
    setCategories(cats);
    if (!selectedId && cats.length > 0 && form.categoryId === 0) {
      setForm((current) => ({ ...current, categoryId: cats[0].id }));
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    return products.filter((product) => {
      const matchesQuery = [product.name, product.sku, product.barcode ?? '']
        .join(' ')
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesCategory = !categoryId || String(product.categoryId) === categoryId;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, categoryId]);

  const startCreate = () => {
    const category = categories[0];
    setSelectedId(null);
    setForm({ ...emptyForm, categoryId: category?.id ?? 0 });
  };

  const startEdit = (product: Product) => {
    setSelectedId(product.id);
    setForm({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      unit: product.unit ?? 'pcs',
      barcode: product.barcode ?? '',
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      vatPercent: product.vatPercent,
      stockOnHand: product.stockOnHand,
      reorderLevel: product.reorderLevel,
      categoryId: product.categoryId
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);

    try {
      if (selectedId) {
        await updateProduct(selectedId, form);
      } else {
        await createProduct(form);
      }
      setSelectedId(null);
      setForm(categories[0] ? { ...emptyForm, categoryId: categories[0].id } : emptyForm);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete ${product.name}?`)) {
      return;
    }

    await deleteProduct(product.id);
    await load();
  };

  return (
    <div className="page-stack">
      <div className="page-title-row">
        <div>
          <div className="eyebrow">Inventory control</div>
          <h1>Products</h1>
          <p>Create, edit, and manage stock records from one workflow.</p>
        </div>
        <button className="primary-btn" onClick={startCreate}><Plus size={16} /> Add Product</button>
      </div>

      <div className="panel product-workspace">
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              <span>SKU</span>
              <input value={form.sku} onChange={(event) => setForm({ ...form, sku: event.target.value })} required />
            </label>
            <label>
              <span>Name</span>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              <span>Category</span>
              <select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })} required>
                <option value={0} disabled>Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Unit</span>
              <input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </label>
            <label>
              <span>Purchase Price</span>
              <input type="number" step="0.01" value={form.purchasePrice} onChange={(event) => setForm({ ...form, purchasePrice: Number(event.target.value) })} />
            </label>
            <label>
              <span>Selling Price</span>
              <input type="number" step="0.01" value={form.sellingPrice} onChange={(event) => setForm({ ...form, sellingPrice: Number(event.target.value) })} />
            </label>
            <label>
              <span>Stock On Hand</span>
              <input type="number" value={form.stockOnHand} onChange={(event) => setForm({ ...form, stockOnHand: Number(event.target.value) })} />
            </label>
            <label>
              <span>Reorder Level</span>
              <input type="number" value={form.reorderLevel} onChange={(event) => setForm({ ...form, reorderLevel: Number(event.target.value) })} />
            </label>
            <label>
              <span>VAT %</span>
              <input type="number" step="0.01" value={form.vatPercent} onChange={(event) => setForm({ ...form, vatPercent: Number(event.target.value) })} />
            </label>
            <label>
              <span>Barcode</span>
              <input value={form.barcode ?? ''} onChange={(event) => setForm({ ...form, barcode: event.target.value })} />
            </label>
            <label className="span-2">
              <span>Description</span>
              <input value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </label>
          </div>

          <div className="form-actions">
            <button className="primary-btn" type="submit" disabled={busy}>{selectedId ? 'Update Product' : 'Save Product'}</button>
            <button className="secondary-btn" type="button" onClick={() => {
              setSelectedId(null);
              setForm(categories[0] ? { ...emptyForm, categoryId: categories[0].id } : emptyForm);
            }}>
              Reset
            </button>
          </div>
        </form>
      </div>

      <div className="panel filter-panel">
        <div className="filter-input">
          <Search size={16} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products, SKU, barcode" />
        </div>
        <div className="filter-input compact">
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="panel table-panel">
        <table className="erp-table">
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Cost</th>
              <th>Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id}>
                <td>{product.sku}</td>
                <td>
                  <div className="table-main-cell">
                    <strong>{product.name}</strong>
                    <span>{product.barcode ?? 'No barcode'}</span>
                  </div>
                </td>
                <td>{product.category?.name ?? 'Unassigned'}</td>
                <td>{product.stockOnHand}</td>
                <td>NPR {Number(product.purchasePrice).toLocaleString()}</td>
                <td>NPR {Number(product.sellingPrice).toLocaleString()}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" type="button" onClick={() => startEdit(product)}><Pencil size={14} /> Edit</button>
                    <button className="ghost-btn danger" type="button" onClick={() => handleDelete(product)}><Trash2 size={14} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
