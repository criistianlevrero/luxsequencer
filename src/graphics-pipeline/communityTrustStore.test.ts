import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { env } from '../config';
import {
  hydrateCommunityTrustStore,
  isUntrustedCommunityPublicKey,
  resetCommunityTrustStoreForTests,
  resolveCommunityPublicKey,
  type TrustedCommunityPublicKey,
} from './communityTrustStore';

const TRUSTED_KEY: TrustedCommunityPublicKey = {
  id: 'community-key-2026-q1',
  spkiBase64: 'MIIB',
  status: 'active',
  notBefore: '2026-01-01T00:00:00Z',
  notAfter: '2026-12-31T23:59:59Z',
  replacedBy: 'community-key-2027-q1',
};

describe('communityTrustStore', () => {
  const originalTrustStoreUrl = env.communityTrustStoreUrl;
  const originalFetchTimeout = env.communityTrustStoreFetchTimeoutMs;
  const originalCacheTtl = env.communityTrustStoreCacheTtlMs;
  const originalMinVersion = env.communityTrustStoreMinVersion;
  const originalRootKeys = env.communityTrustStoreRootPublicKeysJson;
  const originalRevokedRootKeyIds = env.communityTrustStoreRevokedRootKeyIds;
  const originalRequireSignature = env.communityTrustStoreRequireSignature;

  beforeEach(() => {
    env.communityTrustStoreUrl = undefined;
    env.communityTrustStoreFetchTimeoutMs = 2500;
    env.communityTrustStoreCacheTtlMs = 300000;
    env.communityTrustStoreMinVersion = undefined;
    env.communityTrustStoreRootPublicKeysJson = undefined;
    env.communityTrustStoreRevokedRootKeyIds = [];
    env.communityTrustStoreRequireSignature = false;
    localStorage.clear();
    resetCommunityTrustStoreForTests();
  });

  afterEach(() => {
    env.communityTrustStoreUrl = originalTrustStoreUrl;
    env.communityTrustStoreFetchTimeoutMs = originalFetchTimeout;
    env.communityTrustStoreCacheTtlMs = originalCacheTtl;
    env.communityTrustStoreMinVersion = originalMinVersion;
    env.communityTrustStoreRootPublicKeysJson = originalRootKeys;
    env.communityTrustStoreRevokedRootKeyIds = originalRevokedRootKeyIds;
    env.communityTrustStoreRequireSignature = originalRequireSignature;
    vi.restoreAllMocks();
    localStorage.clear();
    resetCommunityTrustStoreForTests();
  });

  it('accepts active key inside validity window', () => {
    const result = resolveCommunityPublicKey(
      'community-key-2026-q1',
      new Date('2026-06-01T00:00:00Z'),
      {
        trustedKeys: {
          'community-key-2026-q1': TRUSTED_KEY,
        },
      },
    );

    expect(result.isTrusted).toBe(true);
  });

  it('rejects key when explicitly revoked', () => {
    const result = resolveCommunityPublicKey(
      'community-key-2026-q1',
      new Date('2026-06-01T00:00:00Z'),
      {
        trustedKeys: {
          'community-key-2026-q1': TRUSTED_KEY,
        },
        revokedKeyIds: ['community-key-2026-q1'],
      },
    );

    expect(result.isTrusted).toBe(false);
    if (isUntrustedCommunityPublicKey(result)) {
      expect(result.reason).toContain('revocada');
    }
  });

  it('rejects expired key and hints replacement', () => {
    const result = resolveCommunityPublicKey(
      'community-key-2026-q1',
      new Date('2027-01-01T00:00:00Z'),
      {
        trustedKeys: {
          'community-key-2026-q1': TRUSTED_KEY,
        },
      },
    );

    expect(result.isTrusted).toBe(false);
    if (isUntrustedCommunityPublicKey(result)) {
      expect(result.reason).toContain('expirada');
      expect(result.reason).toContain('community-key-2027-q1');
    }
  });

  it('hydrates trust store from remote endpoint and resolves key', async () => {
    env.communityTrustStoreUrl = 'https://example.test/trust-store.json';

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: '1.0.0',
          version: '1.2.0',
          keys: [
            {
              id: 'remote-key-2026-q1',
              spkiBase64: 'MIIC',
              status: 'active',
            },
          ],
          revokedKeyIds: [],
        }),
        { status: 200 },
      ),
    );

    await hydrateCommunityTrustStore();

    const result = resolveCommunityPublicKey('remote-key-2026-q1');
    expect(result.isTrusted).toBe(true);
  });

  it('falls back to cached snapshot when remote fetch fails', async () => {
    env.communityTrustStoreUrl = 'https://example.test/trust-store.json';

    localStorage.setItem(
      'luxsequencer.communityTrustStore.v1',
      JSON.stringify({
        fetchedAt: Date.now(),
        document: {
          schemaVersion: '1.0.0',
          version: '1.1.0',
          keys: [
            {
              id: 'cached-key-2026-q1',
              spkiBase64: 'MIID',
              status: 'active',
            },
          ],
          revokedKeyIds: [],
        },
      }),
    );

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network down'));

    await hydrateCommunityTrustStore();

    const result = resolveCommunityPublicKey('cached-key-2026-q1');
    expect(result.isTrusted).toBe(true);
  });

  it('rejects unsigned remote payload when signature is required', async () => {
    env.communityTrustStoreUrl = 'https://example.test/trust-store.json';
    env.communityTrustStoreRequireSignature = true;

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: '1.0.0',
          version: '1.2.0',
          keys: [
            {
              id: 'unsigned-remote-key',
              spkiBase64: 'MIIE',
              status: 'active',
            },
          ],
          revokedKeyIds: [],
        }),
        { status: 200 },
      ),
    );

    await hydrateCommunityTrustStore();

    const result = resolveCommunityPublicKey('unsigned-remote-key');
    expect(result.isTrusted).toBe(false);
  });
});
