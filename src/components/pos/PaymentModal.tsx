import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Banknote,
  QrCode,
  CreditCard,
  Layers,
  X,
  Phone,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { PaymentMethod } from '../../types/pos';

export const PaymentModal: React.FC = () => {
  const {
    isPaymentOpen,
    setIsPaymentOpen,
    cartGrandTotal,
    selectedCustomer,
    walkInCustomer,
    setWalkInCustomer,
    executeCheckout,
    settings,
  } = usePOS();

  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [tenderAmount, setTenderAmount] = useState<string>(cartGrandTotal.toString());
  const [phoneForSms, setPhoneForSms] = useState<string>('');
  const [sendSms, setSendSms] = useState<boolean>(true);
  const [customNotes, setCustomNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Split payment state
  const [splitCash, setSplitCash] = useState<string>('0');
  const [splitUpi, setSplitUpi] = useState<string>('0');
  const [splitCard, setSplitCard] = useState<string>('0');

  const currency = settings?.currencySymbol || '₹';

  useEffect(() => {
    if (isPaymentOpen) {
      setTenderAmount(cartGrandTotal.toString());
      const initialPhone = selectedCustomer?.phone || walkInCustomer.phone || '';
      setPhoneForSms(initialPhone);
      setSplitCash(cartGrandTotal.toString());
      setSplitUpi('0');
      setSplitCard('0');
    }
  }, [isPaymentOpen, cartGrandTotal, selectedCustomer, walkInCustomer]);

  if (!isPaymentOpen) return null;

  const parsedTender = parseFloat(tenderAmount) || 0;
  const changeDue = Math.max(0, parsedTender - cartGrandTotal);

  const quickDenominations = [
    { label: 'Exact', amount: cartGrandTotal },
    { label: `${currency}100`, amount: 100 },
    { label: `${currency}200`, amount: 200 },
    { label: `${currency}500`, amount: 500 },
    { label: `${currency}1000`, amount: 1000 },
    { label: `${currency}2000`, amount: 2000 },
    { label: `${currency}5000`, amount: 5000 },
  ];

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    // Update phone in walk-in if provided
    if (phoneForSms) {
      setWalkInCustomer((prev) => ({ ...prev, phone: phoneForSms }));
    }

    setIsProcessing(true);

    let breakdown = [{ method, amount: cartGrandTotal }];
    if (method === 'split') {
      const c = parseFloat(splitCash) || 0;
      const u = parseFloat(splitUpi) || 0;
      const card = parseFloat(splitCard) || 0;
      breakdown = [
        { method: 'cash', amount: c },
        { method: 'upi', amount: u },
        { method: 'card', amount: card },
      ].filter((b) => b.amount > 0);
    }

    await executeCheckout(method, parsedTender, breakdown, customNotes, sendSms);
    setIsProcessing(false);
  };

  const upiQrString = `upi://pay?pa=${encodeURIComponent(settings?.upiId || 'metromart@icici')}&pn=${encodeURIComponent(
    settings?.storeName || 'MetroMart'
  )}&am=${cartGrandTotal}&cu=INR&tn=BillPayment`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 text-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Complete POS Payment</h3>
            <p className="text-xs text-slate-500">Total Payable: <span className="font-bold text-indigo-600 font-mono text-sm">{currency}{cartGrandTotal.toFixed(2)}</span></p>
          </div>
          <button
            onClick={() => setIsPaymentOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'cash', label: 'Cash', icon: Banknote },
              { id: 'upi', label: 'UPI QR', icon: QrCode },
              { id: 'card', label: 'Card / POS', icon: CreditCard },
              { id: 'split', label: 'Split', icon: Layers },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = method === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMethod(tab.id as PaymentMethod);
                    if (tab.id !== 'cash') {
                      setTenderAmount(cartGrandTotal.toString());
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-bold transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mb-1.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Cash Tender & Change Calculations */}
          {method === 'cash' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Amount Tendered by Customer</label>
                <span className="text-[11px] text-slate-500 font-mono">Bill: {currency}{cartGrandTotal}</span>
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-base">{currency}</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={tenderAmount}
                  onChange={(e) => setTenderAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-base font-bold text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              {/* Quick Denominations */}
              <div className="flex flex-wrap gap-1.5">
                {quickDenominations.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setTenderAmount(d.amount.toString())}
                    className="px-2.5 py-1 text-xs font-mono font-semibold bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition shadow-2xs"
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Balance / Change Due */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-bold">Change to Return:</span>
                <span className={`text-base font-mono font-bold ${changeDue > 0 ? 'text-amber-600' : 'text-slate-700'}`}>
                  {currency}{changeDue.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* UPI Dynamic QR Code */}
          {method === 'upi' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-3">
              <div className="inline-block p-3 bg-white rounded-xl shadow-md border border-slate-200">
                {/* SVG Mock of QR Code with live data */}
                <div className="w-40 h-40 bg-slate-50 flex flex-col items-center justify-center border-2 border-indigo-600 rounded-lg p-2 relative">
                  <QrCode className="w-24 h-24 text-slate-900" />
                  <span className="text-[10px] font-bold text-indigo-700 font-mono mt-1">
                    SCAN TO PAY {currency}{cartGrandTotal}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 bg-indigo-600 text-white text-[8px] font-bold py-0.5 uppercase tracking-wider rounded-b">
                    BHIM UPI / GPay / PhonePe / Paytm
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                UPI VPA: <span className="font-mono text-indigo-600 font-bold">{settings?.upiId || 'metromart@icici'}</span>
              </p>
            </div>
          )}

          {/* Card / POS Terminal */}
          {method === 'card' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
              <CreditCard className="w-10 h-10 text-indigo-600 mx-auto stroke-[1.5]" />
              <p className="text-sm font-bold text-slate-900">Swipe / Tap Card on EDC POS Terminal</p>
              <p className="text-xs text-slate-500">Collect {currency}{cartGrandTotal} via Visa / MasterCard / RuPay.</p>
            </div>
          )}

          {/* Split Payment */}
          {method === 'split' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 text-xs">
              <p className="font-bold text-slate-800">Enter Payment Split Breakdown:</p>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Cash Amount</label>
                  <input
                    type="number"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">UPI Amount</label>
                  <input
                    type="number"
                    value={splitUpi}
                    onChange={(e) => setSplitUpi(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 font-semibold block mb-1">Card Amount</label>
                  <input
                    type="number"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Automated SMS Bill Dispatch Box */}
          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>Automated SMS Bill Delivery</span>
              </label>
              <input
                type="checkbox"
                checked={sendSms}
                onChange={(e) => setSendSms(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300"
              />
            </div>

            {sendSms && (
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneForSms}
                  onChange={(e) => setPhoneForSms(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit mobile number for instant SMS receipt..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            )}
            <p className="text-[11px] text-slate-500">
              Customer receives an instant SMS with digital invoice link and transaction confirmation.
            </p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsPaymentOpen(false)}
              className="px-4 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Back to Cart (Esc)
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isProcessing ? 'Processing Transaction...' : `Confirm & Generate Bill (${currency}${cartGrandTotal})`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
