import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['broadcast'];
const context = normalizeConstraints(surface);
const candidates = generateCandidates(demoAdSpec, context);
const l0 = candidates.find(c => c.strategyName === 'Horizontal Flow' && c.elements[0].degradationLevel === 0);

console.log(l0.elements);
