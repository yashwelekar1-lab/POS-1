import React, { useEffect } from 'react';
import { ProductSearchGrid } from './ProductSearchGrid';
import { CartPanel } from './CartPanel';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { PaymentModal } from './PaymentModal';
import { InvoiceSuccessModal } from './InvoiceSuccessModal';
import { usePOS } from '../../context/POSContext';

export const POSBilling: React.FC = () => {
  const {
    cart,
    cartGrandTotal,
    setIsScannerOpen,
    setIsPaymentOpen,
    isPaymentOpen,
    isScannerOpen,
    completedSale,
    setCompletedSale,
    clearCart,
  } = usePOS();

  // Cashier Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input unless it's hotkeys like F2, F4, Esc
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select';

      // F2: Focus Search
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // F4: Trigger Pay
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !completedSale) {
          setIsPaymentOpen(true);
        }
        return;
      }

      // F8: Focus Customer Phone
      if (e.key === 'F8') {
        e.preventDefault();
        const phoneInput = document.getElementById('pos-customer-phone');
        if (phoneInput) {
          phoneInput.focus();
        }
        return;
      }

      // Space: Launch Camera Barcode Scanner (if not typing in an input)
      if (e.code === 'Space' && !isInput && !isPaymentOpen && !isScannerOpen && !completedSale) {
        e.preventDefault();
        setIsScannerOpen(true);
        return;
      }

      // Enter: Close Completed Sale Modal
      if (e.key === 'Enter' && completedSale) {
        e.preventDefault();
        setCompletedSale(null);
        return;
      }

      // Esc: Close active modal or clear cart
      if (e.key === 'Escape') {
        if (isScannerOpen) {
          setIsScannerOpen(false);
        } else if (isPaymentOpen) {
          setIsPaymentOpen(false);
        } else if (completedSale) {
          setCompletedSale(null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, completedSale, isPaymentOpen, isScannerOpen, setIsScannerOpen, setIsPaymentOpen, setCompletedSale]);

  return (
    <div className="flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 max-w-7xl mx-auto w-full h-[calc(100vh-80px)] overflow-hidden">
      {/* Left 7 Columns: Product Grid & Search */}
      <div className="lg:col-span-7 xl:col-span-8 h-full overflow-hidden flex flex-col">
        <ProductSearchGrid />
      </div>

      {/* Right 5 Columns: Active Cart & Customer Panel */}
      <div className="lg:col-span-5 xl:col-span-4 h-full overflow-hidden flex flex-col">
        <CartPanel />
      </div>

      {/* Modals */}
      <BarcodeScannerModal />
      <PaymentModal />
      <InvoiceSuccessModal />
    </div>
  );
};
