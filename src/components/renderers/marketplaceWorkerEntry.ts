import { env } from '../../config';

const ensureTrailingSlash = (value: string): string => {
  return value.endsWith('/') ? value : `${value}/`;
};

const MARKETPLACE_PROXY_PREFIX = '/marketplace-core-renderers';

const toSameOriginProxyUrl = (remoteUrl: URL): string => {
  return `${MARKETPLACE_PROXY_PREFIX}${remoteUrl.pathname}`;
};

export const resolveExternalCoreRendererWorkerEntry = (
  rendererId: string,
  workerFileName: string,
): string => {
  try {
    const baseUrl = ensureTrailingSlash(env.marketplaceCoreRenderersBaseUrl);
    const resolved = new URL(`${rendererId}/${workerFileName}`, baseUrl);

    if (typeof window !== 'undefined' && resolved.origin !== window.location.origin) {
      return toSameOriginProxyUrl(resolved);
    }

    return resolved.toString();
  } catch {
    return `${MARKETPLACE_PROXY_PREFIX}/src/renderers/${rendererId}/${workerFileName}`;
  }
};
