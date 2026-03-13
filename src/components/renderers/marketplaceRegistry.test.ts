import { describe, expect, it } from 'vitest';
import { buildMarketplaceToolKey } from './sdk/toolIdentity';
import { getAllRenderers, getMarketplaceRendererRegistry, renderers, resolveRendererDefinition } from './index';

const toBase64Url = (value: string): string => {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
};

const buildJwt = (payload: Record<string, unknown>): string => {
  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = toBase64Url(JSON.stringify(payload));
  return `${header}.${body}.sig`;
};

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

  it('hides community renderer when license token is missing', () => {
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
          source: 'community',
          sdk: {
            minWorkerProtocolVersion: '1.0.0',
          },
        },
      },
    ]);

    expect(registry[key]).toBeUndefined();
  });

  it('loads community renderer with valid license token claims', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';
    const now = Math.floor(Date.now() / 1000);
    const licenseToken = buildJwt({
      sub: 'demo-user-id',
      pluginKey: key,
      iat: now - 30,
      exp: now + 60 * 60,
    });

    const registry = getMarketplaceRendererRegistry([
      {
        id: 'neon',
        key,
        name: 'Neon',
        workerFileName: 'neon.worker.ts',
        requiredCapabilities: ['offscreen-canvas', 'canvas2d'],
        licenseToken,
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
          source: 'community',
          sdk: {
            minWorkerProtocolVersion: '1.0.0',
          },
        },
      },
    ]);

    expect(registry[key]).toBeTruthy();
  });
});
