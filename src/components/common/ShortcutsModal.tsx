import React from 'react';
import { usePOS } from '../../context/POSContext';
import { Keyboard, X, Command } from 'lucide-react';

export const ShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, setIsShortcutsOpen } = usePOS();

  if (!isShortcutsOpen) return null;

  const shortcuts = [
    { key: 'F2 or /', desc: 'Focus barcode/product search bar' },
    { key: 'F4 or Enter', desc: 'Open Payment Modal (when cart has items)' },
    { key: 'Space', desc: 'Launch Camera Barcode Scanner' },
    { key: 'Esc', desc: 'Clear cart / Close active modal' },
    { key: 'F8', desc: 'Quick Walk-in / Customer phone focus' },
    { key: 'Alt + 1', desc: 'Switch to POS Billing Tab' },
    { key: 'Alt + 2', desc: 'Switch to Inventory Tab' },
    { key: 'Alt + 3', desc: 'Switch to Barcode Studio' },
    { key: 'Alt + 4', desc: 'Switch to Dashboard' },
    { key: 'Alt + 5', desc: 'Switch to Reports & GST' },
    { key: 'Alt + 6', desc: 'Switch to SMS Logs' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 text-slate-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cashier Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500">High-speed keyboard commands for effortless POS billing</p>
            </div>
          </div>
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((item, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 transition"
            >
              <span className="text-xs text-slate-700 font-semibold">{item.desc}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white text-indigo-700 border border-slate-200 rounded shadow-2xs">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={() => setIsShortcutsOpen(false)}
            className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition shadow-md shadow-indigo-600/20 active:scale-98"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
