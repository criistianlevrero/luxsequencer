
import { RendererDefinition } from '../types';
import ConcentricRenderer from './ConcentricRenderer';
import ConcentricWebGLRenderer from './ConcentricWebGLRenderer';
import { getConcentricSchema } from './concentric-schema';
import { concentricDeclarativeSchema } from './concentric-declarative-schema';

export const concentricRenderer: RendererDefinition = {
  id: 'concentric',
  name: 'Concénctrico',
  component: ConcentricRenderer,
  controlSchema: getConcentricSchema,
  declarativeSchema: concentricDeclarativeSchema,
};

export const concentricWebglRenderer: RendererDefinition = {
  id: 'concentric-webgl',
  name: 'Concénctrico (WebGL)',
  component: ConcentricWebGLRenderer,
  controlSchema: getConcentricSchema,
  declarativeSchema: concentricDeclarativeSchema,
};
