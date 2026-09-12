/**
 * Text measurement utility.
 * Uses CanvasRenderingContext2D.measureText for accurate calculation when available.
 */
let measureDiv: HTMLDivElement | null = null;
let measureSpan: HTMLSpanElement | null = null;

function getMeasureElements() {
  if (!measureDiv && typeof document !== 'undefined') {
    measureDiv = document.createElement('div');
    measureDiv.style.position = 'absolute';
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.pointerEvents = 'none';
    measureDiv.style.left = '-9999px';
    measureDiv.style.top = '-9999px';
    measureDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    measureDiv.style.lineHeight = '1.2';
    measureDiv.style.boxSizing = 'border-box';
    // word wrap
    measureDiv.style.wordBreak = 'normal';
    measureDiv.style.overflowWrap = 'break-word';

    measureSpan = document.createElement('span');
    measureDiv.appendChild(measureSpan);
    
    document.body.appendChild(measureDiv);
  }
  return { measureDiv, measureSpan };
}

export function measureText(text: string, fontSize: number, maxWidth: number, fontWeight: string = 'normal'): { width: number; height: number; lines: string[] } {
  const { measureDiv, measureSpan } = getMeasureElements();
  
  if (measureDiv && measureSpan) {
    measureDiv.style.width = `${maxWidth}px`;
    measureDiv.style.fontSize = `${fontSize}px`;
    measureDiv.style.fontWeight = fontWeight;
    measureSpan.innerText = text;
    
    const rect = measureSpan.getBoundingClientRect();
    
    // We don't have exact line strings, but we can estimate line count from height
    const lineHeight = fontSize * 1.2;
    const lineCount = Math.max(1, Math.round(rect.height / lineHeight));
    const lines = Array(lineCount).fill('');
    
    return {
      width: Math.min(maxWidth, rect.width),
      height: rect.height,
      lines
    };
  }

  // Fallback if no DOM
  const fallbackLineCount = Math.ceil((text.length * (fontSize * 0.6)) / maxWidth);
  return { 
    width: Math.min(maxWidth, text.length * (fontSize * 0.6)), 
    height: fallbackLineCount * (fontSize * 1.2), 
    lines: Array(fallbackLineCount).fill('') 
  };
}
