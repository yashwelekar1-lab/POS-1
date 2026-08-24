import React, { useState, useMemo, useRef, useEffect } from 'react';
import { usePOS } from '../../context/POSContext';
import { Search, Plus, Barcode, Package, AlertTriangle, Layers } from 'lucide-react';
import { Product } from '../../types/pos';

export const ProductSearchGrid: React.FC = () => {
  const { products, addToCart, setIsScannerOpen, settings } = usePOS();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currency = settings?.currencySymbol || '₹';

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchesCategory = selectedCategory === 'All' || p.category.toLowerCase() === selectedCategory.toLowerCase();
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    });
  }, [products, selectedCategory, searchQuery]);

  // Focus search input when triggered
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      addToCart(filteredProducts[0], 1);
      setSearchQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
      {/* Top Search & Action Bar */}
      <div className="p-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row gap-2.5 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            ref={searchInputRef}
            id="pos-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search products, SKUs, or scan barcode (F2)..."
            className="w-full bg-slate-100 border border-slate-200 rounded-lg pl-9 pr-14 py-2 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:bg-white focus:border-indigo-500 transition"
          />
          <div className="absolute right-2.5 top-2.5 flex items-center gap-1.5 pointer-events-none">
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-white text-slate-400 border border-slate-200 rounded shadow-2xs">
              F2
            </kbd>
          </div>
        </div>

        <button
          onClick={() => setIsScannerOpen(true)}
          className="w-full sm:w-auto px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition shrink-0 active:scale-[0.98]"
        >
          <Barcode className="w-4 h-4" />
          <span>Camera Scan (Space)</span>
        </button>
      </div>

      {/* Category Pills Bar */}
      <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="flex-1 p-3 overflow-y-auto min-h-[300px] bg-[#f8fafc]">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Package className="w-14 h-14 stroke-[1.2] mb-3 text-slate-300" />
            <h3 className="text-sm font-bold text-slate-700">No products added yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Add your store inventory to begin scanning barcodes and generating GST invoices.
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
            <Package className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
            <p className="text-sm font-bold text-slate-600">No products match your search</p>
            <p className="text-xs text-slate-400 mt-1">Try another search keyword or clear category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
            {filteredProducts.map((p) => {
              const isLowStock = p.currentStock <= p.minStockLevel && p.currentStock > 0;
              const isOutOfStock = p.currentStock <= 0;

              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p, 1)}
                  className={`group relative flex flex-col justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                    isOutOfStock
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                      : 'bg-white hover:bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md shadow-2xs'
                  }`}
                >
                  {/* Top Badges */}
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-medium rounded bg-slate-100 text-slate-600 border border-slate-200">
                      {p.sku}
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                      GST {p.gstRate}%
                    </span>
                  </div>

                  {/* Product Title */}
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug group-hover:text-indigo-600 transition">
                      {p.name}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Barcode className="w-3 h-3 text-slate-400" />
                      {p.barcode}
                    </p>
                  </div>

                  {/* Pricing & Stock Status */}
                  <div className="mt-auto pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-bold text-indigo-600">
                        {currency}{p.sellingPrice}
                      </span>
                      <span className="text-[10px] text-slate-400 block font-normal">
                        per {p.unit || 'Pc'}
                      </span>
                    </div>

                    <div className="text-right">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full uppercase">
                          Out of Stock
                        </span>
                      ) : (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full uppercase flex items-center gap-1 ${
                            isLowStock
                              ? 'text-amber-700 bg-amber-100'
                              : 'text-green-700 bg-green-100'
                          }`}
                        >
                          {isLowStock && <AlertTriangle className="w-3 h-3 text-amber-600" />}
                          {isLowStock ? 'Low Stock' : `${p.currentStock} In Stock`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Add Overlay on hover */}
                  {!isOutOfStock && (
                    <button
                      type="button"
                      className="absolute bottom-2 right-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition shadow-md"
                      title="Add to Cart"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
