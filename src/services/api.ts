import {
  Product,
  Customer,
  Sale,
  SMSLog,
  StockLog,
  StoreSettings,
  User,
  DashboardStats,
  AuditLog,
} from '../types/pos';

const API_BASE = '/api';

export const api = {
  // Products
  async getProducts(params?: { search?: string; category?: string; lowStock?: boolean; barcode?: string; sku?: string }): Promise<Product[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.lowStock) query.append('lowStock', 'true');
    if (params?.barcode) query.append('barcode', params.barcode);
    if (params?.sku) query.append('sku', params.sku);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch products');
    return data.products;
  },

  async generateBarcode(): Promise<{ barcode: string; format: string }> {
    const res = await fetch(`${API_BASE}/products/generate-barcode`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate barcode');
    return data;
  },

  async createProduct(productData: Partial<Product> & { actorName?: string }): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data.product;
  },

  async updateProduct(id: string, updates: Partial<Product> & { actorName?: string }): Promise<Product> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data.product;
  },

  async deleteProduct(id: string, managerPin?: string, actorName?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ managerPin, actorName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
  },

  async bulkUploadProducts(products: Partial<Product>[], actorName?: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const res = await fetch(`${API_BASE}/products/bulk-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ products, actorName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Bulk upload failed');
    return data;
  },

  // Inventory
  async getInventory(): Promise<{
    totalProducts: number;
    totalStockCount: number;
    totalPurchaseValuation: number;
    totalRetailValuation: number;
    potentialProfit: number;
    lowStockCount: number;
    outOfStockCount: number;
    products: Product[];
  }> {
    const res = await fetch(`${API_BASE}/inventory`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch inventory');
    return data;
  },

  async adjustStock(payload: {
    productId: string;
    quantityChange: number;
    type?: string;
    reason: string;
    actorName?: string;
    referenceId?: string;
  }): Promise<{ product: Product; log: StockLog }> {
    const res = await fetch(`${API_BASE}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Stock adjustment failed');
    return data;
  },

  async getStockLogs(productId?: string): Promise<StockLog[]> {
    const query = productId ? `?productId=${productId}` : '';
    const res = await fetch(`${API_BASE}/inventory/logs${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch stock logs');
    return data.logs;
  },

  // Customers
  async getCustomers(search?: string): Promise<Customer[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await fetch(`${API_BASE}/customers${query}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch customers');
    return data.customers;
  },

  async createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const res = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customer),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create customer');
    return data.customer;
  },

  async getCustomerProfile(id: string): Promise<{ customer: Customer; purchaseHistory: Sale[] }> {
    const res = await fetch(`${API_BASE}/customers/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch customer profile');
    return data;
  },

  // POS Checkout & Invoices
  async checkout(payload: {
    items: Array<{
      productId: string;
      productName?: string;
      quantity: number;
      unitPrice?: number;
      discountPercent?: number;
      discountAmount?: number;
    }>;
    customerId?: string;
    customerName?: string;
    customerPhone?: string;
    customerGstin?: string;
    paymentMethod: string;
    paymentBreakdown?: Array<{ method: string; amount: number; reference?: string }>;
    amountPaid?: number;
    discountTotal?: number;
    cashierId?: string;
    cashierName?: string;
    notes?: string;
    sendSms?: boolean;
  }): Promise<Sale> {
    const res = await fetch(`${API_BASE}/pos/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Checkout transaction failed');
    return data.sale;
  },

  async refundSale(payload: {
    saleId: string;
    managerPin: string;
    reason: string;
    refundedBy?: string;
  }): Promise<{ sale: Sale; message: string }> {
    const res = await fetch(`${API_BASE}/pos/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Refund failed');
    return data;
  },

  async getSales(params?: { date?: string; status?: string; search?: string; limit?: number; customerId?: string }): Promise<Sale[]> {
    const query = new URLSearchParams();
    if (params?.date) query.append('date', params.date);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.customerId) query.append('search', params.customerId);

    const res = await fetch(`${API_BASE}/sales?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch sales');
    return data.sales;
  },

  async getSaleById(id: string): Promise<{ sale: Sale; settings: StoreSettings }> {
    const res = await fetch(`${API_BASE}/sales/${id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch invoice');
    return data;
  },

  // Dashboard Stats
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch dashboard stats');
    return data.stats;
  },

  // Reports
  async getSalesReport(startDate?: string, endDate?: string, cashierId?: string): Promise<any> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    if (cashierId) query.append('cashierId', cashierId);

    const res = await fetch(`${API_BASE}/reports/sales?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch reports');
    return data;
  },

  async getGSTReport(startDate?: string, endDate?: string): Promise<any> {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);

    const res = await fetch(`${API_BASE}/reports/gst?${query.toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch GST report');
    return data;
  },

  // SMS Logs & Resend
  async getSMSLogs(): Promise<SMSLog[]> {
    const res = await fetch(`${API_BASE}/sms/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch SMS logs');
    return data.logs;
  },

  async resendSMS(saleId: string, customPhone?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sms/resend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId, customPhone }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resend SMS');
    return data;
  },

  async sendTestSMS(phone: string, message: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sms/send-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, message }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send test SMS');
    return data;
  },

  // Settings
  async getSettings(): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch settings');
    return data.settings;
  },

  async updateSettings(updates: Partial<StoreSettings>, actorName?: string): Promise<StoreSettings> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates, actorName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update settings');
    return data.settings;
  },

  // Security & Users
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${API_BASE}/users`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch users');
    return data.users;
  },

  async createUser(userData: { name: string; role: 'admin' | 'manager' | 'cashier'; pin: string; actorName?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create user');
    return data.user;
  },

  async updateUser(id: string, updates: { name?: string; role?: 'admin' | 'manager' | 'cashier'; pin?: string; actorName?: string }): Promise<User> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update user');
    return data.user;
  },

  async deleteUser(id: string, actorName?: string): Promise<void> {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ actorName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete user');
  },

  async verifyPin(pin: string, requiredRole?: string): Promise<{ verified: boolean; role: string; userName: string }> {
    const res = await fetch(`${API_BASE}/users/verify-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, requiredRole }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'PIN verification failed');
    return data;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${API_BASE}/audit/logs`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch audit logs');
    return data.logs;
  },
};
