import React, { useEffect, useState } from 'react';
import { useTextureStore } from '../../../store';
import { ensureRendererDeclarativeSchema, resolveRendererDefinition } from '../index';
import { DeclarativeControlPanel } from '../../declarative/ControlRenderer';
import type { DeclarativeControlSchema, RendererControlSpec } from '../../../types';

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

        let cancelled = false;

        const loadDeclarativeSchema = async () => {
            const schema = await ensureRendererDeclarativeSchema(rendererRuntimeId);
            if (cancelled) {
                return;
            }

            if (!schema) {
                if (!cancelled) {
                    setSchemaLoadFailed(true);
                }
                return;
            }

            setLoadedSchema(schema);
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
