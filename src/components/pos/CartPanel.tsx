import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Trash2,
  Plus,
  Minus,
  User,
  Phone,
  Percent,
  CreditCard,
  RotateCcw,
  UserPlus,
  Check,
  Search,
  ShoppingCart,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { api } from '../../services/api';
import { Customer } from '../../types/pos';

export const CartPanel: React.FC = () => {
  const {
    cart,
    updateCartQuantity,
    updateItemDiscount,
    removeFromCart,
    clearCart,
    cartSubtotal,
    cartDiscountTotal,
    cartTaxableAmount,
    cartCgstTotal,
    cartSgstTotal,
    cartGrandTotal,
    cartItemCount,
    selectedCustomer,
    setSelectedCustomer,
    walkInCustomer,
    setWalkInCustomer,
    setIsPaymentOpen,
    settings,
    addToast,
  } = usePOS();

  const [customerSearch, setCustomerSearch] = useState('');
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustGstin, setNewCustGstin] = useState('');

  const currency = settings?.currencySymbol || '₹';

  useEffect(() => {
    if (customerSearch.trim().length >= 2) {
      api.getCustomers(customerSearch).then(setCustomerList).catch(console.warn);
      setShowCustomerDropdown(true);
    } else {
      setCustomerList([]);
      setShowCustomerDropdown(false);
    }
  }, [customerSearch]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setWalkInCustomer({ name: c.name, phone: c.phone, gstin: c.gstin || '' });
    setCustomerSearch('');
    setShowCustomerDropdown(false);
    addToast('info', `Customer Selected: ${c.name}`, `Phone: ${c.phone}`);
  };

  const handleQuickCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) return;
    try {
      const created = await api.createCustomer({
        name: newCustName,
        phone: newCustPhone,
        gstin: newCustGstin,
      });
      setSelectedCustomer(created);
      setWalkInCustomer({ name: created.name, phone: created.phone, gstin: created.gstin || '' });
      setShowNewCustomerForm(false);
      setNewCustName('');
      setNewCustPhone('');
      setNewCustGstin('');
      addToast('success', 'Customer Created', `${created.name} linked to bill.`);
    } catch (err: any) {
      addToast('error', 'Failed to create customer', err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Customer Info Bar */}
      <div className="p-3.5 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-indigo-600" />
            Current Order & Customer
          </span>

          <div className="flex items-center gap-1.5">
            {selectedCustomer ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer(null);
                  setWalkInCustomer({ name: 'Walk-in Customer', phone: '', gstin: '' });
                }}
                className="text-[11px] text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Clear (Walk-in)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(!showNewCustomerForm)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                + Add Customer
              </button>
            )}
          </div>
        </div>

        {/* Quick Customer Mobile Number Input for SMS Bill */}
        {!selectedCustomer && !showNewCustomerForm && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={walkInCustomer.name}
              onChange={(e) => setWalkInCustomer((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Customer Name"
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
            <div className="relative">
              <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                id="pos-customer-phone"
                type="tel"
                maxLength={10}
                value={walkInCustomer.phone}
                onChange={(e) => setWalkInCustomer((prev) => ({ ...prev, phone: e.target.value.replace(/\D/g, '') }))}
                placeholder="Mobile for SMS..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-7 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
              />
            </div>
          </div>
        )}

        {/* Selected Customer Card */}
        {selectedCustomer && (
          <div className="p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-lg flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                {selectedCustomer.name}
                {selectedCustomer.gstin && (
                  <span className="text-[10px] font-mono bg-white border border-indigo-200 px-1.5 py-0.2 rounded text-indigo-700">
                    GSTIN: {selectedCustomer.gstin}
                  </span>
                )}
              </p>
              <p className="text-slate-500 font-mono text-[11px] mt-0.5">Ph: +91 {selectedCustomer.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block uppercase font-semibold">Total Spend</span>
              <span className="font-bold text-indigo-600 font-mono">{currency}{selectedCustomer.totalSpent}</span>
            </div>
          </div>
        )}

        {/* Quick New Customer Modal Drawer */}
        {showNewCustomerForm && (
          <form onSubmit={handleQuickCreateCustomer} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
            <p className="font-bold text-slate-800">New Customer Profile</p>
            <input
              type="text"
              required
              value={newCustName}
              onChange={(e) => setNewCustName(e.target.value)}
              placeholder="Full Name *"
              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800"
            />
            <input
              type="tel"
              required
              maxLength={10}
              value={newCustPhone}
              onChange={(e) => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="10-digit Mobile Number *"
              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono"
            />
            <input
              type="text"
              value={newCustGstin}
              onChange={(e) => setNewCustGstin(e.target.value.toUpperCase())}
              placeholder="GSTIN (Optional)"
              className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs text-slate-800 font-mono uppercase"
            />
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => setShowNewCustomerForm(false)}
                className="px-2.5 py-1 bg-white border border-slate-200 text-slate-600 rounded font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded"
              >
                Save & Select
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-[220px] bg-white">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
            <ShoppingCart className="w-10 h-10 stroke-[1.2] mb-2 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">Cart is empty</p>
            <p className="text-xs text-slate-400 mt-1">Scan barcode or search products to begin billing.</p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.product.id}
              className="p-2.5 bg-white hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-lg text-xs flex items-center justify-between gap-2 transition"
            >
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h5 className="font-bold text-slate-900 truncate">{item.product.name}</h5>
                  <span className="px-1 py-0.2 text-[9px] font-mono bg-slate-100 text-slate-600 rounded border border-slate-200">
                    {item.product.gstRate}% GST
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                  <span>
                    {currency}{item.product.sellingPrice} × {item.quantity}
                  </span>
                  {item.discountPercent > 0 && (
                    <span className="text-green-700 bg-green-100 px-1 rounded font-bold">
                      -{item.discountPercent}%
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Stepper */}
              <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded hover:bg-white transition font-bold"
                  title="Decrease"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center font-bold text-slate-900 font-mono text-xs">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                  className="w-5 h-5 flex items-center justify-center text-slate-600 hover:text-slate-900 rounded hover:bg-white transition font-bold"
                  title="Increase"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Line Total */}
              <div className="text-right min-w-[70px]">
                <p className="font-bold text-slate-900 text-xs font-mono">{currency}{item.total.toFixed(2)}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  {/* Discount trigger */}
                  <button
                    type="button"
                    onClick={() => {
                      const input = window.prompt(`Enter discount % for ${item.product.name}:`, item.discountPercent.toString());
                      if (input !== null) {
                        const val = parseFloat(input);
                        if (!isNaN(val)) updateItemDiscount(item.product.id, val);
                      }
                    }}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Disc%
                  </button>
                  {/* Delete Item */}
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-slate-400 hover:text-red-600 p-0.5 rounded transition"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Totals & Actions Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0 text-xs">
        <div className="space-y-1.5 text-slate-600">
          <div className="flex justify-between">
            <span>Subtotal ({cartItemCount} items)</span>
            <span className="font-mono font-semibold text-slate-800">{currency}{cartSubtotal.toFixed(2)}</span>
          </div>

          {cartDiscountTotal > 0 && (
            <div className="flex justify-between text-green-700 font-semibold">
              <span>Total Discount</span>
              <span className="font-mono">-{currency}{cartDiscountTotal.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-[11px] text-slate-500">
            <span>Taxable / GST (CGST+SGST)</span>
            <span className="font-mono">{currency}{cartTaxableAmount.toFixed(2)} / {currency}{cartCgstTotal.toFixed(2)} + {currency}{cartSgstTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-baseline pt-2 border-t border-slate-200 text-slate-900">
            <span className="font-bold text-sm">Total Payable</span>
            <span className="font-bold text-xl text-indigo-600 font-mono">
              {currency}{cartGrandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            disabled={cart.length === 0}
            onClick={clearCart}
            className="px-3 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-red-600 font-semibold rounded-xl transition disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-2xs"
            title="Clear Cart (Esc)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            id="pos-pay-button"
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition shadow-md shadow-indigo-600/20 disabled:opacity-40 flex items-center justify-center gap-2 text-sm active:scale-[0.98]"
          >
            <CreditCard className="w-4 h-4" />
            <span>Pay {currency}{cartGrandTotal} (F4)</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
          <Check className="w-3 h-3 text-green-600" />
          <span>Auto-SMS Bill Enabled</span>
        </div>
      </div>
    </div>
  );
};
