import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { validateCandidate } from './src/engine/validator';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['stress'];
const context = normalizeConstraints(surface);
const candidates = generateCandidates(demoAdSpec, context);
const cand = candidates.find(c => c.strategyName === 'Hero Split' && c.elements[0].degradationLevel === 0);
const { isValid, validations } = validateCandidate(cand, context, demoAdSpec);
console.log("isValid:", isValid);
console.log("validations:", validations);
for(const el of cand.elements) {
  if (el.visible) {
    console.log(el.id, "y:", el.y, "h:", el.height, "y+h:", el.y + el.height);
  }
}
