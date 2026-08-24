import React, { useEffect, useRef } from 'react';
import { Sale, StoreSettings } from '../../types/pos';
import { renderBarcodeToSvg } from '../../utils/barcode';
import { QrCode } from 'lucide-react';

interface Props {
  sale: Sale;
  settings: StoreSettings;
  mode: 'thermal' | 'a4';
}

export const InvoicePrintView: React.FC<Props> = ({ sale, settings, mode }) => {
  const barcodeRef = useRef<SVGSVGElement>(null);
  const currency = settings?.currencySymbol || '₹';

  useEffect(() => {
    if (barcodeRef.current && sale?.invoiceNumber) {
      renderBarcodeToSvg(barcodeRef.current, sale.invoiceNumber, {
        width: 1.4,
        height: 35,
        displayValue: true,
        fontSize: 10,
        margin: 2,
      });
    }
  }, [sale]);

  if (mode === 'thermal') {
    // 80mm Thermal POS Receipt Layout
    return (
      <div className="bg-white text-black p-4 font-mono text-[11px] leading-tight max-w-[320px] mx-auto border border-dashed border-slate-300 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Store Header */}
        <div className="text-center pb-2 border-b border-black mb-2">
          <h2 className="text-sm font-bold uppercase tracking-wider">{settings.storeName}</h2>
          <p className="text-[10px]">{settings.tagline}</p>
          <p className="text-[10px] mt-0.5">{settings.address}, {settings.city}</p>
          <p className="text-[10px]">Ph: {settings.phone}</p>
          <p className="text-[10px] font-bold mt-1">GSTIN: {settings.gstin}</p>
        </div>

        {/* Invoice Meta */}
        <div className="space-y-0.5 pb-2 border-b border-dashed border-black mb-2 text-[10px]">
          <div className="flex justify-between">
            <span>Invoice #:</span>
            <span className="font-bold">{sale.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date/Time:</span>
            <span>{new Date(sale.createdAt).toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between">
            <span>Cashier:</span>
            <span>{sale.cashierName}</span>
          </div>
          <div className="flex justify-between">
            <span>Customer:</span>
            <span className="truncate max-w-[160px]">{sale.customerName}</span>
          </div>
          {sale.customerPhone && (
            <div className="flex justify-between">
              <span>Mobile:</span>
              <span>+91 {sale.customerPhone}</span>
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="pb-2 border-b border-dashed border-black mb-2">
          <div className="flex justify-between font-bold pb-1 border-b border-black text-[10px]">
            <span className="w-1/2">Item</span>
            <span className="w-1/6 text-center">Qty</span>
            <span className="w-1/3 text-right">Amt</span>
          </div>
          <div className="space-y-1.5 pt-1">
            {sale.items.map((item, idx) => (
              <div key={idx} className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span className="w-1/2 font-semibold truncate">{item.productName}</span>
                  <span className="w-1/6 text-center">{item.quantity}</span>
                  <span className="w-1/3 text-right">{currency}{item.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[9px] text-slate-700">
                  <span>@{currency}{item.unitPrice} (GST {item.gstRate}%)</span>
                  {item.discountPercent > 0 && <span>Disc -{item.discountPercent}%</span>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Totals */}
        <div className="space-y-1 pb-2 border-b border-black mb-2 text-[10px]">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{currency}{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between">
              <span>Discount:</span>
              <span>-{currency}{sale.discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-[9px] text-slate-700">
            <span>CGST / SGST:</span>
            <span>{currency}{sale.cgstTotal.toFixed(2)} / {currency}{sale.sgstTotal.toFixed(2)}</span>
          </div>
          {sale.roundOff !== 0 && (
            <div className="flex justify-between text-[9px]">
              <span>Round Off:</span>
              <span>{sale.roundOff > 0 ? '+' : ''}{currency}{sale.roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-xs pt-1 border-t border-black">
            <span>GRAND TOTAL:</span>
            <span>{currency}{sale.grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Tender Details */}
        <div className="space-y-0.5 pb-2 border-b border-dashed border-black mb-2 text-[10px]">
          <div className="flex justify-between">
            <span>Payment Mode:</span>
            <span className="font-bold uppercase">{sale.paymentMethod}</span>
          </div>
          <div className="flex justify-between">
            <span>Amount Paid:</span>
            <span>{currency}{sale.amountPaid.toFixed(2)}</span>
          </div>
          {sale.changeDue > 0 && (
            <div className="flex justify-between">
              <span>Change Returned:</span>
              <span className="font-bold">{currency}{sale.changeDue.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Barcode & Footer */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex justify-center">
            <svg ref={barcodeRef} className="max-w-[200px]" />
          </div>
          <p className="text-[9px] leading-tight text-slate-600">
            {settings.termsAndConditions || 'Thank you for shopping with us!'}
          </p>
          <p className="text-[8px] text-slate-500">*** End of Receipt ***</p>
        </div>
      </div>
    );
  }

  // A4 Standard GST Tax Invoice
  return (
    <div className="bg-white text-slate-900 p-6 sm:p-8 font-sans max-w-4xl mx-auto border border-slate-200 shadow-sm print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">{settings.storeName}</h1>
          <p className="text-xs text-slate-500 font-medium">{settings.tagline}</p>
          <p className="text-xs text-slate-600 mt-1">{settings.address}, {settings.city}, {settings.state} - {settings.pincode}</p>
          <p className="text-xs text-slate-600">Phone: {settings.phone} | Email: {settings.email}</p>
          <p className="text-xs font-bold text-slate-900 mt-1 font-mono">GSTIN: {settings.gstin}</p>
        </div>

        <div className="text-right">
          <span className="inline-block px-3 py-1 bg-slate-900 text-white font-bold text-xs rounded uppercase tracking-wider mb-2">
            TAX INVOICE
          </span>
          <p className="text-xs text-slate-600"><span className="font-semibold">Invoice No:</span> <span className="font-mono font-bold text-slate-900">{sale.invoiceNumber}</span></p>
          <p className="text-xs text-slate-600"><span className="font-semibold">Date & Time:</span> {new Date(sale.createdAt).toLocaleString('en-IN')}</p>
          <p className="text-xs text-slate-600"><span className="font-semibold">Cashier:</span> {sale.cashierName}</p>
          <p className="text-xs text-slate-600"><span className="font-semibold">Status:</span> <span className="uppercase font-bold text-emerald-600">{sale.status}</span></p>
        </div>
      </div>

      {/* Customer / Billed To */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 mb-4 flex justify-between text-xs">
        <div>
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Billed To (Customer)</p>
          <p className="font-bold text-sm text-slate-900">{sale.customerName}</p>
          {sale.customerPhone && <p className="text-slate-600">Mobile: +91 {sale.customerPhone}</p>}
          {sale.customerGstin && <p className="text-slate-900 font-mono font-semibold">GSTIN: {sale.customerGstin}</p>}
        </div>

        <div className="text-right">
          <p className="font-bold text-slate-700 uppercase tracking-wider text-[10px] mb-1">Payment Details</p>
          <p className="text-slate-800 font-semibold uppercase">{sale.paymentMethod}</p>
          <p className="text-slate-600">Paid: {currency}{sale.amountPaid.toFixed(2)}</p>
          {sale.changeDue > 0 && <p className="text-slate-600">Change: {currency}{sale.changeDue.toFixed(2)}</p>}
        </div>
      </div>

      {/* Table */}
      <table className="w-full text-xs text-left border-collapse mb-4">
        <thead>
          <tr className="bg-slate-900 text-white font-bold">
            <th className="p-2 text-center w-8">#</th>
            <th className="p-2">Item Description</th>
            <th className="p-2 text-center">HSN</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-right">Rate</th>
            <th className="p-2 text-center">Disc</th>
            <th className="p-2 text-center">GST%</th>
            <th className="p-2 text-right">CGST</th>
            <th className="p-2 text-right">SGST</th>
            <th className="p-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 border border-slate-200">
          {sale.items.map((item, idx) => (
            <tr key={idx} className="hover:bg-slate-50">
              <td className="p-2 text-center font-mono text-slate-500">{idx + 1}</td>
              <td className="p-2 font-medium text-slate-900">
                {item.productName}
                <span className="block text-[10px] text-slate-500 font-mono">SKU: {item.sku} | Barcode: {item.barcode}</span>
              </td>
              <td className="p-2 text-center font-mono text-slate-600">{item.hsnCode || '9999'}</td>
              <td className="p-2 text-center font-bold text-slate-800 font-mono">{item.quantity}</td>
              <td className="p-2 text-right font-mono">{currency}{item.unitPrice.toFixed(2)}</td>
              <td className="p-2 text-center font-mono text-emerald-600">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
              <td className="p-2 text-center font-mono">{item.gstRate}%</td>
              <td className="p-2 text-right font-mono text-slate-600">{currency}{item.cgst.toFixed(2)}</td>
              <td className="p-2 text-right font-mono text-slate-600">{currency}{item.sgst.toFixed(2)}</td>
              <td className="p-2 text-right font-mono font-bold text-slate-900">{currency}{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Box */}
      <div className="flex justify-between items-start gap-6 border-t-2 border-slate-200 pt-3">
        <div className="flex-1 text-xs text-slate-600 space-y-2">
          <div>
            <p className="font-bold text-slate-800 text-[11px]">Terms & Conditions:</p>
            <p className="text-[10px] text-slate-500 whitespace-pre-line leading-relaxed">{settings.termsAndConditions}</p>
          </div>
          <div className="pt-2">
            <svg ref={barcodeRef} className="max-w-[200px]" />
          </div>
        </div>

        <div className="w-64 space-y-1.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span className="font-mono">{currency}{sale.subtotal.toFixed(2)}</span>
          </div>
          {sale.discountTotal > 0 && (
            <div className="flex justify-between text-emerald-600 font-semibold">
              <span>Total Discount:</span>
              <span className="font-mono">-{currency}{sale.discountTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-600">
            <span>Taxable Value:</span>
            <span className="font-mono">{currency}{sale.taxableAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>CGST Total:</span>
            <span className="font-mono">{currency}{sale.cgstTotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>SGST Total:</span>
            <span className="font-mono">{currency}{sale.sgstTotal.toFixed(2)}</span>
          </div>
          {sale.roundOff !== 0 && (
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Round Off:</span>
              <span className="font-mono">{sale.roundOff > 0 ? '+' : ''}{currency}{sale.roundOff.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-2 border-t-2 border-slate-900 text-slate-900 font-bold text-sm">
            <span>Grand Total:</span>
            <span className="text-base text-indigo-700 font-mono">{currency}{sale.grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="mt-8 pt-4 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
        <p className="text-[10px]">Digital Invoice Generated by MetroMart Retail POS System</p>
        <div className="text-center">
          <p className="font-semibold text-slate-800">For {settings.storeName}</p>
          <div className="h-10"></div>
          <p className="border-t border-slate-400 pt-1 px-4">Authorized Signatory</p>
        </div>
      </div>
    </div>
  );
};
