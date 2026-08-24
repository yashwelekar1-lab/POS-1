import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { usePOS } from '../../context/POSContext';
import { Camera, X, RefreshCw, AlertCircle, Barcode, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

export const BarcodeScannerModal: React.FC = () => {
  const {
    isScannerOpen,
    setIsScannerOpen,
    products,
    addToCart,
    addToast,
  } = usePOS();

  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'pos-reader-container';

  useEffect(() => {
    if (!isScannerOpen) {
      stopCamera();
      return;
    }

    startCamera();

    return () => {
      stopCamera();
    };
  }, [isScannerOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 15,
          qrbox: { width: 280, height: 180 },
          aspectRatio: 1.5,
        },
        (decodedText) => {
          handleScannedBarcode(decodedText);
        },
        () => {
          // Ignore scanning frame errors
        }
      );
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setCameraError(err.message || 'Camera permission denied or camera device not accessible');
      setIsCameraActive(false);
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (err) {
        console.warn('Error stopping scanner:', err);
      }
    }
    setIsCameraActive(false);
  };

  const handleScannedBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    setLastScannedCode(trimmed);
    const product = products.find(
      (p) => p.barcode.toLowerCase() === trimmed.toLowerCase() || p.sku.toLowerCase() === trimmed.toLowerCase()
    );

    if (product) {
      const added = addToCart(product, 1);
      if (added) {
        addToast('success', 'Product Added', `${product.name} scanned successfully.`);
      }
    } else {
      sound.playErrorBeep();
      addToast('error', 'Barcode Not Found', `No product matches barcode: ${trimmed}`);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScannedBarcode(manualCode);
    setManualCode('');
  };

  if (!isScannerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-900 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Live Barcode Scanner</h3>
              <p className="text-xs text-slate-500">Point camera at product EAN-13 / Code-128 barcode</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              setIsScannerOpen(false);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera Viewport */}
        <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 flex flex-col items-center justify-center min-h-[260px]">
          <div id={scannerContainerId} className="w-full h-full" />

          {/* Aiming Laser Overlay */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-64 h-36 border-2 border-indigo-500 rounded-lg relative">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-500 shadow-md shadow-rose-500 animate-pulse"></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[11px] font-mono font-bold text-white bg-indigo-600 px-2 py-0.5 rounded shadow-xs">
                  Align Barcode in Box
                </span>
              </div>
            </div>
          )}

          {cameraError && (
            <div className="p-6 text-center text-slate-300">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-amber-300 mb-1">Camera Stream Unavailable</p>
              <p className="text-xs text-slate-400 max-w-xs">{cameraError}</p>
              <button
                onClick={startCamera}
                className="mt-3 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Camera
              </button>
            </div>
          )}
        </div>

        {/* Last Scanned Tag */}
        {lastScannedCode && (
          <div className="mt-3 flex items-center justify-between p-2.5 rounded-lg bg-green-50 border border-green-200 text-xs">
            <span className="text-slate-600 font-semibold">Last Scanned:</span>
            <span className="font-mono font-bold text-green-700 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {lastScannedCode}
            </span>
          </div>
        )}

        {/* Manual Barcode Fallback / Simulation */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Or manually type / USB scan barcode..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 focus:bg-white font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition active:scale-[0.98]"
            >
              Scan
            </button>
          </form>

          {/* Quick Demo Barcode Buttons */}
          <div className="mt-3">
            <p className="text-[11px] text-slate-500 font-semibold mb-1.5">Quick Test Sample Barcodes:</p>
            <div className="flex flex-wrap gap-1.5">
              {products.slice(0, 4).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleScannedBarcode(p.barcode)}
                  className="px-2 py-1 text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-200 font-mono transition"
                >
                  {p.name.split(' ')[0]} ({p.barcode.slice(-4)})
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
