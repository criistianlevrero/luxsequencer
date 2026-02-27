# UI Primitives

Esta carpeta contiene las primitivas visuales reutilizables del sistema.

## Regla de uso
- Importar siempre desde [`index.ts`](./index.ts).
- Mantener los componentes de `ui` libres de lógica de negocio (store, MIDI, secuenciador, etc.).
- `controls/` debe componer estas primitivas, no redefinirlas.

## Estado actual
- `Button`, `Select`, `Switch`, `CollapsibleSection`, `SequencerCell`, `SliderInput` están disponibles vía barrel.
- `icons` vive en `ui/icons.tsx` y es el punto recomendado para iconografía reutilizable.
