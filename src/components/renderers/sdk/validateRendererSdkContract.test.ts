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
        packageName: 'luxsequencer/renderer-builtin',
        packageVersion: '0.6.0',
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
        packageName: 'luxsequencer/renderer-incompatible',
        packageVersion: '0.6.0',
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
        packageName: 'community/renderer',
        packageVersion: '1.0.0',
        source: 'community',
        sdk: {
          minWorkerProtocolVersion: '1.0.0',
        },
      },
    });

    expect(error).toContain('workerEntrySha256 requerido');
  });
});
