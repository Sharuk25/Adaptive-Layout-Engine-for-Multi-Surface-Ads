import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { validateCandidate } from './src/engine/validator';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['stress'];
const context = normalizeConstraints(surface);
const candidates = generateCandidates(demoAdSpec, context);
const cand = candidates.find(c => c.strategyName === 'Hero Split' && c.elements[0].degradationLevel === 1);
const { isValid, validations } = validateCandidate(cand, context, demoAdSpec);
console.log(isValid, validations);
console.log(cand.diagnostics.warnings);
