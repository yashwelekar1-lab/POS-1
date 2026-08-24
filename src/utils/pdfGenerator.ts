import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, StoreSettings, Product } from '../types/pos';

export function generateInvoicePDF(sale: Sale, settings: StoreSettings) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = settings.currencySymbol || 'Rs.';

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(settings.storeName, 14, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.tagline || '', 14, 25);
  doc.text(`${settings.address}, ${settings.city}, ${settings.state} - ${settings.pincode}`, 14, 30);
  doc.text(`Phone: ${settings.phone} | Email: ${settings.email}`, 14, 35);
  doc.text(`GSTIN: ${settings.gstin}`, 14, 40);

  // Invoice Title Right Aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', 196, 20, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Invoice No: ${sale.invoiceNumber}`, 196, 26, { align: 'right' });
  doc.text(`Date & Time: ${new Date(sale.createdAt).toLocaleString('en-IN')}`, 196, 31, { align: 'right' });
  doc.text(`Cashier: ${sale.cashierName}`, 196, 36, { align: 'right' });
  doc.text(`Status: ${sale.status.toUpperCase()}`, 196, 41, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 45, 196, 45);

  // Bill To Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Billed To Customer:', 14, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Name: ${sale.customerName}`, 14, 57);
  if (sale.customerPhone) {
    doc.text(`Mobile: ${sale.customerPhone}`, 14, 62);
  }
  if (sale.customerGstin) {
    doc.text(`Customer GSTIN: ${sale.customerGstin}`, 14, 67);
  }

  // Items Table
  const tableRows = sale.items.map((item, index) => [
    (index + 1).toString(),
    `${item.productName}\nSKU: ${item.sku}`,
    item.hsnCode || '9999',
    item.quantity.toString(),
    `${currency}${item.unitPrice.toFixed(2)}`,
    item.discountPercent > 0 ? `${item.discountPercent}%` : '-',
    `${item.gstRate}%`,
    `${currency}${item.cgst.toFixed(2)}`,
    `${currency}${item.sgst.toFixed(2)}`,
    `${currency}${item.total.toFixed(2)}`,
  ]);

  autoTable(doc, {
    startY: sale.customerGstin ? 73 : 68,
    head: [['#', 'Item Description', 'HSN', 'Qty', 'Rate', 'Disc', 'GST', 'CGST', 'SGST', 'Amount']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'center',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'right', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'right', cellWidth: 18 },
      8: { halign: 'right', cellWidth: 18 },
      9: { halign: 'right', cellWidth: 22 },
    },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;

  // Summary Totals
  const rightColX = 140;
  const valueColX = 196;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text('Subtotal:', rightColX, finalY);
  doc.text(`${currency}${sale.subtotal.toFixed(2)}`, valueColX, finalY, { align: 'right' });

  doc.text('Total Discount:', rightColX, finalY + 5);
  doc.text(`-${currency}${sale.discountTotal.toFixed(2)}`, valueColX, finalY + 5, { align: 'right' });

  doc.text('Taxable Value:', rightColX, finalY + 10);
  doc.text(`${currency}${sale.taxableAmount.toFixed(2)}`, valueColX, finalY + 10, { align: 'right' });

  doc.text('Total GST (CGST+SGST):', rightColX, finalY + 15);
  doc.text(`${currency}${sale.taxTotal.toFixed(2)}`, valueColX, finalY + 15, { align: 'right' });

  if (sale.roundOff !== 0) {
    doc.text('Round Off:', rightColX, finalY + 20);
    doc.text(`${sale.roundOff > 0 ? '+' : ''}${currency}${sale.roundOff.toFixed(2)}`, valueColX, finalY + 20, { align: 'right' });
  }

  // Grand Total Box
  doc.setFillColor(241, 245, 249);
  doc.rect(rightColX - 2, finalY + 24, 60, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('Grand Total:', rightColX, finalY + 31);
  doc.text(`${currency}${sale.grandTotal.toFixed(2)}`, valueColX, finalY + 31, { align: 'right' });

  // Payment Details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Payment Mode: ${sale.paymentMethod.toUpperCase()}`, 14, finalY);
  doc.text(`Amount Paid: ${currency}${sale.amountPaid.toFixed(2)}`, 14, finalY + 5);
  doc.text(`Change Returned: ${currency}${sale.changeDue.toFixed(2)}`, 14, finalY + 10);

  // Terms & Footer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Terms & Conditions:', 14, finalY + 24);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  const splitTerms = doc.splitTextToSize(settings.termsAndConditions || 'Thank you for shopping with us!', 110);
  doc.text(splitTerms, 14, finalY + 29);

  // Authorized Signatory
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`For ${settings.storeName}`, 160, finalY + 48, { align: 'center' });
  doc.text('Authorized Signatory', 160, finalY + 58, { align: 'center' });

  doc.save(`Invoice_${sale.invoiceNumber}.pdf`);
}

// Generate Printable Barcode Sheet for a single product with custom copies
export function generateBarcodeSheetPDF(
  product: Product,
  settings: StoreSettings,
  copies: number = 24,
  layout: string = '24'
) {
  return generateBarcodeLabelsPDF([{ product, quantity: copies }], settings);
}

// Generate Printable Barcode Sheet for Products
export function generateBarcodeLabelsPDF(
  products: Array<{ product: Product; quantity: number }>,
  settings: StoreSettings
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const currency = settings.currencySymbol || 'Rs.';

  let x = 12;
  let y = 15;
  const labelWidth = 60;
  const labelHeight = 32;
  const cols = 3;
  const rows = 8;
  let colIndex = 0;
  let rowIndex = 0;

  for (const item of products) {
    for (let q = 0; q < item.quantity; q++) {
      // Label Border
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.2);
      doc.roundedRect(x, y, labelWidth, labelHeight, 1.5, 1.5);

      // Store Title
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text(settings.storeName.substring(0, 26), x + labelWidth / 2, y + 4.5, { align: 'center' });

      // Product Name
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(51, 65, 85);
      doc.text(item.product.name.substring(0, 32), x + labelWidth / 2, y + 8.5, { align: 'center' });

      // SKU and Price
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text(`MRP: ${currency}${item.product.sellingPrice}`, x + 4, y + 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`SKU: ${item.product.sku}`, x + labelWidth - 4, y + 13, { align: 'right' });

      // Barcode placeholder text (Standard numeric barcode string centered)
      doc.setFont('courier', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text(`* ${item.product.barcode} *`, x + labelWidth / 2, y + 26, { align: 'center' });

      colIndex++;
      if (colIndex >= cols) {
        colIndex = 0;
        rowIndex++;
        x = 12;
        y += labelHeight + 3;
      } else {
        x += labelWidth + 3;
      }

      if (rowIndex >= rows) {
        doc.addPage();
        x = 12;
        y = 15;
        colIndex = 0;
        rowIndex = 0;
      }
    }
  }

  doc.save('Barcode_Labels_Sheet.pdf');
}
