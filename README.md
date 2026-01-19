# LuxSequencer

Sistema generativo de visualización en tiempo real desarrollado como aplicación web, diseñado específicamente para la creación de patrones visuales dinámicos destinados a performances audiovisuales, instalaciones artísticas y proyección en vivo.

## Descripción Técnica

LuxSequencer implementa un sistema de renderizado modular basado en React 19 que permite la generación procedural de texturas animadas mediante diferentes motores de renderizado. La aplicación utiliza WebGL para computación en paralelo, ofreciendo un pipeline de renderizado eficiente optimizado para visualización continua en tiempo real.

### Arquitectura de Renderizado

El sistema cuenta con dos motores de renderizado independientes:

#### WebGL Renderer (Primario)
- **Tecnología**: Fragment shaders personalizados ejecutados en GPU
- **Patrones**: Texturas de escamas procedurales con formas morfables (círculo → diamante → estrella)
- **Gradientes**: Sistema de gradientes multicolor (hasta 10 colores) con soporte para hard stops
- **Animación**: Rotación de textura continua y desplazamiento temporal de colores
- **Transiciones**: Crossfade entre gradientes mediante uniforms de shader durante cambios de patrón
- **Rendimiento**: Optimizado para 60 FPS mediante cálculos paralelos en GPU

#### Concentric Renderer
- **Patrón**: Hexágonos concéntricos animados
- **Algoritmo**: Generación procedural de patrones radiales con crecimiento temporal
- **Configuración**: Parámetros independientes para velocidad de repetición y crecimiento

### Sistema de Control de Patrones

#### Persistencia de Estado
Cada patrón almacena un snapshot completo del estado de configuración (`ControlSettings`), incluyendo:
- Parámetros de escala y espaciado
- Configuración de gradientes (foreground/background)
- Velocidades de animación y direcciones
- Configuración de bordes y morfing de formas

#### Sistema de Animación Centralizado
Implementa un pipeline de animación basado en prioridades:

```
ControlSource Priority:
- MIDI (3): Control hardware externo, prioridad máxima
- UI (2): Interacciones de usuario directo
- PropertySequencer (1): Automatización por keyframes
- PatternSequencer (0): Secuenciación de patrones base
```

Las animaciones utilizan interpolación temporal precisa basada en BPM, con cancelación automática de animaciones de menor prioridad.

### Integración MIDI

#### Implementación Técnica
- **API**: Web MIDI API nativa (sin dependencias externas)
- **Protocolo**: MIDI estándar sobre USB/Bluetooth
- **Latencia**: Sub-16ms para respuesta táctil inmediata
- **Mapeo**: Sistema de aprendizaje automático por captura de CC/Note messages

#### Funcionalidades Avanzadas
- **Pattern Creation**: Mantener nota >500ms crea patrón automáticamente
- **Pattern Loading**: Tap de nota asignada dispara transición animada
- **MIDI Learn**: Feedback visual durante asignación de controles
- **Per-Project Storage**: Mapeos MIDI persistentes por proyecto

### Secuenciadores Duales

#### Pattern Sequencer
Sistema matricial para secuenciación de patrones completos:
- **Grid Interface**: Matriz 2D (patrones × steps)
- **Step Counts**: Configurable entre 8, 12, 16, 24, 32 steps
- **BPM Sync**: Timing preciso con compensación de drift temporal
- **Visual Feedback**: Indicadores en tiempo real del step activo

#### Property Sequencer  
Automatización granular de propiedades individuales:
- **Keyframe System**: Puntos de control por propiedad y step
- **Linear Interpolation**: Interpolación suave entre valores
- **Track Visualization**: Representación gráfica de automatizaciones
- **Wrap-around Logic**: Continuidad cíclica en secuencias

### Sistema Dual Screen

#### Arquitectura de Comunicación
- **Protocolo**: BroadcastChannel API para IPC (Inter-Process Communication)
- **Sincronización**: Tiempo real sin polling mediante eventos nativos
- **Ventanas**: Principal (controles) + Secundaria (visualización pura)
- **Estado Compartido**: Sincronización automática de configuraciones y transiciones

#### Flujo de Datos
```
Primary Window → State Change → BroadcastChannel → Secondary Window
Secondary Window → Automatic Renderer Update → Visual Output
```

La ventana secundaria opera en modo fullscreen con cursor auto-hide para proyección profesional.

### Gestión de Estado y Persistencia

#### Store Management
- **Tecnología**: Zustand + Immer para gestión de estado inmutable
- **Arquitectura**: Slice-based con separación de dominios (project, sequencer, midi, ui, animation, dualScreen)
- **Persistencia**: Auto-save a localStorage con detección de cambios
- **Migración**: Sistema de versionado para compatibilidad entre actualizaciones

#### Internacionalización
- **Sistema**: Rosetta para traducciones eficientes
- **Idiomas**: Español (nativo) e Inglés
- **Cobertura**: 100% de strings UI, mensajes de error, tooltips
- **Performance**: Lookup O(1) sin impacto en rendering

### Stack Tecnológico

#### Frontend Framework
- **React 19.2.0**: UI framework con concurrent features
- **TypeScript**: Strict mode para type safety completo
- **Zustand 5.0.8**: State management con shallow equality
- **Immer 10.2.0**: Immutable state updates

#### Build & Development
- **Vite 6.2.0**: Build tool optimizado con HMR
- **PostCSS**: CSS processing pipeline
- **Tailwind CSS**: Utility-first styling
- **SVGR**: SVG-to-React component conversion

#### UI Components
- **Headless UI 2.2.9**: Accessible component primitives
- **Custom Components**: Sistema de componentes modular reutilizable
- **Icons**: SVG icon system con componentes tipados

#### Web APIs Utilizadas
- **WebGL 2.0**: GPU-accelerated graphics rendering
- **Web MIDI API**: Native MIDI device communication  
- **BroadcastChannel**: Inter-window communication
- **RequestAnimationFrame**: Smooth 60fps animation loops
- **ResizeObserver**: Responsive canvas resizing

## Instalación y Configuración

### Requisitos del Sistema
- **Node.js**: v18.0+ (recomendado v20+)
- **Navegador**: Chrome 88+, Firefox 85+, Safari 14+ (soporte WebGL 2.0 requerido)
- **MIDI** (opcional): Dispositivo MIDI compatible con Web MIDI API

### Instalación Básica

```bash
# Clonar repositorio
git clone https://github.com/criistianlevrero/luxsequencer.git
cd luxsequencer

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Aplicación disponible en http://localhost:3000
```

### Variables de Entorno

El sistema utiliza variables de entorno opcionales con prefijo `VITE_`:

```bash
# Archivo .env.example (copiar a .env)
VITE_DEBUG_MODE=false                    # Overlay de debug
VITE_DEBUG_MIDI=false                    # Logs MIDI
VITE_DEBUG_SEQUENCER=false               # Logs sequencer
VITE_DEBUG_ANIMATION=false               # Logs animación
VITE_DEBUG_PROPERTY_SEQUENCER=false      # Logs property automation
VITE_MIDI_AUTO_CONNECT=true              # Auto-conectar MIDI
VITE_MAX_FPS=60                          # Límite de FPS
```

Para configuración avanzada, consultar: [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md)

### Scripts de Build

```bash
npm run dev      # Desarrollo (Vite dev server)
npm run build    # Build producción (dist/)
npm run preview  # Preview build local
```

## Uso del Sistema

### Interfaz Principal

#### Selección de Renderer
El dropdown del header permite cambiar entre motores de renderizado:
- **WebGL Scale**: Texturas procedurales de escamas (recomendado)
- **Concentric Hexagons**: Patrones hexagonales radiales

#### Panel de Control
Interface dinámica generada desde el `controlSchema` del renderer activo:
- **Secciones colapsibles**: Organización por categorías (Scale, Animation, Appearance, Background, Border)
- **Controles MIDI Learn**: Icono 🎹 para mapeo rápido de hardware
- **Gradientes**: Editor multi-color con hard stops y reorganización drag-and-drop
- **Viewport Preview**: Simulación desktop/mobile para testing

### Sistema de Patrones

#### Creación de Patrones
- **Manual**: Botón "Guardar Patrón Actual" → snapshot del estado completo
- **MIDI**: Hold nota >0.5s → auto-creación + asignación MIDI automática

#### Carga de Patrones
- **Interface**: Click en nombre del patrón → transición animada
- **MIDI**: Tap en nota asignada → trigger inmediato
- **Prioridad**: Las cargas manuales/MIDI pueden cancelar animaciones de sequencer

#### Gestión de Transiciones
- **Interpolation Speed**: Control global de duración (0-8 steps)
- **Animate Only Changes**: Solo propiedades modificadas se animan
- **WebGL Crossfade**: Transiciones shader-based para gradientes suaves

### Secuenciadores

#### Pattern Sequencer
1. **Configuración Steps**: Selector 8/12/16/24/32 pasos
2. **Asignación**: Click en celdas grid para toggle pattern-to-step
3. **Timing**: BPM control (30-240) con timestamp-based precision
4. **Transport**: Play/Stop controls con sincronización visual

#### Property Sequencer  
1. **Agregar Track**: Selector de propiedades por renderer activo
2. **Keyframes**: Click en steps para crear/editar puntos de control
3. **Valores**: Ajuste numérico directo o drag para modificación
4. **Automación**: Interpolación linear con wrap-around cíclico

### Integración MIDI

#### Configuración Inicial
1. **Conectar Dispositivo**: Panel configuración → "Conectar MIDI" → seleccionar device
2. **Status Indicator**: Visual feedback del estado de conexión
3. **Auto-connect** (opcional): Variable `VITE_MIDI_AUTO_CONNECT=true`

#### MIDI Learn Workflow
1. Click icono 🎹 en control deseado → modo learning (icono naranja)
2. Mover control físico en dispositivo MIDI
3. Mapeo automático → icono cambia a cyan (confirmación)
4. Click icono cyan para eliminar mapeo existente

#### Pattern Triggering Avanzado
- **Note Tap** (<0.5s): Carga patrón pre-asignado
- **Note Hold** (>0.5s): Crea nuevo patrón + auto-asigna nota
- **Velocity Sensitivity**: Mapeos CC responden a velocity MIDI
- **Per-Project Storage**: Mapeos guardados con proyectos individuales

### Sistema Dual Screen

#### Configuración
1. **Activar**: Botón dual screen en header → abre ventana secundaria
2. **Posicionamiento**: Drag ventana a monitor secundario
3. **Fullscreen**: F11 en ventana secundaria para proyección
4. **Controls**: Solo ventana principal mantiene controles

#### Sincronización Automática
- **Estado Compartido**: BroadcastChannel sincroniza configuraciones en tiempo real
- **Animaciones**: Transiciones sincronizadas entre ventanas
- **Performance**: Zero-latency communication via native browser APIs
- **Cleanup**: Cierre automático de canales al cerrar ventanas

### Herramientas de Debug

#### Debug Overlay
- **Activación**: Botón 🐛 (esquina inferior derecha) o `VITE_DEBUG_MODE=true`
- **Métricas Tiempo Real**: FPS, RAF calls, active animations, sequencer ticks
- **Event Log**: Registro cronológico de eventos del sistema
- **Export Data**: Descarga telemetría en JSON para análisis

#### Console Debugging
```javascript
// Browser console commands
window.enableDebug()    // Activar logging global
window.disableDebug()   // Desactivar logging
window.midiLog          // Array de mensajes MIDI recientes
```

## Extensibilidad del Sistema

### Agregar Nuevo Renderer

#### 1. Estructura de Archivos
```
src/components/renderers/yourrenderer/
├── YourRenderer.tsx          # Componente React principal
├── your-schema.ts            # Definición controlSchema
└── index.ts                  # Export RendererDefinition
```

#### 2. Implementar Renderer Component
```typescript
// YourRenderer.tsx
import React, { useEffect, useRef } from 'react';
import { useTextureStore } from '../../../store';

const YourRenderer: React.FC<{ className?: string }> = ({ className }) => {
  const currentSettings = useTextureStore(state => state.currentSettings);
  
  // Tu lógica de renderizado aquí
  // Subscribirse a currentSettings para actualizaciones automáticas
  
  return <canvas ref={canvasRef} className={className} />;
};

export default YourRenderer;
```

#### 3. Definir Control Schema
```typescript
// your-schema.ts
import type { ControlSection } from '../types';

export const getYourSchema = (): ControlSection[] => [
  {
    title: 'Your Settings',
    defaultOpen: true,
    controls: [
      { type: 'slider', id: 'yourProperty', label: 'Your Control', min: 0, max: 100 },
      { type: 'custom', id: 'yourCustom', component: YourCustomComponent }
    ]
  }
];
```

#### 4. Registrar Renderer
```typescript
// components/renderers/index.ts
import { yourRenderer } from './yourrenderer';

export const renderers = {
  // ... existing renderers
  [yourRenderer.id]: yourRenderer,
};
```

### Agregar Nuevos Controles

#### Custom Control Component
```typescript
interface CustomControlProps {
  value: any;
  onChange: (value: any) => void;
  id: string;
}

const YourCustomControl: React.FC<CustomControlProps> = ({ value, onChange, id }) => {
  // Tu UI personalizada aquí
  return <div>/* Your custom control */</div>;
};
```

#### Integrar en Schema
```typescript
{ type: 'custom', id: 'propertyId', component: YourCustomControl }
```

## Documentación Técnica Avanzada

### Arquitectura de Shaders WebGL

El renderer WebGL utiliza un sistema de fragment shaders personalizado:

```glsl
// Uniforms principales
uniform float u_time;                    // Tiempo global para animaciones
uniform vec2 u_resolution;               // Resolución canvas
uniform float u_rotation;               // Rotación texture global
uniform vec3 u_gradientColors[10];       // Array gradientes (RGB 0-1)
uniform bool u_hardStops[10];           // Hard stops por color
uniform float u_transitionProgress;     // Crossfade entre gradientes
```

#### Pipeline de Renderizado
1. **Vertex Shader**: Fullscreen quad (-1 to 1 coordinates)
2. **Fragment Shader**: Per-pixel procedural generation
3. **Grid Calculation**: Hex/square grid con staggered offset
4. **Shape Distance**: SDF (Signed Distance Functions) para formas
5. **Color Sampling**: Gradient evaluation con interpolación temporal
6. **Final Composition**: Mixing de background/foreground con borders

### Performance Optimizations

#### WebGL Specific
- **Uniform Arrays**: Max 10 colores por gradiente (hardware limit)
- **SDF Shapes**: Analytical distance functions (no texture sampling)  
- **Single Draw Call**: Fullscreen quad con todo el procesamiento en fragment shader
- **GPU Memory**: Minimal VRAM usage con uniform-only approach

#### General Optimizations
- **Zustand Shallow**: Prevent unnecessary re-renders con shallow equality
- **RAF Coordination**: Single animation loop para múltiples subsystems
- **Debounced Updates**: LocalStorage writes throttled para performance
- **Lazy Loading**: Dynamic imports para reducir bundle inicial

### Troubleshooting Común

#### WebGL Issues
- **Context Loss**: Automatic recovery con shader recompilation
- **Uniform Limits**: Gradient colors capped at 10 (expand via texture approach)
- **Precision**: `highp` precision declarada para cálculos exactos

#### MIDI Issues  
- **Device Detection**: Web MIDI API requiere user gesture inicial
- **Latency**: Sub-16ms achievable con RequestAnimationFrame coordination
- **Browser Support**: Chrome/Edge optimal, Firefox/Safari limited

#### Performance Issues
- **FPS Drops**: Check `VITE_MAX_FPS` setting y GPU capabilities
- **Memory Leaks**: Cleanup de event listeners y animation frames
- **Large Projects**: Use import/export para proyectos complejos

## Contribución y Desarrollo

### Convenciones de Código

#### TypeScript
- **Strict Mode**: Habilitado con type checking completo
- **Interfaces**: Explicit typing para todas las data structures
- **Enums**: Para constants con semantic meaning (ControlSource, ViewportMode)

#### React Patterns
- **Functional Components**: Hook-based approach exclusivamente  
- **Custom Hooks**: Para lógica reutilizable cross-component
- **Ref Management**: useRef para DOM manipulation y mutable values

#### Estado y Side Effects
- **Zustand Actions**: Todas las mutations via store actions
- **useEffect Cleanup**: Mandatory cleanup para subscriptions/timers
- **Immutable Updates**: Immer para complex state modifications

### Git Workflow

#### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch para features
- **feature/***: Feature branches desde develop
- **hotfix/***: Critical fixes desde main

#### Commit Messages
```
feat: implementar nuevo renderer X
fix: corregir memory leak en animation loop  
docs: actualizar README con nuevas features
refactor: optimizar shader uniform management
perf: mejorar performance de gradient transitions
test: agregar tests para MIDI integration
chore: actualizar dependencias
```

### Testing Strategy

#### Unit Testing
- **Components**: React Testing Library para UI components
- **Stores**: Zustand store actions y state mutations  
- **Utilities**: Pure functions y helper methods
- **Shaders**: Mock WebGL context para shader compilation tests

#### Integration Testing
- **MIDI Flow**: End-to-end MIDI learn y pattern triggering
- **Renderer Switch**: Consistency cross-renderers
- **State Persistence**: LocalStorage save/load cycles
- **Dual Screen**: BroadcastChannel communication

#### Performance Testing  
- **FPS Benchmarks**: Automated performance regression detection
- **Memory Profiling**: Heap usage tracking durante uso prolongado
- **Bundle Analysis**: Size impact de nuevas features

## Licencia y Créditos

### Licencia
**GNU General Public License v3.0 (GPL-3.0)**

Este proyecto es software libre bajo términos de GPL-3.0:
- ✅ Uso comercial permitido
- ✅ Modificación y distribución permitidas  
- ✅ Uso privado sin restricciones
- 📄 Redistribución debe incluir código fuente
- 🔗 Modificaciones deben usar GPL-3.0
- 📝 Cambios deben estar documentados

Ver archivo [LICENSE](LICENSE) para términos completos.

### Tecnologías y Agradecimientos

#### Core Libraries
- [React](https://react.dev) - UI framework
- [Zustand](https://github.com/pmndrs/zustand) - State management  
- [Vite](https://vitejs.dev) - Build tool
- [TypeScript](https://www.typescriptlang.org) - Type system
- [Tailwind CSS](https://tailwindcss.com) - Styling framework

#### Specialized Libraries
- [Immer](https://immerjs.github.io/immer/) - Immutable state updates
- [Rosetta](https://github.com/lukeed/rosetta) - Internationalization
- [Headless UI](https://headlessui.com) - Accessible components

#### Web Standards
- **Web MIDI API** - Hardware integration
- **WebGL 2.0** - GPU-accelerated graphics  
- **BroadcastChannel API** - Inter-window communication
- **RequestAnimationFrame** - Smooth animations

---

**Desarrollado por**: Cristian Levrero  
**GitHub**: [@criistianlevrero](https://github.com/criistianlevrero)  
**Estado**: Desarrollo activo  
**Documentación Técnica**: Ver directorio `docs/` para guías específicas
