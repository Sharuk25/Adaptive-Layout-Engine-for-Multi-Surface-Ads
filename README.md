# Flam Adaptive Layout Engine

## Overview
This project implements a genuine constraint-based layout engine for multi-surface ads in strict TypeScript, independent of any UI framework or the DOM.

The engine accepts a single declarative Ad Specification and dynamically resolves it against various constrained Surface Profiles (width, height, safe areas).

## Features
- **Algorithmic Resolution**: Generates candidates using generic geometry-driven strategies (Horizontal Flow, Vertical Flow) rather than hardcoded surface checks.
- **Priority-aware Degradation**: Preserves P1 elements, gracefully shrinks sizes, and selectively drops lower priority items (P3, then P2) when mathematically constrained.
- **Strict Separation**: The resolver (`src/engine/resolver.ts`) has zero dependency on the DOM. The `DomRenderer` is completely decoupled.
- **Collision & Validation**: Enforces zero overlaps, minimum tap targets, and bounds checking.
- **Custom Surface Tester**: Test completely arbitrary constraints dynamically.

## Setup
```bash
npm install
npm run dev
```

## Production Build
```bash
npm run build
npm run preview
```

## Architecture
See `ARCHITECTURE.md` for a deep dive into the algorithmic resolution pipeline and the TypeScript type structures.

## Why Not CSS Breakpoints?
CSS media queries rely on static predefined breakpoints, fundamentally coupling layout logic to specific viewport sizes. This engine determines layout, position, sizing, typography, and degradation algorithmically, enabling true constraint-solving independent of predefined breakpoints. This means the exact same engine handles a mobile phone, a square kiosk, a broadcast banner, and an arbitrarily resized iframe without requiring a developer to write a single new CSS rule.

## Disclaimer & Limitations
- **Text Measurement**: For demonstration, text measurement uses a mathematical heuristic rather than full canvas bounds detection, though the architecture supports swapping in a DOM or Canvas-based measurer.
- **Algorithm Trade-off**: Uses a greedy candidate-scoring system rather than a full Linear Programming constraint solver to ensure real-time O(N) performance on client devices while satisfying assignment requirements.

