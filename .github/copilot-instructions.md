# LuxSequencer - AI Agent Instructions

## Important Rules
- **NEVER commit changes automatically**: Always wait for explicit user request to commit
- Only run `git commit` commands when the user explicitly asks to commit changes
- You can prepare changes and show status, but do not execute commits without permission

## Project Overview
Real-time visual pattern generator for VJs and visual artists. React 19 + Vite application with modular renderer system (WebGL), professional MIDI integration, dual sequencers, internationalization, dual-screen support, and state persistence.

**Current Version**: `0.6-beta` (`package.json`), matching the working branch of the same name.
**Tech Stack**: React 19.2.0, Zustand 5.0.8, Immer 10.2.0, TypeScript, Vite 6.2.0, Tailwind CSS, Headless UI 2.2.9

## This repo is part of a five-repo ecosystem

**Read this before assuming anything lives in this repo.** `luxsequencer-core` is a git submodule
of a private workspace repo that spans five projects, unified by an npm workspace:

| Repo | What it holds |
|---|---|
| `luxsequencer-core` | this app — the sequencer, the store, the UI shell |
| `core-renderers` | **all four official renderers**, as external workers |
| `lux-ui` | shared component library (`@luxsequencer/ui`) |
| `luxsequencer-contracts` | shared types (`@luxsequencer/contracts`) |
| `luxsequencer-cloud` | accounts, saved performances, marketplace |

Two consequences that change how you work in this repo:

1. **No renderer is implemented here.** They live in `core-renderers` and run as workers. See
   [Renderer Architecture](../docs/renderers.md).
2. **Dev needs two servers, in order**: `core-renderers` on port 4174 **first**, then this app on
   3000, which proxies it at `/marketplace-core-renderers` (`vite.config.ts`). The shortcut is
   `npm run dev:all`. Port 4174 returning 404 at `/` is intentional — it has no `index.html`.

The workspace-level index (topology, cross-repo decisions, operational traps) is the `CLAUDE.md`
of the parent workspace repo. Do not duplicate its content here.

## Documentation Reference
The project has comprehensive documentation that should be referenced rather than duplicated:

- **[README.md](../README.md)**: Project overview, installation, and setup
- **[Renderer Architecture](../docs/renderers.md)**: **the source of truth for the renderer system**
- **[Environment Variables Guide](../docs/ENVIRONMENT_VARIABLES.md)**: Complete environment configuration system
- **[UI System Guide](../docs/ui-system.md)**: Component architecture, icons, design patterns
- **[Internationalization Guide](../docs/i18n.md)**: i18n system with Rosetta (English/Spanish)
- **[Dual Screen System](../docs/doble-pantalla.md)**: Multi-window display architecture
- **[Testing Guide](../docs/testing.md)**: Test setup and conventions
- **[Recording System Planning](../docs/next-steps/sistema-de-grabacion.md)**: Future recording/video export system

## Architecture

### State Management (Zustand + Immer)
See **[Store Architecture Guide](../docs/store-architecture.md)** for complete documentation of:
- Slice-based architecture and state structure
- Animation system with priority-based control
- Event flows and conflict resolution
- All store slices (project, sequencer, midi, animation, etc.)

### Renderer System

**Full documentation: [docs/renderers.md](../docs/renderers.md).** It is the source of truth and is
kept current; do not restate its contents here. What follows is only what you need to avoid the
most common wrong turn.

**This repo contains no renderer implementations.** The four official renderers (`webgl`,
`concentric`, `dvd-screensaver`, `diagnostic-fps`) live in the `core-renderers` repo and execute
as **web workers**. `src/components/renderers/` holds `index.ts` (the registry), `pipeline/`,
`sdk/`, `shared/` and `types.ts` — and no renderers.

What core keeps for each official renderer is a minimal entry: allowlist, canonical identity,
manifest, and the external worker URL. Consequently:

- `component` is `EmptyExternalRenderer = () => null` for every official entry
  (`src/components/renderers/index.ts:9`, applied at `:246`). **The React component draws
  nothing.** Drawing happens in the worker; the main thread composites the result.
- `controlSchema` is `[]` for every official entry (`:253`). Real controls arrive as declarative
  schemas from `core-renderers`.
- The full `RendererDefinition` contract is in `src/components/renderers/types.ts` — read it
  there. It has eleven fields, and `workerEntry` is the one that matters most.

**Controls are declarative-only.** `RendererControls` renders `DeclarativeControlPanel` and
nothing else; there is no runtime fallback to a legacy React schema. A renderer must **not**
inject React components as controls — that is the explicit policy in
[graphics-pipeline-refactor.md § 11.1](../docs/next-steps/graphics-pipeline-refactor.md). If you find
code handling `type: 'custom'`, it is a leftover, not a pattern to follow.

See **[UI System Guide](../docs/ui-system.md)** for component architecture details.

### MIDI Integration
- **Web MIDI API**: Browser-native MIDI support with auto-connect (configurable via `VITE_MIDI_AUTO_CONNECT`)
- **MIDI Learn**: Visual feedback system - click control icon → move MIDI controller → auto-mapped
- **Pattern triggers**: Hold note 0.5s to create pattern, tap to load pattern
- **Per-project mappings**: Stored in `project.globalSettings.midiMappings`
- **Debug mode**: Enable `VITE_DEBUG_MIDI=true` for message logging
- **Console integration**: Built-in MIDI console for debugging (MidiConsole component)

**Priority system details**: See [Store Architecture Guide](../docs/store-architecture.md#sistema-de-prioridades-de-eventos)

See **[Environment Variables Guide](../docs/ENVIRONMENT_VARIABLES.md)** for MIDI configuration options.

### Interaction Flows

#### Pattern Creation & Loading
1. **Manual save**: Click "Guardar Patrón Actual" → stores current `ControlSettings` as new pattern
2. **MIDI hold**: Hold note 0.5s → auto-creates pattern + assigns MIDI note
3. **MIDI tap**: Tap assigned note → `loadPattern()` with animated transition
4. **Sequencer trigger**: Step sequencer loads pattern on beat with animation

#### Control Priority System
See **[Store Architecture Guide](../docs/store-architecture.md#sistema-de-prioridades-de-eventos)** for complete documentation of priority system, conflict resolution, and animation flows.

### Pattern System
- **Patterns as snapshots**: Complete `ControlSettings` state stored per pattern
- **Animated transitions**: Uses centralized `requestPropertyChange()` system
- **Dirty state tracking**: User edits trigger save prompts
- **MIDI integration**: Pattern creation via note holds, loading via note taps

**Technical details**: See [Store Architecture Guide](../docs/store-architecture.md#flujo-de-eventos-principal) for animation flows and interpolation system.

### Real-Time Rendering Pipeline

The drawing does **not** happen in a React component. Since the worker-only refactor:

```
User Input/MIDI → setCurrentSetting() → Zustand state update
                     ↓
                GraphicsPipelineHost pushes uniforms over postMessage
                     ↓
                RendererWorkerManager → worker (in core-renderers)
                     ↓
                Worker draws and returns an ImageBitmap per frame
                     ↓
                WebGLCompositor paints it on the main thread
```

Files: `src/components/renderers/pipeline/GraphicsPipelineHost.tsx` and
`src/graphics-pipeline/RendererWorkerManager.ts`. Protocol, handshake and frame loop are
documented in [docs/renderers.md § 4](../docs/renderers.md).

**Performance notes**:
- Zustand uses `shallow` equality to prevent unnecessary re-renders
- Gradient arrays converted to flat RGB arrays for shader uniform limits (max 10 colors)
- Uniforms are currently pushed on **every** store change, without a selector
  (`GraphicsPipelineHost.tsx:557-559`). Measured, open investigation:
  [docs/next-steps/pipeline-cadence.md](../docs/next-steps/pipeline-cadence.md)

### Dual Sequencer System
The app has **two independent sequencers** running simultaneously:

#### 1. Pattern Sequencer (`components/sequencer/Sequencer.tsx`)
- **Grid interface**: 2D matrix (rows = patterns, columns = steps)
- **Configurable steps**: 8/12/16/24/32 steps
- **Visual feedback**: Current step highlighted, active cells glow
- **BPM sync**: 30-240 BPM with precise timestamp-based scheduling

#### 2. Property Sequencer (`components/sequencer/PropertySequencer.tsx`) 
- **Per-property automation**: Individual `ControlSettings` keyframes
- **Track lanes**: Visual keyframe indicators per property
- **Linear interpolation**: Automatic value interpolation between keyframes
- **Combined playback**: Overlays on top of pattern changes

**Timing system**: Drift-compensated scheduling via `sequencerStartTime` tracking. See `store/slices/sequencer.slice.ts` for implementation details.

## UI Architecture & Features

### Main Layout (`App.tsx`)
- **Multi-window support**: Primary interface + optional secondary display window
- **Fullscreen mode**: Performance mode with auto-hide overlay (3s mouse idle)
- **Header controls**: Renderer selector, viewport controls, MIDI console, settings
- **Drawer panels**: Control panel and sequencer drawer with toggle states

### Control System
Dynamically generated from renderer `controlSchema`:
- **Collapsible sections**: `CollapsibleSection` component for organization
- **MIDI Learn integration**: Visual indicators on all controls
- **Gradient Editor**: Multi-color gradients with hard stops support
- **Viewport Controls**: Desktop/mobile preview modes

### Internationalization
Built-in i18n system with Rosetta:
- **Languages**: English and Spanish support
- **Hook-based**: `useTranslation()` hook for components
- **Automatic persistence**: Language selection saved to localStorage

Refer to **[UI System Guide](../docs/ui-system.md)** and **[i18n Guide](../docs/i18n.md)** for detailed information.

## Development Workflows

### Running the app
```bash
npm run dev      # Starts Vite dev server on port 3000  
npm run build    # Production build
npm run preview  # Preview production build
```

### Environment Configuration
See **[Environment Variables Guide](../docs/ENVIRONMENT_VARIABLES.md)** for complete configuration options:
- `VITE_DEBUG_MODE`: Enable debug overlay
- `VITE_DEBUG_MIDI`, `VITE_DEBUG_SEQUENCER`: Specific debug categories
- `VITE_MIDI_AUTO_CONNECT`: Auto-connect MIDI devices
- `VITE_MAX_FPS`: Performance limiting

### Adding New Renderers

**Most of this work does not happen in this repo.** A renderer is built in `core-renderers` as a
worker; core only gains an allowlist entry. The step-by-step checklist —including the canonical
key format and the two validation commands— is
[docs/renderers.md § 7](../docs/renderers.md).

Do **not** create a folder under `src/components/renderers/` with a React component that draws.
That was the pre-refactor architecture and it was removed deliberately.

## Key Conventions

### Project Architecture
- **Zustand slices**: State divided into specialized domains (project, sequencer, midi, etc.)
- **TypeScript strict mode**: Full type coverage with interfaces for all data structures
- **Component isolation**: Renderer-specific logic lives in `core-renderers`, not here
- **Shared components**: `src/components/renderers/shared/` holds the cross-renderer UI (today,
  `RendererControls.tsx`). There is no `src/components/shared/`.

### Adding New Features
1. **Control Settings**: Add to `ControlSettings` interface in `types.ts` + store defaults
2. **State management**: Use appropriate slice or create new one if needed
3. **UI integration**: Leverage existing control schema pattern
4. **MIDI support**: Automatic via MIDI Learn system (no code changes needed)

### Commit Messages (Conventional Commits)
- **feat:** New features
- **fix:** Bug fixes
- **docs:** Documentation changes
- **refactor:** Code refactoring
- **perf:** Performance improvements
- **test:** Testing updates
- **chore:** Maintenance tasks

## Critical Implementation Details

### State Management
1. **Never mutate store directly**: Always use actions or `produce()`
2. **Use requestPropertyChange**: All property updates go through centralized animation system
3. **Respect priority system**: ControlSource enum defines animation cancellation rules
4. **Handle dual screen sync**: State changes broadcast to secondary window automatically

**Complete store documentation**: See [Store Architecture Guide](../docs/store-architecture.md) for detailed state management patterns, animation system, and event flows.

### Performance & Rendering  
5. **WebGL shader limits**: 10 colors max per gradient (uniform array size)
6. **Animation frame coordination**: Multiple RAF loops need cleanup on unmount
7. **localStorage limits**: Use JSON import/export for large projects
8. **Renderer switching**: Handle missing settings gracefully when switching renderers

### MIDI & Timing
9. **MIDI note timing**: Pattern creation requires 0.5s hold detection
10. **Sequencer precision**: Timestamp-based scheduling prevents drift
11. **BPM calculations**: Steps to frames conversion based on current BPM
12. **Auto-connect**: `VITE_MIDI_AUTO_CONNECT` controls device connection behavior

## External Dependencies
- **zustand** (5.0.8): State management with shallow equality checks
- **immer** (10.2.0): Immutable state updates via `produce()` helper  
- **react** (19.2.0): UI framework with concurrent features
- **use-sync-external-store** (1.6.0): Zustand React 19 compatibility
- **@headlessui/react** (2.2.9): Accessible UI components
- **rosetta** (1.1.0): Lightweight i18n system
- **tailwindcss**: Utility-first CSS (configured via PostCSS)
- **vite** (6.2.0): Build tool with React and SVGR plugins
- **Web APIs**: MIDI API, WebGL 2.0, BroadcastChannel (dual screen)

## Debugging & Development

### Debug System  
- **Environment variables**: Fine-grained debug categories (see [Environment Variables Guide](../docs/ENVIRONMENT_VARIABLES.md))
- **Debug overlay**: Real-time metrics (FPS, sequencer state, animation count)
- **MIDI console**: Built-in MIDI message inspector
- **Console logging**: Category-specific debug output

### Common Debug Scenarios
- **MIDI issues**: Enable `VITE_DEBUG_MIDI=true`
- **Sequencer timing**: Enable `VITE_DEBUG_SEQUENCER=true`  
- **Animation glitches**: Enable `VITE_DEBUG_ANIMATION=true`
- **Property automation**: Enable `VITE_DEBUG_PROPERTY_SEQUENCER=true`

### Development Tools
- **Hot reload**: Vite provides instant updates
- **TypeScript strict**: Full type checking enabled
- **Browser dev tools**: State inspection via Zustand dev tools

## Project Files & Architecture
- `default-project.json`: Default configuration loaded on first run
- `metadata.json`: Project metadata (version, description)
- `src/config.ts`: Environment variable configuration system
- `vite.config.ts`: Build configuration with React and SVGR plugins
- Documentation in `docs/` directory (see reference links above)

**Future systems**:
- Recording system architecture planned in `docs/next-steps/sistema-de-grabacion.md`
- `src/store/slices/recording.slice.ts` exists and is **0 bytes**. There is no `RecordingPanel.tsx`
  anywhere in the repo — the placeholder was removed, the slice was not.
