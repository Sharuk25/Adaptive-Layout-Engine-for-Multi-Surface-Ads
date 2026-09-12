import { resolveLayout } from '../engine/resolver';
import { DomRenderer } from '../renderer/dom-renderer';
import { demoAdSpec } from './demo-spec';
import { demoSurfaces } from './demo-surfaces';
import { SurfaceProfile, ResolvedLayout } from '../engine/types';

export class DemoController {
  private renderer = new DomRenderer();
  private container: HTMLElement;
  private logContainer: HTMLElement;
  private inspectorContainer: HTMLElement;
  private currentSurfaceId = 'mobilePortrait';
  private debugMode = false;

  constructor() {
    this.container = document.getElementById('preview-canvas')!;
    this.logContainer = document.getElementById('log-panel')!;
    this.inspectorContainer = document.getElementById('inspector-panel')!;
    
    this.setupListeners();
    this.renderCurrent();
  }

  private setupListeners() {
    const buttons = document.querySelectorAll('.surface-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        buttons.forEach(b => b.classList.remove('active'));
        const target = e.currentTarget as HTMLButtonElement;
        target.classList.add('active');
        
        if (target.dataset.surface === 'custom') {
          document.getElementById('custom-form')!.classList.add('visible');
          return;
        } else {
          document.getElementById('custom-form')!.classList.remove('visible');
        }

        this.currentSurfaceId = target.dataset.surface!;
        this.renderCurrent();
      });
    });

    document.getElementById('debug-toggle')?.addEventListener('change', (e) => {
      this.debugMode = (e.target as HTMLInputElement).checked;
      this.renderCurrent();
    });

    document.getElementById('apply-custom')?.addEventListener('click', () => {
      const w = parseInt((document.getElementById('custom-w') as HTMLInputElement).value) || 500;
      const h = parseInt((document.getElementById('custom-h') as HTMLInputElement).value) || 300;
      const saParts = (document.getElementById('custom-sa') as HTMLInputElement).value.split(',').map(n => parseInt(n.trim()) || 0);
      const minText = parseInt((document.getElementById('custom-min-text') as HTMLInputElement).value) || 12;
      const minTap = parseInt((document.getElementById('custom-min-tap') as HTMLInputElement).value) || 44;
      const touch = (document.getElementById('custom-touch') as HTMLInputElement).checked;
      const dist = (document.getElementById('custom-dist') as HTMLSelectElement).value as "near" | "far";
      
      demoSurfaces['custom'] = {
        id: "Custom Surface",
        width: w,
        height: h,
        safeArea: { 
          top: saParts[0] || 0, 
          right: saParts[1] || 0, 
          bottom: saParts[2] || 0, 
          left: saParts[3] || 0 
        },
        minTapTarget: minTap,
        minTextSize: minText,
        touchOnly: touch,
        viewingDistance: dist
      };
      this.currentSurfaceId = 'custom';
      this.renderCurrent();
    });
  }

  private renderCurrent() {
    const surface = demoSurfaces[this.currentSurfaceId];
    
    // Clear logs
    this.logContainer.innerHTML = '';
    
    const layout = resolveLayout(demoAdSpec, surface, { debug: this.debugMode });
    
    // Scale container to fit screen if needed
    const scaleWrapper = document.getElementById('preview-scale-wrapper');
    const outerWrapper = scaleWrapper?.parentElement;
    
    if (scaleWrapper && outerWrapper) {
      const maxWidth = outerWrapper.clientWidth - 64; // 32px padding each side
      const maxHeight = outerWrapper.clientHeight - 64;
      
      const scaleX = maxWidth / surface.width;
      const scaleY = maxHeight / surface.height;
      const scale = Math.min(1, scaleX, scaleY); // Don't scale up, only down
      
      scaleWrapper.style.width = `${surface.width * scale}px`;
      scaleWrapper.style.height = `${surface.height * scale}px`;
      
      this.container.style.transform = `scale(${scale})`;
      this.container.style.transformOrigin = 'top left';
      this.container.style.flexShrink = '0'; // Prevent flexbox from shrinking the logical canvas
    }
    
    // Update DOM
    this.renderer.render(layout, demoAdSpec, this.container);
    
    if (this.debugMode) {
      this.renderer.renderDebugOverlay(layout, demoAdSpec, this.container, surface);
    }
    
    // Update logs
    layout.diagnostics.logs.forEach(log => {
      const el = document.createElement('div');
      el.className = 'log-line';
      el.innerText = log;
      this.logContainer.appendChild(el);
    });
    this.logContainer.scrollTop = this.logContainer.scrollHeight;

    // Update Inspector
    this.updateInspector(layout, surface);
  }

  private updateInspector(layout: ResolvedLayout, surface: SurfaceProfile) {
    const visibleCount = layout.elements.filter((e) => e.visible).length;
    const totalCount = demoAdSpec.elements.length;

    let elementsHtml = demoAdSpec.elements.map(specEl => {
      const resolved = layout.elements.find((e) => e.id === specEl.id);
      let statusClass = '';
      let icon = '✓';
      let statusText = 'Visible ✓';
      let reasonText = '';
      let layoutDetails = '';

      if (!resolved || !resolved.visible) {
        statusClass = 'dropped';
        icon = '○';
        statusText = 'Hidden';
        if (resolved?.reason) reasonText = `<div style="font-size: 0.75rem; margin-top: 0.25rem; color: var(--text-muted);">Reason: ${resolved.reason}</div>`;
      } else {
        if (resolved.degradationLevel > 0 || resolved.reason) {
          statusClass = 'degraded';
          icon = '⚠';
          statusText = resolved.reason ? '⚠ Truncated' : `Degraded (L${resolved.degradationLevel})`;
        }
        
        layoutDetails = `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
          <div>${Math.round(resolved.width)} × ${Math.round(resolved.height)}</div>
          <div>x: ${Math.round(resolved.x)} | y: ${Math.round(resolved.y)}</div>
        </div>`;

        if (resolved.type === 'text' || resolved.type === 'button') {
           const fit = resolved.textFit;
           let fitLabel = resolved.reason ? '⚠ Truncated' : '✓ Fits';
           if (fit && !fit.valid) fitLabel = '✕ Does not fit';
           
           layoutDetails += `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
             <div>Font: ${resolved.fontSize}px</div>
             <div>Text Fit: ${fitLabel}</div>
           </div>`;
           
           if (fit) {
              layoutDetails += `<div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; opacity: 0.8;">
                <div>Lines: ${fit.lineCount} | Size: ${Math.round(fit.measuredWidth)}x${Math.round(fit.measuredHeight)}</div>
              </div>`;
           }
        }
        if (resolved.reason) {
            reasonText = `<div style="font-size: 0.75rem; margin-top: 0.25rem; color: var(--text-muted);">Reason: ${resolved.reason}</div>`;
        }
      }

      return `<div class="element-item ${statusClass}">
        <div style="font-weight: 500; text-transform: uppercase;">
           <span>${specEl.id}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">
           <span>P${specEl.priority}</span>
           <span style="float: right;">${statusText}</span>
        </div>
        ${layoutDetails}
        ${reasonText}
      </div>`;
    }).join('');

    const sa = surface.safeArea;
    const aspect = (surface.width / surface.height).toFixed(2);
    const score = layout.scoreDetails;
    const constraints = layout.constraints;

    this.inspectorContainer.innerHTML = `
      <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Surface</div>
      <div class="info-block" style="margin-bottom: 1.5rem;">
        <div style="font-weight: 600; margin-bottom: 0.5rem;">${surface.id}</div>
        <div class="info-row"><span>Dimensions</span> <span>${surface.width} × ${surface.height}</span></div>
        <div class="info-row"><span>Aspect Ratio</span> <span>${aspect}</span></div>
        <div class="info-row"><span>Safe Area</span> <span>${sa.top} / ${sa.right} / ${sa.bottom} / ${sa.left}</span></div>
      </div>

      <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Constraint Validation</div>
      <div class="info-block" style="margin-bottom: 1.5rem; display: flex; flex-direction: column; gap: 0.25rem; color: var(--text-muted);">
         <div style="color: ${constraints.insideSafeArea ? 'inherit' : 'var(--danger)'};">${constraints.insideSafeArea ? '✓' : '✗'} Inside safe area${constraints.insideSafeArea ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">Element outside bounds</span>'}</div>
         <div style="color: ${constraints.noOverlap ? 'inherit' : 'var(--danger)'};">${constraints.noOverlap ? '✓' : '✗'} No element overlap${constraints.noOverlap ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">Collision detected</span>'}</div>
         <div style="color: ${constraints.noClipping ? 'inherit' : 'var(--danger)'};">${constraints.noClipping ? '✓' : '✗'} No clipping / Text fits${constraints.noClipping ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">Element clipped or text overflows</span>'}</div>
         <div style="color: ${constraints.ctaTargetSatisfied ? 'inherit' : 'var(--danger)'};">${constraints.ctaTargetSatisfied ? '✓' : '✗'} CTA minimum target satisfied${constraints.ctaTargetSatisfied ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">Tap target too small</span>'}</div>
         <div style="color: ${constraints.minTextSizeSatisfied ? 'inherit' : 'var(--danger)'};">${constraints.minTextSizeSatisfied ? '✓' : '✗'} Minimum text size satisfied${constraints.minTextSizeSatisfied ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">Text below threshold</span>'}</div>
         <div style="color: ${constraints.criticalElementsPreserved ? 'inherit' : 'var(--danger)'};">${constraints.criticalElementsPreserved ? '✓' : '✗'} Critical elements preserved${constraints.criticalElementsPreserved ? '' : '<br><span style="font-size:0.7rem;margin-left:14px;">P1 element hidden</span>'}</div>
      </div>

      <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Layout</div>
      <div class="info-block" style="margin-bottom: 1.5rem;">
        <div class="info-row"><span>Strategy</span> <span>${layout.strategy}</span></div>
        <div class="info-row">
          <span style="font-weight: 600;">Resolution Score</span> 
          <span style="font-weight: 600;">${score.total.toFixed(1)} / 100</span>
        </div>
        <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.75rem; color: var(--text-muted);">
           <div class="info-row"><span>Priority Satisfaction</span> <span>${score.prioritySatisfaction.toFixed(0)}%</span></div>
           <div class="info-row"><span>Space Utilization</span> <span>${score.spaceUtilization.toFixed(0)}%</span></div>
           <div class="info-row"><span>Readability</span> <span>${score.readability.toFixed(0)}%</span></div>
           <div class="info-row"><span>Constraint Satisfaction</span> <span>${score.constraintSatisfaction.toFixed(0)}%</span></div>
           <div class="info-row"><span>Whitespace Balance</span> <span>${score.whitespaceBalance.toFixed(0)}%</span></div>
           <div class="info-row"><span>Degradation Penalty</span> <span>${score.degradationPenalty.toFixed(0)}</span></div>
        </div>
      </div>

      <div style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-bottom: 0.5rem;">Elements (${visibleCount} / ${totalCount} visible)</div>
      <div class="element-list">
        ${elementsHtml}
      </div>
    `;
  }
}
