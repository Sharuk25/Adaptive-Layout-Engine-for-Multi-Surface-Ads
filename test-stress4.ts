import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['stress'];
const context = normalizeConstraints(surface);
const candidates = generateCandidates(demoAdSpec, context);
const cand = candidates.find(c => c.strategyName === 'Horizontal Flow' && c.elements[0].degradationLevel === 1);
console.log(cand.elements);
