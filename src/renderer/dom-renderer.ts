import { ResolvedLayout, AdSpec, ResolvedElement } from '../engine/types';
import { LayoutRenderer } from './renderer-types';

export class DomRenderer implements LayoutRenderer {
  render(layout: ResolvedLayout, spec: AdSpec, container: HTMLElement): void {
    const overlay = container.querySelector('.debug-overlay');
    if (overlay) overlay.remove(); // We will re-add it if needed

    container.style.position = 'relative';
    container.style.width = `${Math.round(layout.width)}px`;
    container.style.height = `${Math.round(layout.height)}px`;
    container.style.overflow = 'hidden'; // clip anything outside surface
    container.style.backgroundColor = '#ffffff'; // Ad background
    container.style.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)';
    container.style.borderRadius = '12px';

    const renderedIds = new Set<string>();

    for (const el of layout.elements) {
      if (!el.visible) continue;
      renderedIds.add(el.id);

      let domEl = container.querySelector(`[data-id="${el.id}"]`) as HTMLElement;
      
      const x = Math.round(el.x);
      const y = Math.round(el.y);
      const w = Math.ceil(el.width) + 2; // Add 2px buffer to guarantee no rounding clipping
      const h = Math.ceil(el.height) + 2;
      const fontSize = el.fontSize ? Math.round(el.fontSize) : 12;

      if (!domEl) {
        domEl = document.createElement('div');
        domEl.dataset.id = el.id;
        container.appendChild(domEl);
      }

      domEl.style.position = 'absolute';
      domEl.style.left = `${x}px`;
      domEl.style.top = `${y}px`;
      domEl.style.width = `${w}px`;
      domEl.style.height = `${h}px`;
      domEl.style.zIndex = el.zIndex.toString();
      domEl.style.boxSizing = 'border-box';
      domEl.style.wordBreak = 'normal';
      domEl.style.overflowWrap = 'break-word';

      // Type specific rendering
      if (el.type === 'text') {
        const specEl = spec.elements.find(s => s.id === el.id);
        
        domEl.innerText = el.text || '';
        domEl.style.fontSize = `${fontSize}px`;
        domEl.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        domEl.style.lineHeight = '1.2';
        
        if (specEl?.role === 'primary') {
          domEl.style.fontWeight = 'bold';
          domEl.style.color = '#111827';
        } else if (specEl?.role === 'secondary') {
          domEl.style.fontWeight = 'normal'; // Reset in case reused
          domEl.style.color = '#4B5563';
        }
      } else if (el.type === 'image') {
        let img = domEl.querySelector('img');
        if (!img) {
          img = document.createElement('img');
          domEl.appendChild(img);
        }
        img.src = el.src || '';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain'; // Prevent distortion
      } else if (el.type === 'button') {
        let btn = domEl.querySelector('button');
        if (!btn) {
          btn = document.createElement('button');
          domEl.appendChild(btn);
        }
        btn.innerText = el.text || '';
        btn.style.width = '100%';
        btn.style.height = '100%';
        btn.style.backgroundColor = '#2563EB';
        btn.style.color = '#FFFFFF';
        btn.style.border = 'none';
        btn.style.borderRadius = '6px';
        btn.style.fontSize = `${fontSize}px`;
        btn.style.fontWeight = '600';
        btn.style.cursor = 'pointer';
      }
    }

    // Remove old elements not in current layout
    Array.from(container.children).forEach(child => {
      const el = child as HTMLElement;
      if (el.className === 'debug-overlay') return; // skip debug overlay
      if (el.dataset.id && !renderedIds.has(el.dataset.id)) {
        el.remove();
      }
    });
  }

  renderDebugOverlay(layout: ResolvedLayout, spec: AdSpec, container: HTMLElement, surface: any): void {
    let overlay = container.querySelector('.debug-overlay') as HTMLElement;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'debug-overlay';
      overlay.style.position = 'absolute';
      overlay.style.inset = '0';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '9999';
      container.appendChild(overlay);
    }
    overlay.innerHTML = '';

    // Safe Area
    const sa = surface.safeArea;
    const safeBox = document.createElement('div');
    safeBox.style.position = 'absolute';
    safeBox.style.top = `${sa.top}px`;
    safeBox.style.right = `${sa.right}px`;
    safeBox.style.bottom = `${sa.bottom}px`;
    safeBox.style.left = `${sa.left}px`;
    safeBox.style.border = '2px dashed rgba(16, 185, 129, 0.8)';
    safeBox.style.boxSizing = 'border-box';
    
    const saLabel = document.createElement('span');
    saLabel.innerText = 'Safe Area';
    saLabel.style.position = 'absolute';
    saLabel.style.top = '-16px';
    saLabel.style.left = '0';
    saLabel.style.color = 'rgba(16, 185, 129, 0.8)';
    saLabel.style.fontSize = '10px';
    saLabel.style.fontWeight = 'bold';
    safeBox.appendChild(saLabel);
    
    overlay.appendChild(safeBox);

    for (const el of layout.elements) {
      if (!el.visible) continue;
      const specEl = spec.elements.find(s => s.id === el.id);
      
      const x = Math.round(el.x);
      const y = Math.round(el.y);
      const w = Math.round(el.width);
      const h = Math.round(el.height);
      
      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${w}px`;
      box.style.height = `${h}px`;
      box.style.border = '1px solid rgba(239, 68, 68, 0.8)';
      box.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
      box.style.boxSizing = 'border-box';
      
      const label = document.createElement('span');
      label.innerText = `${el.id} (P${specEl?.priority || '?'})`;
      label.style.position = 'absolute';
      label.style.top = '0';
      label.style.left = '0';
      label.style.backgroundColor = 'rgba(239, 68, 68, 0.8)';
      label.style.color = 'white';
      label.style.fontSize = '10px';
      label.style.padding = '2px 4px';
      
      box.appendChild(label);
      
      // Tap target visualization
      if (specEl?.type === 'button') {
         const minTap = surface.minTapTarget || 44;
         const tapBox = document.createElement('div');
         tapBox.style.position = 'absolute';
         tapBox.style.left = `${Math.min(0, Math.round((w - minTap) / 2))}px`;
         tapBox.style.top = `${Math.min(0, Math.round((h - minTap) / 2))}px`;
         tapBox.style.width = `${Math.max(w, minTap)}px`;
         tapBox.style.height = `${Math.max(h, minTap)}px`;
         tapBox.style.border = '1px dotted rgba(59, 130, 246, 0.8)';
         tapBox.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
         tapBox.style.boxSizing = 'border-box';
         
         const tapLabel = document.createElement('span');
         tapLabel.innerText = 'Min Tap Target';
         tapLabel.style.position = 'absolute';
         tapLabel.style.bottom = '-14px';
         tapLabel.style.right = '0';
         tapLabel.style.color = 'rgba(59, 130, 246, 0.8)';
         tapLabel.style.fontSize = '9px';
         tapBox.appendChild(tapLabel);
         
         box.appendChild(tapBox);
      }
      
      overlay.appendChild(box);
    }
  }
}
