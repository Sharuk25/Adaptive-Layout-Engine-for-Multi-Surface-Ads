import { AdSpec } from '../engine/types';
import { defineAd } from '../engine/spec';

/**
 * ⚠️ FLAM ASSIGNMENT REQUIREMENT: ONE SHARED AD SPECIFICATION
 * 
 * This is the SINGLE canonical ad specification for the entire application.
 * There are NO surface-specific specs (no mobileSpec, kioskSpec, etc).
 * 
 * This exact payload is injected into the Generic Constraint Resolver,
 * which mathematically degrades, scores, and positions the elements 
 * based entirely on the target surface's physical dimensions and rules.
 */
export const demoAdSpec: AdSpec = defineAd({
  id: "aurora-x1",
  elements: [
    {
      id: "headline",
      type: "text",
      role: "primary",
      priority: 1,
      content: "Meet the new Aurora X1",
      minSize: { width: 100, height: 20 }
    },
    {
      id: "product-image",
      type: "image",
      role: "hero",
      priority: 1,
      src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=60",
      aspectRatio: 1.5,
      preferredSize: { width: 300, height: 200 },
      minSize: { width: 100, height: 66 }
    },
    {
      id: "price",
      type: "text",
      role: "secondary",
      priority: 2,
      content: "$799",
      minSize: { width: 40, height: 16 }
    },
    {
      id: "cta",
      type: "button",
      role: "action",
      priority: 2,
      content: "Shop Now",
      minSize: { width: 100, height: 44 }
    },
    {
      id: "logo",
      type: "image",
      role: "branding",
      priority: 3,
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 100'%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-weight='900' font-size='48' fill='%23111827'%3EAURORA%3C/text%3E%3C/svg%3E",
      aspectRatio: 3,
      preferredSize: { width: 120, height: 40 },
      minSize: { width: 60, height: 20 }
    }
  ]
});
