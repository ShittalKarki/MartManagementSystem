import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createCustomer, deleteCustomer, getCustomers, CustomerPayload, updateCustomer } from '../services/api';
import { SectionPage } from '../components/SectionPage';

const emptyForm: CustomerPayload = {
  name: '',
  phone: '',
  email: ''
};

export function CustomersPage() {
  const [items, setItems] = useState<Array<{ id: number; name: string; phone?: string | null; email?: string | null }>>([]);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<CustomerPayload>(emptyForm);

  const load = async () => setItems(await getCustomers());

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => items.filter((item) => [item.name, item.phone ?? '', item.email ?? ''].join(' ').toLowerCase().includes(query.toLowerCase())), [items, query]);

  const startCreate = () => {
    setSelectedId(null);
    setForm(emptyForm);
  };

  const startEdit = (customer: { id: number; name: string; phone?: string | null; email?: string | null }) => {
    setSelectedId(customer.id);
    setForm(customer);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId) {
      await updateCustomer(selectedId, form);
    } else {
      await createCustomer(form);
    }
    startCreate();
    await load();
  };

  const handleDelete = async (customer: { id: number; name: string }) => {
    if (!window.confirm(`Delete ${customer.name}?`)) return;
    await deleteCustomer(customer.id);
    await load();
  };

  return (
    <SectionPage
      kicker="CRM"
      title="Customers"
      description="Track customer contacts and build purchase history records."
      actions={<button className="primary-btn" onClick={startCreate}><Plus size={16} /> Add Customer</button>}
    >
      <div className="panel product-workspace">
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label><span>Phone</span><input value={form.phone ?? ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
            <label><span>Email</span><input value={form.email ?? ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">{selectedId ? 'Update Customer' : 'Save Customer'}</button>
            <button className="secondary-btn" type="button" onClick={startCreate}>Reset</button>
          </div>
        </form>
      </div>

      <div className="panel filter-panel">
        <div className="filter-input"><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customers" /></div>
      </div>

      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Email</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.name}</td>
                <td>{customer.phone ?? '-'}</td>
                <td>{customer.email ?? '-'}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" type="button" onClick={() => startEdit(customer)}><Pencil size={14} /> Edit</button>
                    <button className="ghost-btn danger" type="button" onClick={() => handleDelete(customer)}><Trash2 size={14} /> Delete</button>
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