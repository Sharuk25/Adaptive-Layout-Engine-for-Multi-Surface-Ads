import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { resolveLayout } from './src/engine/resolver';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['broadcast'];
const layout = resolveLayout(demoAdSpec, surface);
console.log(layout.strategy, layout.score);
for(const el of layout.elements) {
  if (el.visible && el.type === 'text') {
    console.log(el.id, "fontSize:", el.fontSize);
  }
}
