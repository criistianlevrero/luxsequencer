import { describe, expect, it } from 'vitest';
import {
  isUntrustedCommunityPublicKey,
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
});
