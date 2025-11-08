
import { RendererDefinition } from '../types';
import Canvas2DRenderer from './Canvas2DRenderer';
import { scaleTextureSchema } from '../shared/scale-texture-schema';

export const canvas2DRenderer: RendererDefinition = {
  id: 'canvas2d',
  name: 'Escamas Canvas2D',
  component: Canvas2DRenderer,
  controlSchema: scaleTextureSchema,
};
