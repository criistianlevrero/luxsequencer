

import { canvas2DRenderer } from './canvas2d';
import { webglRenderer } from './webgl';
import { concentricRenderer } from './concentric';
import type { RendererDefinition } from './types';

export const renderers: Record<string, RendererDefinition> = {
  [webglRenderer.id]: webglRenderer,
  [canvas2DRenderer.id]: canvas2DRenderer,
  [concentricRenderer.id]: concentricRenderer,
};

export type RendererId = keyof typeof renderers;