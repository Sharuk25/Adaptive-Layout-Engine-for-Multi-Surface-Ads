import { ResolvedLayout, AdSpec } from '../engine/types';

export interface LayoutRenderer {
  render(layout: ResolvedLayout, spec: AdSpec, container: HTMLElement): void;
}
