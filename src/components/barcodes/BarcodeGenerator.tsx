import React, { useState, useEffect, useRef } from 'react';
import { usePOS } from '../../context/POSContext';
import {
  Barcode as BarcodeIcon,
  Printer,
  FileDown,
  RefreshCw,
  Sliders,
  Layers,
  Copy,
  Check,
  Package,
} from 'lucide-react';
import { renderBarcodeToSvg } from '../../utils/barcode';
import { generateBarcodeSheetPDF } from '../../utils/pdfGenerator';
import { Product } from '../../types/pos';
import { api } from '../../services/api';

export const BarcodeGenerator: React.FC = () => {
  const { products, settings, addToast } = usePOS();
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [customValue, setCustomValue] = useState<string>(products[0]?.barcode || '');
  const [barcodeFormat, setBarcodeFormat] = useState<'CODE128' | 'EAN13'>('EAN13');
  const [showText, setShowText] = useState<boolean>(true);
  const [fontSize, setFontSize] = useState<number>(14);
  const [barcodeHeight, setBarcodeHeight] = useState<number>(60);
  const [labelCopies, setLabelCopies] = useState<number>(24);
  const [sheetLayout, setSheetLayout] = useState<'24' | '40' | 'thermal'>('24');

  const svgRef = useRef<SVGSVGElement>(null);
  const currency = settings?.currencySymbol || '₹';

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const activeBarcode = selectedProduct ? selectedProduct.barcode : customValue;

  useEffect(() => {
    if (svgRef.current && activeBarcode) {
      renderBarcodeToSvg(svgRef.current, activeBarcode, {
        format: barcodeFormat,
        height: barcodeHeight,
        displayValue: showText,
        fontSize: fontSize,
        margin: 10,
      });
    }
  }, [activeBarcode, barcodeFormat, barcodeHeight, showText, fontSize]);

  const handleGenerateRandomEAN = async () => {
    try {
      const { barcode } = await api.generateBarcode();
      setCustomValue(barcode);
      setSelectedProductId('');
      addToast('success', 'Generated EAN-13', barcode);
    } catch {}
  };

  const handlePrintSingle = () => {
    window.print();
  };

  const handleDownloadSheetPDF = () => {
    if (!selectedProduct && !customValue) return;

    const labelProduct: Product = selectedProduct || {
      id: 'custom',
      name: 'Custom Product Label',
      sku: 'SKU-CUSTOM',
      barcode: customValue,
      category: 'General',
      brand: settings?.storeName || 'MetroMart',
      purchasePrice: 0,
      sellingPrice: 199,
      gstRate: 18,
      currentStock: 100,
      minStockLevel: 5,
      supplier: 'Internal',
      unit: 'Pc',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    generateBarcodeSheetPDF(labelProduct, settings, labelCopies, sheetLayout);
    addToast('success', 'PDF Downloaded', `Generated ${labelCopies} barcode labels sheet.`);
  };

  return (
    <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-100">
            <BarcodeIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Barcode Generation & Label Studio</h2>
            <p className="text-xs text-slate-500">Generate GS1-compliant EAN-13 & Code-128 barcode label sheets for printing</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateRandomEAN}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Generate New EAN-13</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-5 space-y-4">
          {/* Product Source Selector */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-2xs">
            <label className="block text-xs font-bold text-slate-700">1. Select Catalog Product</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((prod) => prod.id === e.target.value);
                if (p) setCustomValue(p.barcode);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            >
              <option value="">-- Or enter custom code below --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Barcode: {p.barcode}) - {currency}{p.sellingPrice}
                </option>
              ))}
            </select>

            {!selectedProductId && (
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Custom Barcode Value</label>
                <input
                  type="text"
                  value={customValue}
                  onChange={(e) => setCustomValue(e.target.value)}
                  placeholder="e.g. 8901030865421"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {/* Barcode Encoding & Style Customizer */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-600" />
              2. Encoding & Visual Dimensions
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Symbology</label>
                <select
                  value={barcodeFormat}
                  onChange={(e) => setBarcodeFormat(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden"
                >
                  <option value="EAN13">EAN-13 (Standard Retail)</option>
                  <option value="CODE128">Code 128 (Alphanumeric)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Barcode Height ({barcodeHeight}px)</label>
                <input
                  type="range"
                  min="30"
                  max="120"
                  value={barcodeHeight}
                  onChange={(e) => setBarcodeHeight(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="text-slate-700 font-semibold">Display Human-Readable Text</label>
              <input
                type="checkbox"
                checked={showText}
                onChange={(e) => setShowText(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-white border-slate-300"
              />
            </div>
          </div>

          {/* Sheet Printing Layout Configuration */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 text-xs shadow-2xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              3. Printable Label Sheet Settings
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Page Sheet Layout</label>
                <select
                  value={sheetLayout}
                  onChange={(e) => {
                    setSheetLayout(e.target.value as any);
                    if (e.target.value === '24') setLabelCopies(24);
                    if (e.target.value === '40') setLabelCopies(40);
                    if (e.target.value === 'thermal') setLabelCopies(10);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 focus:outline-hidden"
                >
                  <option value="24">A4 Sheet (24 Labels - 3x8)</option>
                  <option value="40">A4 Sheet (40 Labels - 4x10)</option>
                  <option value="thermal">Thermal Roll (50mm × 25mm)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Number of Copies</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={labelCopies}
                  onChange={(e) => setLabelCopies(parseInt(e.target.value, 10) || 1)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-900 font-mono focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            </div>

            <button
              onClick={handleDownloadSheetPDF}
              className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition active:scale-98"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Printable Label Sheet PDF</span>
            </button>
          </div>
        </div>

        {/* Right Column: Live Label Card & Scanner Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center shadow-2xs">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Live Product Sticker Preview</span>

            {/* Individual Label Physical Sticker Simulation */}
            <div className="bg-white text-slate-900 p-4 rounded-xl shadow-md border border-slate-200 max-w-xs w-full text-center flex flex-col items-center justify-between">
              {/* Store Header */}
              <div className="border-b border-dashed border-slate-200 pb-1 mb-1 w-full">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-800">
                  {settings?.storeName || 'MetroMart Retail'}
                </p>
              </div>

              {/* Product Info */}
              <div className="w-full my-1">
                <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                  {selectedProduct?.name || 'Custom Product Item'}
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  SKU: {selectedProduct?.sku || 'SKU-SAMPLE'}
                </p>
              </div>

              {/* Rendered SVG Barcode */}
              <div className="py-2 flex justify-center w-full overflow-hidden">
                <svg ref={svgRef} className="max-w-full" />
              </div>

              {/* Price & Tax Footer */}
              <div className="border-t border-dashed border-slate-200 pt-1 w-full flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-semibold">Incl. All Taxes</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  MRP: {currency}{selectedProduct?.sellingPrice || 199}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePrintSingle}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
              >
                <Printer className="w-4 h-4 text-indigo-600" />
                <span>Print Single Sticker</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(activeBarcode);
                  addToast('info', 'Copied Barcode', activeBarcode);
                }}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition"
              >
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Barcode</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
