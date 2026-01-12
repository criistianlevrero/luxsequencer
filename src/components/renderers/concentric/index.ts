
import { RendererDefinition } from '../types';
import ConcentricRenderer from './ConcentricRenderer';
import { getConcentricSchema } from './concentric-schema';

export const concentricRenderer: RendererDefinition = {
  id: 'concentric',
  name: 'Concénctrico',
  component: ConcentricRenderer,
  controlSchema: getConcentricSchema,
};
