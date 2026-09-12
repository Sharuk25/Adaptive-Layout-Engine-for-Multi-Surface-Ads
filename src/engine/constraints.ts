import { SurfaceProfile, Rect } from './types';

export interface ConstraintContext {
  usableArea: Rect;
  surface: SurfaceProfile;
  minTapTarget: number;
  minTextSize: number;
}

export function normalizeConstraints(surface: SurfaceProfile): ConstraintContext {
  const usableArea: Rect = {
    x: surface.safeArea.left,
    y: surface.safeArea.top,
    width: surface.width - surface.safeArea.left - surface.safeArea.right,
    height: surface.height - surface.safeArea.top - surface.safeArea.bottom,
  };

  return {
    usableArea,
    surface,
    minTapTarget: surface.minTapTarget || 44, // default accessibility standard
    minTextSize: surface.minTextSize || 12,
  };
}
