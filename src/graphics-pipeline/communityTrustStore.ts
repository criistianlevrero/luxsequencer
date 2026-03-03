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
const TRUST_STORE_SCHEMA_VERSION = '1.0.0';
const TRUST_STORE_CACHE_KEY = 'luxsequencer.communityTrustStore.v1';

interface RemoteCommunityTrustStoreDocument {
  schemaVersion: string;
  version: string;
  generatedAt?: string;
  keys: unknown;
  revokedKeyIds?: unknown;
}

interface PersistedCommunityTrustStoreCache {
  fetchedAt: number;
  document: RemoteCommunityTrustStoreDocument;
}

interface RuntimeTrustStoreSnapshot {
  loadedAt: number;
  source: 'remote' | 'cache';
  version: string;
  keys: TrustedCommunityPublicKeysMap;
  revokedKeyIds: string[];
}

let runtimeTrustStoreSnapshot: RuntimeTrustStoreSnapshot | null = null;
let hydrationInFlight: Promise<void> | null = null;

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

const parseSemver = (value: string): [number, number, number] => {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    return [0, 0, 0];
  }

  return [Number(match[1]), Number(match[2]), Number(match[3])];
};

const isSemverLess = (a: string, b: string): boolean => {
  const [aMajor, aMinor, aPatch] = parseSemver(a);
  const [bMajor, bMinor, bPatch] = parseSemver(b);

  if (aMajor !== bMajor) return aMajor < bMajor;
  if (aMinor !== bMinor) return aMinor < bMinor;
  return aPatch < bPatch;
};

const normalizeTrustedCommunityPublicKey = (value: unknown): TrustedCommunityPublicKey | null => {
  const entry = value as Record<string, unknown>;

  if (
    typeof value !== 'object' ||
    value === null ||
    typeof entry.id !== 'string' ||
    typeof entry.spkiBase64 !== 'string'
  ) {
    return null;
  }

  return {
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
};

const parseTrustedKeysArray = (value: unknown): TrustedCommunityPublicKeysMap => {
  if (!Array.isArray(value)) {
    return {};
  }

  return value.reduce<TrustedCommunityPublicKeysMap>((acc, entry) => {
    const normalized = normalizeTrustedCommunityPublicKey(entry);
    if (!normalized) {
      return acc;
    }

    acc[normalized.id] = normalized;
    return acc;
  }, {});
};

const parseRevokedKeyIds = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === 'string');
};

const parseTrustedKeysFromEnv = (raw?: string): TrustedCommunityPublicKeysMap => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    return parseTrustedKeysArray(parsed);
  } catch {
    return {};
  }
};

const getLocalTrustStoreKeys = (): TrustedCommunityPublicKeysMap => ({
  ...BUILTIN_COMMUNITY_TRUSTED_PUBLIC_KEYS,
  ...parseTrustedKeysFromEnv(env.communityTrustedPublicKeysJson),
});

const getLocalRevokedKeyIds = (): string[] => [...env.communityRevokedPublicKeyIds];

const dedupeStrings = (values: string[]): string[] => {
  return Array.from(new Set(values));
};

const mergeTrustStoreData = (
  remote: RuntimeTrustStoreSnapshot | null,
): { keys: TrustedCommunityPublicKeysMap; revokedKeyIds: string[] } => {
  const localKeys = getLocalTrustStoreKeys();
  const localRevoked = getLocalRevokedKeyIds();

  if (!remote) {
    return {
      keys: localKeys,
      revokedKeyIds: localRevoked,
    };
  }

  return {
    keys: {
      ...BUILTIN_COMMUNITY_TRUSTED_PUBLIC_KEYS,
      ...remote.keys,
      ...localKeys,
    },
    revokedKeyIds: dedupeStrings([...remote.revokedKeyIds, ...localRevoked]),
  };
};

const isRemoteDocument = (value: unknown): value is RemoteCommunityTrustStoreDocument => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    'schemaVersion' in value &&
    'version' in value &&
    'keys' in value &&
    typeof value.schemaVersion === 'string' &&
    typeof value.version === 'string'
  );
};

const toRuntimeSnapshot = (
  document: RemoteCommunityTrustStoreDocument,
  source: 'remote' | 'cache',
): RuntimeTrustStoreSnapshot | null => {
  if (document.schemaVersion !== TRUST_STORE_SCHEMA_VERSION) {
    return null;
  }

  if (env.communityTrustStoreMinVersion && isSemverLess(document.version, env.communityTrustStoreMinVersion)) {
    return null;
  }

  const keys = parseTrustedKeysArray(document.keys);
  if (Object.keys(keys).length === 0) {
    return null;
  }

  return {
    loadedAt: Date.now(),
    source,
    version: document.version,
    keys,
    revokedKeyIds: parseRevokedKeyIds(document.revokedKeyIds),
  };
};

const fetchWithTimeout = async (url: string, timeoutMs: number): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

const readCache = (): PersistedCommunityTrustStoreCache | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(TRUST_STORE_CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !('fetchedAt' in parsed) ||
      !('document' in parsed) ||
      typeof parsed.fetchedAt !== 'number' ||
      !isRemoteDocument(parsed.document)
    ) {
      return null;
    }

    return {
      fetchedAt: parsed.fetchedAt,
      document: parsed.document,
    };
  } catch {
    return null;
  }
};

const writeCache = (document: RemoteCommunityTrustStoreDocument): void => {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    const payload: PersistedCommunityTrustStoreCache = {
      fetchedAt: Date.now(),
      document,
    };
    localStorage.setItem(TRUST_STORE_CACHE_KEY, JSON.stringify(payload));
  } catch {
    return;
  }
};

const shouldUseCurrentRuntimeSnapshot = (snapshot: RuntimeTrustStoreSnapshot): boolean => {
  const elapsed = Date.now() - snapshot.loadedAt;
  return elapsed < env.communityTrustStoreCacheTtlMs;
};

const hydrateRemoteTrustStore = async (): Promise<void> => {
  const remoteUrl = env.communityTrustStoreUrl;
  if (!remoteUrl) {
    runtimeTrustStoreSnapshot = null;
    return;
  }

  if (runtimeTrustStoreSnapshot && shouldUseCurrentRuntimeSnapshot(runtimeTrustStoreSnapshot)) {
    return;
  }

  let response: Response;
  try {
    response = await fetchWithTimeout(remoteUrl, env.communityTrustStoreFetchTimeoutMs);
  } catch {
    const cached = readCache();
    if (cached) {
      const cachedSnapshot = toRuntimeSnapshot(cached.document, 'cache');
      if (cachedSnapshot) {
        runtimeTrustStoreSnapshot = cachedSnapshot;
      }
    }
    return;
  }

  if (!response.ok) {
    const cached = readCache();
    if (cached) {
      const cachedSnapshot = toRuntimeSnapshot(cached.document, 'cache');
      if (cachedSnapshot) {
        runtimeTrustStoreSnapshot = cachedSnapshot;
      }
    }
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return;
  }

  if (!isRemoteDocument(payload)) {
    return;
  }

  const snapshot = toRuntimeSnapshot(payload, 'remote');
  if (!snapshot) {
    return;
  }

  runtimeTrustStoreSnapshot = snapshot;
  writeCache(payload);
};

export const hydrateCommunityTrustStore = async (): Promise<void> => {
  if (hydrationInFlight) {
    await hydrationInFlight;
    return;
  }

  hydrationInFlight = hydrateRemoteTrustStore();

  try {
    await hydrationInFlight;
  } finally {
    hydrationInFlight = null;
  }
};

export const resetCommunityTrustStoreForTests = (): void => {
  runtimeTrustStoreSnapshot = null;
  hydrationInFlight = null;
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
  const merged = overrides
    ? {
        keys: overrides.trustedKeys ?? getLocalTrustStoreKeys(),
        revokedKeyIds: overrides.revokedKeyIds ?? getLocalRevokedKeyIds(),
      }
    : mergeTrustStoreData(runtimeTrustStoreSnapshot);

  const trustStore = merged.keys;
  const key = trustStore[publicKeyId];

  if (!key) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `publicKeyId no confiable (${publicKeyId})`,
    };
  }

  const revokedKeyIds = merged.revokedKeyIds;
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
