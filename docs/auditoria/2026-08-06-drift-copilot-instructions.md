> **Estado**: VIGENTE · **Fecha**: 2026-08-06 · **Última verificación**: 2026-08-12
>
> 🚚 Mudado desde `docs/auditoria/2026-08-06-drift-por-proyecto.md` de la raíz el 2026-08-12,
> durante la auditoría de Fase 2 de este repo. Reverificado entero contra el código en esa
> sesión; ninguna de las afirmaciones cambió, y se agregaron dos hallazgos nuevos (§1.3 y §2.2).

# Drift en la documentación para agentes de `luxsequencer-core`

Hallazgo de la Fase 1 (2026-08-06), acotado a este repo. Son dos documentos que un agente lee
antes de tocar código, y los dos describen arquitectura que ya no existe.

Importa más que el drift de un README: estos archivos son la vía por la que la arquitectura vieja
se reinyecta en cada sesión de trabajo asistido.

## 1. `.github/copilot-instructions.md`

### 1.1 La versión es incorrecta

> "**Current Version**: Development (package.json shows v0.0.0)"
> — `.github/copilot-instructions.md:11`

La versión real es `0.6-beta` (`package.json:4`), y coincide con la rama de trabajo.

### 1.2 Describe los renderers como módulos React locales

El documento declara este contrato:

```typescript
export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  controlSchema: ControlSection[];
}
```
(`:36-43`)

y lista como renderers disponibles carpetas locales:

> **Available renderers** (src/components/renderers/):
> - `webgl/`: WebGL shader-based scale texture (primary renderer)
> - `concentric/`: Hexagonal concentric patterns
>
> — `:45-47`

Y en el instructivo para agregar uno:

> 1. Create folder in `components/renderers/yourname/`
> — `:162`

**Nada de eso existe.** Tras el refactor a worker-only:

- No hay carpetas `webgl/` ni `concentric/` bajo `src/components/renderers/`. El directorio
  contiene `pipeline/`, `sdk/` y `shared/`, y ningún renderer.
- Los cuatro renderers oficiales viven en el repo `core-renderers` como workers.
- `component` sigue existiendo en el tipo, pero todas las definiciones usan
  `EmptyExternalRenderer = () => null` (`src/components/renderers/index.ts:9`, aplicado en
  `:246`). El dibujado ocurre en el worker; el componente React no pinta nada.
- `controlSchema` se llena con `[]` en las cuatro entradas (`:253`). Los controles reales se
  cargan por schema declarativo desde `core-renderers`.

Un agente que siga este documento creará una carpeta local con un componente React que dibuja
—exactamente el camino que el refactor eliminó.

### 1.3 Documenta un tipo de control que la política vigente prohíbe

> - `type: 'custom'`: React components (e.g., `GradientEditor`)
> — `:51`

La política de controles declarativos estrictos
(`docs/next-steps/graphics-pipeline-refactor.md:259-282`) prohíbe explícitamente inyectar
componentes React desde un renderer. El único lugar del código que todavía renderiza
`type: 'custom'` es `src/components/controls/EnhancedControlPanel.tsx:104`, que es un **módulo
huérfano** sin importadores.

*(Hallazgo agregado el 2026-08-12.)*

## 2. `src/components/ui/README.md`

### 2.1 Inventa una capa que no existe

Documenta cuatro capas:

> - `primitives/`: bloques base de formulario/superficie
> - `composites/`: componentes de mayor complejidad (`AdvancedSelect`, `ColorPicker`, `Vector2DPicker`, etc.)
> - `patterns/`: bloques de presentación reutilizables
> - `foundation/`: tokens y utilidades de estilos (`tokens.ts`)
>
> — `src/components/ui/README.md:11-14`

**`foundation/` no existe** en `src/components/ui/`. Se fue a `lux-ui` en la migración.

Y `composites/` no tiene `AdvancedSelect`: sólo quedan `ColorPicker.tsx` y `Vector2DPicker.tsx`.

### 2.2 `primitives/` ya no contiene ningún componente

El README lo describe como la capa de "bloques base de formulario/superficie", pero
`src/components/ui/primitives/` contiene **un solo archivo**, `index.ts`, y es un barrel de
re-exports puro:

```ts
export {
  Button, Input, Textarea, Select, Switch, Checkbox,
  RadioGroup, Tooltip, FieldLabel, Card, Sheet, Tabs, Slider,
} from '@luxsequencer/ui';
```

De las cuatro capas documentadas, dos ya no tienen código local (`foundation/` no existe,
`primitives/` sólo reexporta) y una perdió la mayoría de sus componentes (`composites/`, 2 de los
3 listados). La única que sigue como se describe es `patterns/`.

Lo que el README describe como la arquitectura de UI de core es, en realidad, la arquitectura de
`lux-ui` vista desde acá.

*(Hallazgo agregado el 2026-08-12.)*

## Qué hacer

No se corrigió ninguno de los dos documentos, por la regla de no arreglar documentación sobre la
marcha. Quedan anotados acá y en el `STATUS.md` de este repo como pendientes de recorte.

Prioridad: `copilot-instructions.md` primero. Es el que los agentes leen automáticamente, y su
drift no es cosmético — induce a construir contra una arquitectura que fue explícitamente
removida.
