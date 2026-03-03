import { env } from '../../config';

const ensureTrailingSlash = (value: string): string => {
  return value.endsWith('/') ? value : `${value}/`;
};

export const resolveExternalCoreRendererWorkerEntry = (
  rendererId: string,
  workerFileName: string,
  localFallback: URL,
): string | URL => {
  try {
    const baseUrl = ensureTrailingSlash(env.marketplaceCoreRenderersBaseUrl);
    return new URL(`${rendererId}/${workerFileName}`, baseUrl).toString();
  } catch {
    return localFallback;
  }
};
