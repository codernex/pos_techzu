import { useState, type FC } from 'react';
import type { Outlet, Sale } from '../services/api';
import { useGetSalesByOutletQuery } from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import { Receipt, RefreshCw, Eye, X, Calendar, DollarSign, CreditCard } from 'lucide-react';

interface OutletSalesHistoryProps {
  outlet: Outlet;
}

export const OutletSalesHistory: FC<OutletSalesHistoryProps> = ({ outlet }) => {
  const { data, isLoading: loading, refetch } = useGetSalesByOutletQuery({
    outletId: outlet.id,
    limit: 50,
  });

  const sales = data?.sales || [];
  const totalCount = data?.total || 0;
  const [activeSale, setActiveSale] = useState<Sale | null>(null);

  const totalSalesRevenue = sales.reduce((acc, s) => acc + Number(s.totalAmount), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Sales History & Receipts
          </h1>
          <p className="text-sm text-slate-500">
            Immutable transaction log for <strong>{outlet.name}</strong>. All orders have collision-free sequential receipt numbers.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh History</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Total Transactions</span>
            <p className="text-xl font-black text-slate-900">{totalCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Gross Revenue (Recent)</span>
            <p className="text-xl font-black text-slate-900">{formatCurrency(totalSalesRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold uppercase">Sequential Counter</span>
            <p className="text-xl font-black font-mono text-purple-700">#{outlet.receiptCounter}</p>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4">Seq #</th>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Items Summary</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="font-mono font-bold text-indigo-700 text-xs bg-indigo-50 px-2 py-1 rounded">
                      {sale.receiptNumber}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-500">
                    #{sale.receiptSequence}
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    <div className="flex items-center space-x-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(sale.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">
                    {sale.items.length} items ({sale.items.reduce((acc, i) => acc + i.quantity, 0)} units)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {sale.paymentMethod}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    {formatCurrency(sale.totalAmount)}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setActiveSale(sale)}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))}

              {sales.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No sales recorded for this outlet yet. Complete a checkout in the POS Terminal to generate a receipt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {activeSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900">Receipt Details</h3>
              </div>
              <button
                onClick={() => setActiveSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt Number:</span>
                  <strong className="text-indigo-700">{activeSale.receiptNumber}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sequence:</span>
                  <span>#{activeSale.receiptSequence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date/Time:</span>
                  <span>{new Date(activeSale.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment:</span>
                  <span>{activeSale.paymentMethod}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2 font-sans">
                  Purchased Items
                </h4>
                <div className="space-y-1.5 divide-y divide-slate-100">
                  {activeSale.items.map((item) => (
                    <div key={item.id} className="pt-1.5 flex justify-between">
                      <div>
                        <span className="font-bold text-slate-800">{item.menuItem.name}</span>
                        <span className="block text-[10px] text-slate-400">
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(activeSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Tax (10%):</span>
                  <span>{formatCurrency(activeSale.tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total Amount:</span>
                  <span className="text-indigo-600">{formatCurrency(activeSale.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

