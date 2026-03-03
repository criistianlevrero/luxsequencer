import { describe, expect, it } from 'vitest';
import { renderers } from './index';

describe('renderer declarative schemas', () => {
  it('renderer registry exposes decoupled renderer definitions with required contracts', () => {
    const ids = Object.keys(renderers);

    expect(ids.length).toBeGreaterThanOrEqual(3);
    ids.forEach((id) => {
      const renderer = renderers[id];
      expect(renderer.id).toBeTruthy();
      expect(renderer.name).toBeTruthy();
      expect(typeof renderer.component).toBe('function');
      expect(renderer.workerEntry).toBeTruthy();
      expect(renderer.workerRequirements).toBeTruthy();
      expect(renderer.workerRequirements?.requiredCapabilities?.length ?? 0).toBeGreaterThan(0);
      expect(renderer.packageManifest).toBeTruthy();
      expect(renderer.packageManifest?.schemaVersion).toBe('1.0.0');
      expect(renderer.packageManifest?.publisherId).toBeTruthy();
      expect(renderer.packageManifest?.repositoryId).toBeTruthy();
      expect(renderer.packageManifest?.packageId).toBeTruthy();
      expect(renderer.packageManifest?.tool?.kind).toBeTruthy();
      expect(renderer.packageManifest?.tool?.id).toBeTruthy();
      expect((renderer.packageManifest?.tool?.versionMajor ?? 0)).toBeGreaterThan(0);
      expect(renderer.packageManifest?.sdk?.minWorkerProtocolVersion).toBeTruthy();
      if (renderer.packageManifest?.source === 'community') {
        expect(renderer.packageManifest.security?.workerEntrySha256).toBeTruthy();
        expect(renderer.packageManifest.security?.workerEntrySignature?.algorithm).toBe('ECDSA_P256_SHA256');
        expect(renderer.packageManifest.security?.workerEntrySignature?.publicKeyId).toBeTruthy();
        expect(renderer.packageManifest.security?.workerEntrySignature?.valueBase64).toBeTruthy();
      }
      expect(renderer.controlSchema).toBeTruthy();
    });
  });
});
