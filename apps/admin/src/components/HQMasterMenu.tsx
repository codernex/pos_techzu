import { useState, type FormEvent } from 'react';
import type { MenuItem } from '../services/api';
import {
  useGetMenuItemsQuery,
  useGetCategoriesQuery,
  useCreateMenuItemMutation,
  useUpdateMenuItemMutation,
  useDeleteMenuItemMutation,
  useCreateCategoryMutation,
} from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, CheckCircle, XCircle, FolderPlus, Loader2 } from 'lucide-react';

export const HQMasterMenu: React.FC = () => {
  const { data: items = [], isLoading: itemsLoading } = useGetMenuItemsQuery();
  const { data: categories = [], isLoading: categoriesLoading } = useGetCategoriesQuery();
  const [createMenuItem] = useCreateMenuItemMutation();
  const [updateMenuItem] = useUpdateMenuItemMutation();
  const [deleteMenuItem] = useDeleteMenuItemMutation();
  const [createCategory] = useCreateCategoryMutation();

  const loading = itemsLoading || categoriesLoading;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Category Modal State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    basePrice: '',
    description: '',
    imageUrl: '',
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const openCreateCategoryModal = () => {
    setCategoryName('');
    setCategoryDescription('');
    setCategoryError(null);
    setShowCategoryModal(true);
  };

  const handleCategorySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      setCreatingCategory(true);
      setCategoryError(null);
      const newCat = await createCategory({
        name: categoryName.trim(),
        description: categoryDescription.trim() || undefined,
      }).unwrap();
      setShowCategoryModal(false);
      setSelectedCategory(newCat.id);
    } catch (err: any) {
      setCategoryError(err.data?.message || err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      sku: '',
      categoryId: categories[0]?.id || '',
      basePrice: '',
      description: '',
      imageUrl: '',
      isActive: true,
    });
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      categoryId: item.categoryId,
      basePrice: String(item.basePrice),
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isActive: item.isActive,
    });
    setModalError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setModalError(null);

      if (editingItem) {
        await updateMenuItem({
          id: editingItem.id,
          data: {
            ...formData,
            basePrice: parseFloat(formData.basePrice),
          },
        }).unwrap();
      } else {
        await createMenuItem({
          ...formData,
          basePrice: parseFloat(formData.basePrice),
        }).unwrap();
      }

      setShowModal(false);
    } catch (err: any) {
      setModalError(err.data?.message || err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the Master Menu?`)) {
      return;
    }
    try {
      await deleteMenuItem(id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to delete item');
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.categoryId === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Master Menu Catalog</h1>
          <p className="text-sm text-slate-500">
            Centrally define menu items, categories, SKUs, and default base prices for the entire company.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={openCreateCategoryModal}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs shadow-sm transition-all"
          >
            <FolderPlus className="w-4 h-4 text-indigo-600" />
            <span>Add Category</span>
          </button>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs shadow-md shadow-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Master Item</span>
          </button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Categories ({items.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.name}
            </button>
          ))}
          <button
            onClick={openCreateCategoryModal}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 border border-dashed border-indigo-300 flex items-center space-x-1 transition-all"
            title="Create new category"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Category</span>
          </button>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Item Details</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">HQ Base Price</th>
                <th className="py-3.5 px-4">Assigned Outlets</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-4 bg-slate-200 rounded" />
                          <div className="w-48 h-3 bg-slate-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-14 h-6 bg-slate-200 rounded ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                            <ImageIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-400 line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold rounded-full">
                        {item.category?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {formatCurrency(item.basePrice)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-medium text-slate-600 bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                        {item.outletAssignments?.length || 0} Outlets
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.isActive ? (
                        <span className="inline-flex items-center space-x-1 text-xs text-emerald-600 font-bold">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-xs text-slate-400 font-medium">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Disabled</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No menu items found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Master Menu Item' : 'Create Master Menu Item'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. Signature Cold Brew"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. COF-CBR-01"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={openCreateCategoryModal}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center space-x-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Category</span>
                    </button>
                  </div>
                  <select
                    required
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Default Base Price (৳ BDT) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. 4.50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe flavor notes, ingredients, preparation..."
                  />
                </div>

                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
                    Active (Available for outlet assignment)
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-bold text-slate-900">Add Menu Category</h2>
              </div>
              <button
                onClick={() => setShowCategoryModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {categoryError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
                {categoryError}
              </div>
            )}

            <form onSubmit={handleCategorySubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Hot Coffees, Pastries, Cold Brews"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="Short description for display and grouping..."
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingCategory || !categoryName.trim()}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {creatingCategory ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create Category</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

