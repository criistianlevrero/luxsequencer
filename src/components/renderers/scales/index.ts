
import { RendererDefinition } from '../types';
import ScalesRenderer from './ScalesRenderer';
import { getScaleTextureSchema } from '../shared/scale-texture-schema';
import { webglRendererControlSpec } from './scales-declarative-schema';

export const webglRenderer: RendererDefinition = {
  id: 'webgl',
  name: 'Escamas WebGL',
  component: ScalesRenderer,
  workerEntry: new URL('./workers/scales.worker.ts', import.meta.url),
  workerRequirements: {
    requiredCapabilities: ['offscreen-canvas', 'webgl2', 'uniform-updates'],
  },
  controlSchema: getScaleTextureSchema,
  declarativeSchema: webglRendererControlSpec,
};
