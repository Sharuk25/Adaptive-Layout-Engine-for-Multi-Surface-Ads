import { SurfaceProfile } from '../engine/types';
import { defineSurface } from '../engine/surfaces';

/**
 * ⚠️ FLAM ASSIGNMENT REQUIREMENT: GENERIC SURFACE MODEL
 * 
 * These profiles define strict physical constraints, view distances,
 * safe areas, and tap targets. The Engine only sees these generic variables,
 * not the names of the devices.
 */
export const demoSurfaces: Record<string, SurfaceProfile> = {
  mobilePortrait: defineSurface({
    id: "Mobile Portrait",
    width: 320,
    height: 480,
    safeArea: { top: 16, right: 16, bottom: 16, left: 16 },
    minTapTarget: 44,
    orientation: "portrait",
    touchOnly: true
  } as any),
  
  mobileLandscape: defineSurface({
    id: "Mobile Landscape",
    width: 640,
    height: 360,
    safeArea: { top: 16, right: 16, bottom: 16, left: 16 },
    minTapTarget: 44,
    orientation: "landscape",
    touchOnly: true
  } as any),
  
  broadcast: defineSurface({
    id: "Broadcast Lower Third",
    width: 1920,
    height: 250,
    safeArea: { top: 20, right: 60, bottom: 20, left: 60 },
    minTextSize: 36,
    viewingDistance: "far",
    touchOnly: false
  } as any),
  
  kiosk: defineSurface({
    id: "Square Retail Kiosk",
    width: 1080,
    height: 1080,
    safeArea: { top: 40, right: 40, bottom: 40, left: 40 },
    minTapTarget: 60,
    touchOnly: true
  } as any),
  
  stress: defineSurface({
    id: "Extreme Stress",
    width: 320,
    height: 220,
    safeArea: { top: 10, right: 10, bottom: 10, left: 10 },
    minTapTarget: 44
  } as any)
};
