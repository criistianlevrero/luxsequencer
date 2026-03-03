import type { RendererDefinition } from './types';
import { buildMarketplaceToolKey, validateMarketplaceIdentity } from './sdk/toolIdentity';
import { resolveExternalCoreRendererWorkerEntry } from './marketplaceWorkerEntry';
import { resolveExternalCoreRendererModuleEntry } from './marketplaceWorkerEntry';
import type { AccordionItem, ControlSection, DeclarativeControlSchema, RendererControlSpec } from '../../types';

const EmptyExternalRenderer: RendererDefinition['component'] = () => null;

export interface AnimatableRendererProperty {
  id: string;
  label: string;
  category: string;
  min: number;
  max: number;
  step: number;
  formatter?: (value: number) => string;
}

type DeclarativeRendererSchema = DeclarativeControlSchema | RendererControlSpec;

const BUILTIN_SCHEMA_MODULES: Record<string, { fileName: string; exportName: string }> = {
  webgl: {
    fileName: 'scales-declarative-schema.ts',
    exportName: 'webglRendererControlSpec',
  },
  concentric: {
    fileName: 'concentric-declarative-schema.ts',
    exportName: 'concentricDeclarativeSchema',
  },
  'dvd-screensaver': {
    fileName: 'dvd-screensaver-declarative-schema.ts',
    exportName: 'dvdScreensaverDeclarativeSchema',
  },
};

const declarativeSchemaLoaders = new Map<string, Promise<DeclarativeRendererSchema | null>>();

const isControlSection = (item: AccordionItem): item is ControlSection => !('type' in item);

const isDeclarativeSchema = (value: unknown): value is DeclarativeControlSchema => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { sections?: unknown };
  return Array.isArray(candidate.sections);
};

const isRendererControlSpec = (value: unknown): value is RendererControlSpec => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as { standard?: unknown };
  return Array.isArray(candidate.standard);
};

const normalizeAnimatableProps = (properties: AnimatableRendererProperty[]): AnimatableRendererProperty[] => {
  const unique = new Map<string, AnimatableRendererProperty>();
  properties.forEach((property) => {
    if (!unique.has(property.id)) {
      unique.set(property.id, property);
    }
  });

  return Array.from(unique.values()).sort((a, b) => {
    const categoryComparison = a.category.localeCompare(b.category);
    if (categoryComparison !== 0) return categoryComparison;
    return a.label.localeCompare(b.label);
  });
};

const extractAnimatablePropsFromDeclarativeSchema = (
  schema: DeclarativeRendererSchema,
): AnimatableRendererProperty[] => {
  if (isRendererControlSpec(schema)) {
    return normalizeAnimatableProps(
      schema.standard
        .filter((control) => control.type === 'slider' && !!control.constraints.slider)
        .map((control) => ({
          id: control.id,
          label: control.label,
          category: control.category,
          min: control.constraints.slider!.min,
          max: control.constraints.slider!.max,
          step: control.constraints.slider!.step,
          formatter: control.constraints.slider!.formatter,
        })),
    );
  }

  return normalizeAnimatableProps(
    schema.sections.flatMap((section) =>
      section.controls
        .filter((control) => control.type === 'slider')
        .map((control) => {
          const sliderConstraints = control.constraints?.slider;
          return {
            id: control.id,
            label: control.label,
            category: section.title,
            min: sliderConstraints?.min ?? control.min ?? 0,
            max: sliderConstraints?.max ?? control.max ?? 1,
            step: sliderConstraints?.step ?? control.step ?? 0.01,
            formatter: sliderConstraints?.formatter as ((value: number) => string) | undefined,
          };
        }),
    ),
  );
};

const extractAnimatablePropsFromAccordion = (schema: AccordionItem[] | (() => AccordionItem[])): AnimatableRendererProperty[] => {
  const resolvedSchema = typeof schema === 'function' ? schema() : schema;
  return normalizeAnimatableProps(
    resolvedSchema
      .filter(isControlSection)
      .flatMap((section) =>
        section.controls
          .filter((control) => control.type === 'slider')
          .map((control) => ({
            id: control.id,
            label: control.label,
            category: section.title,
            min: control.min,
            max: control.max,
            step: control.step,
            formatter: control.formatter,
          })),
      ),
  );
};

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

export const ensureRendererDeclarativeSchema = async (
  rendererSelector: string,
): Promise<DeclarativeRendererSchema | null> => {
  const renderer = resolveRendererDefinition(rendererSelector);
  if (!renderer) return null;

  if (renderer.declarativeSchema) {
    return renderer.declarativeSchema;
  }

  const runtimeId = renderer.id;
  const moduleConfig = BUILTIN_SCHEMA_MODULES[runtimeId];
  if (!moduleConfig) return null;

  const existingLoader = declarativeSchemaLoaders.get(runtimeId);
  if (existingLoader) {
    return existingLoader;
  }

  const loader = (async () => {
    try {
      const moduleUrl = resolveExternalCoreRendererModuleEntry(runtimeId, moduleConfig.fileName);
      const loadedModule = await import(/* @vite-ignore */ moduleUrl);
      const exportedSchema = loadedModule[moduleConfig.exportName] as unknown;

      if (!isDeclarativeSchema(exportedSchema) && !isRendererControlSpec(exportedSchema)) {
        return null;
      }

      renderer.declarativeSchema = exportedSchema;
      return exportedSchema;
    } catch {
      return null;
    }
  })();

  declarativeSchemaLoaders.set(runtimeId, loader);
  return loader;
};

export const invalidateRendererDeclarativeSchema = (rendererSelector: string): void => {
  const renderer = resolveRendererDefinition(rendererSelector);
  if (!renderer) return;

  const runtimeId = renderer.id;
  delete renderer.declarativeSchema;
  declarativeSchemaLoaders.delete(runtimeId);
};

export const getRendererAnimatableProperties = (rendererSelector: string): AnimatableRendererProperty[] => {
  const renderer = resolveRendererDefinition(rendererSelector);
  if (!renderer) return [];

  if (renderer.declarativeSchema) {
    return extractAnimatablePropsFromDeclarativeSchema(renderer.declarativeSchema);
  }

  return extractAnimatablePropsFromAccordion(renderer.controlSchema);
};

export const getRendererSliderConfig = (
  rendererSelector: string,
  propertyId: string,
): AnimatableRendererProperty | null => {
  return getRendererAnimatableProperties(rendererSelector).find((property) => property.id === propertyId) ?? null;
};

export const getSelectableRenderers = (): RendererDefinition[] => {
  return Object.values(getAllRenderers());
};

export type RendererId = keyof typeof renderers;