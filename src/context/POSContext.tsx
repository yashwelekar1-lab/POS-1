import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  Product,
  Customer,
  CartItem,
  Sale,
  StoreSettings,
  User,
  UserRole,
} from '../types/pos';
import { api } from '../services/api';
import { sound } from '../utils/audio';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

interface POSContextType {
  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Role & Users
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  refreshUsers: () => Promise<void>;
  switchUserRole: (role: UserRole) => void;

  // Settings
  settings: StoreSettings | null;
  refreshSettings: () => Promise<void>;
  updateSettings: (updates: Partial<StoreSettings>) => Promise<void>;

  // Products & Inventory
  products: Product[];
  isLoadingProducts: boolean;
  refreshProducts: () => Promise<void>;
  findProductByBarcodeOrSku: (code: string) => Product | undefined;

  // Cart Management
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => boolean;
  updateCartQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discountPercent: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartDiscountTotal: number;
  cartTaxableAmount: number;
  cartCgstTotal: number;
  cartSgstTotal: number;
  cartTaxTotal: number;
  cartGrandTotal: number;
  cartItemCount: number;

  // Customer Management
  selectedCustomer: Customer | null;
  setSelectedCustomer: (customer: Customer | null) => void;
  walkInCustomer: { name: string; phone: string; gstin: string };
  setWalkInCustomer: React.Dispatch<React.SetStateAction<{ name: string; phone: string; gstin: string }>>;

  // Checkout & Modals
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isPaymentOpen: boolean;
  setIsPaymentOpen: (open: boolean) => void;
  isShortcutsOpen: boolean;
  setIsShortcutsOpen: (open: boolean) => void;
  completedSale: Sale | null;
  setCompletedSale: (sale: Sale | null) => void;
  isRefundOpen: boolean;
  setIsRefundOpen: (open: boolean) => void;
  selectedSaleForRefund: Sale | null;
  setSelectedSaleForRefund: (sale: Sale | null) => void;

  // Complete Checkout action
  executeCheckout: (paymentMethod: string, amountPaid: number, breakdown?: any[], customNotes?: string, sendSms?: boolean) => Promise<Sale | null>;

  // Refund action
  executeRefund: (saleId: string, pin: string, reason: string) => Promise<boolean>;

  // Toast
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('pos');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'usr_3',
    name: 'Amit Verma',
    role: 'cashier',
    pin: '3456',
  });
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [walkInCustomer, setWalkInCustomer] = useState<{ name: string; phone: string; gstin: string }>({
    name: 'Walk-in Customer',
    phone: '',
    gstin: '',
  });

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState<boolean>(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isRefundOpen, setIsRefundOpen] = useState<boolean>(false);
  const [selectedSaleForRefund, setSelectedSaleForRefund] = useState<Sale | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const refreshProducts = useCallback(async () => {
    try {
      setIsLoadingProducts(true);
      const data = await api.getProducts();
      setProducts(data);
    } catch (err: any) {
      addToast('error', 'Failed to load products', err.message);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [addToast]);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err: any) {
      console.warn('Failed to load settings:', err);
    }
  }, []);

  const refreshUsers = useCallback(async () => {
    try {
      const data = await api.getUsers();
      setUsers(data);
    } catch (err: any) {
      console.warn('Failed to load users:', err);
    }
  }, []);

  useEffect(() => {
    refreshProducts();
    refreshSettings();
    refreshUsers();
  }, [refreshProducts, refreshSettings, refreshUsers]);

  const switchUserRole = (role: UserRole) => {
    const found = users.find((u) => u.role === role);
    if (found) {
      setCurrentUser(found);
      addToast('info', `Switched active user to ${found.name} (${role.toUpperCase()})`);
    } else {
      setCurrentUser({
        id: `usr_${role}`,
        name: role.charAt(0).toUpperCase() + role.slice(1) + ' User',
        role,
        pin: '1234',
      });
      addToast('info', `Active role set to ${role.toUpperCase()}`);
    }
  };

  const updateSettingsHandler = async (updates: Partial<StoreSettings>) => {
    try {
      const updated = await api.updateSettings(updates, currentUser.name);
      setSettings(updated);
      addToast('success', 'Store settings updated successfully');
    } catch (err: any) {
      addToast('error', 'Failed to update settings', err.message);
    }
  };

  // Find product by SKU or Barcode
  const findProductByBarcodeOrSku = useCallback((code: string): Product | undefined => {
    const clean = code.trim().toLowerCase();
    return products.find(
      (p) => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
    );
  }, [products]);

  // Cart Calculations
  const addToCart = useCallback((product: Product, quantity = 1): boolean => {
    if (!product.isActive) {
      sound.playErrorBeep();
      addToast('error', 'Product is deactivated');
      return false;
    }

    if (product.currentStock <= 0) {
      sound.playErrorBeep();
      addToast('error', 'Out of stock', `${product.name} is currently out of stock.`);
      return false;
    }

    let added = false;
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const currentQtyInCart = existing ? existing.quantity : 0;
      const targetQty = currentQtyInCart + quantity;

      if (targetQty > product.currentStock) {
        sound.playErrorBeep();
        addToast('warning', 'Stock limit reached', `Only ${product.currentStock} available in inventory.`);
        return prev;
      }

      sound.playScanBeep();
      added = true;

      if (existing) {
        return prev.map((item) => {
          if (item.product.id === product.id) {
            const qty = item.quantity + quantity;
            const price = item.product.sellingPrice;
            const discAmt = (price * qty * item.discountPercent) / 100;
            const net = price * qty - discAmt;
            const taxable = net / (1 + (item.product.gstRate || 0) / 100);
            return {
              ...item,
              quantity: qty,
              discountAmount: discAmt,
              taxAmount: net - taxable,
              subtotal: price * qty,
              total: net,
            };
          }
          return item;
        });
      } else {
        const price = product.sellingPrice;
        const net = price * quantity;
        const taxable = net / (1 + (product.gstRate || 0) / 100);
        const newItem: CartItem = {
          product,
          quantity,
          discountPercent: 0,
          discountAmount: 0,
          taxAmount: net - taxable,
          subtotal: net,
          total: net,
        };
        return [newItem, ...prev];
      }
    });

    return added;
  }, [addToast]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          if (quantity > item.product.currentStock) {
            addToast('warning', 'Insufficient stock', `Max available stock is ${item.product.currentStock}`);
            return item;
          }
          const price = item.product.sellingPrice;
          const discAmt = (price * quantity * item.discountPercent) / 100;
          const net = price * quantity - discAmt;
          const taxable = net / (1 + (item.product.gstRate || 0) / 100);
          return {
            ...item,
            quantity,
            discountAmount: discAmt,
            taxAmount: net - taxable,
            subtotal: price * quantity,
            total: net,
          };
        }
        return item;
      })
    );
  }, [addToast]);

  const updateItemDiscount = useCallback((productId: string, discountPercent: number) => {
    const validPercent = Math.max(0, Math.min(100, discountPercent));
    setCart((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const price = item.product.sellingPrice;
          const discAmt = (price * item.quantity * validPercent) / 100;
          const net = price * item.quantity - discAmt;
          const taxable = net / (1 + (item.product.gstRate || 0) / 100);
          return {
            ...item,
            discountPercent: validPercent,
            discountAmount: discAmt,
            taxAmount: net - taxable,
            total: net,
          };
        }
        return item;
      })
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedCustomer(null);
    setWalkInCustomer({ name: 'Walk-in Customer', phone: '', gstin: '' });
  }, []);

  // Aggregated Cart Totals
  const cartSubtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartDiscountTotal = cart.reduce((sum, item) => sum + item.discountAmount, 0);
  const cartTaxTotal = cart.reduce((sum, item) => sum + item.taxAmount, 0);
  const cartTaxableAmount = cartSubtotal - cartDiscountTotal - cartTaxTotal;
  const cartCgstTotal = cartTaxTotal / 2;
  const cartSgstTotal = cartTaxTotal / 2;
  const cartGrandTotal = Math.round(cartSubtotal - cartDiscountTotal);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Execute Checkout
  const executeCheckout = async (
    paymentMethod: string,
    amountPaid: number,
    breakdown?: any[],
    customNotes?: string,
    sendSms = true
  ): Promise<Sale | null> => {
    if (cart.length === 0) {
      addToast('error', 'Cart is empty');
      return null;
    }

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.product.sellingPrice,
          discountPercent: item.discountPercent,
          discountAmount: item.discountAmount,
        })),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer ? selectedCustomer.name : walkInCustomer.name || 'Walk-in Customer',
        customerPhone: selectedCustomer ? selectedCustomer.phone : walkInCustomer.phone,
        customerGstin: selectedCustomer ? selectedCustomer.gstin : walkInCustomer.gstin,
        paymentMethod,
        paymentBreakdown: breakdown || [{ method: paymentMethod, amount: cartGrandTotal }],
        amountPaid: amountPaid || cartGrandTotal,
        discountTotal: cartDiscountTotal,
        cashierId: currentUser.id,
        cashierName: currentUser.name,
        notes: customNotes,
        sendSms,
      };

      const sale = await api.checkout(payload);
      sound.playCashRegisterSound();
      addToast('success', 'Sale Completed!', `Invoice #${sale.invoiceNumber} generated.`);

      setCompletedSale(sale);
      clearCart();
      setIsPaymentOpen(false);
      refreshProducts(); // Refresh stock levels

      return sale;
    } catch (err: any) {
      sound.playErrorBeep();
      addToast('error', 'Checkout Failed', err.message);
      return null;
    }
  };

  // Execute Refund
  const executeRefund = async (saleId: string, pin: string, reason: string): Promise<boolean> => {
    try {
      const res = await api.refundSale({
        saleId,
        managerPin: pin,
        reason,
        refundedBy: currentUser.name,
      });

      addToast('success', 'Refund Processed', res.message);
      refreshProducts();
      setIsRefundOpen(false);
      setSelectedSaleForRefund(null);
      return true;
    } catch (err: any) {
      sound.playErrorBeep();
      addToast('error', 'Refund Failed', err.message);
      return false;
    }
  };

  return (
    <POSContext.Provider
      value={{
        activeTab,
        setActiveTab,
        currentUser,
        setCurrentUser,
        users,
        refreshUsers,
        switchUserRole,
        settings,
        refreshSettings,
        updateSettings: updateSettingsHandler,
        products,
        isLoadingProducts,
        refreshProducts,
        findProductByBarcodeOrSku,
        cart,
        addToCart,
        updateCartQuantity,
        updateItemDiscount,
        removeFromCart,
        clearCart,
        cartSubtotal,
        cartDiscountTotal,
        cartTaxableAmount,
        cartCgstTotal,
        cartSgstTotal,
        cartTaxTotal,
        cartGrandTotal,
        cartItemCount,
        selectedCustomer,
        setSelectedCustomer,
        walkInCustomer,
        setWalkInCustomer,
        isScannerOpen,
        setIsScannerOpen,
        isPaymentOpen,
        setIsPaymentOpen,
        isShortcutsOpen,
        setIsShortcutsOpen,
        completedSale,
        setCompletedSale,
        isRefundOpen,
        setIsRefundOpen,
        selectedSaleForRefund,
        setSelectedSaleForRefund,
        executeCheckout,
        executeRefund,
        toasts,
        addToast,
        removeToast,
      }}
    >
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (!context) {
    throw new Error('usePOS must be used within a POSProvider');
  }
  return context;
};
