
import { RendererDefinition } from '../types';
import WebGlRenderer from './WebGlRenderer';
import { getScaleTextureSchema } from '../shared/scale-texture-schema';

export const webglRenderer: RendererDefinition = {
  id: 'webgl',
  name: 'Escamas WebGL',
  component: WebGlRenderer,
  controlSchema: getScaleTextureSchema,
};
