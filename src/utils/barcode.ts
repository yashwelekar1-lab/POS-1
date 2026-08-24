import JsBarcode from 'jsbarcode';

export function renderBarcodeToCanvas(
  canvas: HTMLCanvasElement,
  value: string,
  options?: {
    format?: 'CODE128' | 'EAN13' | 'UPC' | 'pharmacode';
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
    lineColor?: string;
  }
) {
  if (!canvas || !value) return;

  const format = options?.format || (value.length === 13 && /^\d+$/.test(value) ? 'EAN13' : 'CODE128');

  try {
    JsBarcode(canvas, value, {
      format,
      width: options?.width || 2,
      height: options?.height || 50,
      displayValue: options?.displayValue !== undefined ? options.displayValue : true,
      fontSize: options?.fontSize || 14,
      font: 'monospace',
      margin: options?.margin !== undefined ? options.margin : 10,
      lineColor: options?.lineColor || '#000000',
    });
  } catch (err) {
    // Fallback to Code 128 if EAN13 checksum fails or invalid length
    try {
      JsBarcode(canvas, value, {
        format: 'CODE128',
        width: options?.width || 2,
        height: options?.height || 50,
        displayValue: options?.displayValue !== undefined ? options.displayValue : true,
        fontSize: options?.fontSize || 14,
        margin: options?.margin !== undefined ? options.margin : 10,
      });
    } catch {
      console.warn('Barcode render error for:', value);
    }
  }
}

export function renderBarcodeToSvg(
  svg: SVGSVGElement,
  value: string,
  options?: {
    format?: string;
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    margin?: number;
  }
) {
  if (!svg || !value) return;
  const format = options?.format || (value.length === 13 && /^\d+$/.test(value) ? 'EAN13' : 'CODE128');

  try {
    JsBarcode(svg, value, {
      format,
      width: options?.width || 1.8,
      height: options?.height || 45,
      displayValue: options?.displayValue !== undefined ? options.displayValue : true,
      fontSize: options?.fontSize || 13,
      font: 'monospace',
      margin: options?.margin !== undefined ? options.margin : 5,
    });
  } catch {
    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        width: options?.width || 1.8,
        height: options?.height || 45,
        displayValue: true,
        fontSize: 13,
        margin: 5,
      });
    } catch (e) {
      console.warn('Failed to render barcode SVG:', e);
    }
  }
}
