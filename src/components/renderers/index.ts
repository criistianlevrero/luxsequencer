import { webglRenderer } from './scales';
import { concentricRenderer } from './concentric';
import { dvdScreensaverRenderer } from './dvd-screensaver';
import type { RendererDefinition } from './types';
import { buildMarketplaceToolKey } from './sdk/toolIdentity';

const MARKETPLACE_TREE_STORAGE_KEY = 'luxsequencer.marketplace.tree.v1';

interface MarketplaceTreeTool {
  kind: 'renderer' | 'tool';
  name: string;
  packageManifest: RendererDefinition['packageManifest'];
  workerRequirements?: RendererDefinition['workerRequirements'];
  workerEntry?: string;
}

interface MarketplaceTreeRepository {
  publisherId: string;
  repositoryId: string;
  tools: MarketplaceTreeTool[];
}

interface MarketplaceTree {
  repositories: MarketplaceTreeRepository[];
  entitlements?: {
    allowedToolKeys?: string[];
  };
}

const EmptyExternalRenderer: RendererDefinition['component'] = () => null;

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

const readMarketplaceTree = (): MarketplaceTree | null => {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(MARKETPLACE_TREE_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as MarketplaceTree;
    if (!Array.isArray(parsed.repositories)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const getEntitledToolKeys = (tree: MarketplaceTree | null): Set<string> => {
  const keys = tree?.entitlements?.allowedToolKeys;
  if (!Array.isArray(keys)) {
    return new Set<string>();
  }

  return new Set(keys.filter((value): value is string => typeof value === 'string'));
};

const getMarketplaceRendererRegistry = (): Record<string, RendererDefinition> => {
  const tree = readMarketplaceTree();
  if (!tree) {
    return {};
  }

  const entitledToolKeys = getEntitledToolKeys(tree);
  const registry: Record<string, RendererDefinition> = {};

  tree.repositories.forEach((repository) => {
    repository.tools.forEach((tool) => {
      if (tool.kind !== 'renderer' || !tool.packageManifest || !tool.workerEntry) {
        return;
      }

      const toolKey = buildMarketplaceToolKey(tool.packageManifest);
      if (!entitledToolKeys.has(toolKey)) {
        return;
      }

      registry[toolKey] = {
        id: toolKey,
        name: tool.name,
        component: EmptyExternalRenderer,
        workerEntry: tool.workerEntry,
        workerRequirements: tool.workerRequirements,
        packageManifest: tool.packageManifest,
        controlSchema: [],
      };
    });
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