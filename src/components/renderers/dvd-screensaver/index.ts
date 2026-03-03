import type { RendererDefinition } from '../types';
import DvdScreensaverRenderer from './DvdScreensaverRenderer';
import { getDvdScreensaverSchema } from './dvd-screensaver-schema';
import { dvdScreensaverDeclarativeSchema } from './dvd-screensaver-declarative-schema';

export const dvdScreensaverRenderer: RendererDefinition = {
  id: 'dvd-screensaver',
  name: 'DVD Screensaver',
  component: DvdScreensaverRenderer,
  workerEntry: new URL('./workers/dvd-screensaver.worker.ts', import.meta.url),
  workerRequirements: {
    requiredCapabilities: ['offscreen-canvas', 'canvas2d', 'uniform-updates'],
  },
  controlSchema: getDvdScreensaverSchema,
  declarativeSchema: dvdScreensaverDeclarativeSchema,
};
