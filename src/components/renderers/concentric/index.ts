
import { RendererDefinition } from '../types';
import ConcentricRenderer from './ConcentricRenderer';
import { getConcentricSchema } from './concentric-schema';
import { concentricDeclarativeSchema } from './concentric-declarative-schema';

export const concentricRenderer: RendererDefinition = {
  id: 'concentric',
  name: 'Concénctrico',
  component: ConcentricRenderer,
  workerEntry: new URL('./workers/concentric.worker.ts', import.meta.url),
  workerRequirements: {
    requiredCapabilities: ['offscreen-canvas', 'canvas2d', 'uniform-updates'],
  },
  controlSchema: getConcentricSchema,
  declarativeSchema: concentricDeclarativeSchema,
};
