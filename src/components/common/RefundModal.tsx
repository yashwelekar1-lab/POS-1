import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext';
import { ShieldAlert, RotateCcw, X, Lock } from 'lucide-react';

export const RefundModal: React.FC = () => {
  const { isRefundOpen, setIsRefundOpen, selectedSaleForRefund, setSelectedSaleForRefund, executeRefund } = usePOS();
  const [pin, setPin] = useState('');
  const [reason, setReason] = useState('Customer return / Defective item');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isRefundOpen || !selectedSaleForRefund) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    setIsSubmitting(true);
    const success = await executeRefund(selectedSaleForRefund.id, pin, reason);
    setIsSubmitting(false);
    if (success) {
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Authorize Bill Refund</h3>
              <p className="text-xs text-slate-500">Invoice #{selectedSaleForRefund.invoiceNumber}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsRefundOpen(false);
              setSelectedSaleForRefund(null);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 mb-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Bill Amount:</span>
            <span className="font-bold text-slate-900 font-mono">₹{selectedSaleForRefund.grandTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Customer:</span>
            <span className="text-slate-800 font-medium">{selectedSaleForRefund.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-semibold">Items Count:</span>
            <span className="text-slate-800">{selectedSaleForRefund.items.length} items (Stock will be auto-restored)</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Manager Authorization PIN <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Enter 4-digit Manager PIN (Demo: 1234)"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white font-mono tracking-widest"
                autoFocus
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Default Demo Manager PIN is <span className="font-mono font-bold text-indigo-600">1234</span></p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Reason for Refund / Cancellation</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Customer return / Defective item">Customer return / Defective item</option>
              <option value="Wrong product billed by cashier">Wrong product billed by cashier</option>
              <option value="Customer cancelled before exit">Customer cancelled before exit</option>
              <option value="Billing price dispute / System error">Billing price dispute / System error</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRefundOpen(false);
                setSelectedSaleForRefund(null);
              }}
              className="flex-1 px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-2xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !pin}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition disabled:opacity-50 shadow-md shadow-rose-600/20 active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              {isSubmitting ? 'Authorizing...' : 'Confirm Refund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
