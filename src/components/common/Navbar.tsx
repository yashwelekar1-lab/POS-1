import React, { useState, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  ShoppingCart,
  Boxes,
  Barcode,
  Users,
  LayoutDashboard,
  BarChart3,
  MessageSquareText,
  Settings,
  Keyboard,
  ShieldCheck,
  UserCheck,
  Clock,
  Store,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '../../types/pos';

export const Navbar: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUser,
    users,
    switchUserRole,
    settings,
    products,
    cartItemCount,
    setIsShortcutsOpen,
  } = usePOS();

  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  const lowStockProductsCount = products.filter((p) => p.isActive && p.currentStock <= p.minStockLevel).length;

  const navItems = [
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, badge: cartItemCount > 0 ? cartItemCount : null },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: lowStockProductsCount > 0 ? lowStockProductsCount : null, badgeColor: 'bg-amber-500' },
    { id: 'barcodes', label: 'Barcode Studio', icon: Barcode },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Reports & GST', icon: BarChart3 },
    { id: 'sms', label: 'SMS Delivery', icon: MessageSquareText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="bg-[#0f172a] border-b border-slate-800 text-white select-none shrink-0 sticky top-0 z-40">
      {/* Top microbar */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-black/40 border-b border-white/5 text-[11px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-wide text-indigo-400">
            <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center font-bold text-xs text-white">
              {settings?.storeName ? settings.storeName.charAt(0).toUpperCase() : 'P'}
            </div>
            <span>{settings?.storeName || 'POS Terminal (Setup Required)'}</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400 font-mono text-[10px]">
            {settings?.gstin ? `GSTIN: ${settings.gstin}` : 'GSTIN: Not Configured'}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Real-Data Terminal
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{currentTime}</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">User:</span>
            {users.length > 0 ? (
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const targetUser = users.find((u) => u.id === e.target.value);
                  if (targetUser) setCurrentUser(targetUser);
                }}
                className="bg-slate-800 border border-slate-700 text-indigo-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={currentUser.role}
                onChange={(e) => switchUserRole(e.target.value as UserRole)}
                className="bg-slate-800 border border-slate-700 text-indigo-200 rounded px-2 py-0.5 text-xs font-semibold focus:outline-hidden cursor-pointer"
              >
                <option value="cashier">Cashier (Billing)</option>
                <option value="manager">Manager (Authorized)</option>
                <option value="admin">Admin (Full Control)</option>
              </select>
            )}
          </div>

          <button
            onClick={() => setIsShortcutsOpen(true)}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 border border-white/10 text-xs"
            title="Keyboard Shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5 text-indigo-400" />
            <span>Hotkeys</span>
          </button>
        </div>
      </div>

      {/* Main Nav Items */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== null && item.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold text-white ${
                      item.badgeColor || 'bg-rose-500'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Badge */}
        <div className="flex items-center gap-2 pl-3 border-l border-slate-800">
          <div className="w-7 h-7 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {currentUser.name.charAt(0)}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold text-slate-100 leading-tight">{currentUser.name}</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">{currentUser.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
};
