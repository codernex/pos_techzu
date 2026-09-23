import { useEffect, useState, type FC } from 'react';
import type { Outlet, MenuItem } from '../services/api';
import {
  useGetMenuItemsQuery,
  useGetOutletMenuQuery,
  useAssignMenuItemMutation,
  useUnassignMenuItemMutation,
  useOverridePriceMutation,
} from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import { Layers, Store, Check, Save, Info } from 'lucide-react';

interface HQAssignmentsProps {
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  onSelectOutlet: (outlet: Outlet) => void;
}

export const HQAssignments: FC<HQAssignmentsProps> = ({
  outlets,
  selectedOutlet,
  onSelectOutlet,
}) => {
  const targetOutlet = selectedOutlet || outlets[0];

  const { data: masterItems = [] } = useGetMenuItemsQuery({ isActive: true });
  const { data: assignedItems = [] } = useGetOutletMenuQuery(
    { outletId: targetOutlet?.id || '' },
    { skip: !targetOutlet?.id }
  );

  const [assignMenuItem] = useAssignMenuItemMutation();
  const [unassignMenuItem] = useUnassignMenuItemMutation();
  const [overridePrice] = useOverridePriceMutation();

  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Local state for edits: overrides and assignment toggles
  const [overrides, setOverrides] = useState<Record<string, string>>({});

  useEffect(() => {
    if (assignedItems) {
      const initialOverrides: Record<string, string> = {};
      assignedItems.forEach((item) => {
        initialOverrides[item.menuItemId] =
          item.customPrice !== null ? String(item.customPrice) : '';
      });
      setOverrides(initialOverrides);
    }
  }, [assignedItems]);

  const assignedItemMap = new Map(assignedItems.map((a) => [a.menuItemId, a]));

  const handleToggleAssignment = async (item: MenuItem, isCurrentlyAssigned: boolean) => {
    if (!targetOutlet) return;
    try {
      setSavingId(item.id);
      if (isCurrentlyAssigned) {
        await unassignMenuItem({ outletId: targetOutlet.id, menuItemId: item.id }).unwrap();
        setFeedback(`Unassigned "${item.name}" from ${targetOutlet.name}`);
      } else {
        const customPriceVal = overrides[item.id] ? parseFloat(overrides[item.id]) : null;
        await assignMenuItem({
          outletId: targetOutlet.id,
          menuItemId: item.id,
          customPrice: customPriceVal,
          initialStock: 25,
        }).unwrap();
        setFeedback(`Assigned "${item.name}" to ${targetOutlet.name} with initial stock.`);
      }
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to update assignment');
    } finally {
      setSavingId(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleSavePriceOverride = async (menuItemId: string, itemName: string) => {
    if (!targetOutlet) return;
    try {
      setSavingId(menuItemId);
      const rawVal = overrides[menuItemId]?.trim();
      const customPrice = rawVal === '' || rawVal === undefined ? null : parseFloat(rawVal);

      await overridePrice({
        outletId: targetOutlet.id,
        menuItemId,
        customPrice,
      }).unwrap();

      setFeedback(
        customPrice !== null
          ? `Updated price override for "${itemName}" to ${formatCurrency(customPrice)} at ${targetOutlet.name}`
          : `Reset "${itemName}" to base price at ${targetOutlet.name}`
      );
    } catch (err: any) {
      alert(err.data?.message || err.message || 'Failed to override price');
    } finally {
      setSavingId(null);
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Outlet Menu Assignment & Price Overrides
          </h1>
          <p className="text-sm text-slate-500">
            Control which master menu items are sold at each outlet and set location-specific pricing.
          </p>
        </div>

        {/* Outlet Switcher */}
        <div className="flex items-center space-x-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
          <Store className="w-5 h-5 text-indigo-600 ml-2" />
          <span className="text-xs font-bold text-slate-700">Configuring Outlet:</span>
          <select
            value={targetOutlet?.id || ''}
            onChange={(e) => {
              const found = outlets.find((o) => o.id === e.target.value);
              if (found) onSelectOutlet(found);
            }}
            className="text-sm font-bold text-indigo-900 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Alert Box */}
      <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-start space-x-3 text-xs text-indigo-900">
        <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">How Outlet Assignment & Overrides Work:</p>
          <ul className="list-disc list-inside space-y-0.5 text-indigo-800">
            <li>
              Items checked below will be visible and sellable at <strong>{targetOutlet?.name}</strong>.
            </li>
            <li>
              Leave the <strong>Custom Price Override</strong> field empty to use the HQ Base Price.
            </li>
            <li>
              Entering a custom price (e.g. Airport markup) will apply only to this specific outlet.
            </li>
          </ul>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Assignment Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Master Catalog for {targetOutlet?.name}
            </h2>
          </div>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            {assignedItems.length} of {masterItems.length} Items Assigned
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">Assigned</th>
                <th className="py-3 px-4">Menu Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">HQ Base Price</th>
                <th className="py-3 px-4">Custom Price Override</th>
                <th className="py-3 px-4">Effective Price</th>
                <th className="py-3 px-4">Outlet Stock</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {masterItems.map((item) => {
                const assigned = assignedItemMap.get(item.id);
                const isAssigned = !!assigned;
                const isSaving = savingId === item.id;
                const customPriceInput = overrides[item.id] ?? '';
                const effectivePrice = assigned
                  ? assigned.effectivePrice
                  : item.basePrice;

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors ${
                      isAssigned ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 opacity-70'
                    }`}
                  >
                    {/* Checkbox toggle */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isAssigned}
                        disabled={isSaving}
                        onChange={() => handleToggleAssignment(item, isAssigned)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <div>
                        <span className="font-bold text-slate-900">{item.name}</span>
                        <span className="block font-mono text-xs text-slate-400">{item.sku}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="text-xs px-2 py-0.5 bg-slate-100 font-medium text-slate-700 rounded">
                        {item.category?.name || 'Category'}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-500">
                      {formatCurrency(item.basePrice)}
                    </td>

                    {/* Price Override input */}
                    <td className="py-3 px-4">
                      {isAssigned ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-bold">৳</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Base price"
                            value={customPriceInput}
                            onChange={(e) =>
                              setOverrides({ ...overrides, [item.id]: e.target.value })
                            }
                            className="w-24 px-2 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Assign first</span>
                      )}
                    </td>

                    {/* Effective Price */}
                    <td className="py-3 px-4 font-black text-indigo-700">
                      {isAssigned ? (
                        <div className="flex items-center space-x-1.5">
                          <span>{formatCurrency(effectivePrice)}</span>
                          {assigned.customPrice !== null && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              Overridden
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4">
                      {isAssigned ? (
                        <span
                          className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            assigned.stock <= 0
                              ? 'bg-red-100 text-red-700'
                              : assigned.isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {assigned.stock} units
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>

                    {/* Save Price Button */}
                    <td className="py-3 px-4 text-right">
                      {isAssigned && (
                        <button
                          disabled={isSaving}
                          onClick={() => handleSavePriceOverride(item.id, item.name)}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg text-xs font-bold shadow-sm transition-all"
                        >
                          <Save className="w-3.5 h-3.5" />
                          <span>Save Price</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

