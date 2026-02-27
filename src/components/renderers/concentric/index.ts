
import { RendererDefinition } from '../types';
import ConcentricWebGLRenderer from './ConcentricWebGLRenderer';
import { getConcentricSchema } from './concentric-schema';
import { concentricDeclarativeSchema } from './concentric-declarative-schema';

export const concentricRenderer: RendererDefinition = {
  id: 'concentric',
  name: 'Concénctrico',
  component: ConcentricWebGLRenderer,
  controlSchema: getConcentricSchema,
  declarativeSchema: concentricDeclarativeSchema,
};
