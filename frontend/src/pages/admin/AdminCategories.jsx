import React, { useState, useEffect } from 'react';
import DashboardSidebar from '../../components/layout/DashboardSidebar';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import DataTable from '../../components/common/DataTable';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import api from '../../services/api';
import { Grid, Plus, Edit2, Trash2 } from 'lucide-react';

const AdminCategories = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/categories');
      if (res.data.success) {
        setCategories(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load categories:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleEditClick = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setStatus(cat.status || 'active');
    setShowForm(true);
    setError('');
  };

  const handleCreateClick = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setStatus('active');
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        const res = await api.put(`/admin/categories/${editingId}`, { name, description, status });
        if (res.data.success) {
          setCategories(categories.map(c => c._id === editingId ? res.data.data : c));
          setShowForm(false);
          alert('Category updated successfully.');
        }
      } else {
        const res = await api.post('/admin/categories', { name, description });
        if (res.data.success) {
          setCategories([...categories, res.data.data]);
          setShowForm(false);
          alert('Category created successfully.');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"? This will fail if listings are associated with it.`)) {
      return;
    }

    try {
      const res = await api.delete(`/admin/categories/${id}`);
      if (res.data.success) {
        setCategories(categories.filter(c => c._id !== id));
        alert('Category deleted successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category. Ensure no vehicle listings use it.');
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50">
      <DashboardSidebar role="admin" />

      <main className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
              <Grid className="w-8 h-8 text-blue-600" />
              Category Management
            </h1>
            <p className="text-gray-500 text-sm mt-1">Configure vehicle categories (Cars, Bikes, SUVs) for buyer search discovery.</p>
          </div>
          <Button onClick={handleCreateClick} className="flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Add Category
          </Button>
        </div>

        {/* Categories List */}
        {loading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : (
          <DataTable
            headers={['Category Name', 'Description', 'Status', 'Actions']}
            data={categories}
            emptyMessage="No vehicle categories created."
            renderRow={(c) => (
              <tr key={c._id} className="hover:bg-gray-50/50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  {c.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={c.description}>
                  {c.description || <span className="text-gray-400 italic">No description</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Badge variant={c.status === 'active' ? 'success' : 'danger'}>{c.status}</Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm flex gap-2">
                  <Button variant="secondary" size="small" onClick={() => handleEditClick(c)}>
                    <Edit2 className="w-3.5 h-3.5 mr-1 inline" /> Edit
                  </Button>
                  <Button variant="danger" size="small" onClick={() => handleDelete(c._id, c.name)}>
                    <Trash2 className="w-3.5 h-3.5 mr-1 inline" /> Delete
                  </Button>
                </td>
              </tr>
            )}
          />
        )}

        {/* Create/Edit Category Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-6 relative border border-gray-100">
              <button
                onClick={() => setShowForm(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
              <div>
                <h3 className="text-lg font-black text-gray-900">{editingId ? 'Edit Category' : 'Create Category'}</h3>
                <p className="text-xs text-gray-500">Configure parameters for catalog taxonomy.</p>
              </div>

              {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Electric Vehicle"
                    required
                    className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide description for user browse help..."
                    rows={3}
                    className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                  />
                </div>

                {editingId && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full text-sm rounded-lg border-gray-300 shadow-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                  <Button variant="secondary" onClick={() => setShowForm(false)} disabled={submitting}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit" loading={submitting}>
                    {editingId ? 'Save Changes' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminCategories;
