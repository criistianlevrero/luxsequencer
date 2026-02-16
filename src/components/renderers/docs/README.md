# Renderer System Guide

This guide describes how to build and register renderers in LuxSequencer. It targets humans and AI agents who need a consistent, reusable approach.

## Goals

- Standardize renderer structure and registration.
- Reuse shared helpers and control schemas.
- Keep renderers isolated and predictable.

## Key Concepts

### RendererDefinition

All renderers are registered via the `RendererDefinition` interface:

```ts
export interface RendererDefinition {
  id: string;
  name: string;
  component: React.FC<{ className?: string }>;
  controlSchema: AccordionItem[] | (() => AccordionItem[]);
  declarativeSchema?: DeclarativeControlSchema;
  validation?: RendererValidationSpec;
  fallbackRenderer?: string;
  version?: string;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onRecover?: () => void;
}
```

Important fields:

- `id`: stable, unique string. Use lowercase and no spaces.
- `name`: human-readable name displayed in UI.
- `component`: the renderer React component.
- `controlSchema`: legacy accordion control schema (still used by default UI).
- `declarativeSchema`: optional declarative control schema (new system).
- `validation`: optional settings validation.

### Renderer Folder Structure

Create a dedicated folder under `src/components/renderers/`:

```
src/components/renderers/<your-renderer>/
  YourRenderer.tsx
  your-renderer-schema.ts
  index.ts
```

Recommended file roles:

- `YourRenderer.tsx`: renderer component.
- `your-renderer-schema.ts`: controls and defaults.
- `index.ts`: exports `RendererDefinition`.

## Renderer Registration

Register your renderer in:

- `src/components/renderers/index.ts`

Example:

```ts
import { yourRenderer } from './your-renderer';

export const renderers: Record<string, RendererDefinition> = {
  webgl: webglRenderer,
  concentric: concentricRenderer,
  yourRenderer: yourRenderer
};
```

## Control Schemas

There are two systems. Pick one or both:

### 1) Legacy Accordion Schema

Located in `src/types.ts` and used widely by existing UI.

```ts
export type AccordionItem = ControlSection | SeparatorSection;

export interface ControlSection {
  title: string;
  defaultOpen?: boolean;
  controls: ControlConfig[];
}
```

For a new renderer, implement a function that returns `AccordionItem[]`:

```ts
export const getYourSchema = (): AccordionItem[] => [
  {
    title: 'Shape',
    defaultOpen: true,
    controls: [
      { type: 'slider', id: 'renderer.your.size', label: 'Size', min: 0, max: 100, step: 1 }
    ]
  }
];
```

### 2) Declarative Schema

Located in `src/types/declarativeControls.ts`. It allows richer metadata and dynamic rules. You can attach it to `declarativeSchema`.

```ts
export const yourDeclarativeSchema: DeclarativeControlSchema = {
  schemaVersion: '1.0.0',
  rendererId: 'your-renderer',
  rendererName: 'Your Renderer',
  description: 'Example renderer',
  sections: [
    {
      id: 'shape',
      title: 'Shape',
      controls: [
        {
          type: 'slider',
          id: 'renderer.your.size',
          label: 'Size',
          min: 0,
          max: 100,
          step: 1
        }
      ]
    }
  ]
};
```

If you use the declarative schema, keep `category` fields in the standard controls if you convert to `RendererControlSpec`. Categories drive section grouping.

## Settings Paths

Use hierarchical paths for settings. Examples:

- `renderer.<rendererId>.<property>` for renderer-specific settings.
- `common.<property>` for shared settings.

Examples:

- `renderer.webgl.scaleSize`
- `common.animationSpeed`

## State Access Pattern

Renderers read settings via the texture store:

```ts
const settings = useTextureStore(state => state.currentSettings);
const scaleSize = getNestedProperty(settings, 'renderer.your.size') as number;
```

Use the store action for updates:

```ts
const { setCurrentSetting } = useTextureStore.getState();
setCurrentSetting('renderer.your.size', 42);
```

## Shared Helpers

Use the existing helpers instead of re-implementing:

- `getNestedProperty` in `src/utils/settingsMigration.ts`
- `mapPropertyIdToPath` in `src/utils/settingsMigration.ts`
- `getScaleTextureSchema` in `src/components/renderers/shared/scale-texture-schema.ts`
- `GradientEditor` in `src/components/controls/GradientEditor.tsx`

If you need gradients, follow the shared editor pattern used in the scale texture schema.

## Validation

Optional, but recommended for safety when switching renderers or migrating settings:

- Use `validateRendererSettings` from `src/utils/validation.ts`.
- Provide a `RendererValidationSpec` if you need custom validation.

## Error Handling

Renderers can provide custom error hooks or a fallback renderer:

- `fallbackRenderer`: ID of a known-safe renderer.
- `onError`: log or report errors.
- `onRecover`: reset local state or re-init GL.

## Example Renderer Skeleton

```ts
// src/components/renderers/your-renderer/index.ts
import type { RendererDefinition } from '../types';
import YourRenderer from './YourRenderer';
import { getYourSchema } from './your-renderer-schema';

export const yourRenderer: RendererDefinition = {
  id: 'your-renderer',
  name: 'Your Renderer',
  component: YourRenderer,
  controlSchema: getYourSchema
};
```

```tsx
// src/components/renderers/your-renderer/YourRenderer.tsx
import React, { useMemo } from 'react';
import { useTextureStore } from '../../../store';
import { getNestedProperty } from '../../../utils/settingsMigration';

const YourRenderer: React.FC<{ className?: string }> = ({ className }) => {
  const settings = useTextureStore(state => state.currentSettings);
  const size = useMemo(() => {
    return (getNestedProperty(settings, 'renderer.your.size') as number) ?? 0;
  }, [settings]);

  return (
    <div className={className}>
      Rendered size: {size}
    </div>
  );
};

export default YourRenderer;
```

## Conventions

- Keep renderer logic inside its folder.
- Avoid direct mutations; always use store actions.
- Use `getNestedProperty` for hierarchical settings.
- Prefer shared UI controls and helpers.
- Keep IDs stable to avoid breaking saved projects.

## Checklist for New Renderers

- [ ] Create folder under `src/components/renderers/`.
- [ ] Implement renderer component.
- [ ] Implement control schema (legacy and/or declarative).
- [ ] Register in `src/components/renderers/index.ts`.
- [ ] Add defaults and validation if needed.
- [ ] Test switching between renderers and saved projects.
