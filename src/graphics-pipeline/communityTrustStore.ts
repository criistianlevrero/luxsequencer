import { env } from '../config';

export interface TrustedCommunityPublicKey {
  id: string;
  spkiBase64: string;
  status?: 'active' | 'revoked';
  notBefore?: string;
  notAfter?: string;
  replacedBy?: string;
}

type TrustedCommunityPublicKeysMap = Record<string, TrustedCommunityPublicKey>;

const BUILTIN_COMMUNITY_TRUSTED_PUBLIC_KEYS: TrustedCommunityPublicKeysMap = {};

const parseDate = (value?: string): Date | null => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
};

const parseTrustedKeysFromEnv = (raw?: string): TrustedCommunityPublicKeysMap => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return {};
    }

    return parsed.reduce<TrustedCommunityPublicKeysMap>((acc, entry) => {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        !('id' in entry) ||
        !('spkiBase64' in entry) ||
        typeof entry.id !== 'string' ||
        typeof entry.spkiBase64 !== 'string'
      ) {
        return acc;
      }

      acc[entry.id] = {
        id: entry.id,
        spkiBase64: entry.spkiBase64,
        status:
          entry.status === 'revoked' || entry.status === 'active'
            ? entry.status
            : 'active',
        notBefore: typeof entry.notBefore === 'string' ? entry.notBefore : undefined,
        notAfter: typeof entry.notAfter === 'string' ? entry.notAfter : undefined,
        replacedBy: typeof entry.replacedBy === 'string' ? entry.replacedBy : undefined,
      };

      return acc;
    }, {});
  } catch {
    return {};
  }
};

const createTrustStore = (): TrustedCommunityPublicKeysMap => {
  return {
    ...BUILTIN_COMMUNITY_TRUSTED_PUBLIC_KEYS,
    ...parseTrustedKeysFromEnv(env.communityTrustedPublicKeysJson),
  };
};

export type CommunityPublicKeyResolution =
  | {
      isTrusted: true;
      publicKeyBase64: string;
      keyId: string;
    }
  | {
      isTrusted: false;
      reason: string;
      keyId: string;
    };

export interface CommunityTrustStoreOverrides {
  trustedKeys?: TrustedCommunityPublicKeysMap;
  revokedKeyIds?: string[];
}

export const isUntrustedCommunityPublicKey = (
  resolution: CommunityPublicKeyResolution,
): resolution is Extract<CommunityPublicKeyResolution, { isTrusted: false }> => {
  return resolution.isTrusted === false;
};

export const resolveCommunityPublicKey = (
  publicKeyId: string,
  now: Date = new Date(),
  overrides?: CommunityTrustStoreOverrides,
): CommunityPublicKeyResolution => {
  const trustStore = overrides?.trustedKeys ?? createTrustStore();
  const key = trustStore[publicKeyId];

  if (!key) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `publicKeyId no confiable (${publicKeyId})`,
    };
  }

  const revokedKeyIds = overrides?.revokedKeyIds ?? env.communityRevokedPublicKeyIds;
  if (revokedKeyIds.includes(publicKeyId) || key.status === 'revoked') {
    const replacedBy = key.replacedBy ? `, reemplazada por ${key.replacedBy}` : '';
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `clave revocada (${publicKeyId}${replacedBy})`,
    };
  }

  const notBefore = parseDate(key.notBefore);
  if (key.notBefore && !notBefore) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `notBefore inválido para ${publicKeyId}`,
    };
  }

  const notAfter = parseDate(key.notAfter);
  if (key.notAfter && !notAfter) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `notAfter inválido para ${publicKeyId}`,
    };
  }

  if (notBefore && now < notBefore) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `clave aún no vigente (${publicKeyId})`,
    };
  }

  if (notAfter && now > notAfter) {
    const replacedBy = key.replacedBy ? `, reemplazada por ${key.replacedBy}` : '';
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `clave expirada (${publicKeyId}${replacedBy})`,
    };
  }

  return {
    isTrusted: true,
    keyId: publicKeyId,
    publicKeyBase64: key.spkiBase64,
  };
};
