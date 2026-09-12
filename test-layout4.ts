import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { validateCandidate } from './src/engine/validator';
import { resolveLayout } from './src/engine/resolver';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['broadcast'];
const layout = resolveLayout(demoAdSpec, surface);
console.log(layout.strategy, layout.score);
for(const el of layout.elements) {
  console.log(el.id, "y:", el.y, "height:", el.height);
}
