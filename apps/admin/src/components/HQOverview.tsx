import { useState } from 'react';
import { useGetOverviewQuery, useGetTopSellingItemsQuery } from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import { DollarSign, ShoppingBag, Store, Coffee, RefreshCw, Trophy, Filter } from 'lucide-react';

export const HQOverview: React.FC = () => {
  const { data, isLoading: loading, error: queryError, refetch } = useGetOverviewQuery();
  const error = queryError ? 'Failed to load overview data' : null;

  // Selected outlet for Top 5 Selling Items inspection ('all' for global)
  const [selectedTopOutletId, setSelectedTopOutletId] = useState<string>('all');

  const { data: outletTopItems, isFetching: outletTopLoading } = useGetTopSellingItemsQuery(
    { outletId: selectedTopOutletId, limit: 5 },
    { skip: selectedTopOutletId === 'all' }
  );

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-200 rounded-xl" />
            <div className="h-4 w-96 bg-slate-100 rounded-lg" />
          </div>
          <div className="h-9 w-28 bg-slate-200 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-slate-200" />
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-slate-200 rounded" />
                <div className="h-6 w-28 bg-slate-200 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 bg-slate-100/50" />
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-80 bg-slate-100/50" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center justify-between">
        <span>{error}</span>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg font-semibold text-xs transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data) return null;

  const maxOutletRevenue = Math.max(...data.revenueByOutlet.map((r) => r.totalRevenue), 1);

  const displayedTopItems =
    selectedTopOutletId === 'all'
      ? data.globalTopSellingItems
      : outletTopItems || [];

  const selectedOutletName =
    selectedTopOutletId === 'all'
      ? 'All Outlets (Global)'
      : data.revenueByOutlet.find((o) => o.outletId === selectedTopOutletId)?.outletName || 'Selected Outlet';

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">HQ Executive Dashboard</h1>
          <p className="text-sm text-slate-500">
            Real-time sales performance, outlet revenue distribution, and top menu items per outlet.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center space-x-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl text-xs shadow-sm transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Revenue</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(data.summary.totalRevenue)}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Orders</p>
            <p className="text-2xl font-black text-slate-900">{data.summary.totalSalesCount.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Outlets</p>
            <p className="text-2xl font-black text-slate-900">{data.summary.totalOutlets}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Coffee className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Master Items</p>
            <p className="text-2xl font-black text-slate-900">{data.summary.totalMenuItems}</p>
          </div>
        </div>
      </div>

      {/* Main Reporting Section (Total revenue by outlet + Top 5 selling items per outlet) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Total Revenue By Outlet */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Total Revenue by Outlet</h2>
              <p className="text-xs text-slate-500">Gross sales breakdown across physical outlets (Click to filter items)</p>
            </div>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
              {data.revenueByOutlet.length} Outlets
            </span>
          </div>

          <div className="space-y-4">
            {data.revenueByOutlet.map((outlet) => {
              const percentage = Math.round((outlet.totalRevenue / maxOutletRevenue) * 100);
              const isSelected = selectedTopOutletId === outlet.outletId;

              return (
                <div
                  key={outlet.outletId}
                  onClick={() => setSelectedTopOutletId(outlet.outletId)}
                  className={`space-y-1.5 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-300 ring-2 ring-indigo-200'
                      : 'bg-slate-50/70 border-slate-100 hover:border-slate-300 hover:bg-slate-100/50'
                  }`}
                  title="Click to view top selling items for this outlet"
                >
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{outlet.outletName}</span>
                      <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 font-mono font-semibold rounded">
                        {outlet.outletCode}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                          Active Filter
                        </span>
                      )}
                    </div>
                    <span className="font-black text-slate-900">{formatCurrency(outlet.totalRevenue)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
                    <span>{outlet.totalTransactions} transactions processed</span>
                    <span>{percentage}% of top outlet</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top 5 Selling Items Per Outlet */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-base font-bold text-slate-900">Top 5 Best Selling Items</h2>
                  <Trophy className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs text-slate-500">
                  {selectedTopOutletId === 'all'
                    ? 'Global rankings across all company outlets'
                    : `Ranked specifically for ${selectedOutletName}`}
                </p>
              </div>

              {/* Outlet Switcher Dropdown */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedTopOutletId}
                  onChange={(e) => setSelectedTopOutletId(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                >
                  <option value="all">All Outlets (Global)</option>
                  {data.revenueByOutlet.map((o) => (
                    <option key={o.outletId} value={o.outletId}>
                      {o.outletName} ({o.outletCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* List */}
            {outletTopLoading ? (
              <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="text-xs font-medium">Fetching top items for {selectedOutletName}...</span>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedTopItems.map((item, index) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 border border-slate-100 hover:bg-slate-100/60 transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black ${
                          index === 0
                            ? 'bg-amber-400 text-amber-950 shadow-sm'
                            : index === 1
                            ? 'bg-slate-300 text-slate-800'
                            : index === 2
                            ? 'bg-amber-700 text-amber-100'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{index + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{item.itemName}</h3>
                        <p className="text-xs font-mono text-slate-400">{item.sku}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{item.totalQuantitySold} sold</p>
                      <p className="text-xs text-emerald-600 font-semibold">{formatCurrency(item.totalRevenue)}</p>
                    </div>
                  </div>
                ))}

                {displayedTopItems.length === 0 && (
                  <div className="py-14 text-center text-slate-400 text-xs bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
                    <Coffee className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No sales recorded yet</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Completed transactions at {selectedOutletName} will appear here.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {selectedTopOutletId !== 'all' && (
            <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Filtered by {selectedOutletName}</span>
              <button
                onClick={() => setSelectedTopOutletId('all')}
                className="text-indigo-600 font-bold hover:underline"
              >
                Reset to All Outlets
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
