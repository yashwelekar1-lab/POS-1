import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Receipt,
  Users,
  AlertTriangle,
  RotateCcw,
  Eye,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Banknote,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { DashboardStats, Sale } from '../../types/pos';
import { api } from '../../services/api';

export const Dashboard: React.FC = () => {
  const { settings, setSelectedSaleForRefund, setIsRefundOpen, setCompletedSale } = usePOS();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currency = settings?.currencySymbol || '₹';

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsData, salesData] = await Promise.all([
        api.getDashboardStats(),
        api.getSales({ limit: 8 }),
      ]);
      setStats(statsData);
      setRecentSales(salesData);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
        <p className="text-sm font-semibold animate-pulse">Loading POS Analytics Dashboard...</p>
      </div>
    );
  }

  // Max value for hourly chart scaling
  const maxHourlySales = Math.max(...stats.salesByHour.map((h) => h.sales), 100);
  const maxWeeklySales = Math.max(...stats.weeklyTrend.map((w) => w.sales), 1000);

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Today's Sales Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {currency}{stats.todaySales.toFixed(2)}
          </p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>Real-time live till</span>
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bills Generated Today</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono mt-2">
            {stats.todayOrders} <span className="text-xs font-normal text-slate-500">orders</span>
          </p>
          <p className="text-[11px] text-indigo-600 font-semibold mt-1">
            Avg {currency}{stats.todayOrders > 0 ? Math.round(stats.todaySales / stats.todayOrders) : 0} per bill
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Gross Margin / Profit</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg border border-purple-100">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-700 font-mono mt-2">
            {currency}{stats.todayProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {stats.todaySales > 0 ? `${((stats.todayProfit / stats.todaySales) * 100).toFixed(1)}% margin` : '0% margin'}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl relative overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Stock Alerts</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 font-mono mt-2">
            {stats.lowStockCount} <span className="text-xs font-normal text-slate-500">SKUs</span>
          </p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">
            {stats.lowStockCount > 0 ? 'Action required: Restock' : 'Inventory healthy'}
          </p>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Weekly 7-Day Trend Chart */}
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">7-Day Sales & Profit Performance</h3>
              <p className="text-xs text-slate-500">Daily store revenue against estimated gross margin</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-indigo-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Sales
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Profit
              </span>
            </div>
          </div>

          {/* Bar Chart Visualizer */}
          <div className="h-44 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {stats.weeklyTrend.map((day, idx) => {
              const salesHeight = (day.sales / maxWeeklySales) * 100;
              const profitHeight = (day.profit / maxWeeklySales) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Sales bar */}
                    <div
                      style={{ height: `${Math.max(salesHeight, 4)}%` }}
                      className="w-full max-w-[20px] bg-indigo-600 group-hover:bg-indigo-500 rounded-t transition shadow-2xs"
                      title={`${day.date}: Sales ${currency}${day.sales}`}
                    />
                    {/* Profit bar */}
                    <div
                      style={{ height: `${Math.max(profitHeight, 3)}%` }}
                      className="w-full max-w-[12px] bg-emerald-500 group-hover:bg-emerald-400 rounded-t transition shadow-2xs"
                      title={`${day.date}: Profit ${currency}${day.profit}`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-semibold">
                    {day.date.split('-')[2] || day.date.slice(-2)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hourly Traffic Today */}
          <div>
            <span className="text-xs font-bold text-slate-700 mb-2 block">Today's Hourly Sales Velocity</span>
            <div className="h-16 flex items-end justify-between gap-1">
              {stats.salesByHour.map((hour, i) => {
                const heightPercent = (hour.sales / maxHourlySales) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group">
                    <div
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                      className="w-full bg-slate-200 group-hover:bg-indigo-600 rounded-t transition"
                      title={`${hour.hour}: ${currency}${hour.sales} (${hour.orders} orders)`}
                    />
                    <span className="text-[8px] text-slate-400 font-mono mt-1 font-semibold">{hour.hour.split(':')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Payment Methods & Top Items */}
        <div className="lg:col-span-4 space-y-4">
          {/* Payment Methods Breakdown */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900">Tender Distribution</h3>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <Banknote className="w-3.5 h-3.5 text-emerald-600" /> Cash Tender
                </span>
                <span className="font-mono font-bold text-slate-900">{currency}{stats.paymentMethods.cash.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <QrCode className="w-3.5 h-3.5 text-indigo-600" /> UPI Dynamic QR
                </span>
                <span className="font-mono font-bold text-slate-900">{currency}{stats.paymentMethods.upi.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-700 font-medium">
                  <CreditCard className="w-3.5 h-3.5 text-purple-600" /> Card / POS
                </span>
                <span className="font-mono font-bold text-slate-900">{currency}{stats.paymentMethods.card.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Top Selling Products */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <h3 className="text-sm font-bold text-slate-900">Top 5 Best-Selling SKUs</h3>
            {stats.topProducts.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                No sales recorded yet
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {stats.topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900 truncate max-w-[140px]">{p.name}</p>
                      <p className="text-[10px] text-slate-500">{p.quantity} units sold</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600">{currency}{p.revenue}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Transaction Ledger */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent POS Transactions</h3>
            <p className="text-xs text-slate-500">Live feed of completed bills with one-click receipt view and manager refunds</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Cashier</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-semibold">
                    No sales recorded yet
                  </td>
                </tr>
              ) : (
                recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-indigo-600">{sale.invoiceNumber}</td>
                    <td className="p-3 text-slate-500 font-mono text-[11px]">
                      {new Date(sale.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })},{' '}
                      {new Date(sale.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {sale.customerName}
                      {sale.customerPhone && <span className="block text-[10px] text-slate-500 font-mono">+91 {sale.customerPhone}</span>}
                    </td>
                    <td className="p-3 text-slate-600">{sale.cashierName}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase font-mono font-semibold text-[10px]">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-slate-900">
                      {currency}{sale.grandTotal.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                          sale.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setCompletedSale(sale)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                          title="View / Print Receipt"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {sale.status === 'completed' && (
                          <button
                            onClick={() => {
                              setSelectedSaleForRefund(sale);
                              setIsRefundOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Authorize Refund (Manager PIN)"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
