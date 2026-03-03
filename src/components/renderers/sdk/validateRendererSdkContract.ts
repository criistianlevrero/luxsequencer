import {
  RENDERER_WORKER_PROTOCOL_VERSION,
  isUntrustedCommunityPublicKey,
  resolveCommunityPublicKey,
} from '../../../graphics-pipeline';
import type { RendererPackageManifest, RendererWorkerRequirements } from '../types';
import { buildMarketplaceToolKey, validateMarketplaceIdentity } from './toolIdentity';

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/i;
const BASE64_REGEX = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const SEMVER_REGEX = /^(\d+)\.(\d+)\.(\d+)/;

const MIN_HANDSHAKE_TIMEOUT_MS = 250;
const MAX_HANDSHAKE_TIMEOUT_MS = 20000;
const MIN_STALL_TIMEOUT_MS = 500;
const MAX_STALL_TIMEOUT_MS = 60000;

interface ValidateRendererSdkContractInput {
  rendererId: string;
  workerRequirements?: RendererWorkerRequirements;
  packageManifest?: RendererPackageManifest;
  runtimeProtocolVersion?: string;
}

const parseSemver = (value: string): [number, number, number] => {
  const match = value.match(SEMVER_REGEX);
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

const isSemver = (value: string | undefined): boolean => {
  return Boolean(value && SEMVER_REGEX.test(value));
};

const isTimeoutInRange = (value: number, min: number, max: number): boolean => {
  return Number.isFinite(value) && value >= min && value <= max;
};

export const validateRendererSdkContract = ({
  rendererId,
  workerRequirements,
  packageManifest,
  runtimeProtocolVersion = RENDERER_WORKER_PROTOCOL_VERSION,
}: ValidateRendererSdkContractInput): string | null => {
  if (workerRequirements) {
    if (!Array.isArray(workerRequirements.requiredCapabilities) || workerRequirements.requiredCapabilities.length === 0) {
      return `Contrato SDK inválido para ${rendererId}: requiredCapabilities requerido`;
    }

    if (
      typeof workerRequirements.handshakeTimeoutMs === 'number' &&
      !isTimeoutInRange(workerRequirements.handshakeTimeoutMs, MIN_HANDSHAKE_TIMEOUT_MS, MAX_HANDSHAKE_TIMEOUT_MS)
    ) {
      return `Contrato SDK inválido para ${rendererId}: handshakeTimeoutMs fuera de rango (${MIN_HANDSHAKE_TIMEOUT_MS}-${MAX_HANDSHAKE_TIMEOUT_MS})`;
    }

    if (
      typeof workerRequirements.stallTimeoutMs === 'number' &&
      !isTimeoutInRange(workerRequirements.stallTimeoutMs, MIN_STALL_TIMEOUT_MS, MAX_STALL_TIMEOUT_MS)
    ) {
      return `Contrato SDK inválido para ${rendererId}: stallTimeoutMs fuera de rango (${MIN_STALL_TIMEOUT_MS}-${MAX_STALL_TIMEOUT_MS})`;
    }

    if (workerRequirements.protocolVersion && !isSemver(workerRequirements.protocolVersion)) {
      return `Contrato SDK inválido para ${rendererId}: protocolVersion inválida (${workerRequirements.protocolVersion})`;
    }
  }

  if (!packageManifest) {
    return null;
  }

  if (packageManifest.schemaVersion !== '1.0.0') {
    return `Manifest schema no soportado para ${rendererId}: ${packageManifest.schemaVersion}`;
  }

  if (!packageManifest.packageVersion) {
    return `Manifest inválido para ${rendererId}: packageVersion requerido`;
  }

  const identityError = validateMarketplaceIdentity(rendererId, packageManifest);
  if (identityError) {
    return identityError;
  }

  if (!isSemver(packageManifest.sdk?.minWorkerProtocolVersion)) {
    return `Manifest inválido para ${rendererId}: sdk.minWorkerProtocolVersion inválido`;
  }

  if (isSemverLess(runtimeProtocolVersion, packageManifest.sdk.minWorkerProtocolVersion)) {
    return `SDK/protocolo incompatible para ${buildMarketplaceToolKey(packageManifest)}: runtime=${runtimeProtocolVersion}, mínimo requerido=${packageManifest.sdk.minWorkerProtocolVersion}`;
  }

  if (packageManifest.source === 'community') {
    const checksum = packageManifest.security?.workerEntrySha256;
    if (!checksum) {
      return `Manifest inválido para ${rendererId}: workerEntrySha256 requerido en paquetes community`;
    }

    if (!SHA256_HEX_REGEX.test(checksum)) {
      return `Manifest inválido para ${rendererId}: workerEntrySha256 debe ser SHA-256 hex (64 chars)`;
    }

    const signature = packageManifest.security?.workerEntrySignature;
    if (!signature) {
      return `Manifest inválido para ${rendererId}: workerEntrySignature requerido en paquetes community`;
    }

    if (signature.algorithm !== 'ECDSA_P256_SHA256') {
      return `Manifest inválido para ${rendererId}: algoritmo de firma no soportado (${signature.algorithm})`;
    }

    if (!signature.publicKeyId) {
      return `Manifest inválido para ${rendererId}: publicKeyId requerido para firma`;
    }

    if (!signature.valueBase64 || !BASE64_REGEX.test(signature.valueBase64)) {
      return `Manifest inválido para ${rendererId}: valueBase64 de firma inválido`;
    }

    const publicKey = resolveCommunityPublicKey(signature.publicKeyId);
    if (isUntrustedCommunityPublicKey(publicKey)) {
      return `Manifest inválido para ${rendererId}: ${publicKey.reason}`;
    }
  }

  return null;
};
