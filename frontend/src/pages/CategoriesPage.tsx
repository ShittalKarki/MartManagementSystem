import { Pencil, Plus, Trash2 } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { createCategory, deleteCategory, getCategories, Category, CategoryPayload, updateCategory } from '../services/api';
import { SectionPage } from '../components/SectionPage';

export function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [form, setForm] = useState<CategoryPayload>({ name: '', description: '' });

  const load = async () => setCategories(await getCategories());

  useEffect(() => { load(); }, []);

  const startCreate = () => {
    setSelectedId(null);
    setForm({ name: '', description: '' });
  };

  const startEdit = (category: Category) => {
    setSelectedId(category.id);
    setForm(category);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId) {
      await updateCategory(selectedId, form);
    } else {
      await createCategory(form);
    }
    startCreate();
    await load();
  };

  const handleDelete = async (category: Category) => {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    await deleteCategory(category.id);
    await load();
  };

  return (
    <SectionPage kicker="Master data" title="Categories" description="Organize catalog structure for purchasing and sales analysis." actions={<button className="primary-btn" onClick={startCreate}><Plus size={16} /> Add Category</button>}>
      <div className="panel product-workspace">
        <form className="product-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label><span>Name</span><input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
            <label className="span-2"><span>Description</span><input value={form.description ?? ''} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label>
          </div>
          <div className="form-actions">
            <button className="primary-btn" type="submit">{selectedId ? 'Update Category' : 'Save Category'}</button>
            <button className="secondary-btn" type="button" onClick={startCreate}>Reset</button>
          </div>
        </form>
      </div>

      <div className="panel table-panel">
        <table className="erp-table">
          <thead><tr><th>Name</th><th>Description</th><th>Actions</th></tr></thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td>{category.description ?? '-'}</td>
                <td>
                  <div className="row-actions">
                    <button className="ghost-btn" type="button" onClick={() => startEdit(category)}><Pencil size={14} /> Edit</button>
                    <button className="ghost-btn danger" type="button" onClick={() => handleDelete(category)}><Trash2 size={14} /> Delete</button>
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
