import type { RendererDefinition } from './types';
import { buildMarketplaceToolKey, validateMarketplaceIdentity } from './sdk/toolIdentity';
import { resolveExternalCoreRendererWorkerEntry } from './marketplaceWorkerEntry';

const EmptyExternalRenderer: RendererDefinition['component'] = () => null;

interface AllowedRendererConfig {
  id: string;
  key: string;
  name: string;
  workerFileName: string;
  requiredCapabilities: NonNullable<RendererDefinition['workerRequirements']>['requiredCapabilities'];
  packageManifest: NonNullable<RendererDefinition['packageManifest']>;
  workerRequirements?: RendererDefinition['workerRequirements'];
}

interface ExternalRendererConfig extends AllowedRendererConfig {}

const ALLOWED_RENDERERS: AllowedRendererConfig[] = [
  {
    id: 'webgl',
    key: 'luxsequencer/core-renderers:renderer/webgl@1',
    name: 'Escamas WebGL',
    workerFileName: 'scales.worker.ts',
    requiredCapabilities: ['offscreen-canvas', 'webgl2', 'uniform-updates'],
    packageManifest: {
      schemaVersion: '1.0.0',
      publisherId: 'luxsequencer',
      repositoryId: 'core-renderers',
      packageId: 'builtin-renderers',
      packageVersion: '0.6.0-beta',
      tool: {
        kind: 'renderer',
        id: 'webgl',
        versionMajor: 1,
      },
      source: 'builtin',
      sdk: {
        minWorkerProtocolVersion: '1.0.0',
      },
    },
  },
  {
    id: 'concentric',
    key: 'luxsequencer/core-renderers:renderer/concentric@1',
    name: 'Concénctrico',
    workerFileName: 'concentric.worker.ts',
    requiredCapabilities: ['offscreen-canvas', 'canvas2d', 'uniform-updates'],
    packageManifest: {
      schemaVersion: '1.0.0',
      publisherId: 'luxsequencer',
      repositoryId: 'core-renderers',
      packageId: 'builtin-renderers',
      packageVersion: '0.6.0-beta',
      tool: {
        kind: 'renderer',
        id: 'concentric',
        versionMajor: 1,
      },
      source: 'builtin',
      sdk: {
        minWorkerProtocolVersion: '1.0.0',
      },
    },
  },
  {
    id: 'dvd-screensaver',
    key: 'luxsequencer/core-renderers:renderer/dvd-screensaver@1',
    name: 'DVD Screensaver',
    workerFileName: 'dvd-screensaver.worker.ts',
    requiredCapabilities: ['offscreen-canvas', 'canvas2d', 'uniform-updates'],
    packageManifest: {
      schemaVersion: '1.0.0',
      publisherId: 'luxsequencer',
      repositoryId: 'core-renderers',
      packageId: 'builtin-renderers',
      packageVersion: '0.6.0-beta',
      tool: {
        kind: 'renderer',
        id: 'dvd-screensaver',
        versionMajor: 1,
      },
      source: 'builtin',
      sdk: {
        minWorkerProtocolVersion: '1.0.0',
      },
    },
  },
];

const createAllowedRendererDefinition = (config: AllowedRendererConfig): RendererDefinition => {
  return {
    id: config.id,
    name: config.name,
    component: EmptyExternalRenderer,
    workerEntry: resolveExternalCoreRendererWorkerEntry(config.id, config.workerFileName),
    workerRequirements: {
      requiredCapabilities: config.requiredCapabilities,
      ...(config.workerRequirements ?? {}),
    },
    packageManifest: config.packageManifest,
    controlSchema: [],
  };
};

export const renderers: Record<string, RendererDefinition> = ALLOWED_RENDERERS.reduce<Record<string, RendererDefinition>>(
  (acc, rendererConfig) => {
    acc[rendererConfig.id] = createAllowedRendererDefinition(rendererConfig);
    return acc;
  },
  {},
);

const HARDCODED_EXTERNAL_RENDERERS: ExternalRendererConfig[] = [];

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
  rendererConfigs: ExternalRendererConfig[] = HARDCODED_EXTERNAL_RENDERERS,
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
      workerEntry: resolveExternalCoreRendererWorkerEntry(tool.id, tool.workerFileName),
      workerRequirements: {
        requiredCapabilities: tool.requiredCapabilities,
        ...(tool.workerRequirements ?? {}),
      },
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