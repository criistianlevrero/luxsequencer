import type { RendererDefinition } from '../types';
import DVDScreensaverRenderer from './DVDScreensaverRenderer';
import { getDvdScreensaverSchema } from './dvd-screensaver-schema';
import { dvdScreensaverDeclarativeSchema } from './dvd-screensaver-declarative-schema';

export const dvdScreensaverRenderer: RendererDefinition = {
  id: 'dvd-screensaver',
  name: 'DVD Screensaver',
  component: DVDScreensaverRenderer,
  controlSchema: getDvdScreensaverSchema,
  declarativeSchema: dvdScreensaverDeclarativeSchema,
};
