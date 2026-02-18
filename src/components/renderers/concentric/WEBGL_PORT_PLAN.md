# Concentric Renderer - WebGL Port Plan

## Goals
- Replace Canvas 2D drawing with a WebGL implementation.
- Preserve current visual features:
  - Per-ring configuration snapshots
  - Per-ring rotation speed
  - Per-ring gradient colors
  - Fill / stroke modes
- Improve fullscreen performance and reduce frame drops.

## Scope
- New renderer implementation using WebGL (likely WebGL2).
- Keep current UI controls and settings schema unchanged.

## Non-Goals
- New UI controls or renderer features.
- Changes to store slices or settings format.

## Baseline (Current)
- File: src/components/renderers/concentric/ConcentricRenderer.tsx
- Rendering: Canvas 2D
- Ring lifecycle: creation snapshot + growth + removal

## Proposed WebGL Architecture
### High-Level Strategy
- Represent each ring as a polygon (triangle fan) or an SDF (signed distance field) in fragment shader.
- For performance and flexibility, use instancing with per-ring attributes.
- Maintain ring snapshots on CPU; upload to GPU each frame (or on change).

### Data Model (Per Ring)
- creationTime
- initialSize
- growthSpeed
- sides
- rotationSpeed
- strokeWidth
- fillMode
- gradientColors (packed to a fixed-size array)

### Rendering Options
1) **Geometry-based (triangle fan per ring)**
   - Pros: accurate polygons, easy fill/stroke
   - Cons: more vertices, rebuild on sides change

2) **Shader-based SDF**
   - Pros: very fast, minimal geometry (quad)
   - Cons: complex math for polygon SDF and stroke

Suggested: start with geometry-based, then evaluate SDF if needed.

## Step-by-Step Implementation Plan

### Step 1 - Add WebGL Canvas Scaffold
**Goal**: Render a blank WebGL canvas with proper sizing and lifecycle.
- Create ConcentricWebGLRenderer.tsx in the same folder.
- Initialize WebGL2 context, handle resize, and clear to background.
- Keep the current renderer as default and add a temporary feature flag.

**Testable Result**:
- Fullscreen canvas clears to background color and resizes properly.

### Step 2 - Shader Setup (Solid Color)
**Goal**: Render a single polygon with a solid color.
- Add simple vertex/fragment shaders.
- Implement a single polygon (e.g., hexagon) at center.

**Testable Result**:
- A static polygon renders at center with a solid color.

### Step 3 - Instanced Rendering
**Goal**: Render multiple rings using instancing.
- Define per-instance attributes: size, rotation, sides, color.
- Render multiple rings in one draw call.

**Testable Result**:
- Multiple static rings appear, each with unique size/color.

### Step 4 - Ring Lifecycle and Animation
**Goal**: Animate growth and rotation per ring.
- Maintain CPU ring list with creationTime + snapshot.
- Update per-instance buffer each frame.
- Remove rings when they exceed bounds.

**Testable Result**:
- Rings spawn at set rate, grow outward, and get removed.

### Step 5 - Gradient Colors
**Goal**: Apply gradient along ring size.
- Pack gradient colors into a fixed array (e.g., max 10 colors).
- Compute gradient color in fragment shader based on normalized size.

**Testable Result**:
- Rings smoothly interpolate through gradient colors.

### Step 6 - Fill / Stroke Modes
**Goal**: Support fill, stroke, and both.
- Implement stroke by rendering an inner polygon or in fragment shader.
- Toggle fill/stroke based on per-ring mode.

**Testable Result**:
- Fill, stroke, and both modes behave like current renderer.

## Risks / Considerations
- Gradient hard stops require careful shader handling.
- Instancing attribute updates can be a bottleneck if not optimized.
- WebGL state leaks across renders if not cleaned correctly.

## Open Questions
- WebGL2 availability requirements?
- Maximum gradient colors needed (current limit is 10).
- Should we support multi-pass rendering for strokes?

## Implementation Checklist
- [x] Step 1 - WebGL scaffold and resize
- [x] Step 2 - Single polygon
- [x] Step 3 - Instanced rings
- [x] Step 4 - Lifecycle animation
- [x] Step 5 - Gradient colors (calculated per-frame in CPU)
- [x] Step 6 - Fill / stroke (stroke uses line loop; line width support depends on GPU)
