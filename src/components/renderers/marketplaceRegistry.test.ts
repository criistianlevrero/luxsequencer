import { describe, expect, it } from 'vitest';
import { buildMarketplaceToolKey } from './sdk/toolIdentity';
import { getAllRenderers, getMarketplaceRendererRegistry, resolveRendererDefinition } from './index';
import { webglRenderer } from './scales';

describe('marketplace renderer registry', () => {
  it('resolves builtin renderer by canonical key', () => {
    const key = buildMarketplaceToolKey(webglRenderer.packageManifest!);
    const resolved = resolveRendererDefinition(key);

    expect(resolved?.id).toBe('webgl');
  });

  it('loads external renderer from hardcoded config when key is valid', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';

    const registry = getMarketplaceRendererRegistry([
      {
        key,
        name: 'Neon',
        workerEntry: 'https://cdn.example.com/neon.worker.ts',
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
        key: 'visualcrew/lux-pack:renderer/other@1',
        name: 'Neon',
        workerEntry: 'https://cdn.example.com/neon.worker.ts',
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
