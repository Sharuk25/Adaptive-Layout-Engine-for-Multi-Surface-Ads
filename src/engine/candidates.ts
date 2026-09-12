import { AdSpec, ResolvedElement } from './types';
import { ConstraintContext } from './constraints';
import { DegradationLevel } from './degradation';
import { LayoutCandidate } from './validator';
import { measureText } from '../utils/text';

export function generateCandidates(spec: AdSpec, context: ConstraintContext): LayoutCandidate[] {
  const candidates: LayoutCandidate[] = [];

  const strategies = [
    { name: 'Vertical Flow', generator: generateVerticalFlow },
    { name: 'Horizontal Flow', generator: generateHorizontalFlow },
    { name: 'Hero Split', generator: generateHeroSplit },
    { name: 'Compact Flow', generator: generateCompactFlow }
  ];

  const levels: DegradationLevel[] = [0, 1, 2, 3];

  for (const strategy of strategies) {
    for (const level of levels) {
      const { elements, logs } = strategy.generator(spec, context, level);
      
      const candidate: LayoutCandidate = {
        strategyName: strategy.name,
        elements,
        score: 0, 
        diagnostics: {
          droppedElements: elements.filter(e => !e.visible).map(e => e.id),
          warnings: [],
          logs
        }
      };
      candidates.push(candidate);
    }
  }

  return candidates;
}

function getElementSize(
  el: AdSpec['elements'][0],
  context: ConstraintContext,
  level: DegradationLevel,
  availableWidth: number,
  availableHeight: number = Infinity
): { width: number; height: number; fontSize?: number; lines?: string[], text?: string, reason?: string } {
  let width = 0;
  let height = 0;
  let fontSize = undefined;
  let lines: string[] | undefined = undefined;
  let text = el.content;
  let reason = undefined;

  const useMinSize = level >= 1;

  if (el.type === 'text') {
    fontSize = useMinSize ? (context.minTextSize) : (context.minTextSize * 1.5);
    const content = el.content || '';
    const fontWeight = el.role === 'primary' ? 'bold' : 'normal';
    let textBounds = measureText(content, fontSize, availableWidth, fontWeight);
    
    // truncation logic if text uses too much height
    if (textBounds.height > availableHeight && level >= 1) {
      // try shrinking further to minimum
      fontSize = context.minTextSize;
      textBounds = measureText(content, fontSize, availableWidth, fontWeight);
      if (textBounds.height > availableHeight) {
        if (el.priority > 1) {
          // truncate
          text = content.substring(0, Math.floor(content.length * (availableHeight / textBounds.height))) + '...';
          textBounds = measureText(text, fontSize, availableWidth, fontWeight);
          reason = "Truncated text to fit available space";
        }
      }
    }

    width = textBounds.width;
    height = textBounds.height;
    lines = textBounds.lines;
  } else if (el.type === 'image') {
    const minW = el.minSize?.width || 50;
    const minH = el.minSize?.height || 50;
    const prefW = el.preferredSize?.width || minW * 2;
    
    width = useMinSize ? minW : Math.min(prefW, availableWidth);
    
    if (el.aspectRatio) {
      height = width / el.aspectRatio;
    } else {
      height = useMinSize ? minH : (el.preferredSize?.height || minH * 2);
    }

    if (height > availableHeight) {
      height = availableHeight;
      if (el.aspectRatio) width = height * el.aspectRatio;
    }
  } else if (el.type === 'button') {
    fontSize = useMinSize ? context.minTextSize : context.minTextSize * 1.2;
    const textBounds = measureText(el.content || '', fontSize, availableWidth - 40, '600');
    const minTap = context.minTapTarget;
    
    width = Math.max(minTap, useMinSize ? textBounds.width + 20 : textBounds.width + 40);
    height = Math.max(minTap, useMinSize ? textBounds.height + 10 : textBounds.height + 20);
  }

  return { width, height, fontSize, lines, text, reason };
}

function processVisibility(specEl: AdSpec['elements'][0], level: DegradationLevel): { visible: boolean, reason?: string } {
  let visible = true;
  let reason = undefined;
  if (level >= 2 && specEl.priority === 3) {
    visible = false;
    reason = "Hidden because available space could not satisfy its minimum size after higher-priority elements were preserved.";
  } else if (level >= 3 && specEl.priority === 2) {
    visible = false;
    reason = "Hidden due to severe space constraints (P2 dropped).";
  }
  return { visible, reason };
}

function generateVerticalFlow(spec: AdSpec, context: ConstraintContext, level: DegradationLevel) {
  const elements: ResolvedElement[] = [];
  const logs: string[] = [];

  const gap = level >= 1 ? 8 : 16;
  const startX = context.usableArea.x;
  const availableWidth = context.usableArea.width;

  const visualOrder = ['branding', 'hero', 'primary', 'secondary', 'action'];
  const orderedSpecElements = [...spec.elements].sort((a, b) => visualOrder.indexOf(a.role) - visualOrder.indexOf(b.role));

  const elementsData: any[] = [];
  let totalHeight = 0;

  for (const specEl of orderedSpecElements) {
    const { visible, reason: dropReason } = processVisibility(specEl, level);

    if (!visible) {
      elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: false, x: 0, y: 0, width: 0, height: 0, zIndex: 0, degradationLevel: level, reason: dropReason });
      continue;
    }

    const { width, height, fontSize, text, reason } = getElementSize(specEl, context, level, availableWidth, Math.max(0, context.usableArea.height - totalHeight));
    elementsData.push({ specEl, width, height, fontSize, text, reason });
    totalHeight += height + gap;
  }
  
  if (elementsData.length > 0) {
    totalHeight -= gap; // remove last gap
  }

  let currentY = context.usableArea.y + Math.max(0, (context.usableArea.height - totalHeight) / 2);

  for (const data of elementsData) {
    const x = startX + (availableWidth - data.width) / 2;
    elements.push({ 
      id: data.specEl.id, type: data.specEl.type, priority: data.specEl.priority, 
      visible: true, x, y: currentY, width: data.width, height: data.height, 
      zIndex: 1, fontSize: data.fontSize, text: data.text || data.specEl.content, 
      src: data.specEl.src, degradationLevel: level, reason: data.reason 
    });
    currentY += data.height + gap;
  }
  
  return { elements, logs };
}

function generateHorizontalFlow(spec: AdSpec, context: ConstraintContext, level: DegradationLevel) {
  const elements: ResolvedElement[] = [];
  const logs: string[] = [];
  let currentX = context.usableArea.x;
  const gap = level >= 1 ? 12 : 24;
  
  const visualOrder = ['branding', 'hero', 'primary', 'secondary', 'action'];
  const orderedSpecElements = [...spec.elements].sort((a, b) => visualOrder.indexOf(a.role) - visualOrder.indexOf(b.role));

  for (const specEl of orderedSpecElements) {
    const { visible, reason: dropReason } = processVisibility(specEl, level);
    if (!visible) {
      elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: false, x: 0, y: 0, width: 0, height: 0, zIndex: 0, degradationLevel: level, reason: dropReason });
      continue;
    }

    const { width, height, fontSize, text, reason } = getElementSize(specEl, context, level, context.usableArea.width, context.usableArea.height);
    const y = context.usableArea.y + (context.usableArea.height - height) / 2;
    
    elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: true, x: currentX, y, width, height, zIndex: 1, fontSize, text: text || specEl.content, src: specEl.src, degradationLevel: level, reason });
    currentX += width + gap;
  }
  return { elements, logs };
}

function generateHeroSplit(spec: AdSpec, context: ConstraintContext, level: DegradationLevel) {
  const elements: ResolvedElement[] = [];
  const logs: string[] = [];
  const heroEls = spec.elements.filter(e => e.role === 'hero');
  const otherEls = spec.elements.filter(e => e.role !== 'hero').sort((a, b) => a.priority - b.priority);

  const gap = level >= 1 ? 12 : 24;
  let leftWidth = context.usableArea.width * 0.4; 
  let rightWidth = context.usableArea.width - leftWidth - gap;

  if (heroEls.length > 0) {
    const hero = heroEls[0];
    const { visible, reason: dropReason } = processVisibility(hero, level);
    if (visible) {
      const { width, height } = getElementSize(hero, context, level, leftWidth, context.usableArea.height);
      elements.push({ id: hero.id, type: hero.type, priority: hero.priority, visible: true, x: context.usableArea.x, y: context.usableArea.y + (context.usableArea.height - height) / 2, width: leftWidth, height, zIndex: 1, src: hero.src, degradationLevel: level });
    } else {
      leftWidth = 0; rightWidth = context.usableArea.width;
      elements.push({ id: hero.id, type: hero.type, priority: hero.priority, visible: false, x: 0, y: 0, width: 0, height: 0, zIndex: 0, degradationLevel: level, reason: dropReason });
    }
  } else {
    leftWidth = 0; rightWidth = context.usableArea.width;
  }

  let currentY = context.usableArea.y;
  const startX = context.usableArea.x + leftWidth + (leftWidth > 0 ? gap : 0);

  for (const specEl of otherEls) {
    const { visible, reason: dropReason } = processVisibility(specEl, level);
    if (!visible) {
      elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: false, x: 0, y: 0, width: 0, height: 0, zIndex: 0, degradationLevel: level, reason: dropReason });
      continue;
    }
    const { width, height, fontSize, text, reason } = getElementSize(specEl, context, level, rightWidth, context.usableArea.height - (currentY - context.usableArea.y));
    elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: true, x: startX, y: currentY, width, height, zIndex: 1, fontSize, text: text || specEl.content, src: specEl.src, degradationLevel: level, reason });
    currentY += height + (level >= 1 ? 8 : 16);
  }
  return { elements, logs };
}

function generateCompactFlow(spec: AdSpec, context: ConstraintContext, level: DegradationLevel) {
  const elements: ResolvedElement[] = [];
  const logs: string[] = [];
  let currentX = context.usableArea.x;
  let currentY = context.usableArea.y;
  let rowHeight = 0;
  const gap = level >= 1 ? 8 : 12;

  const visualOrder = ['branding', 'hero', 'primary', 'secondary', 'action'];
  const orderedSpecElements = [...spec.elements].sort((a, b) => visualOrder.indexOf(a.role) - visualOrder.indexOf(b.role));

  for (const specEl of orderedSpecElements) {
    const { visible, reason: dropReason } = processVisibility(specEl, level);
    if (!visible) {
      elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: false, x: 0, y: 0, width: 0, height: 0, zIndex: 0, degradationLevel: level, reason: dropReason });
      continue;
    }

    const { width, height, fontSize, text, reason } = getElementSize(specEl, context, level, context.usableArea.width, context.usableArea.height - (currentY - context.usableArea.y));
    
    if (currentX + width > context.usableArea.x + context.usableArea.width) {
      // Wrap to next line
      currentX = context.usableArea.x;
      currentY += rowHeight + gap;
      rowHeight = 0;
    }

    elements.push({ id: specEl.id, type: specEl.type, priority: specEl.priority, visible: true, x: currentX, y: currentY, width, height, zIndex: 1, fontSize, text: text || specEl.content, src: specEl.src, degradationLevel: level, reason });
    currentX += width + gap;
    rowHeight = Math.max(rowHeight, height);
  }
  return { elements, logs };
}
