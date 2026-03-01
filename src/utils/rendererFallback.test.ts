import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../components/renderers', () => ({
  renderers: {
    webgl: {
      id: 'webgl',
      name: 'WebGL',
      component: () => null,
      controlSchema: [],
    },
    concentric: {
      id: 'concentric',
      name: 'Concentric',
      component: () => null,
      controlSchema: [],
    },
    'dvd-screensaver': {
      id: 'dvd-screensaver',
      name: 'DVD',
      component: () => null,
      controlSchema: [],
    },
  },
}));

vi.mock('../config', () => ({
  env: {
    debug: {
      validation: false,
    },
  },
}));

import { getFallbackManager } from './rendererFallback';

const resetManagerState = () => {
  const manager = getFallbackManager();
  manager.enableRenderer('webgl');
  manager.enableRenderer('concentric');
  manager.enableRenderer('dvd-screensaver');
  manager.setFallbackChain('webgl', ['concentric']);
  manager.setFallbackChain('concentric', []);
  return manager;
};

describe('RendererFallbackManager', () => {
  beforeEach(() => {
    resetManagerState();
  });

  it('returns configured fallback for webgl', () => {
    const manager = getFallbackManager();

    const fallback = manager.getNextFallback('webgl');

    expect(fallback?.id).toBe('concentric');
  });

  it('returns null when configured fallback is disabled', () => {
    const manager = getFallbackManager();
    manager.disableRenderer('concentric');

    const fallback = manager.getNextFallback('webgl');

    expect(fallback).toBeNull();
  });

  it('getBestAvailableRenderer returns preferred renderer when available', () => {
    const manager = getFallbackManager();

    const renderer = manager.getBestAvailableRenderer('webgl');

    expect(renderer?.id).toBe('webgl');
  });

  it('getBestAvailableRenderer returns fallback when preferred is disabled', () => {
    const manager = getFallbackManager();
    manager.disableRenderer('webgl');

    const renderer = manager.getBestAvailableRenderer('webgl');

    expect(renderer?.id).toBe('concentric');
  });

  it('setFallbackChain ignores unknown fallback ids', () => {
    const manager = getFallbackManager();
    manager.setFallbackChain('webgl', ['missing-renderer', 'concentric']);

    const chain = manager.getFallbackChain('webgl');

    expect(chain.map((renderer) => renderer.id)).toEqual(['concentric']);
  });
});
