import React, { useEffect, useState } from 'react';
import { useTextureStore } from '../../../store';
import { resolveRendererDefinition } from '../index';
import { DeclarativeControlPanel } from '../../declarative/ControlRenderer';
import type { DeclarativeControlSchema, RendererControlSpec } from '../../../types';
import { resolveExternalCoreRendererModuleEntry } from '../marketplaceWorkerEntry';

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

const isDeclarativeSpec = (value: unknown): value is DeclarativeControlSchema | RendererControlSpec => {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const schemaCandidate = value as { sections?: unknown; standard?: unknown };
    return Array.isArray(schemaCandidate.sections) || Array.isArray(schemaCandidate.standard);
};

const RendererControls: React.FC = () => {
    const { currentSettings, activeRenderer } = useTextureStore((state) => ({
        currentSettings: state.currentSettings,
        activeRenderer: state.project?.globalSettings.renderer ?? 'webgl',
    }));

    const { setCurrentSetting } = useTextureStore.getState();

    const [loadedSchema, setLoadedSchema] = useState<DeclarativeControlSchema | RendererControlSpec | null>(null);
    const [schemaLoadFailed, setSchemaLoadFailed] = useState(false);

    const currentRenderer = resolveRendererDefinition(activeRenderer);
    const rendererRuntimeId = currentRenderer?.id ?? activeRenderer;
    const declarativeSchema = currentRenderer?.declarativeSchema ?? loadedSchema;

    useEffect(() => {
        setLoadedSchema(null);
        setSchemaLoadFailed(false);

        if (currentRenderer?.declarativeSchema) {
            return;
        }

        const moduleConfig = BUILTIN_SCHEMA_MODULES[rendererRuntimeId];
        if (!moduleConfig) {
            return;
        }

        let cancelled = false;

        const loadDeclarativeSchema = async () => {
            try {
                const moduleUrl = resolveExternalCoreRendererModuleEntry(rendererRuntimeId, moduleConfig.fileName);
                const loadedModule = await import(/* @vite-ignore */ moduleUrl);
                const exportedValue = loadedModule[moduleConfig.exportName] as unknown;

                if (!isDeclarativeSpec(exportedValue) || cancelled) {
                    if (!cancelled) {
                        setSchemaLoadFailed(true);
                    }
                    return;
                }

                setLoadedSchema(exportedValue);
                if (currentRenderer) {
                    currentRenderer.declarativeSchema = exportedValue;
                }
            } catch {
                if (!cancelled) {
                    setSchemaLoadFailed(true);
                }
            }
        };

        loadDeclarativeSchema();

        return () => {
            cancelled = true;
        };
    }, [activeRenderer, currentRenderer, rendererRuntimeId]);

    if (!declarativeSchema || schemaLoadFailed) {
        return null;
    }

    return (
        <DeclarativeControlPanel
            spec={declarativeSchema}
            settings={currentSettings}
            onSettingChange={(property, value) => setCurrentSetting(property, value)}
            rendererId={activeRenderer}
        />
    );
};

export default RendererControls;
