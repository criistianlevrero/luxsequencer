

import { webglRenderer } from './webgl';
import { concentricRenderer, concentricWebglRenderer } from './concentric';
import { dvdScreensaverRenderer } from './dvd-screensaver';
import type { RendererDefinition } from './types';

export const renderers: Record<string, RendererDefinition> = {
  [webglRenderer.id]: webglRenderer,
  [concentricRenderer.id]: concentricRenderer,
  [concentricWebglRenderer.id]: concentricWebglRenderer,
  [dvdScreensaverRenderer.id]: dvdScreensaverRenderer,
};

export type RendererId = keyof typeof renderers;