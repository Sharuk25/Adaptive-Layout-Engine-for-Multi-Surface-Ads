import { resolveLayout } from './src/engine/resolver';
import { demoAdSpec } from './src/demo/demo-spec';
import { demoSurfaces } from './src/demo/demo-surfaces';

const surface = demoSurfaces['broadcast'];
const layout = resolveLayout(demoAdSpec, surface);
console.log("Strategy:", layout.strategy);
for (const el of layout.elements) {
  console.log(el.id, "visible:", el.visible, "x:", el.x, "width:", el.width, "height:", el.height, "fontSize:", el.fontSize);
}
