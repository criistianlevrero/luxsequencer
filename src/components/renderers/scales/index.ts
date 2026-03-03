
import { RendererDefinition } from '../types';
import ScalesRenderer from './ScalesRenderer';
import { getScaleTextureSchema } from '../shared/scale-texture-schema';
import { webglRendererControlSpec } from './scales-declarative-schema';

export const webglRenderer: RendererDefinition = {
  id: 'webgl',
  name: 'Escamas WebGL',
  component: ScalesRenderer,
  workerEntry: new URL('./workers/scales.worker.ts', import.meta.url),
  controlSchema: getScaleTextureSchema,
  declarativeSchema: webglRendererControlSpec,
};

export const webglRendererLegacy: RendererDefinition = {
  id: 'webgl-legacy',
  name: 'Escamas WebGL (Legacy)',
  component: ScalesRenderer,
  controlSchema: getScaleTextureSchema,
  declarativeSchema: webglRendererControlSpec,
};
