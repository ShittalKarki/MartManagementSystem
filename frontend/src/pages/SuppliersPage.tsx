import { BriefcaseBusiness, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createSupplier, deleteSupplier, getVendors, Supplier, SupplierPayload, updateSupplier } from '../services/api';
import { SectionPage } from '../components/SectionPage';

const emptyForm: SupplierPayload = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: ''
};

export function SuppliersPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<SupplierPayload>(emptyForm);

  const load = async () => setItems(await getVendors());

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => items.filter((item) => [item.name, item.contactPerson ?? '', item.phone ?? ''].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query]);

  const startCreate = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const startEdit = (supplier: Supplier) => {
    setSelectedId(supplier.id);
    setForm(supplier);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId) {
      await updateSupplier(selectedId, form);
    } else {
      await createSupplier(form);
    }
    startCreate();
    await load();
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Delete ${supplier.name}?`)) return;
    await deleteSupplier(supplier.id);
    await load();
  };

  return (
    <SectionPage
      kicker="Procurement"
      title="Suppliers"
      description="Manage supplier contacts and procurement partners."
      actions={<button className="primary-btn" onClick={startCreate}><Plus size={16} /> Add Supplier</button>}
    >
      <div className="panel product-workspace">
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label><span>Contact Person</span><input value={form.contactPerson ?? ''} onChange={(event) => setForm({ ...form, contactPerson: event.target.value })} /></label>
            <label><span>Phone</span><input value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label><span>Email</span><input value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
            <label className="span-2"><span>Address</span><input value={form.address ?? ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">{selectedId ? 'Update Supplier' : 'Save Supplier'}</button>
            <button className="secondary-btn" type="button" onClick={startCreate}>Reset</button>
          </div>
        </form>
      </div>

      <div className="panel filter-panel">
        <div className="filter-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search suppliers" /></div>
      </div>

      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>Name</th><th>Contact</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((supplier) => (
              <tr key={supplier.id}>
                <td>{supplier.name}</td>
                <td>{supplier.contactPerson ?? '-'}</td>
                <td>{supplier.phone ?? '-'}</td>
                <td>{supplier.email ?? '-'}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" type="button" onClick={() => startEdit(supplier)}><Pencil size={14} /> Edit</button>
                    <button className="ghost-btn danger" type="button" onClick={() => handleDelete(supplier)}><Trash2 size={14} /> Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPage>
  );
}