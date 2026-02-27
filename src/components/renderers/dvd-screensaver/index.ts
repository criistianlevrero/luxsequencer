import type { RendererDefinition } from '../types';
import DvdScreensaverRenderer from './DvdScreensaverRenderer';
import { getDvdScreensaverSchema } from './dvd-screensaver-schema';
import { dvdScreensaverDeclarativeSchema } from './dvd-screensaver-declarative-schema';

export const dvdScreensaverRenderer: RendererDefinition = {
  id: 'dvd-screensaver',
  name: 'DVD Screensaver',
  component: DvdScreensaverRenderer,
  controlSchema: getDvdScreensaverSchema,
  declarativeSchema: dvdScreensaverDeclarativeSchema,
};
