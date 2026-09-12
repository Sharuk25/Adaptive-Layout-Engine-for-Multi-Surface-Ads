# Technical Architecture

## 1. System Architecture

```text
Ad Specification
      ↓
Surface Profile
      ↓
Constraint Context
      ↓
Candidate Generator
      ↓
Placement Engine
      ↓
Constraint Validator
      ↓
Degradation Engine
      ↓
Scoring Engine
      ↓
Resolved Layout
      ↓
Renderer (DOM)
```

## 2. Module Responsibilities

*   `types.ts`: Core type definitions for specs, constraints, and outputs.
*   `constraints.ts`: Normalizes incoming surface profiles into a calculable geometry context (handling Safe Areas, etc).
*   `candidates.ts`: The generator/placement engine. Iterates over generic visual flows (Vertical, Horizontal) and degradation layers to propose layout arrays.
*   `validator.ts`: Checks physical bounds, overlap collisions, and hard constraints (like tap targets).
*   `scoring.ts`: Ranks valid candidates favoring preserved priority elements and space utilization.
*   `resolver.ts`: The central orchestration pipeline tying generation, validation, and scoring together.
*   `dom-renderer.ts`: The only DOM-aware class, mapping the pure algorithmic output to absolute positioned HTML nodes.

## 3. Data Structures

- **AdSpec**: A declarative array of Elements. Defined once.
- **AdElement**: Contains type, semantic role, priority (1=Critical, 3=Optional), and physical hints.
- **SurfaceProfile**: The physical bounds and UX requirements (e.g. `touchOnly`).
- **ConstraintContext**: Internal math bounds (e.g. `usableArea`).
- **LayoutCandidate**: A proposed array of `ResolvedElement` nodes with an attached strategy identifier.
- **ResolvedLayout**: The winning candidate output, containing exact absolute (x,y,w,h) coordinates.

## 4. Resolution Algorithm
1.  **Normalization**: Calculate `usableArea` by subtracting the `safeArea` insets from the raw surface dimensions.
2.  **Generation**: Spawn candidate strategies (`generateVerticalFlow`, `generateHorizontalFlow`). Each strategy loops over 4 Degradation Levels.
3.  **Placement**: Sort elements logically. Calculate size based on the current Degradation Level and constraints (using text estimation and aspect ratios). Align elements (e.g., center align vertical, column split horizontal).
4.  **Validation**: Reject candidate if there are Overlaps (`checkCollisions`) or out-of-bounds elements.
5.  **Scoring**: Sum priorities of placed elements. Penalize for drops.
6.  **Selection**: Return the highest-scoring candidate.

## 5. Priority Degradation
Driven by `DegradationLevel` inside `candidates.ts`:
- **Level 0**: Ideal. Preferred spacing and sizes.
- **Level 1**: Reduced. Shrink paddings, drop text sizes down to `minTextSize`.
- **Level 2**: Cull Optional. Drop Priority 3 elements (e.g., Logo).
- **Level 3**: Cull Secondary. Drop Priority 2 elements (e.g., Price, CTA) and keep only critical hero elements.

## 6. Collision Detection
Implemented in `collision.ts` via standard AABB (Axis-Aligned Bounding Box) rectangle intersection checks against all visible sibling elements.

## 7. Text Measurement
Provides dynamic reflow awareness. In a pure algorithmic context, `text.ts` uses an average character-width estimation algorithm. A production-grade Canvas `measureText` implementation can easily drop in.

## 8. Renderer Separation
By producing a `ResolvedLayout` of primitive `Rect` coordinates and metadata, the resolver remains headless. The DOM renderer simply reads (x,y) and sets CSS `absolute` positioning.

## 9. Extensibility
- **New Surface**: Simply define a new `SurfaceProfile`. Zero algorithm changes.
- **New Element Type**: Add it to `ElementType`, update `getElementSize` switch cases.
- **New Renderer**: Implement the `LayoutRenderer` interface (e.g., `CanvasRenderer`).
