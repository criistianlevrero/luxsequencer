import { describe, expect, it } from 'vitest';
import { buildMarketplaceToolKey, validateMarketplaceIdentity } from './toolIdentity';

describe('toolIdentity', () => {
  it('builds canonical marketplace key', () => {
    const key = buildMarketplaceToolKey({
      schemaVersion: '1.0.0',
      publisherId: 'visualcrew',
      repositoryId: 'lux-pack-01',
      packageId: 'core-pack',
      packageVersion: '0.1.0',
      tool: {
        kind: 'renderer',
        id: 'neon-waves',
        versionMajor: 1,
      },
      source: 'builtin',
      sdk: {
        minWorkerProtocolVersion: '1.0.0',
      },
    });

    expect(key).toBe('visualcrew/lux-pack-01:renderer/neon-waves@1');
  });

  it('rejects invalid identity token', () => {
    const error = validateMarketplaceIdentity('test-renderer', {
      schemaVersion: '1.0.0',
      publisherId: 'VisualCrew',
      repositoryId: 'lux-pack-01',
      packageId: 'core-pack',
      packageVersion: '0.1.0',
      tool: {
        kind: 'renderer',
        id: 'neon-waves',
        versionMajor: 1,
      },
      source: 'builtin',
      sdk: {
        minWorkerProtocolVersion: '1.0.0',
      },
    });

    expect(error).toContain('publisherId inválido');
  });
});
