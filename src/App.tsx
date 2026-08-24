import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';

import { auth } from './firebase';
import { Login } from './components/auth/Login';

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

  const isSetupRequired = Boolean(
    settings &&
      (!settings.isConfigured || !settings.storeName)
  );

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

const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto" />

        <p className="mt-4 text-sm font-medium text-slate-500">
          Checking authentication...
        </p>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser);
        setCheckingAuth(false);
      },
      (error) => {
        console.error('Authentication state error:', error);
        setUser(null);
        setCheckingAuth(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * Firebase is checking whether the user already has
   * an authenticated session.
   */
  if (checkingAuth) {
    return <LoadingScreen />;
  }

  /*
   * No authenticated user:
   * show the Google login page.
   */
  if (!user) {
    return <Login />;
  }

  /*
   * Authenticated user:
   * allow access to the complete POS system.
   */
  return (
    <POSProvider>
      <MainLayout />
    </POSProvider>
  );
}
