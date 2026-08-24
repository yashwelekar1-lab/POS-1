export type UserRole = 'admin' | 'manager' | 'cashier';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  barcodeFormat?: 'CODE128' | 'EAN13' | 'UPC';
  category: string;
  brand: string;
  purchasePrice: number;
  sellingPrice: number;
  gstRate: number; // e.g. 0, 5, 12, 18, 28
  hsnCode?: string;
  currentStock: number;
  minStockLevel: number;
  supplier: string;
  unit: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  totalPurchases: number;
  totalSpent: number;
  outstandingBalance: number;
  createdAt: string;
  lastPurchaseDate?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customPrice?: number;
  discountPercent: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  total: number;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'split' | 'store_credit';

export interface PaymentBreakdown {
  method: PaymentMethod;
  amount: number;
  reference?: string; // UPI txn id, card last 4 digits
}

export type SaleStatus = 'completed' | 'refunded' | 'cancelled';

export interface SaleItem {
  productId: string;
  productName: string;
  sku: string;
  barcode: string;
  hsnCode?: string;
  quantity: number;
  unitPrice: number;
  purchasePrice: number;
  discountPercent: number;
  discountAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  taxAmount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  cashierId: string;
  cashierName: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerGstin?: string;
  items: SaleItem[];
  subtotal: number;
  discountTotal: number;
  taxableAmount: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  taxTotal: number;
  grandTotal: number;
  roundOff: number;
  amountPaid: number;
  changeDue: number;
  paymentMethod: PaymentMethod;
  paymentBreakdown: PaymentBreakdown[];
  status: SaleStatus;
  notes?: string;
  smsSent: boolean;
  smsLogId?: string;
  refundReason?: string;
  refundedBy?: string;
  refundedAt?: string;
}

export type SMSStatus = 'pending' | 'sent' | 'delivered' | 'failed';

export interface SMSLog {
  id: string;
  saleId: string;
  invoiceNumber: string;
  recipientPhone: string;
  customerName: string;
  message: string;
  provider: string;
  status: SMSStatus;
  sentAt: string;
  deliveredAt?: string;
  error?: string;
  retryCount: number;
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: 'sale' | 'purchase' | 'adjustment_in' | 'adjustment_out' | 'return' | 'initial';
  quantityChange: number; // positive or negative
  stockBefore: number;
  stockAfter: number;
  reason: string;
  referenceId?: string; // invoice number or batch number
  actorName: string;
  timestamp: string;
}

export interface StoreSettings {
  isConfigured?: boolean;
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  gstin: string;
  currency: string;
  currencySymbol: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  printerType: 'thermal' | 'a4';
  thermalWidth: '80mm' | '58mm';
  enableSms: boolean;
  smsProvider: 'simulator' | 'fast2sms' | 'twilio' | 'custom_http';
  smsApiKey: string;
  smsSenderId: string;
  dltTemplateId: string;
  smsTemplate: string;
  termsAndConditions: string;
  logoUrl?: string;
  managerPin: string;
  upiId: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  actor: string;
  timestamp: string;
}

export interface DashboardStats {
  todaySales: number;
  todayBillsCount: number;
  todayOrders: number;
  todayAverageBill: number;
  todayProfit: number;
  totalProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  paymentMethods: { cash: number; card: number; upi: number; split?: number };
  todayPaymentBreakdown: Record<string, number>;
  salesByHour: { hour: string; sales: number; orders: number }[];
  hourlySales: { hour: string; sales: number; bills: number }[];
  weeklyTrend: { date: string; sales: number; profit: number }[];
  weeklySales: { date: string; sales: number; profit: number }[];
  topProducts: { id?: string; name: string; sku?: string; quantity: number; revenue: number }[];
  topSellingProducts: { id: string; name: string; sku: string; unitsSold: number; revenue: number }[];
  recentTransactions: Sale[];
}

export interface GSTReportSlab {
  rate: number;
  taxableAmount: number;
  taxableValue?: number;
  cgst: number;
  sgst: number;
  totalTax: number;
}

export interface GSTReport {
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalTax: number;
  totalGrossSales?: number;
  slabs: GSTReportSlab[];
  gstBreakdown?: GSTReportSlab[];
}

export interface ProductSaleStat {
  productId: string;
  name: string;
  sku: string;
  units: number;
  revenue: number;
  profit: number;
}

export interface CashierSaleStat {
  cashierName: string;
  orders: number;
  sales: number;
}

export interface SalesReport {
  totalSales: number;
  totalUnits: number;
  totalDiscount: number;
  totalProfit: number;
  productSales: ProductSaleStat[];
  cashierSales: CashierSaleStat[];
}

