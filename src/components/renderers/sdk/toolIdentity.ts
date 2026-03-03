import type { RendererPackageManifest } from '../types';

const ID_TOKEN_REGEX = /^[a-z0-9][a-z0-9-]*$/;

export const isValidIdentityToken = (value: string): boolean => {
  return ID_TOKEN_REGEX.test(value);
};

export const buildMarketplaceToolKey = (manifest: RendererPackageManifest): string => {
  return `${manifest.publisherId}/${manifest.repositoryId}:${manifest.tool.kind}/${manifest.tool.id}@${manifest.tool.versionMajor}`;
};

export const validateMarketplaceIdentity = (
  rendererId: string,
  manifest: RendererPackageManifest,
): string | null => {
  if (!isValidIdentityToken(manifest.publisherId)) {
    return `Manifest inválido para ${rendererId}: publisherId inválido (${manifest.publisherId})`;
  }

  if (!isValidIdentityToken(manifest.repositoryId)) {
    return `Manifest inválido para ${rendererId}: repositoryId inválido (${manifest.repositoryId})`;
  }

  if (!isValidIdentityToken(manifest.packageId)) {
    return `Manifest inválido para ${rendererId}: packageId inválido (${manifest.packageId})`;
  }

  if (!isValidIdentityToken(manifest.tool.id)) {
    return `Manifest inválido para ${rendererId}: tool.id inválido (${manifest.tool.id})`;
  }

  if (!Number.isInteger(manifest.tool.versionMajor) || manifest.tool.versionMajor <= 0) {
    return `Manifest inválido para ${rendererId}: tool.versionMajor debe ser entero > 0`;
  }

  return null;
};
