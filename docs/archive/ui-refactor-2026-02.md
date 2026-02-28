# Plan de Refactor UI - LuxSequencer

## Objetivo
Estandarizar la IU para que **no existan elementos visuales fuera del sistema de primitivas**, reducir estilos personalizados ad hoc y migrar a **DaisyUI** sobre Tailwind, manteniendo accesibilidad y consistencia visual.

## Estado actual (resumen)

### Primitivas existentes en uso
- `Button`, `Input`, `Textarea`, `Select`, `Switch`, `Slider`, `SliderInput`, `CollapsibleSection`, `SequencerCell`.
- Base correcta en controles y secuenciadores, pero con alta cantidad de `className` personalizados en layout, overlays, estados vacíos/error, depuración y drawers.

### Problema principal
- Hay componentes que usan primitivas pero las “rompen” con sobreescrituras extensivas (`className`) y otros que implementan superficies, drawers, alertas, tabs, badges y estados vacíos como bloques personalizados.

---

## Clasificación de reemplazo

## 1) Reemplazable por primitiva existente

### `CollapsibleSection`
- Reemplazar implementación local en `declarative/ControlRenderer` por `CollapsibleSection` de `ui`.

### `Button` (normalizar variantes y evitar sobreescrituras visuales no semánticas)
- Botones redondos de overlay fullscreen.
- Botones de icono en header/consola.
- FAB de consola MIDI.

### `Select`
- Skin del selector de idioma vía props/variant de `Select` (evitar estilo inline por uso).

### `Input` / `Switch` / `SliderInput`
- Casos donde hoy se usa un contenedor personalizado para label/value que ya puede resolverse con composición de primitivas existentes.

---

## 2) Requiere nueva primitiva

### Superficies y layout
- `Card` / `Panel` / `Surface` (contenedores repetidos con bordes, fondo, sombra y padding).
- `AppShell`/`TopBar` wrappers (layout estructural con tokens unificados).

### Contenedores de interacción
- `Drawer`/`Sheet` (overlays reutilizables left/bottom).
- `Tabs` (DebugOverlay).

### Estados y feedback
- `Alert`/`Callout` (error/advertencia/info/éxito).
- `EmptyState`.
- `LoadingState` / `Spinner`.
- `ErrorState`.

### Micro-primitivas (átomos)
- `IconButton` (ghost circular/flotante).
- `Badge` / `Chip` / `StatusDot`.
- `Divider`.
- `SectionHeader`.
- `StatTile` (métrica + label + valor).
- `ColorSwatchInput` (input color estandarizado).

---

## Sub-primitivas (átomos) a separar y reutilizar

1. **Focus ring tokenizado**
   - Unificar clases repetidas de focus en `Button`, `Input`, `Textarea`, `Switch`.

2. **Átomo `FormField`**
   - Label + helper + valor/badge (patrón repetido en sliders, color pickers y secciones de config).

3. **Átomo `Interactive Surface`**
   - Base para elementos clickeables con estados hover/active/focus (usado por tabs, celdas, botones compactos).

4. **Átomo `Tone System`**
   - Tokens de tono (`primary`, `neutral`, `danger`, `warning`) para evitar hardcode de `bg-gray-*`, `text-*`, etc.

---

## Plan de implementación por pasos

## Fase 0 — Preparación (sin cambios visuales)
1. Inventario final de clases repetidas y mapeo a tokens semánticos.
2. Definir contrato de primitivas nuevas (`Card`, `Drawer`, `Alert`, `EmptyState`, `Tabs`, `Badge`, `IconButton`).
3. Definir política: cuándo usar `className` y cuándo crear/expandir primitiva.

## Fase 1 — DaisyUI base
1. Instalar DaisyUI en dependencias.
2. Registrar plugin en Tailwind.
3. Definir tema base (oscuro) y mapear semántica de color.
4. Reducir CSS global en `src/index.css` moviendo estilos de controles de formulario a primitivas/Daisy.

## Fase 2 — Normalización de primitivas existentes
1. `Button`: incorporar variantes de icon/fab/circle sin hacks por `className`.
2. `Select`: variante para uso en header compacta.
3. `Input`/`Textarea`/`Switch`/`Slider`: unificar focus/disabled/size con tokens.
4. `CollapsibleSection`: eliminar duplicados funcionales.

## Fase 3 — Crear primitivas faltantes
1. `Card` / `Surface`.
2. `Drawer` / `Sheet`.
3. `Alert` / `Callout`.
4. `EmptyState`, `LoadingState`, `ErrorState`.
5. `Tabs`, `Badge`, `StatusDot`, `Divider`, `SectionHeader`, `StatTile`, `ColorSwatchInput`.

## Fase 4 — Migración de pantallas por prioridad
1. Layout (`DesktopLayout`, `MainViewport`, `FullscreenLayout`, `AppHeader`).
2. Consola y overlays (`MidiConsole`, `DebugOverlay`, `PerformanceMonitor`).
3. Secuenciadores (`Sequencer`, `PropertySequencer`, `PropertyTrackLane`).
4. Estados dual screen y error boundaries.

## Fase 5 — Cierre y hardening
1. QA visual (desktop + fullscreen + dual-screen).
2. QA de accesibilidad (keyboard/focus/aria).
3. Limpieza de clases heredadas y utilidades CSS no usadas.
4. Actualizar documentación (`docs/ui-system.md`).

---

## Checklist ejecutable por PRs

> Objetivo: ejecutar la migración en PRs pequeños, revisables y con rollback simple.

### PR-01 — DaisyUI base + tema
- [ ] Instalar DaisyUI y configurar plugin.
- [ ] Definir tema oscuro base y tokens semánticos iniciales.
- [ ] Mantener compatibilidad visual sin migración masiva en este PR.
- **Archivos objetivo**: `package.json`, `tailwind.config.js`, `src/index.css`.
- **Cierre**: build OK, app renderiza, sin regresiones críticas en layout global.

### PR-02 — Normalización de primitivas existentes
- [ ] Extender `Button` con variantes reutilizables (`icon`, `circle`, `fab` o equivalentes).
- [ ] Ajustar `Select` para variante compacta (uso en header).
- [ ] Unificar focus/disabled/size de `Input`, `Textarea`, `Switch`, `Slider`.
- [ ] Remover duplicación funcional de secciones colapsables.
- **Archivos objetivo**: `src/components/ui/*`, `src/components/declarative/ControlRenderer.tsx`.
- **Cierre**: no hay wrappers duplicados para collapse; API de primitivas documentada.

### PR-03 — Nuevas primitivas estructurales
- [ ] Crear `Card/Surface`.
- [ ] Crear `Drawer/Sheet`.
- [ ] Crear `Alert/Callout`.
- [ ] Crear `EmptyState`, `LoadingState`, `ErrorState`.
- **Archivos objetivo**: `src/components/ui/` (nuevos), `src/components/ui/index.ts`.
- **Cierre**: primitivas compilando, tipadas y exportadas en barrel.

### PR-04 — Nuevas micro-primitivas (átomos)
- [ ] Crear `IconButton`, `Badge/StatusDot`, `Divider`.
- [ ] Crear `SectionHeader`, `StatTile`, `ColorSwatchInput`.
- [ ] Estandarizar `FormField` (label + helper + value badge).
- **Archivos objetivo**: `src/components/ui/` (nuevos + ajustes).
- **Cierre**: átomos reutilizables disponibles para migración de pantallas.

### PR-05 — Migración Layout + Viewport
- [ ] Migrar `DesktopLayout`, `AppHeader`, `MainViewport`, `FullscreenLayout` a primitivas.
- [ ] Eliminar clases ad hoc donde exista primitiva equivalente.
- **Archivos objetivo**: `src/components/layout/*.tsx`, `src/components/controls/ViewportControls.tsx`.
- **Cierre**: layout principal sin wrappers visuales personalizados repetidos.

### PR-06 — Migración Console + Debug
- [ ] Migrar `MidiConsole` a `Drawer/Sheet` + `PanelHeader` + botones normalizados.
- [ ] Migrar `DebugOverlay` y `PerformanceMonitor` a `Tabs`, `StatTile`, `AlertItem`, `Card`.
- **Archivos objetivo**: `src/components/midi/MidiConsole.tsx`, `src/components/debug/*.tsx`.
- **Cierre**: overlays/depuración sin bloques estilísticos repetidos.

### PR-07 — Migración Sequencers
- [ ] Migrar `Sequencer`, `PropertySequencer`, `PropertyTrackLane` a `Card`, `EmptyState`, `SegmentedControl` (si aplica), `PanelHeader/Footer`.
- [ ] Consolidar wrappers timeline/celdas repetidas.
- **Archivos objetivo**: `src/components/sequencer/*.tsx`.
- **Cierre**: secuenciadores consistentes con primitivas + DaisyUI.

### PR-08 — Migración Dual Screen + errores
- [ ] Migrar `SecondaryDisplay` overlays/info/hints a primitives de estado/overlay.
- [ ] Migrar `RendererErrorBoundary` a `ErrorState/Alert`.
- [ ] Evaluar unificación de iconos inline dual-screen en sistema de iconos.
- **Archivos objetivo**: `src/components/dualscreen/*.tsx`, `src/components/error/RendererErrorBoundary.tsx`.
- **Cierre**: estados de error y dual-screen estandarizados.

### PR-09 — Limpieza final + documentación
- [x] Eliminar hacks CSS globales de `select/range` trasladados a primitivas.
- [x] Remover clases heredadas sin uso.
- [x] Actualizar documentación oficial del sistema UI.
- **Archivos objetivo**: `src/index.css`, `docs/ui-system.md`, `docs/ui-refactor.md`.
- **Cierre**: criterios de aceptación cumplidos y documentación alineada.

### Avance reciente (2026-02-28)
- Se eliminaron las sobreescrituras globales heredadas de `select`/`input[type="range"]` en `src/index.css`.
- El estilo base de `Slider` se migró a clases DaisyUI (`range range-primary`) para evitar dependencia de CSS global.
- Se removieron clases heredadas no estándar (`bg-gray-750`) en depuración/controles declarativos usando utilidades válidas (`bg-gray-700/50`).
- Se actualizó `docs/ui-system.md` con DaisyUI (`luxdark`), nuevas primitivas de `ui/` y reglas de uso de estilos globales.
- Validación ejecutada: `npm run type-check` y `npm run build` en verde (advertencia DaisyUI `@property` no bloqueante).

### Checklist transversal por PR
- [x] Typecheck y build en verde.
- [ ] Verificación de accesibilidad (focus visible, keyboard nav, aria).
- [ ] Verificación visual en desktop/fullscreen/dual-screen (cuando aplique).
- [ ] Sin introducir estilos fuera de primitives para casos ya cubiertos.

---

## Backlog de tickets (listo para issue tracker)

### TICKET-UI-001 — Integrar DaisyUI base
- **PR asociado**: PR-01
- **Objetivo**: incorporar DaisyUI y tema oscuro base sin migración visual masiva.
- **Alcance**:
   - instalar dependencia DaisyUI
   - registrar plugin en Tailwind
   - definir tema base y tokens semánticos iniciales
- **Archivos**: `package.json`, `tailwind.config.js`, `src/index.css`
- **Aceptación**:
   - build y typecheck OK
   - la app renderiza sin errores de estilos críticos
   - tema base activo
- **Depende de**: ninguno

### TICKET-UI-002 — Normalizar primitivas existentes
- **PR asociado**: PR-02
- **Objetivo**: reducir sobreescrituras ad hoc en primitivas base.
- **Alcance**:
   - variantes adicionales de `Button` para icon/circle/fab
   - variante compacta de `Select`
   - unificación de estados/focus/disabled en inputs/switch/slider
   - reemplazo de colapsables duplicados
- **Archivos**: `src/components/ui/*`, `src/components/declarative/ControlRenderer.tsx`
- **Aceptación**:
   - no quedan wrappers colapsables duplicados
   - API de primitivas documentada y consistente
- **Depende de**: TICKET-UI-001

### TICKET-UI-003 — Crear primitivas estructurales
- **PR asociado**: PR-03
- **Objetivo**: crear base reutilizable para superficies, drawers y estados.
- **Alcance**:
   - `Card/Surface`
   - `Drawer/Sheet`
   - `Alert/Callout`
   - `EmptyState`, `LoadingState`, `ErrorState`
- **Archivos**: `src/components/ui/` + `src/components/ui/index.ts`
- **Aceptación**:
   - todas las primitivas nuevas exportadas desde barrel
   - tipos y props definidos
- **Depende de**: TICKET-UI-002

### TICKET-UI-004 — Crear micro-primitivas (átomos)
- **PR asociado**: PR-04
- **Objetivo**: extraer piezas repetidas para evitar duplicación.
- **Alcance**:
   - `IconButton`, `Badge/StatusDot`, `Divider`
   - `SectionHeader`, `StatTile`, `ColorSwatchInput`
   - `FormField` (label/helper/value)
- **Archivos**: `src/components/ui/` + `src/components/ui/index.ts`
- **Aceptación**:
   - átomos reutilizados en al menos un caso real
   - reducción de clases repetidas en componentes objetivo
- **Depende de**: TICKET-UI-003

### TICKET-UI-005 — Migrar layout principal
- **PR asociado**: PR-05
- **Objetivo**: migrar layout y viewport a primitivas.
- **Alcance**:
   - `DesktopLayout`, `AppHeader`, `MainViewport`, `FullscreenLayout`
   - `ViewportControls`
- **Archivos**: `src/components/layout/*.tsx`, `src/components/controls/ViewportControls.tsx`
- **Aceptación**:
   - sin bloques visuales repetidos de panel/drawer fuera de `ui/`
   - interacciones de fullscreen intactas
- **Depende de**: TICKET-UI-004

### TICKET-UI-006 — Migrar consola y depuración
- **PR asociado**: PR-06
- **Objetivo**: estandarizar overlays y paneles de monitoreo.
- **Alcance**:
   - migrar `MidiConsole` a `Drawer/Sheet` + header unificado
   - migrar `DebugOverlay` a tabs/tiles/estados reutilizables
   - migrar `PerformanceMonitor` a cards/alerts/tiles
- **Archivos**: `src/components/midi/MidiConsole.tsx`, `src/components/debug/*.tsx`
- **Aceptación**:
   - tabs y métricas sin bloques personalizados repetidos
   - estado visual y funcional equivalente al actual
- **Depende de**: TICKET-UI-004

### TICKET-UI-007 — Migrar secuenciadores
- **PR asociado**: PR-07
- **Objetivo**: unificar secuenciadores bajo primitivas.
- **Alcance**:
   - `Sequencer`, `PropertySequencer`, `PropertyTrackLane`
   - wrappers de timeline y estados vacíos
- **Archivos**: `src/components/sequencer/*.tsx`
- **Aceptación**:
   - layouts internos usando `Card/Surface`, `EmptyState`, headers reutilizables
   - UX de edición de steps/keyframes sin regresiones
- **Depende de**: TICKET-UI-004

### TICKET-UI-008 — Migrar dual-screen y errores
- **PR asociado**: PR-08
- **Objetivo**: estandarizar estados de error y overlays de display secundario.
- **Alcance**:
   - migrar `SecondaryDisplay` overlays/info/hints
   - migrar `RendererErrorBoundary` a estados reutilizables
   - revisar iconos inline dual-screen
- **Archivos**: `src/components/dualscreen/*.tsx`, `src/components/error/RendererErrorBoundary.tsx`
- **Aceptación**:
   - error/empty states consistentes con diseño base
   - dual-screen mantiene comportamiento actual
- **Depende de**: TICKET-UI-004

### TICKET-UI-009 — Limpieza final y documentación
- **PR asociado**: PR-09
- **Objetivo**: cerrar migración y dejar baseline limpio.
- **Alcance**:
   - remover hacks globales de `select/range`
   - limpieza de estilos heredados
   - actualizar documentación final de UI
- **Archivos**: `src/index.css`, `docs/ui-system.md`, `docs/ui-refactor.md`
- **Aceptación**:
   - criterios de aceptación globales cumplidos
   - documentación alineada con implementación final
- **Depende de**: TICKET-UI-005, TICKET-UI-006, TICKET-UI-007, TICKET-UI-008

---

## Riesgos y mitigación
- **Riesgo**: regresión visual por cambio masivo de clases.
  - **Mitigación**: migración por fases + snapshots visuales por módulo.

- **Riesgo**: mezcla DaisyUI + estilos heredados durante transición.
   - **Mitigación**: flags de funcionalidad o migración por componentes verticales completos.

- **Riesgo**: sobreescrituras fuera de primitivas reaparecen.
   - **Mitigación**: guía explícita + revisión de PR centrada en `ui/`.

---

## Criterio de aceptación
- 100% de elementos visuales interactivos pasan por primitivas de `src/components/ui`.
- No quedan bloques estructurales repetidos con estilo hardcodeado cuando exista primitiva equivalente.
- DaisyUI activo y tema base aplicado.
- `src/index.css` sin hacks de `select/range` que deban vivir en primitivas.

---

## ANEXO — Ubicación de elementos reemplazables (archivo, línea, posición)

> Convención de `posición`: zona funcional del componente donde aparece el elemento.

| Tipo | Reemplazo sugerido | Archivo | Línea | Posición |
|---|---|---|---:|---|
| Existente | `Button` (normalizar estilo icon ghost) | `src/components/layout/AppHeader.tsx` | 37 | Header > botón reset |
| Existente | `Button` (normalizar estilo icon ghost) | `src/components/layout/AppHeader.tsx` | 46 | Header > botón fullscreen |
| Existente | `Select` (variant compacta) | `src/components/layout/AppHeader.tsx` | 29 | Header > selector de idioma |
| Nueva | `Card/Surface` | `src/components/layout/DesktopLayout.tsx` | 25 | Columna izquierda > panel de controles |
| Nueva | `Card/Surface` | `src/components/layout/DesktopLayout.tsx` | 31 | Columna derecha > panel secuenciador |
| Nueva | `AppShell/Footer` | `src/components/layout/DesktopLayout.tsx` | 38 | Footer de aplicación |
| Nueva | `Card/Surface` | `src/components/layout/MainViewport.tsx` | 23 | Contenedor principal del viewport |
| Nueva | `EmptyState` | `src/components/layout/MainViewport.tsx` | 38 | Estado dual-screen activo |
| Nueva | `ErrorState` | `src/components/layout/MainViewport.tsx` | 49 | Fallback sin renderer |
| Existente | `Button` (`IconButton` variant) | `src/components/layout/FullscreenLayout.tsx` | 48 | Overlay top-left > toggle controls |
| Existente | `Button` (`IconButton` variant) | `src/components/layout/FullscreenLayout.tsx` | 57 | Overlay top-left > toggle sequencer |
| Existente | `Button` (`IconButton` variant) | `src/components/layout/FullscreenLayout.tsx` | 68 | Overlay top-right > reset |
| Existente | `Button` (`IconButton` variant) | `src/components/layout/FullscreenLayout.tsx` | 77 | Overlay top-right > exit fullscreen |
| Nueva | `Drawer/Sheet` | `src/components/layout/FullscreenLayout.tsx` | 84 | Drawer lateral de controles |
| Nueva | `Drawer/Sheet` | `src/components/layout/FullscreenLayout.tsx` | 95 | Drawer inferior de secuenciador |
| Nueva | `LoadingState` | `src/components/routing/MainApp.tsx` | 88 | Loader inicial (spinner + texto) |
| Nueva | `ErrorState` | `src/components/routing/MainApp.tsx` | 118 | Fullscreen > Canvas component missing |
| Existente | `Button` (`FabButton` variant) | `src/components/routing/MainApp.tsx` | 142 | FAB abrir consola MIDI |
| Nueva | `Drawer/Sheet` | `src/components/midi/MidiConsole.tsx` | 20 | Contenedor consola deslizante |
| Nueva | `PanelHeader` | `src/components/midi/MidiConsole.tsx` | 27 | Header de consola |
| Existente | `Button` (variant secondary estándar) | `src/components/midi/MidiConsole.tsx` | 35 | Acción clear console |
| Existente | `Button` (`IconButton` variant) | `src/components/midi/MidiConsole.tsx` | 46 | Acción cerrar consola |
| Nueva | `Alert/ErrorState` | `src/components/error/RendererErrorBoundary.tsx` | 40 | Estado renderer crashed |
| Nueva | `Alert/WarningState` | `src/components/error/RendererErrorBoundary.tsx` | 60 | Estado no renderer |
| Existente | `CollapsibleSection` | `src/components/declarative/ControlRenderer.tsx` | 431 | Sección colapsable declarativa duplicada |
| Nueva | `Card/Surface` | `src/components/declarative/ControlRenderer.tsx` | 444 | Body de sección declarativa |
| Nueva | `Card/Surface` | `src/components/sequencer/Sequencer.tsx` | 118 | Bloque transport/settings |
| Nueva | `SegmentedControl` | `src/components/sequencer/Sequencer.tsx` | 272 | Selector numSteps (grupo 1) |
| Nueva | `SegmentedControl` | `src/components/sequencer/Sequencer.tsx` | 277 | Selector numSteps (grupo 2) |
| Nueva | `StickyLabelCell` | `src/components/sequencer/Sequencer.tsx` | 327 | Columna sticky de nombre patrón |
| Nueva | `EmptyState` | `src/components/sequencer/Sequencer.tsx` | 351 | Secuenciador sin patrones |
| Nueva | `Card/Surface` | `src/components/sequencer/PropertySequencer.tsx` | 75 | Barra add track |
| Nueva | `EmptyState` | `src/components/sequencer/PropertySequencer.tsx` | 107 | Sin pistas de propiedades |
| Nueva | `Card/Surface` | `src/components/sequencer/PropertyTrackLane.tsx` | 133 | Contenedor lane |
| Nueva | `PanelHeader` | `src/components/sequencer/PropertyTrackLane.tsx` | 135 | Header lane |
| Nueva | `TimelineCell` | `src/components/sequencer/PropertyTrackLane.tsx` | 196 | Celda timeline (wrapper) |
| Nueva | `PanelFooter` | `src/components/sequencer/PropertyTrackLane.tsx` | 224 | Editor keyframe footer |
| Existente | `Button` (`FabButton` variant) | `src/components/debug/DebugOverlay.tsx` | 204 | Trigger abrir debug |
| Nueva | `Drawer/Panel` | `src/components/debug/DebugOverlay.tsx` | 213 | Contenedor overlay debug |
| Nueva | `Tabs` | `src/components/debug/DebugOverlay.tsx` | 238 | Navegación de tabs |
| Nueva | `StatTile` | `src/components/debug/DebugOverlay.tsx` | 289 | Grid de métricas (tiles repetidos) |
| Nueva | `PanelHeader` | `src/components/debug/DebugOverlay.tsx` | 215 | Header debug (título + badge) |
| Nueva | `Card/Surface` | `src/components/debug/PerformanceMonitor.tsx` | 171 | Monitoring settings |
| Nueva | `Card/Surface` | `src/components/debug/PerformanceMonitor.tsx` | 201 | Performance score |
| Nueva | `AlertList/AlertItem` | `src/components/debug/PerformanceMonitor.tsx` | 237 | Sección alerts |
| Nueva | `StatTile` | `src/components/debug/PerformanceMonitor.tsx` | 297 | Current metrics (tiles) |
| Nueva | `StatTile` | `src/components/debug/PerformanceMonitor.tsx` | 372 | Renderer profiling card |
| Nueva | `StatTile` | `src/components/debug/PerformanceMonitor.tsx` | 405 | WebGL metrics card |
| Nueva | `ErrorState` | `src/components/dualscreen/SecondaryDisplay.tsx` | 48 | Renderer no encontrado |
| Nueva | `OverlayInfo` | `src/components/dualscreen/SecondaryDisplay.tsx` | 86 | Overlay superior info display |
| Nueva | `OverlayHint` | `src/components/dualscreen/SecondaryDisplay.tsx` | 106 | Instrucciones teclado |
| Nueva | `Icon` primitiva (si se desea unificar) | `src/components/dualscreen/DualScreenControls.tsx` | 6 | SVG dual-screen inline |
| Nueva | `Icon` primitiva (si se desea unificar) | `src/components/dualscreen/DualScreenControls.tsx` | 25 | SVG single-screen inline |
| Existente | `Button` (`IconButton` variant) | `src/components/dualscreen/DualScreenControls.tsx` | 78 | Botón toggle dual-screen |
| Nueva | `Toolbar/ControlGroup` | `src/components/controls/ViewportControls.tsx` | 24 | Contenedor controles viewport |
| Nueva | `Divider` | `src/components/controls/ViewportControls.tsx` | 46 | Separador vertical |
| Nueva | `Badge/StatusChip` | `src/components/controls/ViewportControls.tsx` | 52 | Chip “Dual Screen Activo” |
| Nueva | `Alert` | `src/components/controls/ControlPanel.tsx` | 187 | Error conexión MIDI |
| Nueva | `StatusChip` | `src/components/controls/ControlPanel.tsx` | 102 | Renderer cache chip activo |
| Nueva | `StatusChip` | `src/components/controls/ControlPanel.tsx` | 103 | Renderer cache chip inactivo |
| Nueva | `Card/Callout` | `src/components/controls/EnhancedControlPanel.tsx` | 123 | Header control system |
| Nueva | `Callout/FeatureList` | `src/components/controls/EnhancedControlPanel.tsx` | 191 | Bloque enhanced features |
| Nueva | `ColorSwatchInput` | `src/components/controls/GradientEditor.tsx` | 75 | Input color por stop |
| Nueva | `GradientPreview` | `src/components/controls/GradientEditor.tsx` | 107 | Preview gradiente |
| Nueva | `FormField` + `ColorSwatchInput` | `src/components/renderers/shared/scale-texture-schema.tsx` | 38 | BorderColorPicker personalizado |
| Nueva | `ColorSwatchInput` | `src/components/renderers/shared/scale-texture-schema.tsx` | 56 | Selector de color de borde |
| Nueva | Migrar a primitivas/Daisy (eliminar hacks globales) | `src/index.css` | 46 | Reset personalizado de select/range |
| Nueva | Migrar a primitivas/Daisy (eliminar hacks globales) | `src/index.css` | 52 | Estilo personalizado de select |
| Nueva | Migrar a primitivas/Daisy (eliminar hacks globales) | `src/index.css` | 76 | Estilo personalizado de range |

---

## ANEXO B — Átomos internos detectados para extracción desde `ui/`

| Átomo propuesto | Archivo origen | Línea | Observación |
|---|---|---:|---|
| FocusRing token | `src/components/ui/Button.tsx` | 40 | Ring y offset repetidos en múltiples primitives |
| Variant map reutilizable | `src/components/ui/Button.tsx` | 15 | `variantStyles` puede volverse token/recipe común |
| Size map reutilizable | `src/components/ui/Button.tsx` | 22 | `sizeStyles` reutilizable para `IconButton`/`Fab` |
| FieldBase | `src/components/ui/Input.tsx` | 19 | Base visual de campos repetida en Textarea/Select |
| FieldBase | `src/components/ui/Textarea.tsx` | 12 | Misma semántica de borde/focus/disabled |
| SwitchLabelBlock | `src/components/ui/Switch.tsx` | 66 | Label + description reusable atom |

