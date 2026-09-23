import { useState, type FC, type FormEvent } from 'react';
import type { Outlet, InventoryItem } from '../services/api';
import { useGetOutletInventoryQuery, useRestockMutation } from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import { Search, PlusCircle, AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';

interface OutletInventoryProps {
  outlet: Outlet;
}

export const OutletInventory: FC<OutletInventoryProps> = ({ outlet }) => {
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [search, setSearch] = useState('');

  const { data: inventory = [], isLoading: loading, refetch } = useGetOutletInventoryQuery({
    outletId: outlet.id,
    lowStockOnly: filterLowStock,
  });
  const [restock] = useRestockMutation();

  // Restock Modal State
  const [activeItem, setActiveItem] = useState<InventoryItem | null>(null);
  const [addedQuantity, setAddedQuantity] = useState<string>('10');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleRestockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    const qty = parseInt(addedQuantity, 10);
    if (isNaN(qty) || qty <= 0) {
      alert('Please enter a positive restock quantity');
      return;
    }

    try {
      setSubmitting(true);
      await restock({
        outletId: outlet.id,
        menuItemId: activeItem.menuItemId,
        addedQuantity: qty,
      }).unwrap();
      setFeedback(`Successfully added +${qty} units to "${activeItem.name}"`);
      setActiveItem(null);
      setAddedQuantity('10');
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Restock failed');
    } finally {
      setSubmitting(false);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filteredItems = inventory.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Outlet Inventory Management
          </h1>
          <p className="text-sm text-slate-500">
            Real-time stock tracking for <strong>{outlet.name}</strong>. Transactions automatically deduct inventory with negative-stock prevention.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Stock</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search stock by item name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button
            onClick={() => setFilterLowStock(!filterLowStock)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterLowStock
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Filter (&lt; 5 units)</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Menu Item</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Effective Price</th>
                <th className="py-3.5 px-4">Available Stock</th>
                <th className="py-3.5 px-4">Stock Health</th>
                <th className="py-3.5 px-4 text-right">Quick Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3.5 px-4"><div className="w-32 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4"><div className="w-16 h-4 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-14 h-5 bg-slate-200 rounded" /></td>
                    <td className="py-3.5 px-4"><div className="w-20 h-5 bg-slate-200 rounded-full" /></td>
                    <td className="py-3.5 px-4 text-right"><div className="w-20 h-7 bg-slate-200 rounded-xl ml-auto" /></td>
                  </tr>
                ))
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.quantity <= 0;
                  const isLow = item.quantity <= item.lowStockThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{item.name}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">
                        {item.sku}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs px-2 py-0.5 bg-slate-100 font-medium text-slate-700 rounded">
                          {item.category?.name || 'Category'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {formatCurrency(item.effectivePrice)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-black text-base text-slate-900">
                          {item.quantity}
                        </span>
                        <span className="text-xs text-slate-400 ml-1">units</span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full">
                            <span>Out of Stock (0)</span>
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock ({item.quantity})</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            <span>Healthy</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setActiveItem(item)}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}

              {filteredItems.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No inventory records found for this outlet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Restock Inventory</h3>
                <p className="text-xs text-slate-500">{outlet.name}</p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRestockSubmit} className="mt-4 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700">{activeItem.name}</div>
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>Current Stock:</span>
                  <strong className="text-slate-900">{activeItem.quantity} units</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Quantity to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={addedQuantity}
                  onChange={(e) => setAddedQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. 20"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Confirm Restock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

