export type ElementType = "text" | "image" | "button";

export type ElementRole = "primary" | "hero" | "action" | "secondary" | "branding";

export interface AdElement {
  id: string;
  type: ElementType;
  role: ElementRole;
  priority: number; // 1 = critical, 2 = important, 3 = optional
  content?: string;
  src?: string;
  preferredSize?: { width?: number; height?: number };
  minSize?: { width: number; height: number };
  maxSize?: { width?: number; height?: number };
  aspectRatio?: number;
  visibilityRules?: {
    hideIfConstrained?: boolean;
  };
}

export interface AdSpec {
  id: string;
  elements: AdElement[];
}

export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface SurfaceProfile {
  id: string;
  width: number;
  height: number;
  safeArea: Insets;
  minTapTarget?: number;
  minTextSize?: number;
  viewingDistance?: "near" | "normal" | "far";
  touchOnly?: boolean;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResolvedElement extends Rect {
  id: string;
  visible: boolean;
  zIndex: number;
  fontSize?: number;
  text?: string;
  src?: string;
  degradationLevel: number;
  reason?: string;
  type: ElementType;
  priority: number;
  textFit?: any;
}

export interface ScoreDetails {
  total: number;
  prioritySatisfaction: number;
  spaceUtilization: number;
  readability: number;
  constraintSatisfaction: number;
  whitespaceBalance: number;
  degradationPenalty: number;
}

export interface ConstraintValidation {
  insideSafeArea: boolean;
  noOverlap: boolean;
  noClipping: boolean;
  ctaTargetSatisfied: boolean;
  minTextSizeSatisfied: boolean;
  criticalElementsPreserved: boolean;
}

export interface ResolvedLayout {
  surfaceId: string;
  width: number;
  height: number;
  elements: ResolvedElement[];
  score: number;
  scoreDetails: ScoreDetails;
  strategy: string;
  constraints: ConstraintValidation;
  diagnostics: {
    droppedElements: string[];
    warnings: string[];
    logs: string[];
  };
}
