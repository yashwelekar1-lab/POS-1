import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { usePOS } from '../../context/POSContext';
import {
  Printer,
  FileDown,
  MessageSquare,
  CheckCircle2,
  X,
  Share2,
  RotateCcw,
  Sparkles,
  Phone,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { InvoicePrintView } from '../invoice/InvoicePrintView';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { api } from '../../services/api';

export const InvoiceSuccessModal: React.FC = () => {
  const { completedSale, setCompletedSale, settings, addToast } = usePOS();
  const [printMode, setPrintMode] = useState<'thermal' | 'a4'>('thermal');
  const [smsDeliveryStatus, setSmsDeliveryStatus] = useState<string>('delivered');
  const [isResendingSms, setIsResendingSms] = useState(false);
  const [resendPhone, setResendPhone] = useState('');
  const [showResendInput, setShowResendInput] = useState(false);

  useEffect(() => {
    if (completedSale) {
      // Trigger subtle celebration confetti
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#4f46e5', '#10b981', '#f59e0b', '#ec4899'],
        });
      } catch {}

      setPrintMode(settings?.printerType || 'thermal');
      setResendPhone(completedSale.customerPhone || '');
      setSmsDeliveryStatus(completedSale.smsSent ? 'delivered' : 'not_sent');
    }
  }, [completedSale, settings]);

  if (!completedSale || !settings) return null;

  const currency = settings.currencySymbol || '₹';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateInvoicePDF(completedSale, settings);
    addToast('success', 'PDF Downloaded', `Invoice_${completedSale.invoiceNumber}.pdf saved`);
  };

  const handleResendSMS = async () => {
    if (!resendPhone) {
      addToast('error', 'Mobile number is required');
      return;
    }
    setIsResendingSms(true);
    try {
      await api.resendSMS(completedSale.id, resendPhone);
      setSmsDeliveryStatus('delivered');
      addToast('success', 'SMS Sent!', `Digital invoice dispatched to +91 ${resendPhone}`);
      setShowResendInput(false);
    } catch (err: any) {
      addToast('error', 'SMS Failed', err.message);
    } finally {
      setIsResendingSms(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 text-slate-900 shadow-2xl my-auto">
        {/* Top Celebration Bar */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Payment Successful!</h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {completedSale.invoiceNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Amount Paid: <span className="font-bold text-emerald-600 font-mono">{currency}{completedSale.grandTotal}</span> via {completedSale.paymentMethod.toUpperCase()}
              </p>
            </div>
          </div>

          <button
            onClick={() => setCompletedSale(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SMS Status Notification Banner */}
        <div className="mb-4 p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-indigo-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-800">
                Automated SMS Bill Delivery:{' '}
                {completedSale.customerPhone ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Delivered to +91 {completedSale.customerPhone}
                  </span>
                ) : (
                  <span className="text-slate-500">Not sent (No mobile number provided)</span>
                )}
              </p>
              <p className="text-[11px] text-slate-500">
                Customer receives an instant SMS link to download their digital bill.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowResendInput(!showResendInput)}
              className="px-2.5 py-1 text-[11px] font-bold bg-white hover:bg-slate-50 text-indigo-600 rounded border border-indigo-200 shadow-2xs transition"
            >
              {showResendInput ? 'Cancel' : 'Resend / Change Phone'}
            </button>
          </div>
        </div>

        {/* Resend SMS Input Drawer */}
        {showResendInput && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-2 text-xs">
            <Phone className="w-4 h-4 text-slate-500" />
            <input
              type="tel"
              maxLength={10}
              value={resendPhone}
              onChange={(e) => setResendPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 10-digit mobile number..."
              className="flex-1 bg-white border border-slate-200 rounded px-2.5 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleResendSMS}
              disabled={isResendingSms || !resendPhone}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded disabled:opacity-50 flex items-center gap-1.5 active:scale-95 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResendingSms ? 'animate-spin' : ''}`} />
              Send SMS
            </button>
          </div>
        )}

        {/* Receipt / Invoice Preview Options */}
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-indigo-600" />
            Receipt Preview:
          </span>
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setPrintMode('thermal')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                printMode === 'thermal' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              80mm Thermal Receipt
            </button>
            <button
              onClick={() => setPrintMode('a4')}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                printMode === 'a4' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              A4 Standard GST Invoice
            </button>
          </div>
        </div>

        {/* Printable Component Container */}
        <div className="max-h-[380px] overflow-y-auto bg-slate-50 p-4 rounded-xl border border-slate-200 mb-4">
          <InvoicePrintView sale={completedSale} settings={settings} mode={printMode} />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 shadow-2xs"
          >
            <Printer className="w-4 h-4 text-indigo-600" />
            <span>Print Receipt</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex-1 py-2.5 px-3 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 shadow-2xs"
          >
            <FileDown className="w-4 h-4 text-emerald-600" />
            <span>Download PDF</span>
          </button>

          <button
            onClick={() => setCompletedSale(null)}
            className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Next Bill (Enter)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
