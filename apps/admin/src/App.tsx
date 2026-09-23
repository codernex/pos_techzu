import { useEffect } from 'react';
import { useGetOutletsQuery } from './store/apiSlice';
import { useAppDispatch, useAppSelector } from './store';
import { setCurrentMode, setSelectedOutletId } from './store/uiSlice';
import { Navbar, type AppMode } from './components/Navbar';
import { HQOverview } from './components/HQOverview';
import { HQMasterMenu } from './components/HQMasterMenu';
import { HQAssignments } from './components/HQAssignments';
import { HQOutlets } from './components/HQOutlets';
import { POSTerminal } from './components/POSTerminal';
import { OutletInventory } from './components/OutletInventory';
import { OutletSalesHistory } from './components/OutletSalesHistory';
import { Store, RefreshCw } from 'lucide-react';

export function App() {
  const dispatch = useAppDispatch();
  const { currentMode, selectedOutletId } = useAppSelector((state) => state.ui);

  const { data: outlets = [], isLoading, refetch } = useGetOutletsQuery();

  // Ensure an outlet is selected when outlets load
  useEffect(() => {
    if (outlets.length > 0 && (!selectedOutletId || !outlets.some((o) => o.id === selectedOutletId))) {
      dispatch(setSelectedOutletId(outlets[0].id));
    }
  }, [outlets, selectedOutletId, dispatch]);

  const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) || null;

  const handleSelectMode = (mode: AppMode) => {
    dispatch(setCurrentMode(mode));
  };

  const handleSelectOutlet = (outlet: { id: string }) => {
    dispatch(setSelectedOutletId(outlet.id));
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar
        currentMode={currentMode}
        onSelectMode={handleSelectMode}
        outlets={outlets}
        selectedOutlet={selectedOutlet}
        onSelectOutlet={handleSelectOutlet}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm text-slate-500 font-medium">Initializing POS Workspace with RTK Query...</p>
            </div>
          </div>
        ) : (
          <>
            {currentMode === 'hq-overview' && <HQOverview />}
            {currentMode === 'hq-menu' && <HQMasterMenu />}
            {currentMode === 'hq-assignments' && (
              <HQAssignments
                outlets={outlets}
                selectedOutlet={selectedOutlet}
                onSelectOutlet={handleSelectOutlet}
              />
            )}
            {currentMode === 'hq-outlets' && (
              <HQOutlets outlets={outlets} onRefresh={refetch} />
            )}

            {/* Outlet Operations Modes */}
            {selectedOutlet ? (
              <>
                {currentMode === 'pos' && <POSTerminal outlet={selectedOutlet} />}
                {currentMode === 'inventory' && <OutletInventory outlet={selectedOutlet} />}
                {currentMode === 'sales-history' && (
                  <OutletSalesHistory outlet={selectedOutlet} />
                )}
              </>
            ) : (
              !currentMode.startsWith('hq') && (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
                  <Store className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-800 mb-1">No Outlet Selected</h3>
                  <p className="text-xs text-slate-500 mb-4">
                    Please create or select an outlet from the top bar to access the POS terminal.
                  </p>
                  <button
                    onClick={() => handleSelectMode('hq-outlets')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200"
                  >
                    Manage Outlets
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
          <span>Techzu Multi-Outlet POS System &copy; 2026</span>
          <div className="flex items-center space-x-4">
            <span>Redux Toolkit & RTK Query</span>
            <span>&bull;</span>
            <span>PostgreSQL 16 & Prisma 7</span>
            <span>&bull;</span>
            <span>Tailwind CSS v4</span>
            <span>&bull;</span>
            <span className="text-indigo-600 font-semibold">ACID Guaranteed</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
