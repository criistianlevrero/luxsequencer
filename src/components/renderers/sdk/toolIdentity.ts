import type { RendererPackageManifest } from '../types';
import {
  buildMarketplaceToolKey as buildMarketplaceToolKeyFromContracts,
  isValidIdentityToken as isValidIdentityTokenFromContracts,
  validateMarketplaceIdentity as validateMarketplaceIdentityFromContracts,
} from '@luxsequencer/contracts/marketplace';

export const isValidIdentityToken = isValidIdentityTokenFromContracts;

export const buildMarketplaceToolKey = (manifest: RendererPackageManifest): string => {
  return buildMarketplaceToolKeyFromContracts(manifest);
};

export const validateMarketplaceIdentity = (
  rendererId: string,
  manifest: RendererPackageManifest,
): string | null => {
  return validateMarketplaceIdentityFromContracts(rendererId, manifest);
};
