import { AdElement, AdSpec, ResolvedLayout, ResolvedElement, ConstraintValidation, ScoreDetails } from './types';
import { ConstraintContext } from './constraints';
import { checkCollisions } from './collision';
import { contains } from '../utils/geometry';
import { measureText } from '../utils/text';

export interface LayoutCandidate {
  strategyName: string;
  elements: ResolvedElement[];
  score: number;
  scoreDetails?: ScoreDetails;
  validations?: ConstraintValidation;
  isValid?: boolean;
  diagnostics: {
    droppedElements: string[];
    warnings: string[];
    logs: string[];
  };
}

export interface TextFitResult {
  valid: boolean;
  measuredWidth: number;
  measuredHeight: number;
  availableWidth: number;
  availableHeight: number;
  fontSize: number;
  lineCount: number;
  truncated: boolean;
  reason?: string;
}

export function validateTextFit(
  el: ResolvedElement, 
  specEl: any, 
  minTextSize: number
): TextFitResult {
  const content = el.text || '';
  const fontSize = el.fontSize || 12;
  const fontWeight = specEl?.role === 'primary' ? 'bold' : (specEl?.type === 'button' ? '600' : 'normal');
  
  // Measure text with the exact width it was given
  const bounds = measureText(content, fontSize, el.type === 'button' ? el.width - 20 : el.width, fontWeight);

  // We add a small epsilon for height rounding, and consider button padding
  const maxHeight = el.type === 'button' ? el.height - 10 : el.height;
  const valid = bounds.height <= maxHeight + 2;
  
  return {
    valid,
    measuredWidth: bounds.width,
    measuredHeight: bounds.height,
    availableWidth: el.width,
    availableHeight: el.height,
    fontSize,
    lineCount: bounds.lines.length,
    truncated: content !== specEl?.content,
    reason: valid ? undefined : 'Text content exceeds element bounds'
  };
}

export function validateCandidate(candidate: LayoutCandidate, context: ConstraintContext, spec: AdSpec): { isValid: boolean, validations: ConstraintValidation } {
  const visibleElements = candidate.elements.filter(e => e.visible);

  const validations: ConstraintValidation = {
    insideSafeArea: true,
    noOverlap: true,
    noClipping: true,
    ctaTargetSatisfied: true,
    minTextSizeSatisfied: true,
    criticalElementsPreserved: true
  };

  // 1. No overlaps allowed
  if (checkCollisions(visibleElements)) {
    validations.noOverlap = false;
    candidate.diagnostics.warnings.push('Collision detected.');
  }

  // 2. All elements must be within usable bounds
  for (const el of visibleElements) {
    if (!contains(context.usableArea, el)) {
      validations.insideSafeArea = false;
      validations.noClipping = false;
      candidate.diagnostics.warnings.push(`Element ${el.id} is out of bounds.`);
    }
    
    // 2.5 Ensure internal text content doesn't clip its own container
    if (el.type === 'text' || el.type === 'button') {
       const specEl = spec.elements.find(s => s.id === el.id);
       const fit = validateTextFit(el, specEl, context.minTextSize);
       el.textFit = fit;
       if (!fit.valid) {
          validations.noClipping = false;
          candidate.diagnostics.warnings.push(`Element ${el.id} text is clipped: ${fit.reason}`);
       }
    }
  }

  // 3. Check hard constraints (e.g., tap targets for buttons)
  for (const el of visibleElements) {
    if (el.type === 'button') {
      if (el.width < context.minTapTarget || el.height < context.minTapTarget) {
        validations.ctaTargetSatisfied = false;
        candidate.diagnostics.warnings.push(`Element ${el.id} failed minimum tap target.`);
      }
    }
    if (el.type === 'text' && el.fontSize && el.fontSize < context.minTextSize) {
      validations.minTextSizeSatisfied = false;
      candidate.diagnostics.warnings.push(`Element ${el.id} failed minimum text size.`);
    }
  }

  // 4. Critical Elements preserved
  const criticalSpecEls = spec.elements.filter(e => e.priority === 1);
  for (const crit of criticalSpecEls) {
    const resolvedCrit = candidate.elements.find(e => e.id === crit.id);
    if (!resolvedCrit || !resolvedCrit.visible) {
      validations.criticalElementsPreserved = false;
      candidate.diagnostics.warnings.push(`Critical element ${crit.id} is not visible.`);
    }
  }

  const isValid = validations.insideSafeArea && validations.noOverlap && validations.noClipping && 
                  validations.ctaTargetSatisfied && validations.minTextSizeSatisfied && validations.criticalElementsPreserved;

  return { isValid, validations };
}
