import {
  Product,
  Customer,
  Sale,
  SMSLog,
  StockLog,
  StoreSettings,
  User,
  AuditLog
} from '../src/types/pos';

// Initial Store Settings (Fresh unconfigured store)
export const initialSettings: StoreSettings = {
  isConfigured: false,
  storeName: '',
  tagline: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  phone: '',
  email: '',
  gstin: '',
  currency: 'INR',
  currencySymbol: '₹',
  invoicePrefix: 'INV-',
  nextInvoiceNumber: 1001,
  printerType: 'thermal',
  thermalWidth: '80mm',
  enableSms: true,
  smsProvider: 'simulator',
  smsApiKey: '',
  smsSenderId: '',
  dltTemplateId: '',
  smsTemplate: 'Thank you for shopping with [STORE NAME]. Invoice #[INVOICE NO] for ₹[TOTAL] has been generated successfully. View your digital bill: [INVOICE LINK]',
  termsAndConditions: '1. Goods once sold can be exchanged within 7 days with original bill.\n2. Warranty handled by respective brand service centers.\n3. Thank you for shopping with us!',
  logoUrl: '',
  managerPin: '1234',
  upiId: '',
};

// Initial Categories (Standard retail classifications)
export const initialCategories = [
  'Groceries & Staples',
  'Beverages & Juices',
  'Snacks & Confectionery',
  'Personal Care & Hygiene',
  'Household & Cleaning',
  'Dairy & Bakery',
  'Electronics & Accessories',
  'Stationery & Office',
  'Apparel & Fashion',
  'General Merchandise',
];

// Initial Suppliers
export const initialSuppliers: string[] = [];

// Production-ready In-Memory Database (No fake or fabricated data)
class InMemoryDatabase {
  public products: Product[] = [];
  public customers: Customer[] = [];
  public sales: Sale[] = [];
  public smsLogs: SMSLog[] = [];
  public stockLogs: StockLog[] = [];
  public auditLogs: AuditLog[] = [];
  public users: User[] = [];
  public settings: StoreSettings = { ...initialSettings };
  private lock = false;

  constructor() {
    // Zero fake sales or hardcoded records
  }

  // Database helper methods
  public async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    while (this.lock) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    this.lock = true;
    try {
      return await work();
    } finally {
      this.lock = false;
    }
  }

  public addAuditLog(action: string, entity: string, entityId: string, details: string, actor: string) {
    this.auditLogs.unshift({
      id: 'aud_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      action,
      entity,
      entityId,
      details,
      actor: actor || 'System',
      timestamp: new Date().toISOString(),
    });
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }
}

export const db = new InMemoryDatabase();
