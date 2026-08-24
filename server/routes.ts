import express, { Request, Response } from 'express';
import { db } from './db';
import { formatSMSMessage, sendSMSNotification } from './sms';
import { Product, Sale, SaleItem, StockLog, Customer, PaymentMethod } from '../src/types/pos';

export const apiRouter = express.Router();

// Helper to generate unique EAN13 barcode
function generateUniqueEAN13(): string {
  let code = '';
  let exists = true;
  while (exists) {
    // 890 (India prefix) + 9 random digits + 1 checksum digit
    const base = '890' + Math.floor(100000000 + Math.random() * 900000000).toString();
    // Calculate EAN13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(base[i], 10);
      sum += i % 2 === 0 ? digit : digit * 3;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    code = base + checkDigit;
    exists = db.products.some((p) => p.barcode === code);
  }
  return code;
}

// -------------------------------------------------------------
// PRODUCTS & BARCODES
// -------------------------------------------------------------
apiRouter.get('/products', (req: Request, res: Response) => {
  const { search, category, lowStock, barcode, sku } = req.query;
  let items = db.products.filter((p) => p.isActive);

  if (category && typeof category === 'string' && category !== 'All') {
    items = items.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  if (lowStock === 'true') {
    items = items.filter((p) => p.currentStock <= p.minStockLevel);
  }

  if (barcode && typeof barcode === 'string') {
    items = items.filter((p) => p.barcode === barcode);
  }

  if (sku && typeof sku === 'string') {
    items = items.filter((p) => p.sku.toLowerCase() === sku.toLowerCase());
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: items.length, products: items });
});

apiRouter.post('/products/generate-barcode', (req: Request, res: Response) => {
  const barcode = generateUniqueEAN13();
  res.json({ success: true, barcode, format: 'EAN13' });
});

apiRouter.post('/products', (req: Request, res: Response) => {
  const {
    name,
    sku,
    barcode,
    barcodeFormat,
    category,
    brand,
    purchasePrice,
    sellingPrice,
    gstRate,
    hsnCode,
    currentStock,
    minStockLevel,
    supplier,
    unit,
    imageUrl,
    actorName,
  } = req.body;

  if (!name || !sellingPrice) {
    return res.status(400).json({ success: false, error: 'Product name and selling price are required' });
  }

  const generatedSku = (sku || 'SKU-' + Math.random().toString(36).substring(2, 8)).toUpperCase();
  const assignedBarcode = barcode ? barcode.trim() : generateUniqueEAN13();

  // Check unique SKU
  const existingSku = db.products.find((p) => p.sku.toLowerCase() === generatedSku.toLowerCase());
  if (existingSku) {
    return res.status(400).json({ success: false, error: `SKU '${generatedSku}' already exists for '${existingSku.name}'` });
  }

  // Check unique Barcode
  const existingBarcode = db.products.find((p) => p.barcode === assignedBarcode);
  if (existingBarcode) {
    return res.status(400).json({ success: false, error: `Barcode '${assignedBarcode}' already assigned to '${existingBarcode.name}'` });
  }

  const newProduct: Product = {
    id: 'prod_' + Date.now(),
    name: name.trim(),
    sku: generatedSku,
    barcode: assignedBarcode,
    barcodeFormat: barcodeFormat || 'EAN13',
    category: category || 'General',
    brand: brand || 'Generic',
    purchasePrice: Number(purchasePrice) || 0,
    sellingPrice: Number(sellingPrice),
    gstRate: Number(gstRate) || 0,
    hsnCode: hsnCode || '9999',
    currentStock: Number(currentStock) || 0,
    minStockLevel: Number(minStockLevel) || 5,
    supplier: supplier || 'General Supplier',
    unit: unit || 'Pcs',
    imageUrl: imageUrl || '',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);

  // Initial stock movement log
  if (newProduct.currentStock > 0) {
    db.stockLogs.unshift({
      id: 'stk_' + Date.now(),
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'initial',
      quantityChange: newProduct.currentStock,
      stockBefore: 0,
      stockAfter: newProduct.currentStock,
      reason: 'Initial stock intake on product creation',
      actorName: actorName || 'System',
      timestamp: new Date().toISOString(),
    });
  }

  db.addAuditLog('PRODUCT_CREATED', 'Product', newProduct.id, `Created product ${newProduct.name} (${newProduct.sku})`, actorName || 'Admin');

  res.status(201).json({ success: true, product: newProduct });
});

apiRouter.put('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const productIndex = db.products.findIndex((p) => p.id === id);

  if (productIndex === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const existing = db.products[productIndex];
  const {
    name,
    sku,
    barcode,
    category,
    brand,
    purchasePrice,
    sellingPrice,
    gstRate,
    hsnCode,
    minStockLevel,
    supplier,
    unit,
    imageUrl,
    actorName,
  } = req.body;

  // Validate barcode uniqueness if changed
  if (barcode && barcode !== existing.barcode) {
    const dup = db.products.find((p) => p.id !== id && p.barcode === barcode);
    if (dup) {
      return res.status(400).json({ success: false, error: `Barcode ${barcode} already used by ${dup.name}` });
    }
  }

  const updated: Product = {
    ...existing,
    name: name !== undefined ? name.trim() : existing.name,
    sku: sku !== undefined ? sku.trim().toUpperCase() : existing.sku,
    barcode: barcode !== undefined ? barcode.trim() : existing.barcode,
    category: category !== undefined ? category : existing.category,
    brand: brand !== undefined ? brand : existing.brand,
    purchasePrice: purchasePrice !== undefined ? Number(purchasePrice) : existing.purchasePrice,
    sellingPrice: sellingPrice !== undefined ? Number(sellingPrice) : existing.sellingPrice,
    gstRate: gstRate !== undefined ? Number(gstRate) : existing.gstRate,
    hsnCode: hsnCode !== undefined ? hsnCode : existing.hsnCode,
    minStockLevel: minStockLevel !== undefined ? Number(minStockLevel) : existing.minStockLevel,
    supplier: supplier !== undefined ? supplier : existing.supplier,
    unit: unit !== undefined ? unit : existing.unit,
    imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
    updatedAt: new Date().toISOString(),
  };

  db.products[productIndex] = updated;
  db.addAuditLog('PRODUCT_UPDATED', 'Product', updated.id, `Updated product details for ${updated.name}`, actorName || 'Admin');

  res.json({ success: true, product: updated });
});

apiRouter.delete('/products/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorName, managerPin } = req.body;

  if (managerPin && managerPin !== db.settings.managerPin) {
    return res.status(403).json({ success: false, error: 'Invalid Manager PIN authorization' });
  }

  const productIndex = db.products.findIndex((p) => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ success: false, error: 'Product not found' });
  }

  const prod = db.products[productIndex];
  prod.isActive = false;
  db.addAuditLog('PRODUCT_DELETED', 'Product', prod.id, `Deactivated product ${prod.name} (${prod.sku})`, actorName || 'Manager');

  res.json({ success: true, message: `Product ${prod.name} removed successfully` });
});

apiRouter.post('/products/bulk-upload', (req: Request, res: Response) => {
  const { products, actorName } = req.body;
  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ success: false, error: 'Valid array of products is required' });
  }

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const item of products) {
    if (!item.name || !item.sellingPrice) {
      skipped++;
      errors.push(`Row missing name or price`);
      continue;
    }

    const sku = (item.sku || 'SKU-' + Math.random().toString(36).substring(2, 8)).toUpperCase();
    const barcode = item.barcode ? String(item.barcode).trim() : generateUniqueEAN13();

    // Check if barcode or sku exists
    const dupSku = db.products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
    const dupBarcode = db.products.find((p) => p.barcode === barcode);

    if (dupSku || dupBarcode) {
      skipped++;
      errors.push(`Skipped ${item.name}: Duplicate SKU (${sku}) or Barcode (${barcode})`);
      continue;
    }

    const newProd: Product = {
      id: 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      name: String(item.name).trim(),
      sku,
      barcode,
      barcodeFormat: 'EAN13',
      category: item.category || 'General',
      brand: item.brand || 'Generic',
      purchasePrice: Number(item.purchasePrice) || 0,
      sellingPrice: Number(item.sellingPrice),
      gstRate: Number(item.gstRate) || 0,
      hsnCode: item.hsnCode ? String(item.hsnCode) : '9999',
      currentStock: Number(item.currentStock) || 0,
      minStockLevel: Number(item.minStockLevel) || 5,
      supplier: item.supplier || 'General Supplier',
      unit: item.unit || 'Pcs',
      imageUrl: item.imageUrl || '',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.products.unshift(newProd);
    imported++;
  }

  db.addAuditLog('BULK_PRODUCT_IMPORT', 'Product', 'bulk', `Imported ${imported} products, skipped ${skipped}`, actorName || 'Admin');
  res.json({ success: true, imported, skipped, errors, total: db.products.length });
});

// -------------------------------------------------------------
// INVENTORY & STOCK MANAGEMENT
// -------------------------------------------------------------
apiRouter.get('/inventory', (req: Request, res: Response) => {
  const activeProducts = db.products.filter((p) => p.isActive);
  const totalStockCount = activeProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const totalPurchaseValuation = activeProducts.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalRetailValuation = activeProducts.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = activeProducts.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0).length;
  const outOfStockCount = activeProducts.filter((p) => p.currentStock <= 0).length;

  res.json({
    success: true,
    totalProducts: activeProducts.length,
    totalStockCount,
    totalPurchaseValuation,
    totalRetailValuation,
    potentialProfit: totalRetailValuation - totalPurchaseValuation,
    lowStockCount,
    outOfStockCount,
    products: activeProducts,
  });
});

apiRouter.post('/inventory/adjust', async (req: Request, res: Response) => {
  const { productId, quantityChange, type, reason, actorName, referenceId } = req.body;

  if (!productId || quantityChange === undefined) {
    return res.status(400).json({ success: false, error: 'Product ID and quantity change are required' });
  }

  const result = await db.withTransaction(async () => {
    const prod = db.products.find((p) => p.id === productId);
    if (!prod) {
      throw new Error('Product not found');
    }

    const change = Number(quantityChange);
    const stockBefore = prod.currentStock;
    const stockAfter = Math.max(0, stockBefore + change);

    prod.currentStock = stockAfter;
    prod.updatedAt = new Date().toISOString();

    const stockLog: StockLog = {
      id: 'stk_' + Date.now(),
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      type: type || (change >= 0 ? 'adjustment_in' : 'adjustment_out'),
      quantityChange: change,
      stockBefore,
      stockAfter,
      reason: reason || 'Manual stock adjustment',
      referenceId: referenceId || '',
      actorName: actorName || 'Manager',
      timestamp: new Date().toISOString(),
    };

    db.stockLogs.unshift(stockLog);
    db.addAuditLog('STOCK_ADJUSTED', 'Inventory', prod.id, `Stock changed by ${change} (${stockBefore} -> ${stockAfter}). Reason: ${reason}`, actorName || 'Manager');

    return { product: prod, log: stockLog };
  });

  res.json({ success: true, ...result });
});

apiRouter.get('/inventory/logs', (req: Request, res: Response) => {
  const { productId, limit } = req.query;
  let logs = [...db.stockLogs];
  if (productId && typeof productId === 'string') {
    logs = logs.filter((l) => l.productId === productId);
  }
  const max = limit ? Number(limit) : 100;
  res.json({ success: true, count: logs.length, logs: logs.slice(0, max) });
});

// -------------------------------------------------------------
// CUSTOMERS & CRM
// -------------------------------------------------------------
apiRouter.get('/customers', (req: Request, res: Response) => {
  const { search } = req.query;
  let list = [...db.customers];

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email && c.email.toLowerCase().includes(q)));
  }

  res.json({ success: true, count: list.length, customers: list });
});

apiRouter.post('/customers', (req: Request, res: Response) => {
  const { name, phone, email, address, gstin } = req.body;
  if (!name || !phone) {
    return res.status(400).json({ success: false, error: 'Customer name and phone number are required' });
  }

  const cleanPhone = phone.replace(/[^0-9]/g, '').slice(-10);
  const existing = db.customers.find((c) => c.phone.replace(/[^0-9]/g, '').slice(-10) === cleanPhone);

  if (existing) {
    // Update existing customer details
    existing.name = name.trim();
    if (email) existing.email = email.trim();
    if (address) existing.address = address.trim();
    if (gstin) existing.gstin = gstin.trim().toUpperCase();
    return res.json({ success: true, customer: existing, updated: true });
  }

  const newCustomer: Customer = {
    id: 'cust_' + Date.now(),
    name: name.trim(),
    phone: cleanPhone,
    email: email ? email.trim() : '',
    address: address ? address.trim() : '',
    gstin: gstin ? gstin.trim().toUpperCase() : '',
    totalPurchases: 0,
    totalSpent: 0,
    outstandingBalance: 0,
    createdAt: new Date().toISOString(),
  };

  db.customers.unshift(newCustomer);
  db.addAuditLog('CUSTOMER_CREATED', 'Customer', newCustomer.id, `Created customer ${newCustomer.name} (${newCustomer.phone})`, 'Cashier');

  res.status(201).json({ success: true, customer: newCustomer });
});

apiRouter.get('/customers/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const customer = db.customers.find((c) => c.id === id);
  if (!customer) {
    return res.status(404).json({ success: false, error: 'Customer not found' });
  }
  const purchaseHistory = db.sales.filter((s) => s.customerId === id);
  res.json({ success: true, customer, purchaseHistory });
});

// -------------------------------------------------------------
// POS CHECKOUT & BILLING (TRANSACTIONAL)
// -------------------------------------------------------------
apiRouter.post('/pos/checkout', async (req: Request, res: Response) => {
  const {
    items,
    customerId,
    customerName,
    customerPhone,
    customerGstin,
    paymentMethod,
    paymentBreakdown,
    amountPaid,
    discountTotal,
    cashierId,
    cashierName,
    notes,
    sendSms,
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart is empty. Please add items to checkout.' });
  }

  try {
    const saleResult = await db.withTransaction(async () => {
      // 1. Validate all products and stock
      const saleItems: SaleItem[] = [];
      let subtotal = 0;
      let calculatedDiscountTotal = 0;
      let taxableAmount = 0;
      let cgstTotal = 0;
      let sgstTotal = 0;
      let igstTotal = 0;
      let taxTotal = 0;

      for (const item of items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (!product) {
          throw new Error(`Product '${item.productName || item.productId}' not found in catalog.`);
        }

        const qty = Number(item.quantity);
        if (qty <= 0) {
          throw new Error(`Invalid quantity for ${product.name}`);
        }

        if (product.currentStock < qty) {
          throw new Error(`Insufficient stock for '${product.name}'. Available: ${product.currentStock}, Requested: ${qty}`);
        }

        const unitPrice = Number(item.unitPrice || product.sellingPrice);
        const itemDiscountPercent = Number(item.discountPercent) || 0;
        const itemDiscountAmt = Number(item.discountAmount) || (unitPrice * qty * itemDiscountPercent) / 100;
        const netItemPrice = unitPrice * qty - itemDiscountAmt;

        // GST calculation (Reverse GST from MRP if inclusive or standard computation)
        // Rate is inclusive in selling price
        const gstRate = product.gstRate || 0;
        const itemTaxable = netItemPrice / (1 + gstRate / 100);
        const itemTax = netItemPrice - itemTaxable;
        const cgst = itemTax / 2;
        const sgst = itemTax / 2;
        const igst = 0;

        subtotal += unitPrice * qty;
        calculatedDiscountTotal += itemDiscountAmt;
        taxableAmount += itemTaxable;
        cgstTotal += cgst;
        sgstTotal += sgst;
        igstTotal += igst;
        taxTotal += itemTax;

        saleItems.push({
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          barcode: product.barcode,
          hsnCode: product.hsnCode,
          quantity: qty,
          unitPrice,
          purchasePrice: product.purchasePrice,
          discountPercent: itemDiscountPercent,
          discountAmount: Number(itemDiscountAmt.toFixed(2)),
          gstRate,
          cgst: Number(cgst.toFixed(2)),
          sgst: Number(sgst.toFixed(2)),
          igst: 0,
          taxAmount: Number(itemTax.toFixed(2)),
          total: Number(netItemPrice.toFixed(2)),
        });
      }

      // Add overall cart discount if any
      const overallCartDiscount = Number(discountTotal) || 0;
      if (overallCartDiscount > calculatedDiscountTotal) {
        calculatedDiscountTotal = overallCartDiscount;
      }

      const rawGrandTotal = subtotal - calculatedDiscountTotal;
      const roundedGrandTotal = Math.round(rawGrandTotal);
      const roundOff = Number((roundedGrandTotal - rawGrandTotal).toFixed(2));

      const paid = Number(amountPaid) || roundedGrandTotal;
      const changeDue = Math.max(0, paid - roundedGrandTotal);

      // 2. Generate unique invoice number
      const invoiceNumber = `${db.settings.invoicePrefix}${db.settings.nextInvoiceNumber}`;
      db.settings.nextInvoiceNumber += 1;

      // 3. Deduct stock and write stock movement logs
      for (const saleItem of saleItems) {
        const product = db.products.find((p) => p.id === saleItem.productId)!;
        const stockBefore = product.currentStock;
        product.currentStock -= saleItem.quantity;
        product.updatedAt = new Date().toISOString();

        db.stockLogs.unshift({
          id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          type: 'sale',
          quantityChange: -saleItem.quantity,
          stockBefore,
          stockAfter: product.currentStock,
          reason: 'POS Sale',
          referenceId: invoiceNumber,
          actorName: cashierName || 'Cashier',
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Handle Customer Association / Updates
      let finalCustomerId = customerId;
      let finalCustomerName = customerName || 'Walk-in Customer';
      let finalCustomerPhone = customerPhone || '';

      if (customerPhone && customerPhone.trim().length >= 10) {
        const cleanPhone = customerPhone.replace(/[^0-9]/g, '').slice(-10);
        let cust = db.customers.find((c) => c.phone.slice(-10) === cleanPhone);
        if (!cust) {
          cust = {
            id: 'cust_' + Date.now(),
            name: customerName || 'Valued Customer',
            phone: cleanPhone,
            gstin: customerGstin || '',
            totalPurchases: 1,
            totalSpent: roundedGrandTotal,
            outstandingBalance: 0,
            createdAt: new Date().toISOString(),
            lastPurchaseDate: new Date().toISOString(),
          };
          db.customers.unshift(cust);
        } else {
          cust.totalPurchases += 1;
          cust.totalSpent += roundedGrandTotal;
          cust.lastPurchaseDate = new Date().toISOString();
          if (customerName && customerName !== 'Walk-in Customer') {
            cust.name = customerName;
          }
          if (customerGstin) {
            cust.gstin = customerGstin;
          }
        }
        finalCustomerId = cust.id;
        finalCustomerName = cust.name;
        finalCustomerPhone = cust.phone;
      }

      // 5. Create Sale Record
      const saleId = 'sale_' + Date.now();
      const newSale: Sale = {
        id: saleId,
        invoiceNumber,
        createdAt: new Date().toISOString(),
        cashierId: cashierId || 'usr_3',
        cashierName: cashierName || 'Amit Verma (Cashier)',
        customerId: finalCustomerId,
        customerName: finalCustomerName,
        customerPhone: finalCustomerPhone,
        customerGstin,
        items: saleItems,
        subtotal: Number(subtotal.toFixed(2)),
        discountTotal: Number(calculatedDiscountTotal.toFixed(2)),
        taxableAmount: Number(taxableAmount.toFixed(2)),
        cgstTotal: Number(cgstTotal.toFixed(2)),
        sgstTotal: Number(sgstTotal.toFixed(2)),
        igstTotal: 0,
        taxTotal: Number(taxTotal.toFixed(2)),
        grandTotal: roundedGrandTotal,
        roundOff,
        amountPaid: paid,
        changeDue,
        paymentMethod: (paymentMethod as PaymentMethod) || 'cash',
        paymentBreakdown: paymentBreakdown || [{ method: paymentMethod || 'cash', amount: roundedGrandTotal }],
        status: 'completed',
        notes: notes || '',
        smsSent: false,
      };

      db.sales.unshift(newSale);
      db.addAuditLog('SALE_COMPLETED', 'Sale', newSale.id, `Bill ${invoiceNumber} created for ₹${roundedGrandTotal} (${newSale.paymentMethod.toUpperCase()})`, cashierName || 'Cashier');

      return newSale;
    });

    // 6. Automated SMS Trigger (Non-blocking for billing reliability)
    if (sendSms && saleResult.customerPhone && db.settings.enableSms) {
      const digitalInvoiceLink = `${process.env.APP_URL || ''}/api/pos/invoice-html/${saleResult.id}`;
      const message = formatSMSMessage(db.settings.smsTemplate, {
        storeName: db.settings.storeName,
        invoiceNo: saleResult.invoiceNumber,
        customerName: saleResult.customerName,
        total: saleResult.grandTotal.toString(),
        currency: db.settings.currencySymbol,
        date: new Date(saleResult.createdAt).toLocaleDateString('en-IN'),
        link: digitalInvoiceLink,
      });

      sendSMSNotification(
        saleResult.customerPhone,
        message,
        saleResult.id,
        saleResult.invoiceNumber,
        saleResult.customerName,
        db.settings,
        (log) => db.smsLogs.unshift(log),
        (id, updates) => {
          const l = db.smsLogs.find((item) => item.id === id);
          if (l) Object.assign(l, updates);
        }
      ).then((res) => {
        if (res.success) {
          saleResult.smsSent = true;
          saleResult.smsLogId = res.logId;
        }
      });
    }

    res.status(201).json({ success: true, sale: saleResult });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Transaction failed' });
  }
});

// -------------------------------------------------------------
// REFUNDS & BILL CANCELLATION (MANAGER AUTHORIZED)
// -------------------------------------------------------------
apiRouter.post('/pos/refund', async (req: Request, res: Response) => {
  const { saleId, managerPin, reason, refundedBy } = req.body;

  if (!saleId) {
    return res.status(400).json({ success: false, error: 'Sale ID is required' });
  }

  if (managerPin !== db.settings.managerPin) {
    return res.status(403).json({ success: false, error: 'Invalid Manager Authorization PIN.' });
  }

  try {
    const refundedSale = await db.withTransaction(async () => {
      const sale = db.sales.find((s) => s.id === saleId);
      if (!sale) {
        throw new Error('Sale transaction not found');
      }

      if (sale.status === 'refunded' || sale.status === 'cancelled') {
        throw new Error(`Bill ${sale.invoiceNumber} is already marked as ${sale.status}`);
      }

      // Restock inventory for each item
      for (const item of sale.items) {
        const product = db.products.find((p) => p.id === item.productId);
        if (product) {
          const stockBefore = product.currentStock;
          product.currentStock += item.quantity;
          product.updatedAt = new Date().toISOString();

          db.stockLogs.unshift({
            id: 'stk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
            productId: product.id,
            productName: product.name,
            sku: product.sku,
            type: 'return',
            quantityChange: item.quantity,
            stockBefore,
            stockAfter: product.currentStock,
            reason: `Bill Refund/Cancellation: ${reason || 'Customer return'}`,
            referenceId: sale.invoiceNumber,
            actorName: refundedBy || 'Manager',
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Adjust customer spent stats if customer was linked
      if (sale.customerId) {
        const customer = db.customers.find((c) => c.id === sale.customerId);
        if (customer) {
          customer.totalSpent = Math.max(0, customer.totalSpent - sale.grandTotal);
        }
      }

      sale.status = 'refunded';
      sale.refundReason = reason || 'Customer requested return';
      sale.refundedBy = refundedBy || 'Manager';
      sale.refundedAt = new Date().toISOString();

      db.addAuditLog('SALE_REFUNDED', 'Sale', sale.id, `Bill ${sale.invoiceNumber} refunded for ₹${sale.grandTotal}. Reason: ${sale.refundReason}`, refundedBy || 'Manager');

      return sale;
    });

    res.json({ success: true, sale: refundedSale, message: `Bill ${refundedSale.invoiceNumber} successfully refunded and stock restored.` });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message || 'Refund processing failed' });
  }
});

// -------------------------------------------------------------
// SALES & INVOICES
// -------------------------------------------------------------
apiRouter.get('/sales', (req: Request, res: Response) => {
  const { date, status, search, limit } = req.query;
  let list = [...db.sales];

  if (status && typeof status === 'string' && status !== 'all') {
    list = list.filter((s) => s.status === status);
  }

  if (date && typeof date === 'string') {
    list = list.filter((s) => s.createdAt.startsWith(date));
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName.toLowerCase().includes(q) ||
        (s.customerPhone && s.customerPhone.includes(q))
    );
  }

  const max = limit ? Number(limit) : 200;
  res.json({ success: true, count: list.length, sales: list.slice(0, max) });
});

apiRouter.get('/sales/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const sale = db.sales.find((s) => s.id === id || s.invoiceNumber === id);
  if (!sale) {
    return res.status(404).json({ success: false, error: 'Invoice not found' });
  }
  res.json({ success: true, sale, settings: db.settings });
});

// -------------------------------------------------------------
// DASHBOARD & ANALYTICS
// -------------------------------------------------------------
apiRouter.get('/dashboard/stats', (req: Request, res: Response) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySalesList = db.sales.filter((s) => s.createdAt.startsWith(todayStr) && s.status === 'completed');

  const todaySales = todaySalesList.reduce((sum, s) => sum + s.grandTotal, 0);
  const todayBillsCount = todaySalesList.length;
  const todayAverageBill = todayBillsCount > 0 ? Math.round(todaySales / todayBillsCount) : 0;

  // Calculate profit
  let todayProfit = 0;
  for (const s of todaySalesList) {
    for (const item of s.items) {
      const cost = item.purchasePrice * item.quantity;
      const revenue = item.total;
      todayProfit += (revenue - cost);
    }
  }

  const activeProducts = db.products.filter((p) => p.isActive);
  const lowStockCount = activeProducts.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0).length;
  const outOfStockCount = activeProducts.filter((p) => p.currentStock <= 0).length;

  // Payment Breakdown
  const todayPaymentBreakdown: Record<string, number> = { cash: 0, card: 0, upi: 0, split: 0 };
  for (const s of todaySalesList) {
    todayPaymentBreakdown[s.paymentMethod] = (todayPaymentBreakdown[s.paymentMethod] || 0) + s.grandTotal;
  }

  // Hourly Sales (9 AM to 10 PM)
  const hourlySales: { hour: string; sales: number; bills: number }[] = [];
  for (let h = 9; h <= 22; h++) {
    const hourLabel = `${h > 12 ? h - 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
    const salesInHour = todaySalesList.filter((s) => {
      const saleHour = new Date(s.createdAt).getHours();
      return saleHour === h;
    });
    hourlySales.push({
      hour: hourLabel,
      sales: salesInHour.reduce((sum, s) => sum + s.grandTotal, 0),
      bills: salesInHour.length,
    });
  }

  // Weekly Trend (Last 7 days)
  const weeklySales: { date: string; sales: number; profit: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

    const daySalesList = db.sales.filter((s) => s.createdAt.startsWith(dateKey) && s.status === 'completed');
    const daySales = daySalesList.reduce((sum, s) => sum + s.grandTotal, 0);

    let dayProfit = 0;
    for (const s of daySalesList) {
      for (const item of s.items) {
        dayProfit += (item.total - item.purchasePrice * item.quantity);
      }
    }

    weeklySales.push({
      date: `${dayName} (${d.getDate()})`,
      sales: daySales,
      profit: Math.round(dayProfit),
    });
  }

  // Top Selling Products
  const productSalesMap = new Map<string, { id: string; name: string; sku: string; unitsSold: number; revenue: number }>();
  for (const s of db.sales.filter((s) => s.status === 'completed')) {
    for (const item of s.items) {
      const existing = productSalesMap.get(item.productId) || {
        id: item.productId,
        name: item.productName,
        sku: item.sku,
        unitsSold: 0,
        revenue: 0,
      };
      existing.unitsSold += item.quantity;
      existing.revenue += item.total;
      productSalesMap.set(item.productId, existing);
    }
  }

  const topSellingProducts = Array.from(productSalesMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  res.json({
    success: true,
    stats: {
      todaySales,
      todayBillsCount,
      todayOrders: todayBillsCount,
      todayAverageBill,
      todayProfit: Math.round(todayProfit),
      totalProductsCount: activeProducts.length,
      lowStockCount,
      outOfStockCount,
      paymentMethods: {
        cash: todayPaymentBreakdown.cash || 0,
        upi: todayPaymentBreakdown.upi || 0,
        card: todayPaymentBreakdown.card || 0,
        split: todayPaymentBreakdown.split || 0,
      },
      todayPaymentBreakdown,
      salesByHour: hourlySales.map((h) => ({ hour: h.hour, sales: h.sales, orders: h.bills })),
      hourlySales,
      weeklyTrend: weeklySales,
      weeklySales,
      topProducts: topSellingProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku,
        quantity: p.unitsSold,
        revenue: p.revenue,
      })),
      topSellingProducts,
      recentTransactions: db.sales.slice(0, 8),
    },
  });
});

// -------------------------------------------------------------
// REPORTS & GST SUMMARY
// -------------------------------------------------------------
apiRouter.get('/reports/gst', (req: Request, res: Response) => {
  const { startDate, endDate } = req.query;
  let sales = db.sales.filter((s) => s.status === 'completed');

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => s.createdAt >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => s.createdAt <= endDate + 'T23:59:59.999Z');
  }

  const slabs: Record<number, { rate: number; taxableAmount: number; cgst: number; sgst: number; totalTax: number }> = {
    0: { rate: 0, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
    5: { rate: 5, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
    12: { rate: 12, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
    18: { rate: 18, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
    28: { rate: 28, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 },
  };

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalTax = 0;

  for (const s of sales) {
    for (const item of s.items) {
      const rate = item.gstRate || 0;
      if (!slabs[rate]) {
        slabs[rate] = { rate, taxableAmount: 0, cgst: 0, sgst: 0, totalTax: 0 };
      }
      const itemTaxable = item.total / (1 + rate / 100);
      const tax = item.total - itemTaxable;
      const cgst = tax / 2;
      const sgst = tax / 2;

      slabs[rate].taxableAmount += itemTaxable;
      slabs[rate].cgst += cgst;
      slabs[rate].sgst += sgst;
      slabs[rate].totalTax += tax;

      totalTaxable += itemTaxable;
      totalCgst += cgst;
      totalSgst += sgst;
      totalTax += tax;
    }
  }

  res.json({
    success: true,
    totalTaxable: Number(totalTaxable.toFixed(2)),
    totalCgst: Number(totalCgst.toFixed(2)),
    totalSgst: Number(totalSgst.toFixed(2)),
    totalTax: Number(totalTax.toFixed(2)),
    slabs: Object.values(slabs),
  });
});

apiRouter.get('/reports/sales', (req: Request, res: Response) => {
  const { startDate, endDate, cashierId } = req.query;
  let sales = db.sales.filter((s) => s.status === 'completed');

  if (startDate && typeof startDate === 'string') {
    sales = sales.filter((s) => s.createdAt >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    sales = sales.filter((s) => s.createdAt <= endDate + 'T23:59:59.999Z');
  }
  if (cashierId && typeof cashierId === 'string' && cashierId !== 'all') {
    sales = sales.filter((s) => s.cashierId === cashierId);
  }

  let totalSales = 0;
  let totalUnits = 0;
  let totalDiscount = 0;
  let totalProfit = 0;

  const productMap = new Map<string, { productId: string; name: string; sku: string; units: number; revenue: number; profit: number }>();
  const cashierMap = new Map<string, { cashierName: string; orders: number; sales: number }>();

  for (const s of sales) {
    totalSales += s.grandTotal;
    totalDiscount += s.discountTotal;

    const currentCashier = cashierMap.get(s.cashierName) || { cashierName: s.cashierName, orders: 0, sales: 0 };
    currentCashier.orders += 1;
    currentCashier.sales += s.grandTotal;
    cashierMap.set(s.cashierName, currentCashier);

    for (const item of s.items) {
      totalUnits += item.quantity;
      const profit = item.total - (item.purchasePrice * item.quantity);
      totalProfit += profit;

      const p = productMap.get(item.productId) || {
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        units: 0,
        revenue: 0,
        profit: 0,
      };
      p.units += item.quantity;
      p.revenue += item.total;
      p.profit += profit;
      productMap.set(item.productId, p);
    }
  }

  res.json({
    success: true,
    totalSales: Number(totalSales.toFixed(2)),
    totalUnits,
    totalDiscount: Number(totalDiscount.toFixed(2)),
    totalProfit: Number(totalProfit.toFixed(2)),
    productSales: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue),
    cashierSales: Array.from(cashierMap.values()).sort((a, b) => b.sales - a.sales),
  });
});

// -------------------------------------------------------------
// SMS LOGS & RESEND DISPATCH
// -------------------------------------------------------------
apiRouter.get('/sms/logs', (req: Request, res: Response) => {
  res.json({ success: true, count: db.smsLogs.length, logs: db.smsLogs });
});

apiRouter.post('/sms/resend', async (req: Request, res: Response) => {
  const { saleId, customPhone } = req.body;
  const sale = db.sales.find((s) => s.id === saleId);
  if (!sale) {
    return res.status(404).json({ success: false, error: 'Sale record not found' });
  }

  const phone = customPhone || sale.customerPhone;
  if (!phone) {
    return res.status(400).json({ success: false, error: 'Customer mobile number is missing' });
  }

  const digitalInvoiceLink = `${process.env.APP_URL || ''}/api/pos/invoice-html/${sale.id}`;
  const message = formatSMSMessage(db.settings.smsTemplate, {
    storeName: db.settings.storeName,
    invoiceNo: sale.invoiceNumber,
    customerName: sale.customerName,
    total: sale.grandTotal.toString(),
    currency: db.settings.currencySymbol,
    date: new Date(sale.createdAt).toLocaleDateString('en-IN'),
    link: digitalInvoiceLink,
  });

  const result = await sendSMSNotification(
    phone,
    message,
    sale.id,
    sale.invoiceNumber,
    sale.customerName,
    db.settings,
    (log) => db.smsLogs.unshift(log),
    (id, updates) => {
      const l = db.smsLogs.find((item) => item.id === id);
      if (l) Object.assign(l, updates);
    }
  );

  sale.smsSent = true;
  sale.smsLogId = result.logId;

  res.json({ success: result.success, logId: result.logId, status: result.status, message: 'SMS dispatch initiated' });
});

apiRouter.post('/sms/send-test', async (req: Request, res: Response) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: 'Phone and message are required' });
  }

  const result = await sendSMSNotification(
    phone,
    message,
    'test_' + Date.now(),
    'TEST-999',
    'Test Customer',
    db.settings,
    (log) => db.smsLogs.unshift(log),
    (id, updates) => {
      const l = db.smsLogs.find((item) => item.id === id);
      if (l) Object.assign(l, updates);
    }
  );

  res.json({ success: result.success, logId: result.logId, status: result.status });
});

// -------------------------------------------------------------
// STORE SETTINGS & CONFIGURATION
// -------------------------------------------------------------
apiRouter.get('/settings', (req: Request, res: Response) => {
  res.json({ success: true, settings: db.settings });
});

apiRouter.put('/settings', (req: Request, res: Response) => {
  const { updates, actorName } = req.body;
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ success: false, error: 'Valid updates object is required' });
  }

  Object.assign(db.settings, updates);
  db.addAuditLog('SETTINGS_UPDATED', 'Settings', 'store', `Store settings updated by ${actorName || 'Admin'}`, actorName || 'Admin');

  res.json({ success: true, settings: db.settings });
});

// -------------------------------------------------------------
// USERS & SECURITY / PIN VERIFICATION
// -------------------------------------------------------------
apiRouter.get('/users', (req: Request, res: Response) => {
  const safeUsers = db.users.map(({ pin, ...safe }) => safe);
  res.json({ success: true, users: safeUsers });
});

apiRouter.post('/users', (req: Request, res: Response) => {
  const { name, role, pin, actorName } = req.body;
  if (!name || !role || !pin) {
    return res.status(400).json({ success: false, error: 'Name, role, and PIN are required' });
  }

  const validRoles = ['admin', 'manager', 'cashier'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, error: 'Invalid user role' });
  }

  // Check unique PIN
  const existingPin = db.users.find((u) => u.pin === String(pin).trim());
  if (existingPin) {
    return res.status(400).json({ success: false, error: 'PIN already assigned to another employee' });
  }

  const newUser = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    name: String(name).trim(),
    role: role as 'admin' | 'manager' | 'cashier',
    pin: String(pin).trim(),
  };

  db.users.push(newUser);
  db.addAuditLog('USER_CREATED', 'User', newUser.id, `Created employee ${newUser.name} with role ${newUser.role}`, actorName || 'Admin');

  const { pin: _, ...safeUser } = newUser;
  res.status(201).json({ success: true, user: safeUser });
});

apiRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, role, pin, actorName } = req.body;

  const user = db.users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'Employee not found' });
  }

  if (pin && String(pin).trim() !== user.pin) {
    const dup = db.users.find((u) => u.id !== id && u.pin === String(pin).trim());
    if (dup) {
      return res.status(400).json({ success: false, error: 'PIN already in use by another user' });
    }
    user.pin = String(pin).trim();
  }

  if (name) user.name = String(name).trim();
  if (role && ['admin', 'manager', 'cashier'].includes(role)) {
    user.role = role as 'admin' | 'manager' | 'cashier';
  }

  db.addAuditLog('USER_UPDATED', 'User', user.id, `Updated employee ${user.name} (${user.role})`, actorName || 'Admin');

  const { pin: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser });
});

apiRouter.delete('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actorName } = req.body;

  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Employee not found' });
  }

  const removed = db.users.splice(index, 1)[0];
  db.addAuditLog('USER_DELETED', 'User', removed.id, `Removed employee ${removed.name}`, actorName || 'Admin');

  res.json({ success: true, message: `Employee ${removed.name} removed successfully` });
});

apiRouter.post('/users/verify-pin', (req: Request, res: Response) => {
  const { pin, requiredRole } = req.body;
  if (!pin) {
    return res.status(400).json({ success: false, error: 'PIN is required' });
  }

  // Check store manager PIN
  if (pin === db.settings.managerPin) {
    return res.json({ success: true, verified: true, role: 'manager', userName: 'Manager Authority' });
  }

  const user = db.users.find((u) => u.pin === pin);
  if (!user) {
    return res.status(401).json({ success: false, verified: false, error: 'Invalid PIN' });
  }

  if (requiredRole && requiredRole === 'manager' && user.role !== 'admin' && user.role !== 'manager') {
    return res.status(403).json({ success: false, verified: false, error: 'Manager authority required for this action' });
  }

  res.json({ success: true, verified: true, role: user.role, userName: user.name });
});

// -------------------------------------------------------------
// AUDIT LOGS
// -------------------------------------------------------------
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  res.json({ success: true, count: db.auditLogs.length, logs: db.auditLogs.slice(0, 100) });
});
