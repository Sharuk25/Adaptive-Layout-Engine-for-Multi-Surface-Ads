import { normalizeConstraints } from './src/engine/constraints';
import { generateCandidates } from './src/engine/candidates';
import { validateCandidate } from './src/engine/validator';
import { scoreLayout } from './src/engine/scoring';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['broadcast'];
const context = normalizeConstraints(surface);
const candidates = generateCandidates(demoAdSpec, context);
for (const cand of candidates) {
  const { isValid, validations } = validateCandidate(cand, context, demoAdSpec);
  const score = scoreLayout(cand, context);
  console.log(cand.strategyName, "L" + cand.elements[0].degradationLevel, "valid:", isValid, "score:", score.total.toFixed(1));
  if (!isValid) console.log("  ", validations);
}
