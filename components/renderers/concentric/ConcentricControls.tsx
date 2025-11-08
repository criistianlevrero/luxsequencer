

import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../GradientEditor';
import SliderInput from '../shared/SliderInput';
import CollapsibleSection from '../shared/CollapsibleSection';

const ConcentricControls: React.FC = () => {
    const { currentSettings } = useTextureStore(state => ({
        currentSettings: state.currentSettings,
    }));

    const { setCurrentSetting } = useTextureStore.getState();

    const repetitionSpeed = currentSettings.concentric_repetitionSpeed ?? 0.5;
    const growthSpeed = currentSettings.concentric_growthSpeed ?? 0.5;
    const initialSize = currentSettings.concentric_initialSize ?? 10;
    const gradientColors = currentSettings.concentric_gradientColors ?? [];

    return (
        <CollapsibleSection title="Controles Concénctricos">
            <div className="space-y-6">
                <SliderInput
                    label="Velocidad de Repetición"
                    value={repetitionSpeed}
                    onChange={(e) => setCurrentSetting('concentric_repetitionSpeed', Number(e.target.value))}
                    min={0.1}
                    max={5}
                    step={0.1}
                    valueFormatter={(v) => `${v.toFixed(1)}s`}
                />
                <SliderInput
                    label="Velocidad de Crecimiento"
                    value={growthSpeed}
                    onChange={(e) => setCurrentSetting('concentric_growthSpeed', Number(e.target.value))}
                    min={0.1}
                    max={5}
                    step={0.1}
                    valueFormatter={(v) => `${v.toFixed(1)}x`}
                />
                <SliderInput
                    label="Tamaño Inicial"
                    value={initialSize}
                    onChange={(e) => setCurrentSetting('concentric_initialSize', Number(e.target.value))}
                    min={1}
                    max={100}
                    step={1}
                    valueFormatter={(v) => `${v}px`}
                />
                <div className="pt-4 border-t border-gray-700/50">
                    <GradientEditor
                        title="Gradiente de Hexágono"
                        colors={gradientColors}
                        onColorsChange={(newColors) => setCurrentSetting('concentric_gradientColors', newColors)}
                        minColors={2}
                    />
                </div>
            </div>
        </CollapsibleSection>
    );
}

export default ConcentricControls;
