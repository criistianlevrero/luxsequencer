# UI System

Esta carpeta contiene el sistema de componentes de UI reutilizables de LuxSequencer.

## Reglas de uso
- Importar siempre desde [`index.ts`](./index.ts) para mantener una API pública estable.
- Mantener `ui/` libre de lógica de negocio (store, MIDI, renderers, secuenciador).
- Los módulos de `controls/`, `debug/` y `sequencer/` deben componer estas piezas, no redefinir componentes base.

## Capas (actual)
- `primitives/`: bloques base de formulario/superficie (`Button`, `Input`, `Select`, `Switch`, etc.).
- `composites/`: componentes de mayor complejidad (`AdvancedSelect`, `ColorPicker`, `Vector2DPicker`, etc.).
- `patterns/`: bloques de presentación reutilizables (`MetricCard`, `MiniChartCard`, estados, métricas).
- `foundation/`: tokens y utilidades de estilos (`tokens.ts`).

La estructura por capas está activa y los componentes se organizan físicamente en estas subcarpetas.

## Stack visual
- **Tailwind CSS** como base utility-first.
- **Headless UI** para interacciones complejas accesibles (ej. `Select`, `Switch`).
- **DaisyUI** en modo opt-in y consistente (evitar mezclar patrones distintos del mismo control en la misma vista).

## API pública actual (barrel)
El barrel principal exporta componentes de:
- Primitivas de entrada e interacción.
- Compuestos reutilizables de controles declarativos.
- Patrones de presentación para paneles/estado/debug.

## Criterios de contribución
- Priorizar variantes y tokens semánticos sobre clases duplicadas.
- Si un componente requiere interacción compleja con teclado/foco, considerar Headless UI antes de implementación manual.
- Si el componente encapsula layout o visualización específica de una vista, ubicarlo en `patterns` o fuera de `ui` según acoplamiento.
- Actualizar este README y `docs/ui-system.md` al introducir nuevas primitives o cambiar la API pública.
