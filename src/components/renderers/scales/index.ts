
import { RendererDefinition } from '../types';
import ScalesRenderer from './ScalesRenderer';
import { getScaleTextureSchema } from '../shared/scale-texture-schema';
import { webglRendererControlSpec } from './scales-declarative-schema';

export const webglRenderer: RendererDefinition = {
  id: 'webgl',
  name: 'Escamas WebGL',
  component: ScalesRenderer,
  workerEntry: new URL('./workers/scales.worker.ts', import.meta.url),
  packageManifest: {
    schemaVersion: '1.0.0',
    packageName: 'luxsequencer/renderer-webgl',
    packageVersion: '0.6.0-beta',
    source: 'builtin',
    sdk: {
      minWorkerProtocolVersion: '1.0.0',
    },
  },
  workerRequirements: {
    requiredCapabilities: ['offscreen-canvas', 'webgl2', 'uniform-updates'],
  },
  controlSchema: getScaleTextureSchema,
  declarativeSchema: webglRendererControlSpec,
};
