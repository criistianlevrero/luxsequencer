

import { webglRenderer } from './webgl';
import { concentricRenderer } from './concentric';
import type { RendererDefinition } from './types';

export const renderers: Record<string, RendererDefinition> = {
  [webglRenderer.id]: webglRenderer,
  [concentricRenderer.id]: concentricRenderer,
};

export type RendererId = keyof typeof renderers;