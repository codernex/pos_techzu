import type { FC } from 'react';
import type { Outlet } from '../services/api';
import { Store, Building2, ShoppingCart, BarChart3, Package, Layers, ShieldCheck } from 'lucide-react';

export type AppMode = 'hq-overview' | 'hq-menu' | 'hq-outlets' | 'hq-assignments' | 'pos' | 'inventory' | 'sales-history';

interface NavbarProps {
  currentMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  onSelectOutlet: (outlet: Outlet) => void;
}

export const Navbar: FC<NavbarProps> = ({
  currentMode,
  onSelectMode,
  outlets,
  selectedOutlet,
  onSelectOutlet,
}) => {
  const isHQ = currentMode.startsWith('hq');

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Mode Switcher */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-none">
                  TECHZU
                </span>
                <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">
                  Enterprise POS
                </span>
              </div>
            </div>

            {/* Top Level Mode Tabs (HQ vs Outlet) */}
            <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => onSelectMode('hq-overview')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isHQ
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>HQ Central Admin</span>
              </button>
              <button
                type="button"
                onClick={() => onSelectMode('pos')}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isHQ
                    ? 'bg-white text-indigo-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Outlet POS & Ops</span>
              </button>
            </div>
          </div>

          {/* Right Action: Active Outlet Dropdown & Status */}
          <div className="flex items-center space-x-4">
            {!isHQ && (
              <div className="flex items-center space-x-2 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl">
                <Store className="w-4 h-4 text-indigo-600" />
                <span className="text-xs text-slate-500 font-medium">Active Outlet:</span>
                <select
                  value={selectedOutlet?.id || ''}
                  onChange={(e) => {
                    const found = outlets.find((o) => o.id === e.target.value);
                    if (found) onSelectOutlet(found);
                  }}
                  className="text-xs font-bold text-indigo-900 bg-transparent border-none focus:ring-0 cursor-pointer pr-2"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-600 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> ACID Sync
              </span>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-100 py-2">
          {isHQ ? (
            <>
              <button
                onClick={() => onSelectMode('hq-overview')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'hq-overview'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Reports & Analytics</span>
              </button>
              <button
                onClick={() => onSelectMode('hq-menu')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'hq-menu'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Master Menu Catalog</span>
              </button>
              <button
                onClick={() => onSelectMode('hq-assignments')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'hq-assignments'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Outlet Assignment & Price Overrides</span>
              </button>
              <button
                onClick={() => onSelectMode('hq-outlets')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'hq-outlets'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Outlets Management</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onSelectMode('pos')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'pos'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>POS Cashier Terminal</span>
              </button>
              <button
                onClick={() => onSelectMode('inventory')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'inventory'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Outlet Inventory & Restock</span>
              </button>
              <button
                onClick={() => onSelectMode('sales-history')}
                className={`flex items-center space-x-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  currentMode === 'sales-history'
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Sales History & Receipts</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

