
import { RendererDefinition } from '../types';
import WebGlRenderer from './WebGlRenderer';
import { scaleTextureSchema } from '../shared/scale-texture-schema';

export const webglRenderer: RendererDefinition = {
  id: 'webgl',
  name: 'Escamas WebGL',
  component: WebGlRenderer,
  controlSchema: scaleTextureSchema,
};
