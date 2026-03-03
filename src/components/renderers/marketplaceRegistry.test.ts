import { describe, expect, it } from 'vitest';
import { buildMarketplaceToolKey } from './sdk/toolIdentity';
import { getAllRenderers, getMarketplaceRendererRegistry, renderers, resolveRendererDefinition } from './index';

describe('marketplace renderer registry', () => {
  it('resolves builtin renderer by canonical key', () => {
    const key = buildMarketplaceToolKey(renderers.webgl.packageManifest!);
    const resolved = resolveRendererDefinition(key);

    expect(resolved?.id).toBe('webgl');
  });

  it('loads external renderer from hardcoded config when key is valid', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';

    const registry = getMarketplaceRendererRegistry([
      {
        id: 'neon',
        key,
        name: 'Neon',
        workerFileName: 'neon.worker.ts',
        requiredCapabilities: ['offscreen-canvas', 'canvas2d'],
        packageManifest: {
          schemaVersion: '1.0.0',
          publisherId: 'visualcrew',
          repositoryId: 'lux-pack',
          packageId: 'renderers',
          packageVersion: '1.0.0',
          tool: {
            kind: 'renderer',
            id: 'neon',
            versionMajor: 1,
          },
          source: 'builtin',
          sdk: {
            minWorkerProtocolVersion: '1.0.0',
          },
        },
      },
    ]);

    expect(registry[key]).toBeTruthy();
    expect(registry[key]?.id).toBe(key);
  });

  it('hides external renderer when hardcoded key does not match manifest key', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';

    const registry = getMarketplaceRendererRegistry([
      {
        id: 'neon',
        key: 'visualcrew/lux-pack:renderer/other@1',
        name: 'Neon',
        workerFileName: 'neon.worker.ts',
        requiredCapabilities: ['offscreen-canvas', 'canvas2d'],
        packageManifest: {
          schemaVersion: '1.0.0',
          publisherId: 'visualcrew',
          repositoryId: 'lux-pack',
          packageId: 'renderers',
          packageVersion: '1.0.0',
          tool: {
            kind: 'renderer',
            id: 'neon',
            versionMajor: 1,
          },
          source: 'builtin',
          sdk: {
            minWorkerProtocolVersion: '1.0.0',
          },
        },
      },
    ]);

    expect(registry[key]).toBeUndefined();
  });

  it('keeps app registry operational with hardcoded policy', () => {
    const registry = getAllRenderers();
    expect(Object.keys(registry).length).toBeGreaterThan(0);
    expect(resolveRendererDefinition('webgl')?.id).toBe('webgl');
  });
});
