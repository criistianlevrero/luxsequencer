# UI System

Esta carpeta es la **API pública de UI que consume el core**. Después de la migración a
`@luxsequencer/ui`, es sobre todo una fachada: la mayoría de los componentes ya no se implementan
acá.

Arquitectura completa del sistema de UI: [`docs/ui-system.md`](../../../docs/ui-system.md).
Alcance de la librería compartida: `lux-ui/docs/decisiones/2026-08-11-alcance-de-la-libreria.md`.

## Reglas de uso
- Importar siempre desde [`index.ts`](./index.ts) para mantener una API pública estable.
- Mantener `ui/` libre de lógica de negocio (store, MIDI, renderers, secuenciador).
- Los módulos de `controls/`, `debug/` y `sequencer/` deben componer estas piezas, no redefinir
  componentes base.
- **Antes de crear un componente acá, verificar si corresponde a `lux-ui`.** Lo que es genérico va
  a la librería compartida; acá queda lo acoplado al dominio de LuxSequencer.

## Capas (verificado el 2026-08-18)

Las tres subcarpetas existen, pero **sólo dos contienen código local**:

| Carpeta | Qué hay realmente |
|---|---|
| `primitives/` | **Ningún componente local.** Sólo `index.ts`, un barrel que re-exporta 13 componentes de `@luxsequencer/ui` (`Button`, `Input`, `Select`, `Switch`, …). |
| `composites/` | **2 componentes locales**: `ColorPicker` y `Vector2DPicker`. Los otros 7 (`AdvancedSelect`, `SliderInput`, `RangeSlider`, `CollapsibleSection`, `IconActionButton`, `CompactNumberInput`, `SegmentedGroup`) se re-exportan de `@luxsequencer/ui`. |
| `patterns/` | **8 componentes locales**, todos propios: `Alert`, `EmptyState`, `ErrorState`, `MetricCard`, `MiniChartCard`, `PanelHeader`, `SequencerCell`, `StatTile`. |

Sueltos en la raíz de la carpeta: `icons.tsx` y el barrel principal `index.ts`.

**No existe una capa `foundation/`.** Los tokens y utilidades de estilo se fueron a `lux-ui` en la
migración. Si una versión anterior de este documento te trajo hasta acá buscándola, no está.

En la práctica, entonces: `patterns/` es la única capa que sigue siendo de core. `primitives/` es
una fachada pura, y `composites/` es una fachada con dos excepciones.

## Stack visual
- **Tailwind CSS** como base utility-first.
- **Headless UI** para interacciones complejas accesibles (ej. `Select`, `Switch`).
- **DaisyUI** (`^5.5.19`, cargado desde `src/index.css`) en modo opt-in y consistente: evitar
  mezclar patrones distintos del mismo control en la misma vista.

## Criterios de contribución
- Priorizar variantes y tokens semánticos sobre clases duplicadas.
- Si un componente requiere interacción compleja con teclado/foco, considerar Headless UI antes de
  implementación manual.
- Si el componente encapsula layout o visualización específica de una vista, ubicarlo en
  `patterns/` o fuera de `ui/` según acoplamiento.
- Al cambiar la API pública, actualizar este README y
  [`docs/ui-system.md`](../../../docs/ui-system.md).
