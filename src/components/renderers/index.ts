import { webglRenderer } from './scales';
import { concentricRenderer } from './concentric';
import { dvdScreensaverRenderer } from './dvd-screensaver';
import type { RendererDefinition } from './types';
import { buildMarketplaceToolKey, validateMarketplaceIdentity } from './sdk/toolIdentity';

const EmptyExternalRenderer: RendererDefinition['component'] = () => null;

interface HardcodedExternalRendererConfig {
  key: string;
  name: string;
  workerEntry: string;
  packageManifest: NonNullable<RendererDefinition['packageManifest']>;
  workerRequirements?: RendererDefinition['workerRequirements'];
}

const HARDCODED_EXTERNAL_RENDERERS: HardcodedExternalRendererConfig[] = [];

export const renderers: Record<string, RendererDefinition> = {
  [webglRenderer.id]: webglRenderer,
  [concentricRenderer.id]: concentricRenderer,
  [dvdScreensaverRenderer.id]: dvdScreensaverRenderer,
};

const BUILTIN_RENDERERS = Object.values(renderers);

const getBuiltinRendererKeyIndex = (): Record<string, RendererDefinition> => {
  return BUILTIN_RENDERERS.reduce<Record<string, RendererDefinition>>((acc, renderer) => {
    if (renderer.packageManifest) {
      acc[buildMarketplaceToolKey(renderer.packageManifest)] = renderer;
    }
    return acc;
  }, {});
};

export const getMarketplaceRendererRegistry = (
  rendererConfigs: HardcodedExternalRendererConfig[] = HARDCODED_EXTERNAL_RENDERERS,
): Record<string, RendererDefinition> => {
  const registry: Record<string, RendererDefinition> = {};

  rendererConfigs.forEach((tool) => {
    const identityError = validateMarketplaceIdentity(tool.key, tool.packageManifest);
    if (identityError) {
      return;
    }

    const manifestKey = buildMarketplaceToolKey(tool.packageManifest);
    if (manifestKey !== tool.key) {
      return;
    }

    registry[tool.key] = {
      id: tool.key,
      name: tool.name,
      component: EmptyExternalRenderer,
      workerEntry: tool.workerEntry,
      workerRequirements: tool.workerRequirements,
      packageManifest: tool.packageManifest,
      controlSchema: [],
    };
  });

  return registry;
};

export const getAllRenderers = (): Record<string, RendererDefinition> => {
  return {
    ...renderers,
    ...getMarketplaceRendererRegistry(),
  };
};

export const resolveRendererDefinition = (selector: string): RendererDefinition | undefined => {
  const registry = getAllRenderers();
  if (registry[selector]) {
    return registry[selector];
  }

  const builtinByKey = getBuiltinRendererKeyIndex();
  return builtinByKey[selector];
};

export const getSelectableRenderers = (): RendererDefinition[] => {
  return Object.values(getAllRenderers());
};

export type RendererId = keyof typeof renderers;