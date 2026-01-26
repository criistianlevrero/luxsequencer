# LuxSequencer - AI Agent Instructions

## Important Rules
- **NEVER commit changes automatically**: Always wait for explicit user request to commit
- Only run `git commit` commands when the user explicitly asks to commit changes
- You can prepare changes and show status, but do not execute commits without permission

## Project Overview
Real-time visual pattern generator for VJs and visual artists. React 19 + Vite application with modular renderer system (WebGL), professional MIDI integration, dual sequencers, internationalization, dual-screen support, and state persistence.

**Current Version**: Development (package.json shows v0.0.0)
**Tech Stack**: React 19.2.0, Zustand 5.0.8, Immer 10.2.0, TypeScript, Vite 6.2.0, Tailwind CSS, Headless UI 2.2.9

## Documentation Reference
The project has comprehensive documentation that should be referenced rather than duplicated:

- **[README.md](README.md)**: Project overview, installation, and setup
- **[Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md)**: Complete environment configuration system
- **[UI System Guide](docs/ui-system.md)**: Component architecture, icons, design patterns
- **[Internationalization Guide](docs/i18n.md)**: i18n system with Rosetta (English/Spanish)
- **[Dual Screen System](docs/doble-pantalla.md)**: Multi-window display architecture
- **[Recording System Planning](docs/next-steps/sistema-de-grabacion.md)**: Future recording/video export system

## Architecture

### State Management (Zustand + Immer)
See **[Store Architecture Guide](docs/store-architecture.md)** for complete documentation of:
- Slice-based architecture and state structure
- Animation system with priority-based control
- Event flows and conflict resolution
- All store slices (project, sequencer, midi, animation, etc.)

### Renderer Plugin System
Renderers are **completely independent modules** registered in `components/renderers/index.ts`:

```typescript
export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  controlSchema: ControlSection[];
}
```

**Available renderers** (src/components/renderers/):
- `webgl/`: WebGL shader-based scale texture (primary renderer)
- `concentric/`: Hexagonal concentric patterns

**Control Schema Pattern**: Each renderer defines controls via `ControlSection[]` arrays. The system supports:
- `type: 'slider'`: Declarative sliders with min/max/formatter
- `type: 'custom'`: React components (e.g., `GradientEditor`)

See **[UI System Guide](docs/ui-system.md)** for complete component architecture details.

### MIDI Integration
- **Web MIDI API**: Browser-native MIDI support with auto-connect (configurable via `VITE_MIDI_AUTO_CONNECT`)
- **MIDI Learn**: Visual feedback system - click control icon → move MIDI controller → auto-mapped
- **Pattern triggers**: Hold note 0.5s to create pattern, tap to load pattern
- **Per-project mappings**: Stored in `project.globalSettings.midiMappings`
- **Debug mode**: Enable `VITE_DEBUG_MIDI=true` for message logging
- **Console integration**: Built-in MIDI console for debugging (MidiConsole component)

**Priority system details**: See [Store Architecture Guide](docs/store-architecture.md#sistema-de-prioridades-de-eventos)

See **[Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md)** for MIDI configuration options.

### Interaction Flows

#### Pattern Creation & Loading
1. **Manual save**: Click "Guardar Patrón Actual" → stores current `ControlSettings` as new pattern
2. **MIDI hold**: Hold note 0.5s → auto-creates pattern + assigns MIDI note
3. **MIDI tap**: Tap assigned note → `loadPattern()` with animated transition
4. **Sequencer trigger**: Step sequencer loads pattern on beat with animation

#### Control Priority System
See **[Store Architecture Guide](docs/store-architecture.md#sistema-de-prioridades-de-eventos)** for complete documentation of priority system, conflict resolution, and animation flows.

### Pattern System
- **Patterns as snapshots**: Complete `ControlSettings` state stored per pattern
- **Animated transitions**: Uses centralized `requestPropertyChange()` system
- **Dirty state tracking**: User edits trigger save prompts
- **MIDI integration**: Pattern creation via note holds, loading via note taps

**Technical details**: See [Store Architecture Guide](docs/store-architecture.md#flujo-de-eventos-principal) for animation flows and interpolation system.

### Real-Time Rendering Pipeline
```
User Input/MIDI → setCurrentSetting() → Zustand state update
                     ↓
                useTextureStore subscription triggers re-render
                     ↓
                Renderer component reads currentSettings
                     ↓
                WebGL: Upload uniforms → Fragment shader execution
                     ↓
                RequestAnimationFrame continues animation loop
```

**Performance notes**:
- Zustand uses `shallow` equality to prevent unnecessary re-renders
- WebGL shaders update uniforms each frame without DOM manipulation
- Gradient arrays converted to flat RGB arrays for shader uniform limits (max 10 colors)
- Texture rotation runs in independent RAF loop from `initializeProject()`

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

Refer to **[UI System Guide](docs/ui-system.md)** and **[i18n Guide](docs/i18n.md)** for detailed information.

## Development Workflows

### Running the app
```bash
npm run dev      # Starts Vite dev server on port 3000  
npm run build    # Production build
npm run preview  # Preview production build
```

### Environment Configuration
See **[Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md)** for complete configuration options:
- `VITE_DEBUG_MODE`: Enable debug overlay
- `VITE_DEBUG_MIDI`, `VITE_DEBUG_SEQUENCER`: Specific debug categories
- `VITE_MIDI_AUTO_CONNECT`: Auto-connect MIDI devices
- `VITE_MAX_FPS`: Performance limiting

### Adding New Renderers
1. Create folder in `components/renderers/yourname/`
2. Implement component with `useTextureStore` subscription
3. Define `controlSchema: ControlSection[]` 
4. Export `RendererDefinition`
5. Register in `components/renderers/index.ts`

**Example schema**:
```typescript
export const yourSchema: ControlSection[] = [
  {
    title: "Section Title",
    defaultOpen: true,
    controls: [
      { type: 'slider', id: 'property', label: 'Label', min: 0, max: 100 },
      { type: 'custom', id: 'customId', component: YourComponent }
    ]
  }
];
```

## Key Conventions

### Project Architecture
- **Zustand slices**: State divided into specialized domains (project, sequencer, midi, etc.)
- **TypeScript strict mode**: Full type coverage with interfaces for all data structures
- **Component isolation**: Renderer-specific logic stays within renderer directories
- **Shared components**: Cross-renderer UI components in `components/shared/`

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

**Complete store documentation**: See [Store Architecture Guide](docs/store-architecture.md) for detailed state management patterns, animation system, and event flows.

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
- **Environment variables**: Fine-grained debug categories (see [Environment Variables Guide](docs/ENVIRONMENT_VARIABLES.md))
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

**Future systems** (placeholder implementations):
- Recording system architecture planned in `docs/next-steps/sistema-de-grabacion.md`
- Empty `RecordingPanel.tsx` and `recording.slice.ts` await implementation
