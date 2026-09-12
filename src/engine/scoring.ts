import { LayoutCandidate } from './validator';
import { ConstraintContext } from './constraints';
import { ScoreDetails } from './types';

export function scoreLayout(candidate: LayoutCandidate, context: ConstraintContext): ScoreDetails {
  let prioritySatisfaction = 100;
  let spaceUtilization = 0;
  let readability = 100;
  let constraintSatisfaction = candidate.isValid ? 100 : 0;
  let whitespaceBalance = 100;
  let degradationPenalty = 0;
  
  let totalArea = 0;
  const usableArea = context.usableArea.width * context.usableArea.height;

  for (const el of candidate.elements) {
    if (el.visible) {
      totalArea += el.width * el.height;
      degradationPenalty -= (el.degradationLevel * 2);
      if (el.type === 'text' && el.fontSize && el.fontSize < context.minTextSize * 1.2) {
         readability -= 5;
      }
      if (el.text && el.text.endsWith('...')) {
         readability -= 10;
      }
    } else {
      const penalty = el.priority === 1 ? 50 : (el.priority === 2 ? 20 : 5);
      prioritySatisfaction -= penalty;
      degradationPenalty -= penalty;
    }
  }
  
  spaceUtilization = Math.min(100, (totalArea / usableArea) * 100);
  
  // White space balance (penalty if too cramped or too sparse)
  if (spaceUtilization > 90) whitespaceBalance -= 20;
  else if (spaceUtilization < 30) whitespaceBalance -= 30;

  prioritySatisfaction = Math.max(0, prioritySatisfaction);
  readability = Math.max(0, readability);

  const total = (
    prioritySatisfaction * 0.4 +
    spaceUtilization * 0.2 +
    readability * 0.15 +
    constraintSatisfaction * 0.15 +
    whitespaceBalance * 0.1 +
    degradationPenalty
  );

  return {
    total: Math.max(0, Math.min(100, total)),
    prioritySatisfaction,
    spaceUtilization,
    readability,
    constraintSatisfaction,
    whitespaceBalance,
    degradationPenalty
  };
}
