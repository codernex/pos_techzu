import { useEffect, useState, type FC } from 'react';
import type { Outlet, OutletMenuItem, Sale } from '../services/api';
import { useGetOutletMenuQuery, useCreateSaleMutation } from '../store/apiSlice';
import { formatCurrency } from '../lib/utils';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  X,
  CreditCard,
  Banknote,
  QrCode,
  AlertTriangle,
  Receipt,
  Store,
} from 'lucide-react';

interface POSTerminalProps {
  outlet: Outlet;
}

interface CartItem {
  menuItemId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  maxStock: number;
}

export const POSTerminal: FC<POSTerminalProps> = ({ outlet }) => {
  const { data: menuItems = [], isLoading: loading } = useGetOutletMenuQuery({
    outletId: outlet.id,
    availableOnly: true,
  });
  const [createSale] = useCreateSaleMutation();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'QRIS'>('CASH');
  const [cashierNote, setCashierNote] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Completed Receipt Modal State
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  // Extract unique categories
  const categories = Array.from(new Set(menuItems.map((i) => i.category.name)));

  useEffect(() => {
    setCart([]);
    setErrorMessage(null);
  }, [outlet.id]);

  // Cart Functions
  const addToCart = (item: OutletMenuItem) => {
    if (item.stock <= 0) return;

    setErrorMessage(null);
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === item.menuItemId);
      if (existing) {
        if (existing.quantity >= item.stock) {
          setErrorMessage(`Cannot add more "${item.name}". Only ${item.stock} in stock.`);
          return prev;
        }
        return prev.map((c) =>
          c.menuItemId === item.menuItemId ? { ...c, quantity: c.quantity + 1 } : c
        );
      } else {
        return [
          ...prev,
          {
            menuItemId: item.menuItemId,
            name: item.name,
            sku: item.sku,
            price: Number(item.effectivePrice),
            quantity: 1,
            maxStock: item.stock,
          },
        ];
      }
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setErrorMessage(null);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.menuItemId === menuItemId) {
            const newQty = item.quantity + delta;
            if (newQty > item.maxStock) {
              setErrorMessage(`Cannot exceed available stock (${item.maxStock})`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((item) => item.menuItemId !== menuItemId));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMessage(null);
  };

  // Financial Calculations
  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const tax = subtotal * 0.1; // 10%
  const total = subtotal + tax;

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      setCheckingOut(true);
      setErrorMessage(null);

      const sale = await createSale({
        outletId: outlet.id,
        items: cart.map((c) => ({
          menuItemId: c.menuItemId,
          quantity: c.quantity,
        })),
        paymentMethod,
        cashierNote: cashierNote.trim() || undefined,
        taxRate: 0.1,
      }).unwrap();

      setCompletedSale(sale);
      setCart([]);
      setCashierNote('');
    } catch (err: any) {
      setErrorMessage(err.data?.message || err.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category.name === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left Menu Section (8 Cols) */}
      <div className="lg:col-span-8 space-y-5">
        {/* Terminal Header Info */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-black text-slate-900">{outlet.name} Terminal</h1>
                <span className="font-mono text-xs px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold rounded">
                  {outlet.code}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Only items assigned to {outlet.name} are available for sale.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 font-medium">Last Receipt Sequence:</span>
            <p className="font-mono text-xs font-bold text-slate-700">
              #{String(outlet.receiptCounter).padStart(6, '0')}
            </p>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search assigned items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Items ({menuItems.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl flex items-center space-x-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const isOutOfStock = item.stock <= 0;
            const cartQty = cart.find((c) => c.menuItemId === item.menuItemId)?.quantity || 0;

            return (
              <div
                key={item.menuItemId}
                onClick={() => !isOutOfStock && addToCart(item)}
                className={`group relative bg-white rounded-2xl border p-3 flex flex-col justify-between transition-all select-none ${
                  isOutOfStock
                    ? 'opacity-60 border-slate-200 cursor-not-allowed bg-slate-50/70'
                    : 'cursor-pointer hover:border-indigo-400 hover:shadow-md border-slate-200 active:scale-[0.98]'
                }`}
              >
                {/* Item Image & Badge */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 mb-2">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 font-bold text-xs">
                      TECHZU
                    </div>
                  )}

                  {/* Stock Badge */}
                  <span
                    className={`absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${
                      isOutOfStock
                        ? 'bg-red-600 text-white'
                        : item.isLowStock
                        ? 'bg-amber-500 text-white animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {isOutOfStock ? 'Sold Out' : `${item.stock} in stock`}
                  </span>

                  {/* Cart quantity badge if in cart */}
                  {cartQty > 0 && (
                    <span className="absolute bottom-2 left-2 bg-indigo-600 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md">
                      {cartQty}
                    </span>
                  )}
                </div>

                {/* Details */}
                <div>
                  <h3 className="font-bold text-slate-900 text-xs line-clamp-1 leading-snug">
                    {item.name}
                  </h3>
                  <span className="font-mono text-[10px] text-slate-400 block">{item.sku}</span>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="leading-tight">
                    <span className="text-sm font-black text-slate-900">
                      {formatCurrency(item.effectivePrice)}
                    </span>
                    {item.customPrice !== null && (
                      <span className="block text-[9px] font-bold text-amber-600">Overridden</span>
                    )}
                  </div>

                  <button
                    disabled={isOutOfStock}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-colors'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredItems.length === 0 && !loading && (
            <div className="col-span-full py-16 text-center text-slate-400 text-sm bg-white rounded-2xl border border-slate-200">
              No menu items assigned to {outlet.name} match your search.
            </div>
          )}
        </div>
      </div>

      {/* Right Cart Section (4 Cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4 sticky top-24">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            <h2 className="font-black text-slate-900 text-base">Current Order</h2>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {/* Cart Item List */}
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
          {cart.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
            >
              <div className="flex-1 mr-2">
                <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h4>
                <span className="text-[11px] font-semibold text-indigo-600">
                  {formatCurrency(item.price)} each
                </span>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => updateQuantity(item.menuItemId, -1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-black text-xs text-slate-900">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.menuItemId, 1)}
                  className="w-6 h-6 rounded-md bg-white border border-slate-200 text-slate-600 flex items-center justify-center hover:bg-slate-100"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeFromCart(item.menuItemId)}
                  className="p-1 text-slate-400 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              Your order is currently empty.
              <br />
              Click any menu item on the left to add.
            </div>
          )}
        </div>

        {/* Payment Method Selector */}
        {cart.length > 0 && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'CASH'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote className="w-4 h-4 mb-1" />
                <span>Cash</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('CARD')}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'CARD'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1" />
                <span>Card</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('QRIS')}
                className={`flex flex-col items-center py-2 px-1 rounded-xl text-xs font-bold border transition-all ${
                  paymentMethod === 'QRIS'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <QrCode className="w-4 h-4 mb-1" />
                <span>QRIS</span>
              </button>
            </div>
          </div>
        )}

        {/* Notes Input */}
        {cart.length > 0 && (
          <div>
            <input
              type="text"
              placeholder="Order / Cashier note (optional)..."
              value={cashierNote}
              onChange={(e) => setCashierNote(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Total & Checkout Button */}
        {cart.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Sales Tax (10%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-black text-slate-900 pt-1 border-t border-slate-100">
              <span>Grand Total</span>
              <span className="text-indigo-600 text-lg">{formatCurrency(total)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full mt-3 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm shadow-md shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-[0.99] transition-all"
            >
              {checkingOut ? (
                <span>Processing ACID Transaction...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Charge {formatCurrency(total)}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Digital Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            {/* Thermal Receipt Header */}
            <div className="flex items-center justify-between pb-3 border-b border-dashed border-slate-200">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-indigo-600" />
                <span className="font-mono text-xs font-black uppercase tracking-wider text-slate-900">
                  Sales Receipt
                </span>
              </div>
              <button
                onClick={() => setCompletedSale(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 text-center font-mono space-y-1">
              <h3 className="font-black text-base text-slate-900 tracking-tight">
                {outlet.name}
              </h3>
              <p className="text-[11px] text-slate-500">{outlet.address || 'Central HQ Group'}</p>
              <p className="text-[11px] text-slate-500">{outlet.phone || '+1-555-TECHZU'}</p>

              <div className="pt-2 pb-1 border-y border-dashed border-slate-200 my-2 text-left text-xs space-y-0.5">
                <div className="flex justify-between font-bold text-slate-900">
                  <span>RECEIPT NO:</span>
                  <span className="text-indigo-600">{completedSale.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>SEQUENCE:</span>
                  <span>#{completedSale.receiptSequence}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>DATE/TIME:</span>
                  <span>{new Date(completedSale.createdAt).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>PAYMENT:</span>
                  <span>{completedSale.paymentMethod}</span>
                </div>
              </div>

              {/* Items */}
              <div className="py-2 space-y-1.5 text-left text-xs">
                {completedSale.items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
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

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-slate-200 space-y-1 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>SUBTOTAL:</span>
                  <span>{formatCurrency(completedSale.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>TAX (10%):</span>
                  <span>{formatCurrency(completedSale.tax)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                  <span>TOTAL PAID:</span>
                  <span className="text-indigo-600">{formatCurrency(completedSale.totalAmount)}</span>
                </div>
              </div>

              <div className="pt-4 text-[11px] text-slate-400">
                <p>Thank you for your visit!</p>
                <p className="text-[9px]">Verified ACID Database Transaction</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Receipt</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Next Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

