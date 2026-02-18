

import { webglRenderer } from './webgl';
import { concentricRenderer, concentricWebglRenderer } from './concentric';
import type { RendererDefinition } from './types';

export const renderers: Record<string, RendererDefinition> = {
  [webglRenderer.id]: webglRenderer,
  [concentricRenderer.id]: concentricRenderer,
  [concentricWebglRenderer.id]: concentricWebglRenderer,
};

export type RendererId = keyof typeof renderers;