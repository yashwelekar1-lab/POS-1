import React, { useState, useEffect, useMemo } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  FileSpreadsheet,
  Upload,
  Edit2,
  Trash2,
  RefreshCw,
  Barcode,
  Layers,
  ArrowUpDown,
  History,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  X,
} from 'lucide-react';
import { Product, StockLog } from '../../types/pos';
import { api } from '../../services/api';
import { renderBarcodeToSvg } from '../../utils/barcode';

export const InventoryManager: React.FC = () => {
  const { products, refreshProducts, currentUser, settings, addToast } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProductForAdjust, setSelectedProductForAdjust] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [stockLogs, setStockLogs] = useState<StockLog[]>([]);

  // Add/Edit Product Form state
  const [formName, setFormName] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formBarcode, setFormBarcode] = useState('');
  const [formCategory, setFormCategory] = useState('Groceries & Staples');
  const [formBrand, setFormBrand] = useState('');
  const [formPurchasePrice, setFormPurchasePrice] = useState('0');
  const [formSellingPrice, setFormSellingPrice] = useState('0');
  const [formGstRate, setFormGstRate] = useState('5');
  const [formHsnCode, setFormHsnCode] = useState('9999');
  const [formCurrentStock, setFormCurrentStock] = useState('10');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formSupplier, setFormSupplier] = useState('ITC Limited');
  const [formUnit, setFormUnit] = useState('Pcs');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Stock Adjustment state
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustType, setAdjustType] = useState<'adjustment_in' | 'adjustment_out'>('adjustment_in');
  const [adjustReason, setAdjustReason] = useState('Restock shipment received');

  const currency = settings?.currencySymbol || '₹';

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Key Valuation Metrics
  const activeProducts = products.filter((p) => p.isActive);
  const totalStockUnits = activeProducts.reduce((sum, p) => sum + p.currentStock, 0);
  const totalCostValuation = activeProducts.reduce((sum, p) => sum + p.currentStock * p.purchasePrice, 0);
  const totalRetailValuation = activeProducts.reduce((sum, p) => sum + p.currentStock * p.sellingPrice, 0);
  const lowStockCount = activeProducts.filter((p) => p.currentStock <= p.minStockLevel && p.currentStock > 0).length;
  const outOfStockCount = activeProducts.filter((p) => p.currentStock <= 0).length;

  const filteredProducts = useMemo(() => {
    return activeProducts.filter((p) => {
      const matchCat = categoryFilter === 'All' || p.category.toLowerCase() === categoryFilter.toLowerCase();
      if (!matchCat) return false;

      if (stockStatusFilter === 'low' && (p.currentStock > p.minStockLevel || p.currentStock <= 0)) return false;
      if (stockStatusFilter === 'out' && p.currentStock > 0) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q)
      );
    });
  }, [activeProducts, categoryFilter, stockStatusFilter, searchQuery]);

  const handleOpenAddModal = async () => {
    try {
      const { barcode } = await api.generateBarcode();
      setFormName('');
      setFormSku('SKU-' + Math.random().toString(36).substring(2, 7).toUpperCase());
      setFormBarcode(barcode);
      setFormCategory('Groceries & Staples');
      setFormBrand('');
      setFormPurchasePrice('100');
      setFormSellingPrice('130');
      setFormGstRate('5');
      setFormHsnCode('1902');
      setFormCurrentStock('25');
      setFormMinStock('5');
      setFormSupplier('ITC Limited');
      setFormUnit('Pcs');
      setSelectedProductForEdit(null);
      setShowAddModal(true);
    } catch {
      setShowAddModal(true);
    }
  };

  const handleOpenEditModal = (p: Product) => {
    setSelectedProductForEdit(p);
    setFormName(p.name);
    setFormSku(p.sku);
    setFormBarcode(p.barcode);
    setFormCategory(p.category);
    setFormBrand(p.brand);
    setFormPurchasePrice(p.purchasePrice.toString());
    setFormSellingPrice(p.sellingPrice.toString());
    setFormGstRate(p.gstRate.toString());
    setFormHsnCode(p.hsnCode || '9999');
    setFormCurrentStock(p.currentStock.toString());
    setFormMinStock(p.minStockLevel.toString());
    setFormSupplier(p.supplier);
    setFormUnit(p.unit);
    setShowAddModal(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        name: formName,
        sku: formSku,
        barcode: formBarcode,
        category: formCategory,
        brand: formBrand,
        purchasePrice: parseFloat(formPurchasePrice) || 0,
        sellingPrice: parseFloat(formSellingPrice) || 0,
        gstRate: parseFloat(formGstRate) || 0,
        hsnCode: formHsnCode,
        currentStock: parseInt(formCurrentStock, 10) || 0,
        minStockLevel: parseInt(formMinStock, 10) || 5,
        supplier: formSupplier,
        unit: formUnit,
        actorName: currentUser.name,
      };

      if (selectedProductForEdit) {
        await api.updateProduct(selectedProductForEdit.id, payload);
        addToast('success', 'Product Updated', `${formName} saved successfully.`);
      } else {
        await api.createProduct(payload);
        addToast('success', 'Product Created', `${formName} added with barcode ${formBarcode}`);
      }

      await refreshProducts();
      setShowAddModal(false);
    } catch (err: any) {
      addToast('error', 'Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (p: Product) => {
    if (currentUser.role === 'cashier') {
      addToast('error', 'Permission Denied', 'Manager or Admin role required to delete products.');
      return;
    }
    if (window.confirm(`Are you sure you want to deactivate '${p.name}'?`)) {
      try {
        await api.deleteProduct(p.id, undefined, currentUser.name);
        addToast('success', 'Product Removed', `${p.name} deactivated.`);
        refreshProducts();
      } catch (err: any) {
        addToast('error', 'Delete Failed', err.message);
      }
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForAdjust || !adjustQty) return;
    const qty = parseInt(adjustQty, 10);
    if (isNaN(qty) || qty === 0) return;

    const change = adjustType === 'adjustment_in' ? Math.abs(qty) : -Math.abs(qty);

    try {
      await api.adjustStock({
        productId: selectedProductForAdjust.id,
        quantityChange: change,
        type: adjustType,
        reason: adjustReason,
        actorName: currentUser.name,
      });

      addToast('success', 'Stock Adjusted', `${selectedProductForAdjust.name} stock updated by ${change}`);
      await refreshProducts();
      setSelectedProductForAdjust(null);
      setAdjustQty('');
    } catch (err: any) {
      addToast('error', 'Adjustment Failed', err.message);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Product ID', 'Name', 'SKU', 'Barcode', 'Category', 'Brand', 'Purchase Price', 'Selling Price', 'GST Rate', 'Stock', 'Min Stock', 'Supplier'];
    const rows = activeProducts.map((p) => [
      p.id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.sku,
      `'${p.barcode}`,
      `"${p.category}"`,
      `"${p.brand}"`,
      p.purchasePrice,
      p.sellingPrice,
      `${p.gstRate}%`,
      p.currentStock,
      p.minStockLevel,
      `"${p.supplier}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Inventory_Catalog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'CSV Exported', 'Inventory catalog CSV downloaded.');
  };

  const handleViewLogs = async () => {
    try {
      const logs = await api.getStockLogs();
      setStockLogs(logs);
      setShowLogsModal(true);
    } catch (err: any) {
      addToast('error', 'Failed to fetch logs', err.message);
    }
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Top Valuation Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Total Products / Stock</span>
          <p className="text-xl font-bold text-slate-900 font-mono mt-1">
            {activeProducts.length} <span className="text-xs text-slate-500 font-normal">({totalStockUnits} units)</span>
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Inventory Cost Value</span>
          <p className="text-xl font-bold text-indigo-600 font-mono mt-1">
            {currency}{totalCostValuation.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Retail Selling Value</span>
          <p className="text-xl font-bold text-emerald-600 font-mono mt-1">
            {currency}{totalRetailValuation.toLocaleString('en-IN')}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-xs text-slate-500 font-semibold">Low / Out of Stock</span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-base font-bold font-mono ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-600'}`}>
              {lowStockCount} Low
            </span>
            <span className="text-slate-300">/</span>
            <span className={`text-base font-bold font-mono ${outOfStockCount > 0 ? 'text-rose-600' : 'text-slate-600'}`}>
              {outOfStockCount} Out
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-2xs">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search SKU, Barcode, Name..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-700 font-semibold focus:outline-hidden"
          >
            <option value="all">All Stock Status</option>
            <option value="low">Low Stock (≤ Min)</option>
            <option value="out">Out of Stock (0)</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <button
            onClick={handleViewLogs}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
          >
            <History className="w-3.5 h-3.5 text-indigo-600" />
            <span>Stock Ledger</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-[0.98] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
              <tr>
                <th className="p-3">Product / SKU</th>
                <th className="p-3">Barcode (EAN-13)</th>
                <th className="p-3">Category</th>
                <th className="p-3 text-right">Cost Price</th>
                <th className="p-3 text-right">Selling MRP</th>
                <th className="p-3 text-center">GST%</th>
                <th className="p-3 text-center">Stock Level</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <Boxes className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
                      <h4 className="text-sm font-bold text-slate-800">No products added yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-1">
                        Your catalog is empty. Click below to add your first real product with barcode, GST rate, and stock.
                      </p>
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Product</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    No products matched current filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minStockLevel && p.currentStock > 0;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">SKU: {p.sku} | Brand: {p.brand}</p>
                      </td>
                      <td className="p-3 font-mono text-slate-600 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Barcode className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{p.barcode}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-slate-500">
                        {currency}{p.purchasePrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-900">
                        {currency}{p.sellingPrice.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-1.5 py-0.2 rounded font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
                          {p.gstRate}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold font-mono text-[11px] ${
                            isOut
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isLow && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Stock Adjust */}
                          <button
                            onClick={() => {
                              setSelectedProductForAdjust(p);
                              setAdjustQty('');
                            }}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            title="Adjust Stock"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit */}
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            title="Deactivate Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 text-slate-900 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {selectedProductForEdit ? 'Edit Product Details' : 'Add New Inventory Product'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 font-bold mb-1">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Tata Tea Gold 500g"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono uppercase focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 flex items-center justify-between">
                    <span>Barcode (EAN-13 / Code128) *</span>
                    <button
                      type="button"
                      onClick={async () => {
                        const { barcode } = await api.generateBarcode();
                        setFormBarcode(barcode);
                      }}
                      className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold underline"
                    >
                      Generate New
                    </button>
                  </label>
                  <input
                    type="text"
                    required
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    list="category-options"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                  <datalist id="category-options">
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Brand</label>
                  <input
                    type="text"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    placeholder="e.g. Tata, Nestle, Amul"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Purchase Cost Price ({currency})</label>
                  <input
                    type="number"
                    step="any"
                    value={formPurchasePrice}
                    onChange={(e) => setFormPurchasePrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Selling Price / MRP ({currency}) *</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono font-bold focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">GST Tax Slab</label>
                  <select
                    value={formGstRate}
                    onChange={(e) => setFormGstRate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden"
                  >
                    <option value="0">0% (Nil / Exempted)</option>
                    <option value="5">5% GST</option>
                    <option value="12">12% GST</option>
                    <option value="18">18% GST</option>
                    <option value="28">28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">HSN / SAC Code</label>
                  <input
                    type="text"
                    value={formHsnCode}
                    onChange={(e) => setFormHsnCode(e.target.value)}
                    placeholder="e.g. 0902, 1902"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {!selectedProductForEdit && (
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Initial Opening Stock Units</label>
                    <input
                      type="number"
                      value={formCurrentStock}
                      onChange={(e) => setFormCurrentStock(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Min Low-Stock Alert Threshold</label>
                  <input
                    type="number"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Supplier / Distributor</label>
                  <input
                    type="text"
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Unit of Measurement</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden"
                  >
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Pack">Pack</option>
                    <option value="Kg">Kg</option>
                    <option value="L">Litre</option>
                    <option value="Box">Box</option>
                    <option value="Can">Can</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg font-bold shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-md shadow-indigo-600/20 active:scale-98 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {selectedProductForAdjust && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 text-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Adjust Stock Level</h3>
                <p className="text-xs text-slate-500 font-semibold">{selectedProductForAdjust.name}</p>
              </div>
              <button
                onClick={() => setSelectedProductForAdjust(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStockAdjustment} className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="text-slate-600 font-semibold">Current Stock:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedProductForAdjust.currentStock} {selectedProductForAdjust.unit}</span>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Adjustment Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment_in')}
                    className={`py-2 rounded-lg border font-bold transition ${
                      adjustType === 'adjustment_in'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    + Stock In (Add)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('adjustment_out')}
                    className={`py-2 rounded-lg border font-bold transition ${
                      adjustType === 'adjustment_out'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    - Stock Out (Deduct)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Quantity Units</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Enter quantity..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Reason for Adjustment</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-hidden"
                >
                  <option value="Restock shipment received">Restock shipment received</option>
                  <option value="Inventory audit recount correction">Inventory audit recount correction</option>
                  <option value="Damaged / expired goods write-off">Damaged / expired goods write-off</option>
                  <option value="Supplier return">Supplier return</option>
                  <option value="Internal store consumption">Internal store consumption</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProductForAdjust(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold rounded-lg shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md shadow-indigo-600/20 active:scale-98"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Movement Ledger Modal */}
      {showLogsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 text-slate-900 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Stock Movement Audit Ledger</h3>
              </div>
              <button
                onClick={() => setShowLogsModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[400px] overflow-y-auto border border-slate-100 rounded-xl">
              <table className="w-full text-xs text-left text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">Date / Time</th>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Change</th>
                    <th className="p-2.5 text-center">Stock Level</th>
                    <th className="p-2.5">Reason / Reference</th>
                    <th className="p-2.5">Actor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="p-2.5 text-slate-500 font-mono text-[11px]">
                        {new Date(log.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="p-2.5 font-bold text-slate-900">{log.productName}</td>
                      <td className="p-2.5 text-center font-mono font-bold">
                        <span className={log.quantityChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                          {log.quantityChange >= 0 ? `+${log.quantityChange}` : log.quantityChange}
                        </span>
                      </td>
                      <td className="p-2.5 text-center font-mono text-slate-500">
                        {log.stockBefore} → <span className="text-slate-900 font-bold">{log.stockAfter}</span>
                      </td>
                      <td className="p-2.5 text-slate-700">
                        {log.reason} {log.referenceId && <span className="font-mono text-indigo-600">({log.referenceId})</span>}
                      </td>
                      <td className="p-2.5 text-slate-500">{log.actorName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
