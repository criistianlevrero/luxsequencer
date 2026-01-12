
import { RendererDefinition } from '../types';
import Canvas2DRenderer from './Canvas2DRenderer';
import { getScaleTextureSchema } from '../shared/scale-texture-schema';

export const canvas2dRenderer: RendererDefinition = {
  id: 'canvas2d',
  name: 'Escamas Canvas 2D',
  component: Canvas2DRenderer,
  controlSchema: getScaleTextureSchema,
};
