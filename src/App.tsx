import { Login } from './components/auth/Login';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './firebase';
import React from 'react';
import { POSProvider, usePOS } from './context/POSContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/Toast';
import { ShortcutsModal } from './components/common/ShortcutsModal';
import { RefundModal } from './components/common/RefundModal';
import { StoreSetupModal } from './components/common/StoreSetupModal';
import { POSBilling } from './components/pos/POSBilling';
import { InventoryManager } from './components/inventory/InventoryManager';
import { BarcodeGenerator } from './components/barcodes/BarcodeGenerator';
import { CustomerManager } from './components/customers/CustomerManager';
import { Dashboard } from './components/dashboard/Dashboard';
import { ReportsManager } from './components/reports/ReportsManager';
import { SMSLogsViewer } from './components/sms/SMSLogsViewer';
import { StoreSettings } from './components/settings/StoreSettings';

const MainLayout: React.FC = () => {
  const { activeTab, settings } = usePOS();
  const isSetupRequired = Boolean(settings && (!settings.isConfigured || !settings.storeName));

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#1e293b] flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <Navbar />
      <ToastContainer />
      <ShortcutsModal />
      <RefundModal />
      <StoreSetupModal isOpen={isSetupRequired} />

      <main className="flex-1 flex flex-col overflow-y-auto">
        {activeTab === 'pos' && <POSBilling />}
        {activeTab === 'inventory' && <InventoryManager />}
        {activeTab === 'barcodes' && <BarcodeGenerator />}
        {activeTab === 'customers' && <CustomerManager />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'reports' && <ReportsManager />}
        {activeTab === 'sms' && <SMSLogsViewer />}
        {activeTab === 'settings' && <StoreSettings />}
      </main>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setCheckingAuth(false);
    });

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
