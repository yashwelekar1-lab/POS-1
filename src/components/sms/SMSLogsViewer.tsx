import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  MessageSquareText,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Radio,
  ExternalLink,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import { SMSLog } from '../../types/pos';
import { api } from '../../services/api';

export const SMSLogsViewer: React.FC = () => {
  const { settings, addToast } = usePOS();
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [testPhone, setTestPhone] = useState<string>('');
  const [testMessage, setTestMessage] = useState<string>('');

  useEffect(() => {
    if (settings?.storeName) {
      setTestMessage(
        `Thank you for shopping at ${settings.storeName}! Your bill #INV-1001 of ₹500.00 is generated. View: https://bill.pos/b/1001`
      );
    }
  }, [settings?.storeName]);

  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getSMSLogs();
      setLogs(data);
    } catch (err) {
      console.warn(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleSendTestSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;
    setIsSendingTest(true);
    try {
      const res = await api.sendTestSMS(testPhone, testMessage);
      addToast('success', 'SMS Dispatched', `Status: ${res.status} via ${res.provider}`);
      await loadLogs();
    } catch (err: any) {
      addToast('error', 'SMS Test Failed', err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (filterStatus === 'all') return true;
    return log.status.toLowerCase() === filterStatus.toLowerCase();
  });

  const deliveredCount = logs.filter((l) => l.status === 'delivered').length;
  const sentCount = logs.filter((l) => l.status === 'sent').length;
  const failedCount = logs.filter((l) => l.status === 'failed').length;

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Automated SMS Bill Delivery Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Active: {settings?.smsProvider?.toUpperCase() || 'SIMULATOR'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Audit live SMS dispatches, delivery receipts, customer phone links, and DLT routing
            </p>
          </div>
        </div>

        <button
          onClick={loadLogs}
          className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Live SMS Ledger */}
        <div className="lg:col-span-8 space-y-4">
          {/* Summary Pills */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-slate-500 font-semibold text-xs">Delivered Bills</span>
              <p className="text-xl font-bold text-emerald-600 font-mono mt-1">{deliveredCount}</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-slate-500 font-semibold text-xs">Sent / In Flight</span>
              <p className="text-xl font-bold text-indigo-600 font-mono mt-1">{sentCount}</p>
            </div>
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <span className="text-slate-500 font-semibold text-xs">Failed / Undelivered</span>
              <p className="text-xl font-bold text-rose-600 font-mono mt-1">{failedCount}</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-2xs">
            <span className="text-xs font-bold text-slate-700">Filter By Delivery Status:</span>
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
              {['all', 'delivered', 'sent', 'failed'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1 rounded capitalize font-bold transition ${
                    filterStatus === st ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* SMS Logs Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-3">Time & Invoice</th>
                    <th className="p-3">Recipient Mobile</th>
                    <th className="p-3">Message Text Preview</th>
                    <th className="p-3 text-center">Provider</th>
                    <th className="p-3 text-right">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-semibold">
                        No SMS delivery records yet
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="p-3">
                          <p className="font-mono font-bold text-slate-900">
                            {log.invoiceNumber || 'Manual Test'}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })},{' '}
                            {new Date(log.timestamp).toLocaleDateString('en-IN')}
                          </p>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          +91 {log.phone}
                        </td>
                        <td className="p-3 text-slate-600 max-w-xs">
                          <p className="text-[11px] line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200 font-mono text-slate-800">
                            {log.message}
                          </p>
                        </td>
                        <td className="p-3 text-center font-mono uppercase text-[10px] font-semibold text-slate-500">
                          {log.provider}
                        </td>
                        <td className="p-3 text-right">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase font-mono ${
                              log.status === 'delivered'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : log.status === 'sent'
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {log.status === 'delivered' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Send Test SMS Console & SMS Config Status */}
        <div className="lg:col-span-4 space-y-4">
          {/* Test SMS Dispatcher */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-900">Live SMS Dispatch Console</h3>
            </div>
            <p className="text-xs text-slate-500">
              Test your SMS gateway integration by dispatching an instant digital invoice alert.
            </p>

            <form onSubmit={handleSendTestSMS} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Mobile Phone Number (+91)</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={testPhone}
                    onChange={(e) => setTestPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">SMS Template Content</label>
                <textarea
                  required
                  rows={4}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 font-mono text-[11px] focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Length: {testMessage.length} characters (1 SMS segment)
                </span>
              </div>

              <button
                type="submit"
                disabled={isSendingTest || !testPhone}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSendingTest ? 'Dispatching SMS...' : 'Dispatch Test SMS'}</span>
              </button>
            </form>
          </div>

          {/* DLT & Template Compliance Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-600" />
              DLT Compliance & SMS Routing
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              In India, automated transactional billing SMS requires TRAI/DLT registration. Configure your Fast2SMS or Twilio credentials in <span className="text-indigo-600 font-bold">Settings</span>. By default, the system uses the high-speed instant Simulator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
