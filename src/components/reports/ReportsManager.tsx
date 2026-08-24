import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Calendar,
  Layers,
  IndianRupee,
  Users,
  Package,
  ArrowUpDown,
  Download,
} from 'lucide-react';
import { GSTReport, SalesReport } from '../../types/pos';
import { api } from '../../services/api';

export const ReportsManager: React.FC = () => {
  const { settings, addToast } = usePOS();
  const [reportType, setReportType] = useState<'sales' | 'gst' | 'cashier'>('gst');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [gstReport, setGstReport] = useState<GSTReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const currency = settings?.currencySymbol || '₹';

  const loadReports = async () => {
    setIsLoading(true);
    try {
      if (reportType === 'sales' || reportType === 'cashier') {
        const data = await api.getSalesReport(startDate, endDate);
        setSalesReport(data);
      } else if (reportType === 'gst') {
        const data = await api.getGSTReport(startDate, endDate);
        setGstReport(data);
      }
    } catch (err: any) {
      addToast('error', 'Report Load Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [reportType, startDate, endDate]);

  const handleExportCSV = () => {
    if (reportType === 'gst' && gstReport) {
      const headers = ['GST Slab', 'Taxable Amount', 'CGST', 'SGST', 'Total Tax Amount'];
      const rows = gstReport.slabs.map((s) => [
        `"${s.rate}% GST"`,
        s.taxableAmount.toFixed(2),
        s.cgst.toFixed(2),
        s.sgst.toFixed(2),
        s.totalTax.toFixed(2),
      ]);
      rows.push([
        '"TOTAL"',
        gstReport.totalTaxable.toFixed(2),
        gstReport.totalCgst.toFixed(2),
        gstReport.totalSgst.toFixed(2),
        gstReport.totalTax.toFixed(2),
      ]);

      downloadCSV(`GST_Filing_Report_${startDate}_to_${endDate}.csv`, headers, rows);
    } else if (salesReport) {
      const headers = ['Product Name', 'SKU', 'Units Sold', 'Revenue', 'Profit'];
      const rows = salesReport.productSales.map((p) => [
        `"${p.name.replace(/"/g, '""')}"`,
        p.sku,
        p.units,
        p.revenue.toFixed(2),
        p.profit.toFixed(2),
      ]);
      downloadCSV(`Product_Sales_Report_${startDate}_to_${endDate}.csv`, headers, rows);
    }
  };

  const downloadCSV = (filename: string, headers: string[], rows: any[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Export Complete', filename);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Financial & GST Reports Center</h2>
            <p className="text-xs text-slate-500">Generate GST-compliant tax returns, sales registers, and cashier summaries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-600" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-98 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range & Tab Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setReportType('gst')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              reportType === 'gst' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            GST Tax Slabs Report
          </button>
          <button
            onClick={() => setReportType('sales')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              reportType === 'sales' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Product Sales & Profit
          </button>
          <button
            onClick={() => setReportType('cashier')}
            className={`px-3 py-1 rounded-md text-xs font-bold transition ${
              reportType === 'cashier' ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Cashier Performance
          </button>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <span className="text-slate-400 font-semibold">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* GST REPORT VIEW */}
      {reportType === 'gst' && gstReport && (
        <div className="space-y-4">
          {/* Top GST Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Taxable Turnover</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-1">
                {currency}{gstReport.totalTaxable.toFixed(2)}
              </p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">CGST Collected</span>
              <p className="text-xl font-bold text-indigo-600 font-mono mt-1">
                {currency}{gstReport.totalCgst.toFixed(2)}
              </p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">SGST Collected</span>
              <p className="text-xl font-bold text-indigo-600 font-mono mt-1">
                {currency}{gstReport.totalSgst.toFixed(2)}
              </p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Tax Output Liability</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
                {currency}{gstReport.totalTax.toFixed(2)}
              </p>
            </div>
          </div>

          {/* GST Slabs Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Tax Rate (Slab)</th>
                  <th className="p-3.5 text-right">Taxable Turnover Value</th>
                  <th className="p-3.5 text-right">Central GST (CGST)</th>
                  <th className="p-3.5 text-right">State GST (SGST)</th>
                  <th className="p-3.5 text-right">Total Tax Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gstReport.slabs.map((slab) => (
                  <tr key={slab.rate} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900 font-mono">
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {slab.rate}% GST
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-900">{currency}{slab.taxableAmount.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{currency}{slab.cgst.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">{currency}{slab.sgst.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{currency}{slab.totalTax.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold text-slate-900">
                <tr>
                  <td className="p-3.5 uppercase text-xs">TOTAL LIABILITY</td>
                  <td className="p-3.5 text-right font-mono text-slate-900">{currency}{gstReport.totalTaxable.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-indigo-700">{currency}{gstReport.totalCgst.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-indigo-700">{currency}{gstReport.totalSgst.toFixed(2)}</td>
                  <td className="p-3.5 text-right font-mono text-emerald-600 text-sm">{currency}{gstReport.totalTax.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* SALES & PROFIT REPORT */}
      {reportType === 'sales' && salesReport && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Period Revenue</span>
              <p className="text-xl font-bold text-slate-900 font-mono mt-1">{currency}{salesReport.totalSales.toFixed(2)}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Units Sold</span>
              <p className="text-xl font-bold text-indigo-600 font-mono mt-1">{salesReport.totalUnits}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Total Discounts Given</span>
              <p className="text-xl font-bold text-amber-600 font-mono mt-1">{currency}{salesReport.totalDiscount.toFixed(2)}</p>
            </div>
            <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-xs font-semibold text-slate-500">Gross Margin / Profit</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{currency}{salesReport.totalProfit.toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3.5">Product SKU & Name</th>
                  <th className="p-3.5 text-center">Units Sold</th>
                  <th className="p-3.5 text-right">Total Revenue</th>
                  <th className="p-3.5 text-right">Estimated Gross Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {salesReport.productSales.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                      No sales recorded in selected date range
                    </td>
                  </tr>
                ) : (
                  salesReport.productSales.map((p) => (
                    <tr key={p.productId} className="hover:bg-slate-50 transition">
                      <td className="p-3.5">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-500 font-mono">SKU: {p.sku}</p>
                      </td>
                      <td className="p-3.5 text-center font-mono font-bold text-slate-700">{p.units}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-slate-900">{currency}{p.revenue.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{currency}{p.profit.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CASHIER PERFORMANCE REPORT */}
      {reportType === 'cashier' && salesReport && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3.5">Cashier Name</th>
                <th className="p-3.5 text-center">Bills Handled</th>
                <th className="p-3.5 text-right">Total Collection Revenue</th>
                <th className="p-3.5 text-right">Average Bill Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesReport.cashierSales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400 font-semibold">
                    No sales recorded in selected date range
                  </td>
                </tr>
              ) : (
                salesReport.cashierSales.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition">
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center text-[10px] font-bold">
                        {c.cashierName.charAt(0)}
                      </div>
                      <span>{c.cashierName}</span>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold text-slate-700">{c.orders}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-emerald-600">{currency}{c.sales.toFixed(2)}</td>
                    <td className="p-3.5 text-right font-mono text-slate-600">
                      {currency}{c.orders > 0 ? (c.sales / c.orders).toFixed(2) : '0.00'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
