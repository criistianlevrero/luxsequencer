import { afterEach, describe, expect, it } from 'vitest';
import { buildMarketplaceToolKey } from './sdk/toolIdentity';
import { getAllRenderers, resolveRendererDefinition } from './index';
import { webglRenderer } from './scales';

const STORAGE_KEY = 'luxsequencer.marketplace.tree.v1';

afterEach(() => {
  localStorage.removeItem(STORAGE_KEY);
});

describe('marketplace renderer registry', () => {
  it('resolves builtin renderer by canonical key', () => {
    const key = buildMarketplaceToolKey(webglRenderer.packageManifest!);
    const resolved = resolveRendererDefinition(key);

    expect(resolved?.id).toBe('webgl');
  });

  it('loads entitled external renderer from localStorage tree', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        repositories: [
          {
            publisherId: 'visualcrew',
            repositoryId: 'lux-pack',
            tools: [
              {
                kind: 'renderer',
                name: 'Neon',
                workerEntry: 'https://cdn.example.com/neon.worker.js',
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
                  security: {
                    workerEntrySha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    workerEntrySignature: {
                      algorithm: 'ECDSA_P256_SHA256',
                      publicKeyId: 'community-key-1',
                      valueBase64: 'YWJjZA==',
                    },
                  },
                },
              },
            ],
          },
        ],
        entitlements: {
          allowedToolKeys: [key],
        },
      }),
    );

    const registry = getAllRenderers();
    expect(registry[key]).toBeTruthy();
    expect(resolveRendererDefinition(key)?.id).toBe(key);
  });

  it('hides non-entitled external renderer', () => {
    const key = 'visualcrew/lux-pack:renderer/neon@1';

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        repositories: [
          {
            publisherId: 'visualcrew',
            repositoryId: 'lux-pack',
            tools: [
              {
                kind: 'renderer',
                name: 'Neon',
                workerEntry: 'https://cdn.example.com/neon.worker.js',
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
                  security: {
                    workerEntrySha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
                    workerEntrySignature: {
                      algorithm: 'ECDSA_P256_SHA256',
                      publicKeyId: 'community-key-1',
                      valueBase64: 'YWJjZA==',
                    },
                  },
                },
              },
            ],
          },
        ],
        entitlements: {
          allowedToolKeys: [],
        },
      }),
    );

    expect(resolveRendererDefinition(key)).toBeUndefined();
  });
});
