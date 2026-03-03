import { describe, expect, it } from 'vitest';
import { validateRendererSdkContract } from './validateRendererSdkContract';

describe('validateRendererSdkContract', () => {
  it('accepts builtin manifest with compatible runtime protocol', () => {
    const error = validateRendererSdkContract({
      rendererId: 'builtin-renderer',
      workerRequirements: {
        requiredCapabilities: ['offscreen-canvas', 'uniform-updates'],
      },
      packageManifest: {
        schemaVersion: '1.0.0',
        publisherId: 'luxsequencer',
        repositoryId: 'core-renderers',
        packageId: 'builtin-renderers',
        packageVersion: '0.6.0',
        tool: {
          kind: 'renderer',
          id: 'builtin-renderer',
          versionMajor: 1,
        },
        source: 'builtin',
        sdk: {
          minWorkerProtocolVersion: '1.0.0',
        },
      },
      runtimeProtocolVersion: '1.0.0',
    });

    expect(error).toBeNull();
  });

  it('rejects incompatible runtime protocol', () => {
    const error = validateRendererSdkContract({
      rendererId: 'incompatible-renderer',
      packageManifest: {
        schemaVersion: '1.0.0',
        publisherId: 'luxsequencer',
        repositoryId: 'core-renderers',
        packageId: 'builtin-renderers',
        packageVersion: '0.6.0',
        tool: {
          kind: 'renderer',
          id: 'incompatible-renderer',
          versionMajor: 1,
        },
        source: 'builtin',
        sdk: {
          minWorkerProtocolVersion: '2.0.0',
        },
      },
      runtimeProtocolVersion: '1.0.0',
    });

    expect(error).toContain('SDK/protocolo incompatible');
  });

  it('rejects out-of-range handshake timeout', () => {
    const error = validateRendererSdkContract({
      rendererId: 'invalid-timeout-renderer',
      workerRequirements: {
        requiredCapabilities: ['offscreen-canvas'],
        handshakeTimeoutMs: 100,
      },
    });

    expect(error).toContain('handshakeTimeoutMs fuera de rango');
  });

  it('rejects community manifest without checksum/signature', () => {
    const error = validateRendererSdkContract({
      rendererId: 'community-renderer',
      packageManifest: {
        schemaVersion: '1.0.0',
        publisherId: 'communitygroup',
        repositoryId: 'render-pack',
        packageId: 'render-pack-core',
        packageVersion: '1.0.0',
        tool: {
          kind: 'renderer',
          id: 'community-renderer',
          versionMajor: 1,
        },
        source: 'community',
        sdk: {
          minWorkerProtocolVersion: '1.0.0',
        },
      },
    });

    expect(error).toContain('workerEntrySha256 requerido');
  });
});
