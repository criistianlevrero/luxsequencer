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
const BUILTIN_TRUST_STORE_ROOT_PUBLIC_KEYS: TrustedCommunityPublicKeysMap = {};
const TRUST_STORE_SCHEMA_VERSION = '1.0.0';
const TRUST_STORE_CACHE_KEY = 'luxsequencer.communityTrustStore.v1';
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

interface RemoteTrustStoreSignature {
  algorithm: 'ECDSA_P256_SHA256';
  publicKeyId: string;
  valueBase64: string;
}

interface RemoteCommunityTrustStoreDocument {
  schemaVersion: string;
  version: string;
  generatedAt?: string;
  keys: unknown;
  revokedKeyIds?: unknown;
  signature?: RemoteTrustStoreSignature;
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

const base64ToUint8Array = (value: string): Uint8Array => {
  const normalized = value.replace(/\s+/g, '');
  const binary = atob(normalized);
  const output = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    output[index] = binary.charCodeAt(index);
  }

  return output;
};

const toArrayBuffer = (value: Uint8Array): ArrayBuffer => {
  const output = new Uint8Array(value.byteLength);
  output.set(value);
  return output.buffer;
};

const stableStringify = (value: unknown): string => {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(',')}]`;
  }

  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();

  return `{${keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(',')}}`;
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

const getLocalRootTrustStoreKeys = (): TrustedCommunityPublicKeysMap => ({
  ...BUILTIN_TRUST_STORE_ROOT_PUBLIC_KEYS,
  ...parseTrustedKeysFromEnv(env.communityTrustStoreRootPublicKeysJson),
});

const getLocalRevokedRootKeyIds = (): string[] => [...env.communityTrustStoreRevokedRootKeyIds];

const isWithinGracePeriod = (expiredAt: Date, now: Date, graceMs: number): boolean => {
  if (graceMs <= 0) {
    return false;
  }

  const elapsed = now.getTime() - expiredAt.getTime();
  return elapsed >= 0 && elapsed <= graceMs;
};

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

export const resolveTrustStoreRootPublicKey = (
  publicKeyId: string,
  now: Date = new Date(),
): CommunityPublicKeyResolution => {
  const trustStore = getLocalRootTrustStoreKeys();
  const revoked = getLocalRevokedRootKeyIds();
  const key = trustStore[publicKeyId];

  if (!key) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `root key no confiable (${publicKeyId})`,
    };
  }

  if (revoked.includes(publicKeyId) || key.status === 'revoked') {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `root key revocada (${publicKeyId})`,
    };
  }

  const notBefore = parseDate(key.notBefore);
  if (key.notBefore && !notBefore) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `notBefore inválido para root key ${publicKeyId}`,
    };
  }

  const notAfter = parseDate(key.notAfter);
  if (key.notAfter && !notAfter) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `notAfter inválido para root key ${publicKeyId}`,
    };
  }

  if (notBefore && now < notBefore) {
    return {
      isTrusted: false,
      keyId: publicKeyId,
      reason: `root key aún no vigente (${publicKeyId})`,
    };
  }

  if (notAfter && now > notAfter) {
    const hasRotationTarget = typeof key.replacedBy === 'string' && key.replacedBy.length > 0;
    const withinGrace = isWithinGracePeriod(notAfter, now, env.communityTrustStoreRootRotationGraceMs);

    if (!hasRotationTarget || !withinGrace) {
      const replacement = hasRotationTarget ? `, reemplazada por ${key.replacedBy}` : '';
      return {
        isTrusted: false,
        keyId: publicKeyId,
        reason: `root key expirada (${publicKeyId}${replacement})`,
      };
    }
  }

  return {
    isTrusted: true,
    keyId: publicKeyId,
    publicKeyBase64: key.spkiBase64,
  };
};

const getSignedDocumentPayload = (document: RemoteCommunityTrustStoreDocument): ArrayBuffer => {
  const canonicalPayload = stableStringify({
    schemaVersion: document.schemaVersion,
    version: document.version,
    generatedAt: document.generatedAt,
    keys: document.keys,
    revokedKeyIds: document.revokedKeyIds,
  });

  return new TextEncoder().encode(canonicalPayload).buffer;
};

const validateRemoteTrustStoreSignature = async (
  document: RemoteCommunityTrustStoreDocument,
): Promise<string | null> => {
  if (!env.communityTrustStoreRequireSignature) {
    return null;
  }

  const signature = document.signature;
  if (!signature) {
    return 'trust store remoto inválido: firma requerida y ausente';
  }

  if (signature.algorithm !== 'ECDSA_P256_SHA256') {
    return `trust store remoto inválido: algoritmo de firma no soportado (${signature.algorithm})`;
  }

  if (!signature.publicKeyId || !signature.valueBase64 || !BASE64_REGEX.test(signature.valueBase64)) {
    return 'trust store remoto inválido: metadata de firma incompleta o malformada';
  }

  if (typeof crypto === 'undefined' || !crypto.subtle) {
    return 'SubtleCrypto no disponible para validar firma del trust store remoto';
  }

  const rootPublicKey = resolveTrustStoreRootPublicKey(signature.publicKeyId);
  if (isUntrustedCommunityPublicKey(rootPublicKey)) {
    return `trust store remoto inválido: ${rootPublicKey.reason}`;
  }

  let publicKeyBytes: Uint8Array;
  let signatureBytes: Uint8Array;
  try {
    publicKeyBytes = base64ToUint8Array(rootPublicKey.publicKeyBase64);
    signatureBytes = base64ToUint8Array(signature.valueBase64);
  } catch {
    return 'trust store remoto inválido: clave/firma base64 corrupta';
  }

  let cryptoKey: CryptoKey;
  try {
    cryptoKey = await crypto.subtle.importKey(
      'spki',
      toArrayBuffer(publicKeyBytes),
      {
        name: 'ECDSA',
        namedCurve: 'P-256',
      },
      false,
      ['verify'],
    );
  } catch {
    return 'trust store remoto inválido: no se pudo importar root key';
  }

  let verified = false;
  try {
    verified = await crypto.subtle.verify(
      {
        name: 'ECDSA',
        hash: 'SHA-256',
      },
      cryptoKey,
      toArrayBuffer(signatureBytes),
      getSignedDocumentPayload(document),
    );
  } catch {
    return 'trust store remoto inválido: fallo al verificar firma';
  }

  if (!verified) {
    return 'trust store remoto inválido: firma no válida';
  }

  return null;
};

const toValidatedRuntimeSnapshot = async (
  document: RemoteCommunityTrustStoreDocument,
  source: 'remote' | 'cache',
): Promise<RuntimeTrustStoreSnapshot | null> => {
  const signatureError = await validateRemoteTrustStoreSignature(document);
  if (signatureError) {
    return null;
  }

  return toRuntimeSnapshot(document, source);
};

const tryHydrateFromCache = async (): Promise<boolean> => {
  const cached = readCache();
  if (!cached) {
    return false;
  }

  const snapshot = await toValidatedRuntimeSnapshot(cached.document, 'cache');
  if (!snapshot) {
    return false;
  }

  runtimeTrustStoreSnapshot = snapshot;
  return true;
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
    await tryHydrateFromCache();
    return;
  }

  if (!response.ok) {
    await tryHydrateFromCache();
    return;
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    return;
  }

  if (!isRemoteDocument(payload)) {
    await tryHydrateFromCache();
    return;
  }

  const snapshot = await toValidatedRuntimeSnapshot(payload, 'remote');
  if (!snapshot) {
    await tryHydrateFromCache();
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
