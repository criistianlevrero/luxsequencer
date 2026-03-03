
import React from 'react';
import { useTextureStore } from '../../../store';
import { resolveRendererDefinition } from '../index';
import { DeclarativeControlPanel } from '../../declarative/ControlRenderer';
 
const RendererControls: React.FC = () => {
    const {
        currentSettings,
        activeRenderer,
    } = useTextureStore((state) => ({
        currentSettings: state.currentSettings,
        activeRenderer: state.project?.globalSettings.renderer ?? 'webgl',
    }));

    const {
        setCurrentSetting,
    } = useTextureStore.getState();
    
    const currentRenderer = resolveRendererDefinition(activeRenderer);
    const declarativeSchema = currentRenderer?.declarativeSchema;
    
    if (!declarativeSchema) {
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
}

export default RendererControls;
