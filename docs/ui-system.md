# Sistema de UI - LuxSequencer

Documentación completa del sistema de interfaz de usuario de LuxSequencer, incluyendo componentes, iconos, patrones de diseño y arquitectura de la UI.

## Índice

- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura de Componentes](#arquitectura-de-componentes)
- [Sistema de Iconos](#sistema-de-iconos)
- [Componentes Base](#componentes-base)
- [Componentes Avanzados](#componentes-avanzados)
- [Sistema de Estilos](#sistema-de-estilos)
- [Internacionalización](#internacionalización)
- [Responsive Design](#responsive-design)
- [Eventos de Teclado](#eventos-de-teclado)
- [Accesibilidad](#accesibilidad)
- [Patrones de Diseño](#patrones-de-diseño)
- [Propuesta de Arquitectura UI (2026-03)](#propuesta-de-arquitectura-ui-2026-03)
- [Mejoras Futuras](#mejoras-futuras)
- [Historial de Refactor UI](#historial-de-refactor-ui)

---

## Historial de Refactor UI

- Plan de refactor archivado: [docs/archive/ui-refactor-2026-02.md](./archive/ui-refactor-2026-02.md)
- Este documento (`ui-system.md`) se mantiene como referencia activa del sistema UI actual.

---

## Stack Tecnológico

### Core
- **React 19.2.0**: framework de UI con funcionalidades concurrentes
- **TypeScript**: Tipado estático completo
- **Tailwind CSS**: framework CSS utility-first
- **DaisyUI 5.x**: Primitivas semánticas y tematización sobre Tailwind
- **Headless UI 2.2.9**: Componentes UI headless con accesibilidad completa
- **Vite**: herramienta de build y servidor de desarrollo
- **Zustand**: gestión de estado

### Herramientas de Desarrollo
- **vite-plugin-svgr**: SVG como componentes React
- **rosetta**: Sistema de internacionalización
- **use-sync-external-store**: Compatibilidad Zustand con React 19

---

## Arquitectura de Componentes

### Estructura de Directorios
```
src/components/
├── ui/               # Primitivas visuales (punto único de import)
├── controls/         # Composición de negocio para panel de controles
├── declarative/      # Motor declarativo de controles y adaptadores
├── layout/           # Shells y layouts principales
├── routing/          # Composición de la app principal
├── renderers/        # Sistema de renderizado modular
├── sequencer/        # Interfaz del secuenciador
├── midi/             # Controles MIDI
├── debug/            # Herramientas de desarrollo
├── dualscreen/       # Sistema de doble pantalla
├── error/            # Error boundaries y fallbacks
└── i18n/             # Componentes de internacionalización
```

### Principios Arquitectónicos
1. **Separación de responsabilidades**: Cada directorio tiene un propósito específico
2. **Composición sobre herencia**: Componentes pequeños y combinables
3. **Props drilling mínimo**: Uso de contexto y gestión de estado centralizada
4. **Tipado estricto**: Interfaces TypeScript para todos los props
5. **Accesibilidad first**: ARIA, navegación por teclado, screen readers

---

## Propuesta de Arquitectura UI (2026-03)

Esta propuesta define una separación explícita entre primitivas, componentes compuestos y utilidades de estilo, sin romper la API pública actual.

### Objetivos
- Reducir acoplamiento entre piezas base y componentes de mayor complejidad.
- Facilitar mantenibilidad del sistema UI y escalabilidad de nuevos controles.
- Unificar criterios de uso de Tailwind, DaisyUI y Headless UI.
- Mantener compatibilidad hacia atrás importando desde `src/components/ui/index.ts`.

### Estructura objetivo
```text
src/components/ui/
├── primitives/          # Bloques base sin lógica de negocio
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Textarea.tsx
│   ├── Select.tsx
│   ├── Switch.tsx
│   ├── Checkbox.tsx
│   ├── RadioGroup.tsx
│   ├── Tooltip.tsx
│   ├── FieldLabel.tsx
│   ├── Card.tsx
│   ├── Sheet.tsx
│   ├── Tabs.tsx
│   └── index.ts
├── composites/          # Reutilizables de media/alta complejidad
│   ├── AdvancedSelect.tsx
│   ├── RangeSlider.tsx
│   ├── ColorPicker.tsx
│   ├── Vector2DPicker.tsx
│   ├── SliderInput.tsx
│   ├── CollapsibleSection.tsx
│   ├── PanelHeader.tsx
│   └── index.ts
├── patterns/            # Bloques de presentación para paneles/debug
│   ├── Alert.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── StatTile.tsx
│   ├── MetricCard.tsx
│   ├── MiniChartCard.tsx
│   └── index.ts
├── foundation/          # Tokens y helpers de estilo compartidos
│   ├── tokens.ts
│   └── index.ts
├── icons.tsx
├── index.ts             # API pública estable (re-export)
└── README.md
```

### Criterios de clasificación
- **Primitives**: elementos base de formulario/superficie con API genérica.
- **Composites**: combinan múltiples primitives y manejan interacción más rica.
- **Patterns**: piezas visuales listas para uso en vistas concretas (dashboard, paneles).
- **Foundation**: constantes y utilidades de estilos, sin JSX de producto.

### Lineamientos Tailwind, DaisyUI y Headless UI
- **Tailwind**: mantener utility-first, pero extraer patrones repetidos a tokens semánticos en `foundation/tokens.ts`.
- **Headless UI**: usarlo para interacciones complejas y accesibles (select, switch, popover/dialog/menu) evitando reimplementar navegación de teclado manual.
- **DaisyUI**: uso opt-in y consistente. Si se usa, limitarlo a primitives base; evitar mezclar DaisyUI y clases custom distintas para el mismo tipo de control en la misma pantalla.

### Estrategia de barrel exports
1. Mantener `ui/index.ts` como punto único de import público.
2. Crear barrels por capa (`primitives/index.ts`, `composites/index.ts`, `patterns/index.ts`, `foundation/index.ts`).
3. Re-exportar desde `ui/index.ts` para evitar ruptura de imports existentes.
4. En una fase posterior, restringir export de piezas internas no destinadas a consumo transversal.

### Plan de migración incremental (sin romper imports)
1. **Fase 1 (estructura)**: crear subcarpetas y sub-barrels, sin cambiar APIs ni comportamiento visual.
2. **Fase 2 (normalización)**: mover archivos gradualmente por capa y actualizar imports internos del módulo `ui`.
3. **Fase 3 (tokens)**: consolidar clases repetidas en tokens semánticos y helpers de variantes.
4. **Fase 4 (documentación)**: mantener sincronizado `docs/ui-system.md` y `src/components/ui/README.md` con inventario y reglas.
5. **Fase 5 (gobernanza)**: definir checklist de PR para componentes UI (a11y, API pública, pruebas mínimas, i18n).

---

## Sistema de Iconos

### Implementación Actual
**Archivo**: [`src/components/ui/icons.tsx`](../src/components/ui/icons.tsx)  
**Tecnología**: SVGs locales + vite-plugin-svgr

### Iconos Disponibles (23 iconos)

#### **Navegación y Acciones**
- `FishIcon` - Logo de la aplicación
- `PlusIcon` - Agregar elementos
- `TrashIcon` - Eliminar elementos
- `CloseIcon` - Cerrar modales/drawers
- `SettingsIcon` - Configuración
- `SaveIcon` - Guardar proyectos/patrones
- `CopyIcon` - Duplicar elementos

#### **Transporte y Media**
- `PlayIcon` - Reproducir secuenciador
- `StopIcon` - Detener secuenciador
- `SequencerIcon` - Icono del secuenciador

#### **MIDI y Audio**
- `MidiIcon` - Controles MIDI
- `ConsoleIcon` - Consola de debug MIDI

#### **Archivos y Datos**
- `DownloadIcon` - Exportar proyectos
- `UploadIcon` - Importar proyectos

#### **Viewport y Pantalla**
- `DesktopIcon` - Vista desktop
- `MobileIcon` - Vista mobile
- `AspectRatioIcon` - Cambio de aspecto
- `EnterFullscreenIcon` - Entrar fullscreen
- `ExitFullscreenIcon` - Salir fullscreen

#### **UI y Navegación**
- `ChevronDownIcon` - Collapse/expand
- `ChevronUpDownIcon` - Selector dropdown (Headless UI)
- `CheckIcon` - Selección confirmada (Headless UI)
- `SplitIcon` - Divisores de gradiente

#### **Especiales**
- `ResetIcon` - Reset valores (SVG inline)

### Patrón de Implementación
```typescript
// SVG import con vite-plugin-svgr
import IconSvg from '../../assets/icons/icon.svg?react';

// Wrapper component para consistencia
export const IconName: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <IconSvg {...props} />
);
```

### Ventajas del Sistema Actual
✅ **Performance**: SVGs optimizados, tree-shaking automático  
✅ **Consistencia**: Wrapper components con props unificados  
✅ **Mantenibilidad**: Un archivo centralizado para todos los iconos  
✅ **Flexibilidad**: Props nativos de SVG (className, style, etc.)  
✅ **Bundle size**: Solo incluye iconos utilizados

---

## Componentes Base

> Import recomendado para primitivas: `src/components/ui/index.ts`

### 1. Button Component
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/Button.tsx`](../src/components/ui/Button.tsx)

#### Variants
- `primary`: Cyan, acciones principales
- `secondary`: Gray, acciones secundarias  
- `danger`: Red, acciones destructivas
- `ghost`: Transparente, acciones sutiles

#### Sizes
- `sm`: Botones pequeños (px-3 py-1.5)
- `md`: Tamaño estándar (px-4 py-2) 
- `lg`: Botones grandes (px-6 py-3)
- `icon`: Solo icono (p-2)
- `circle`: Icon button circular (overlay/header)
- `fab`: Floating action button

#### Características
- ✅ Iconos con `icon` prop
- ✅ Modo `iconOnly` para botones de icono
- ✅ Estados disabled
- ✅ Anillo de foco para accesibilidad
- ✅ Transiciones suaves

#### Criterios de uso de `unstyled`
Para mantener consistencia visual, usar siempre variantes estándar (`variant` + `size`) como primera opción.

Usar `unstyled` **solo** en estos casos:
- Interacciones altamente custom (ejemplo: swatches de color pequeños, handles visuales, chips con layout no estándar)
- Inputs ocultos de infraestructura (`type="file"`, `type="color"` oculto para trigger externo)
- Controles con geometría no compatible con el padding/ring base de la primitiva

Evitar `unstyled` cuando:
- El componente puede representarse con `primary`, `secondary`, `danger` o `ghost`
- Solo se requiere ajustar ancho, alineación o spacing (usar `className` sobre la variante estándar)
- El objetivo es replicar un botón/input común de formulario

Regla práctica del proyecto:
- Si el control sigue siendo un botón o input tradicional, usar primitiva estándar.
- Si el control funciona como parte de una UI dibujada o mini-widget, permitir `unstyled`.

### 2. Select Component (Headless UI)
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/Select.tsx`](../src/components/ui/Select.tsx)

#### Dual API
- **Options API**: Para casos simples con array de objetos
- **Children API**: Para casos complejos con JSX personalizado

#### Características Headless UI
- ✅ Animaciones fluidas con `Transition`
- ✅ Navegación por teclado completa
- ✅ Búsqueda incremental por escritura
- ✅ Iconos en opciones
- ✅ Descripciones en opciones
- ✅ Estados disabled por opción
- ✅ Render en portal (`z-index` seguro)

#### Variantes visuales
- `default`: Select estándar para paneles y formularios
- `header`: Select compacto para header/topbar

#### Configuración de Portal
- `usePortal` (default: `true`): Renderiza `Listbox.Options` en `document.body` para evitar clipping y conflictos de `z-index`.
- `usePortal={false}`: Mantiene el render inline (comportamiento local) cuando se necesite por layout específico.

#### Fallback nativo
Cuando se usan `children`, se utiliza `<select>` HTML nativo para máxima compatibilidad.

### 3. Switch Component (Headless UI)
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/Switch.tsx`](../src/components/ui/Switch.tsx)

#### Características
- ✅ Animaciones de transición suaves
- ✅ Dos tamaños: `sm` y `md`
- ✅ Labels y descripciones opcionales
- ✅ Estados disabled
- ✅ Colores dinámicos (cyan activo, gray inactivo)
- ✅ Anillo de foco para accesibilidad

#### Implementación Actual
Reemplaza botones toggle en **GradientEditor** para hardstops de colores.

### 4. CollapsibleSection Component
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/CollapsibleSection.tsx`](../src/components/ui/CollapsibleSection.tsx)

#### Características
- ✅ Estado expandido/colapsado
- ✅ Animación de rotación de chevron
- ✅ `defaultOpen` prop
- ✅ ARIA `aria-expanded`
- ✅ Estados hover

### 5. SequencerCell Component
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/SequencerCell.tsx`](../src/components/ui/SequencerCell.tsx)

#### Variantes
- `pattern`: Celda para patrón con borde y estados activos
- `step`: Celda para pasos del secuenciador con tamaño fijo
- `keyframe`: Celda para automatización por keyframes

#### Características
- ✅ Estados `active`, `selected` y `disabled`
- ✅ Estilos por variante y estado
- ✅ Anillo de foco para navegación por teclado
- ✅ API simple basada en `onClick` y `children`

### 6. Primitivas de layout y feedback
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)

#### Superficies y contenedores
- `Card`: Superficie base para paneles y bloques de contenido
- `Sheet`: Drawer/sheet reutilizable (`left`, `right`, `top`, `bottom`)

#### Estados y mensajes
- `Alert`: Mensajes `info/success/warning/error` con acciones opcionales
- `EmptyState`: Estado vacío reutilizable con icono/título/descripcion
- `ErrorState`: Estado de error reutilizable para fallbacks de UI

#### Encabezados y métricas
- `PanelHeader`: Encabezado estandarizado para overlays y paneles
- `StatTile`: Métricas compactas (label/valor/subtítulo)

#### Navegación
- `Tabs`: Navegación por pestañas basada en primitivas del sistema

---

## Componentes Avanzados

### 1. SliderInput
**Importar desde**: [`src/components/ui/index.ts`](../src/components/ui/index.ts)  
**Implementación actual**: [`src/components/ui/SliderInput.tsx`](../src/components/ui/SliderInput.tsx)  
**Compatibilidad heredada**: [`src/components/controls/SliderInput.tsx`](../src/components/controls/SliderInput.tsx)

#### Características
- ✅ Label y valor mostrado simultáneamente
- ✅ Formateador personalizable para unidades
- ✅ Valor destacado en insignia cyan
- ✅ Slider base estandarizado con clase DaisyUI `range`
- ✅ IDs semánticos para etiquetas

### 2. GradientEditor
**Archivo**: [`src/components/controls/GradientEditor.tsx`](../src/components/controls/GradientEditor.tsx)

#### Características Avanzadas
- ✅ Selector de color nativo del navegador
- ✅ Switch para hardstops (implementado con Headless UI)
- ✅ Arrastrar y soltar para reordenar colores
- ✅ Previsualización en tiempo real
- ✅ Validación de colores mínimos
- ✅ Generación automática de CSS gradients

#### Implementación de hardstops
Usa la primitiva `Switch` para mejorar la UX frente a botones toggle.

### 3. MidiLearnButton
**Archivo**: [`src/components/midi/MidiLearnButton.tsx`](../src/components/midi/MidiLearnButton.tsx)

#### Estados visuales
- **Sin mapear**: gris, disponible para mapeo
- **Aprendiendo**: naranja con animación de pulso
- **Mapeado**: cyan, MIDI asignado

### 4. RendererControls
**Archivo**: [`src/components/renderers/shared/RendererControls.tsx`](../src/components/renderers/shared/RendererControls.tsx)

#### Schema-Driven UI
- ✅ Generación dinámica de controles
- ✅ Soporte para slider y custom controls
- ✅ Integración MIDI Learn automática
- ✅ Validación de schemas TypeScript

---

## Sistema de Estilos

### Theming (Tailwind + DaisyUI)
- Tema activo: `luxdark` definido en `src/index.css`
- Tokens semánticos de color/shape unificados en DaisyUI theme
- Fondo y color base del `body` derivados de variables del tema

### Regla de estilos globales
- No aplicar hacks globales para controles de formulario (`select`, `range`, etc.).
- Los estilos de formularios deben vivir en primitivas de `src/components/ui`.
- `src/index.css` se reserva para base/theme/utilidades globales mínimas.

### Color Palette
- **Primary**: Cyan (500-700) - Acciones principales, estados activos
- **Secondary**: Gray (600-800) - Backgrounds, controles
- **Danger**: Red (600) - Acciones destructivas
- **Success**: Green - Confirmaciones (poco usado)
- **Warning**: Orange - MIDI learning, estados de alerta

### Spacing System
Siguiendo escala Tailwind estándar (0.25rem increments):
- **xs**: 0.75rem (3)
- **sm**: 1rem (4)  
- **md**: 1.5rem (6)
- **lg**: 2rem (8)
- **xl**: 3rem (12)

### Typography
- **Font Family**: System fonts (sans-serif)
- **Mono**: Para valores numéricos y códigos
- **Sizes**: text-xs to text-xl, responsive scaling

### Border Radius
- **sm**: 0.25rem - Elementos pequeños
- **md**: 0.375rem (default) - Botones, inputs
- **lg**: 0.5rem - Cards, panels
- **full**: Para elementos circulares

### Shadows
- **Glow effects**: `shadow-cyan-500/30` para elementos activos
- **Elevation**: `shadow-lg` para modals y dropdowns
- **Ring focus**: `focus:ring-2 focus:ring-cyan-500` universal

---

## Internacionalización

### Sistema Actual
**Tecnología**: Rosetta  
**Idiomas**: Español (es), English (en)  
**Hook**: `useTranslation()` 

### Cobertura de Traducción
- ✅ **100% UI components**: Todos los textos visibles
- ✅ **Dynamic content**: Nombres de renderers, shapes, etc.
- ✅ **Error messages**: Validaciones y alerts
- ✅ **Tooltips**: Ayuda contextual
- ✅ **ARIA labels**: Accesibilidad

### Patrones de Uso
```typescript
// Hook para components React
const { t } = useTranslation()
return <button>{t('common.save')}</button>

// Función directa para schemas
import { t } from '../i18n'
const schema = { label: t('controls.scaleSize') }
```

### Organización de Claves
- `common.*` - Textos reutilizables
- `header.*` - Header de aplicación  
- `sequencer.*` - Controles de secuenciador
- `controls.*` - Labels de controles
- `midi.*` - Funcionalidades MIDI
- `patterns.*` - Gestión de patrones
- `ui.*` - Acciones de interfaz

---

## Responsive Design

### Breakpoints Implementados
- **Mobile**: < 640px - Layout vertical, controls colapsados
- **Desktop**: >= 640px - Layout horizontal, panels laterales

### Patterns Responsive
1. **Flex direction switching**: `flex-col sm:flex-row`
2. **Grid adaptativo**: `grid-cols-1 sm:grid-cols-2`
3. **Spacing progresivo**: `gap-2 sm:gap-4`
4. **Text scaling**: `text-sm sm:text-base`

### Fullscreen Mode
- **Overlay toggle**: Auto-hide después de 3s de inactividad
- **Touch-friendly**: Botones más grandes en modo táctil
- **Performance optimized**: Rendering directo sin DOM overhead

---

## Eventos de Teclado

### Sistema de Keyboard Shortcuts

#### Hook: useKeyboardShortcuts
**Archivo**: [`src/hooks/useKeyboardShortcuts.ts`](../src/hooks/useKeyboardShortcuts.ts)

Sistema centralizado para gestión de atajos de teclado globales de la aplicación.

#### Atajos Implementados

| Tecla | Acción | Contexto |
|-------|--------|----------|
| `F11` | Toggle fullscreen | Global |
| `Escape` | Cerrar todos los drawers | Solo en fullscreen |
| `Ctrl+1` | Toggle panel de control | Solo en fullscreen |
| `Ctrl+2` | Toggle panel del secuenciador | Solo en fullscreen |
| `Ctrl+`` | Toggle consola MIDI | Global |
| `Space` | Toggle play/stop del secuenciador | Global |

#### Implementación del Hook

```typescript
export interface ShortcutActions {
  toggleFullscreen: () => void;
  closeAllDrawers: () => void;
  toggleControlDrawer: () => void;
  toggleSequencerDrawer: () => void;
  toggleConsole: () => void;
  togglePlayStop: () => void;
}

export const useKeyboardShortcuts = (actions: ShortcutActions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F11 - Toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        actions.toggleFullscreen();
        return;
      }

      // Escape - Close all drawers (only in fullscreen)
      if (e.key === 'Escape' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        actions.closeAllDrawers();
        return;
      }

      // Ctrl+1 - Toggle control drawer (in fullscreen)
      if (e.key === '1' && e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.toggleControlDrawer();
        return;
      }

      // Space - Toggle play/stop sequencer
      if (e.key === ' ' && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        actions.togglePlayStop();
        return;
      }
      
      // Más atajos...
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions]);
};
```

#### Uso en Componentes

```typescript
// En MainApp.tsx
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

const { drawers, actions: drawerActions } = useDrawerStates();
const handleToggleFullscreen = () => toggleFullscreen(appRef);

// Configurar keyboard shortcuts
useKeyboardShortcuts({
  toggleFullscreen: handleToggleFullscreen,
  closeAllDrawers: drawerActions.closeAllDrawers,
  toggleControlDrawer: drawerActions.toggleDrawer,
  toggleSequencerDrawer: drawerActions.toggleSequencerDrawer,
  toggleConsole: drawerActions.toggleConsole,
  togglePlayStop: handleTogglePlayStop,
});
```

#### Características del Sistema

✅ **Event Prevention**: `preventDefault()` para evitar comportamientos por defecto del browser  
✅ **Modifier Keys Validation**: Verificación estricta de Ctrl/Shift/Alt para evitar conflictos  
✅ **Context-Aware**: Algunos atajos solo funcionan en fullscreen  
✅ **Hook Pattern**: Fácil integración en cualquier componente  
✅ **Type Safety**: Interface TypeScript para todas las acciones  

### Navegación por Teclado en Componentes

#### Headless UI Components
Los componentes de Headless UI implementan navegación por teclado completa automáticamente:

- **Select/Listbox**: 
  - `↑/↓` - Navegar opciones
  - `Enter/Space` - Seleccionar
  - `Escape` - Cerrar
  - `Tab` - Salir del componente
  - `Typing` - Búsqueda incremental

- **Switch**: 
  - `Space/Enter` - Toggle
  - `Tab` - Focus/Blur

- **Dialog/Modal** (futuro):
  - `Escape` - Cerrar
  - `Tab` - Trap focus dentro del modal

#### Controles Nativos
- **Range sliders**: Arrow keys para ajustar valores
- **Buttons**: Enter/Space para activar
- **Form inputs**: Tab navigation estándar

### Cómo Agregar Nuevos Atajos

1. **Agregar acción a la interface**:
```typescript
export interface ShortcutActions {
  // Existentes...
  saveProject: () => void;
}
```

2. **Implementar handler en el hook**:
```typescript
// Nueva combinación - ejemplo: Ctrl+S para guardar
if (e.key === 's' && e.ctrlKey && !e.shiftKey && !e.altKey) {
  e.preventDefault();
  actions.saveProject();
  return;
}
```

3. **Conectar con la lógica del componente**:
```typescript
useKeyboardShortcuts({
  // Existentes...
  saveProject: handleSaveProject,
});
```

### Mejoras Futuras

#### Sistema de Atajos Avanzado
- **Overlay de atajos**: Visual overlay con `?` o `F1` mostrando todos los atajos
- **Personalización**: Settings panel para customizar combinaciones
- **Contextos específicos**: Atajos que cambian según la sección activa
- **Conflictos**: Detección automática y resolución de conflictos

#### Navegación Avanzada
- **Vim-style navigation**: h/j/k/l para power users
- **Focus trapping**: En modals y drawers
- **Skip links**: Para screen readers

---

## Accesibilidad

### Implementado
- ✅ **Keyboard navigation**: Tab order correcto, Enter/Space/Arrow keys
- ✅ **Screen readers**: ARIA labels, descriptions, live regions
- ✅ **Focus management**: Visible focus rings, trap focus en modals
- ✅ **Color contrast**: WCAG AA compliance en todos los elementos
- ✅ **Semantic HTML**: Headers, labels, buttons correctos
- ✅ **Keyboard shortcuts**: Sistema centralizado de atajos de teclado

### Headless UI Benefits
- ✅ **WAI-ARIA patterns**: Implementados automáticamente
- ✅ **Focus management**: Auto en modals y menus
- ✅ **Keyboard interactions**: Completas out-of-the-box
- ✅ **Live regions**: Para updates dinámicos

### Ejemplos
```typescript
// ARIA labels descriptivos
<button aria-label={t('patterns.assignMidi', { name: pattern.name })}>

// Focus ring universal  
className="focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"

// Screen reader context
<span className="sr-only">{t('accessibility.currentStep')}</span>
```

---

## Patrones de Diseño

### 1. Progressive Disclosure
- **CollapsibleSection**: Información organizada jerárquicamente
- **Drawer panels**: Controles ocultos hasta necesarios
- **Fullscreen mode**: UI mínima para performance

### 2. Feedback Inmediato
- **Real-time preview**: Cambios reflejados instantáneamente
- **Visual states**: Loading, success, error, learning
- **Micro-animations**: Transiciones de 200ms estándar

### 3. Consistent Interactions
- **Button variants**: Primary/secondary/danger en toda la app
- **Hover states**: Elevación y color changes universales
- **Focus states**: Ring cyan consistente

### 4. Error Prevention
- **Validation**: Min/max values en sliders
- **Confirmation**: Dialogs para acciones destructivas
- **Undo-friendly**: Non-destructive changes donde posible

---

## Mejoras Futuras

### Componentes Headless UI potenciales

#### 1. Dialog/Modal System
```typescript
// Para configuración avanzada, confirmaciones
<Dialog open={isOpen} onClose={setIsOpen}>
  <Dialog.Panel>
    <Dialog.Title>Configuración Avanzada</Dialog.Title>
    {/* Settings content */}
  </Dialog.Panel>
</Dialog>
```

#### 2. Popover Components
```typescript
// Para MIDI learn UI, ayuda contextual
<Popover>
  <Popover.Button>MIDI Learn</Popover.Button>
  <Popover.Panel>
    <MidiMappingInterface />
  </Popover.Panel>
</Popover>
```

#### 3. Menu/Context Menu
```typescript
// Para acciones de patterns, sequencer options
<Menu>
  <Menu.Button>Opciones</Menu.Button>
  <Menu.Items>
    <Menu.Item>Duplicar Patrón</Menu.Item>
    <Menu.Item>Eliminar</Menu.Item>
  </Menu.Items>
</Menu>
```

#### 4. Tab System avanzado (opcional)
```typescript
// Nota: ya existe la primitiva `Tabs` en `src/components/ui/Tabs.tsx`.
// Esta opción aplica solo si se requiere migrar a Tab.Group de Headless UI.
<Tab.Group>
  <Tab.List>
    <Tab>Renderer</Tab>
    <Tab>MIDI</Tab>
    <Tab>Secuenciador</Tab>
  </Tab.List>
  <Tab.Panels>
    <Tab.Panel><RendererControls /></Tab.Panel>
    <Tab.Panel><MidiControls /></Tab.Panel>
    <Tab.Panel><SequencerControls /></Tab.Panel>
  </Tab.Panels>
</Tab.Group>
```

#### 5. RadioGroup
```typescript
// Para opciones exclusivas
<RadioGroup value={interpolationType} onChange={setInterpolationType}>
  <RadioGroup.Option value="linear">Linear</RadioGroup.Option>
  <RadioGroup.Option value="easeIn">Ease In</RadioGroup.Option>
  <RadioGroup.Option value="easeOut">Ease Out</RadioGroup.Option>
</RadioGroup>
```

#### 6. Combobox (Select + Search)
```typescript
// Para búsqueda de dispositivos MIDI, patterns
<Combobox value={selected} onChange={setSelected}>
  <Combobox.Input onChange={handleSearch} />
  <Combobox.Options>
    {filteredItems.map(item => (
      <Combobox.Option key={item.id} value={item} />
    ))}
  </Combobox.Options>
</Combobox>
```

### UI/UX Improvements

#### 1. **Design System Expansion**
- Definir color tokens semánticos
- Sistema de spacing más consistente
- Typography scale más definida
- Motion design guidelines

#### 2. **Component Library**
- Storybook para documentar components
- Unit tests para components críticos
- Visual regression testing
- Performance benchmarks

#### 3. **Advanced Interactions**
- Drag & drop para reordering
- ✅ **Keyboard shortcuts system**: Sistema centralizado implementado
- Keyboard shortcuts overlay con ayuda visual
- Gesture support para mobile
- Multi-touch interactions
- Vim-style navigation para power users

#### 4. **Theming System**
- User preference persistence

#### 5. **Performance Optimization**
- Memoization de expensive components
- Bundle size analysis

### Mobile & Touch Improvements

#### 1. **Touch-First Controls**
- Larger touch targets (min 44px)
- Swipe gestures para navigation
- Pull-to-refresh patterns
- Touch-optimized sliders

#### 2. **Progressive Web App**
- Service worker para offline
- App manifest
- Install prompts
- Splash screen

#### 3. **Mobile Layout Patterns**
- Bottom navigation
- Collapsible toolbars
- Sheet modals
- Safe area handling

### Integration Improvements

#### 1. **MIDI Enhancements**
- Visual MIDI monitor component
- MIDI CC value displays
- Device status indicators
- Connection stability feedback

#### 2. **Sequencer UX**
- Grid resize handles
- Step highlighting animations
- Pattern preview on hover
- Velocity visualization

#### 3. **Renderer Controls**
- Real-time parameter visualization
- A/B comparison mode
- Preset management UI
- Parameter automation curves

---

## Estado Actual del Sistema

### ✅ Implementado y Estable
- **23 iconos** optimizados con vite-plugin-svgr
- **Button system** completo con 4 variants y 6 sizes (`sm/md/lg/icon/circle/fab`)
- **Select component** dual API con Headless UI
- **Switch component** para toggles modernos  
- **Primitivas de layout/feedback**: `Card`, `Sheet`, `Alert`, `EmptyState`, `ErrorState`, `PanelHeader`, `StatTile`, `Tabs`
- **Tema DaisyUI (`luxdark`)** integrado y activo
- **Sistema de eventos de teclado** con hook centralizado
- **6 atajos de teclado** implementados (F11, Escape, Ctrl+1/2/`, Space)
- **Navegación por teclado** completa en componentes Headless UI
- **Internacionalización** completa (ES/EN)
- **Responsive design** básico
- **Accesibilidad** level AA

### 🚧 En Desarrollo
- Consolidación incremental de flows con primitives en `ui/`
- Soporte de gestos avanzados
- Optimización de performance en overlays/debug

### 📋 Roadmap
- Design system consolidation
- Component testing suite
- Advanced theming
- PWA implementation
- Mobile-first improvements

---

**Fecha de actualización**: Febrero 28, 2026  
**Versión del sistema**: v2.1.0  
**Mantenedores**: AI Development Team