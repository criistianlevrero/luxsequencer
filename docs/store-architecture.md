# Store Architecture - LuxSequencer

## Overview
LuxSequencer utiliza **Zustand** como gestor de estado global con una arquitectura modular basada en slices. El store centraliza toda la lógica de la aplicación incluyendo gestión de proyectos, secuenciadores, MIDI, animaciones y pantalla dual.

## Tecnologías Clave
- **Zustand**: State manager con `createWithEqualityFn` y `shallow` equality
- **Immer**: Actualizaciones inmutables con `produce()`
- **LocalStorage**: Persistencia automática de proyectos
- **BroadcastChannel**: Sincronización entre ventanas (sistema dual screen)

## Modelo de Datos Principal

### Jerarquía del Proyecto
```
Project
├── globalSettings (MIDIMappings, BPM, renderer, etc.)
└── sequences[]
    └── Sequence
        ├── interpolationSpeed (0-8 steps, soporta decimales)
        ├── activeRenderer (string)
        ├── activePatterns[] (Pattern[] - patrones del renderer activo)
        ├── rendererPatterns (cache por renderer)
        │   └── [rendererId]: Pattern[]
        └── rendererSequencerStates (estado del sequencer por renderer)
            └── [rendererId]: SequencerSettings
                ├── steps[] (Pattern IDs por step)
                ├── propertyTracks[] (automatización por propiedad)
                └── configuración (BPM, numSteps)
```

### Estados Centrales
```typescript
interface State {
    // Datos del proyecto
    project: Project | null;
    activeSequenceIndex: number;
    currentSettings: ControlSettings;
    
    // Estado de patrones
    isPatternDirty: boolean;
    selectedPatternId: string | null;
    learningPatternMidiNote: string | null;
    
    // Secuenciadores
    sequencerCurrentStep: number;
    sequencerStartTime: number | null;
    propertySequencerRafId: number | null;
    
    // Sistema de animación
    activeAnimations: Map<keyof ControlSettings, ActiveAnimation>;
    textureRotation: number;
    
    // MIDI
    midi: MidiState;
    midiLog: MidiLogEntry[];
    
    // UI & Internacionalización
    viewportMode: 'horizontal' | 'vertical';
    currentLocale: LocaleCode;
    
    // Sistema dual screen
    dualScreen: DualScreenState;
}
```

## Arquitectura de Slices

### 1. Project Slice (`project.slice.ts`)
**Responsabilidad**: Gestión del proyecto, secuencias, patrones y persistencia

**Acciones principales**:
- `initializeProject()`: Carga proyecto + migración de versiones + loop de rotación
- `setProject()`: Actualización + auto-save a localStorage
- `savePattern()`: Guarda `currentSettings` como nuevo patrón
- `loadPattern()`: Carga patrón con transición animada
- `changeRenderer()`: Cambia renderer activo, preserva patrones y estado

**Flujo de persistencia**:
```
setProject() → localStorage.setItem() → Auto-save automático
```

### Sistema Híbrido de Patrones por Renderer
**Arquitectura**: Cada secuencia mantiene patrones separados por renderer con cache inteligente

**Componentes clave**:
- `activePatterns[]`: Patrones del renderer actualmente activo
- `rendererPatterns{}`: Cache de patrones por renderer ID
- `rendererSequencerStates{}`: Estado del sequencer por renderer
- `activeRenderer`: Renderer actualmente seleccionado

**Flujo de cambio de renderer**:
```
changeRenderer(newId) → Cache patrones actuales → Cargar patrones cached → 
Actualizar activePatterns → Resetear sequencer state → Auto-save
```

**Ventajas**:
- Patrones preservados al cambiar renderer
- Estado del sequencer independiente por renderer
- Performance óptima (activePatterns pre-filtrado)
- Migración automática desde versiones anteriores

### 2. Animation Slice (`animation.slice.ts`)
**Responsabilidad**: Sistema centralizado de animaciones con prioridades

**Función clave**: `requestPropertyChange(property, from, to, steps, source, interpolationType)`

**Sistema de prioridades** (enum `ControlSource`):
```
MIDI (3)               → Prioridad máxima, cancelación inmediata
UI (2)                 → Interacciones del usuario
PropertySequencer (1)  → Automatización por keyframes
PatternSequencer (0)   → Prioridad mínima
```

**Flujo de animación**:
1. Verificar animación existente
2. Comparar prioridades (`source < existingAnimation.source` → ignorar)
3. Cancelar animación de menor prioridad
4. Crear nueva animación o cambio inmediato (`steps = 0`)
5. Interpolar valores frame por frame

### 3. Sequencer Slice (`sequencer.slice.ts`)
**Responsabilidad**: Dos secuenciadores independientes con sincronización temporal

#### Pattern Sequencer
- **Grid 2D**: filas = patrones, columnas = pasos
- **Configuración**: 8/12/16/24/32 pasos, 30-240 BPM
- **Timing preciso**: `sequencerStartTime` + compensación de drift
- **Loop continuo**: `_tickSequencer()` con setTimeout recursivo

#### Property Sequencer 
- **Tracks por propiedad**: Automatización independiente por `ControlSettings`
- **Keyframes**: Interpolación linear entre puntos clave
- **RAF loop**: `_updatePropertySequencer()` con requestAnimationFrame
- **Overlay**: Se combina con Pattern Sequencer

**Flujo temporal**:
```
Date.now() → stepDuration (BPM) → setTimeout → nextStep → loadPattern()
```

### 4. MIDI Slice (`midi.slice.ts`)
**Responsabilidad**: Web MIDI API + MIDI Learn + mappings

**Características**:
- **Auto-connect**: Configurable vía `VITE_MIDI_AUTO_CONNECT`
- **MIDI Learn visual**: Click en control → mover MIDI controller → auto-mapping
- **Pattern triggers**: Hold 0.5s = crear patrón, Tap = cargar patrón
- **Priority override**: MIDI puede cancelar cualquier animación
- **Per-project mappings**: Almacenados en `project.globalSettings.midiMappings`

**Flujo MIDI Learn**:
```
startMidiLearning(controlId) → _handleMidiMessage() → assignMidiMapping() → Update project
```

### 5. Dual Screen Slice (`dualScreen.slice.ts`)
**Responsabilidad**: Sistema multi-ventana con sincronización de estado

**Arquitectura**:
- **BroadcastChannel**: Comunicación entre ventanas principales/secundarias
- **State sync**: Cambios de `currentSettings` y `project` se sincronizan automáticamente
- **Window management**: Apertura/cierre de ventana secundaria
- **Middleware**: Auto-broadcast en cambios de estado

**Flujo de sincronización**:
```
Primary Window: State change → broadcastStateUpdate() → BroadcastChannel
Secondary Window: channel.onmessage → Apply state update (sin re-broadcast)
```

### 6. UI Slice (`ui.slice.ts`)
**Responsabilidad**: Estado de interfaz y configuración de idioma

**Características**:
- **Viewport modes**: Horizontal/vertical preview
- **i18n**: Persistencia de idioma en localStorage
- **Auto-detection**: Fallback a idioma del navegador

### 7. Settings Slice (`settings.slice.ts`)
**Responsabilidad**: Configuraciones globales de la aplicación

## Sistema de Prioridades de Eventos

### Control Sources (Prioridad descendente)
```
ControlSource.MIDI (3)              → Inmediato, cancela todo
ControlSource.UI (2)                → Interacción usuario
ControlSource.PropertySequencer (1) → Automatización keyframes
ControlSource.PatternSequencer (0)  → Cambios de patrón
```

### Flujo de Resolución de Conflictos
1. **Request nuevo**: `requestPropertyChange()` con `source`
2. **Check existente**: ¿Hay animación activa para esa propiedad?
3. **Comparar prioridad**: `if (newSource < existingSource) return` (ignorar)
4. **Cancelar inferior**: Eliminar animación de menor prioridad
5. **Aplicar nuevo**: Crear animación o cambio inmediato

### Casos de Uso Típicos
- **MIDI override**: Usuario mueve fader MIDI → cancela automatización del sequencer
- **UI interrupt**: Click en slider → cancela keyframe automation pero respeta MIDI
- **Pattern loading**: Secuenciador carga patrón solo si no hay controles activos

## Flujo de Eventos Principal

### 1. Inicialización de la Aplicación
```
App start → useTextureStore() → initializeProject() → 
Load from localStorage → Migration check → Start animation loops
```

### 2. Cambio de Configuración Manual
```
User interaction → SliderInput → requestPropertyChange(source: UI) →
Animation system → Interpolation → currentSettings update → Renderer re-render
```

### 3. MIDI Input Flow
```
MIDI message → _handleMidiMessage() → Check mapping → 
requestPropertyChange(source: MIDI) → Immediate application → Cancel other animations
```

### 4. Secuenciador Flow
```
_tickSequencer() → Calculate next step → Check pattern assignment →
loadPattern() → requestPropertyChange(source: PatternSequencer) → Animation
```

### 5. Pattern Management Flow
```
savePattern() → Snapshot currentSettings → Add to sequence.activePatterns[] → setProject()
loadPattern() → Compare with current → requestPropertyChange() → Animated transition
```

## Persistencia y Sincronización

### LocalStorage Strategy
- **Auto-save**: Cada `setProject()` guarda en localStorage
- **Migration system**: Versioning con backward compatibility
- **Error handling**: Fallback a proyecto por defecto si falla

### Dual Screen Sync
- **Selective sync**: Solo `currentSettings` y `project` se sincronizan
- **Loop prevention**: Source tracking para evitar broadcast loops
- **Window lifecycle**: Cleanup automático al cerrar ventanas

### MIDI Persistence
- **Per-project**: Mappings guardados en `project.globalSettings.midiMappings`
- **Device agnostic**: Mappings por control ID, no por device ID
- **Auto-restore**: Re-conexión automática de devices disponibles

## Debugging y Monitoreo

### Debug System
Variables de entorno para logging específico:
- `VITE_DEBUG_ANIMATION=true`: Log de sistema de animaciones
- `VITE_DEBUG_SEQUENCER=true`: Timing y steps del sequencer
- `VITE_DEBUG_MIDI=true`: Mensajes MIDI raw
- `VITE_DEBUG_PROPERTY_SEQUENCER=true`: Property sequencer keyframes

### Performance Monitoring
- **Animation count**: `activeAnimations.size` en debug overlay
- **RAF management**: Cleanup automático de loops activos
- **Memory leaks prevention**: Proper cleanup de timeouts y eventListeners

## Best Practices para Desarrollo

### 1. Añadir Nueva Propiedad
```typescript
// 1. Añadir a ControlSettings interface
interface ControlSettings {
    newProperty: number;
}

// 2. Añadir default en store initial state
const initialState = {
    currentSettings: {
        newProperty: 0.5,
    }
}

// 3. Añadir config en helpers.ts si necesario
export const controlConfigs = {
    newProperty: { min: 0, max: 1 }
}
```

### 2. Implementar Nueva Animación
```typescript
// Usar siempre requestPropertyChange
get().requestPropertyChange(
    'propertyName',
    fromValue,
    toValue,
    steps,              // 0 = inmediato, >0 = animado
    ControlSource.UI,   // Definir prioridad apropiada
    'linear'           // Tipo de interpolación
);
```

### 3. Gestión de Estado Inmutable
```typescript
// SIEMPRE usar produce() para updates complejos
const newProject = produce(project, draft => {
    draft.sequences[index].name = newName;
});
get().setProject(newProject);
```

### 4. MIDI Integration
```typescript
// No mapear manualmente - usar MIDI Learn
// Sistema automático maneja mappings
startMidiLearning('controlId');
// Usuario mueve control MIDI → auto-mapping
```

## Limitaciones Técnicas

### Performance Limits
- **10 colores max**: Gradients limitados por uniform arrays en WebGL
- **Animation Map size**: Máximo recomendado ~50 animaciones simultáneas  
- **localStorage size**: ~5MB típico, usar import/export para proyectos grandes

### Browser Compatibility
- **Web MIDI API**: Solo Chrome/Edge, fallback graceful
- **BroadcastChannel**: Soporte amplio, fallback a localStorage events
- **RequestAnimationFrame**: Universal, 60fps típico

### Concurrency Considerations
- **Single-threaded**: JavaScript main thread, evitar operaciones pesadas
- **RAF coordination**: Múltiples loops necesitan cleanup coordinado
- **State mutations**: Race conditions prevenidas por Zustand
