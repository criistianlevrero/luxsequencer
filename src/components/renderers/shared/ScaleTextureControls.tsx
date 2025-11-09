
import React from 'react';
import { useTextureStore } from '../../../store';
import GradientEditor from '../../controls/GradientEditor';
import MidiLearnButton from '../../midi/MidiLearnButton';
import SliderInput from './SliderInput';
import CollapsibleSection from './CollapsibleSection';

const ScaleTextureControls: React.FC = () => {
    // Select state and actions from the store
    const {
        currentSettings,
        midiMappings,
        learningMidiControl,
    } = useTextureStore((state: ReturnType<typeof useTextureStore.getState>) => ({
        currentSettings: state.currentSettings,
        midiMappings: state.project?.globalSettings.midiMappings ?? {},
        learningMidiControl: state.midi.learningControl,
    }));

    const {
        setCurrentSetting,
        startMidiLearning,
    } = useTextureStore.getState();

    const sliders = [
        { id: 'scaleSize', label: 'Tamaño', value: currentSettings.scaleSize, onChange: (v: number) => setCurrentSetting('scaleSize', v), min: 45, max: 400, step: 1, formatter: (v: number) => `${v}px` },
        { id: 'scaleSpacing', label: 'Espaciado Horizontal', value: currentSettings.scaleSpacing, onChange: (v: number) => setCurrentSetting('scaleSpacing', v), min: -0.4, max: 2.0, step: 0.01, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        { id: 'verticalOverlap', label: 'Espaciado Vertical', value: currentSettings.verticalOverlap, onChange: (v: number) => setCurrentSetting('verticalOverlap', v), min: -0.4, max: 2.0, step: 0.01, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        { id: 'horizontalOffset', label: 'Desplazamiento Horizontal', value: currentSettings.horizontalOffset, onChange: (v: number) => setCurrentSetting('horizontalOffset', v), min: 0, max: 1, step: 0.01, formatter: (v: number) => `${(v * 100).toFixed(0)}%` },
        { id: 'shapeMorph', label: 'Forma de Escama', value: currentSettings.shapeMorph, onChange: (v: number) => setCurrentSetting('shapeMorph', v), min: 0, max: 1, step: 0.01, formatter: (v: number) => {
            if (v < 0.05) return 'Círculo';
            if (v > 0.45 && v < 0.55) return 'Rombo';
            if (v > 0.95) return 'Estrella';
            if (v < 0.5) return 'Círculo → Rombo';
            return 'Rombo → Estrella';
        }},
    ];
    
    const borderSliders = [
        { id: 'scaleBorderWidth', label: 'Grosor de Borde', value: currentSettings.scaleBorderWidth, onChange: (v: number) => setCurrentSetting('scaleBorderWidth', v), min: 0, max: 10, step: 0.1, formatter: (v: number) => `${v.toFixed(1)}px` },
    ];

    const transformSliders = [
        { 
            id: 'textureRotationSpeed', 
            label: 'Rotación de Textura', 
            value: currentSettings.textureRotationSpeed, 
            onChange: (v: number) => setCurrentSetting('textureRotationSpeed', v), 
            min: -5, 
            max: 5, 
            step: 0.1, 
            formatter: (v: number) => {
                if (Math.abs(v) < 0.05) return 'Detenido';
                const speed = Math.abs(v).toFixed(1);
                return v > 0 ? `→ ${speed}` : `← ${speed}`;
            }
        },
    ];

    const animationSliders = [
        { id: 'animationSpeed', label: 'Velocidad de Animación', value: currentSettings.animationSpeed, onChange: (v: number) => setCurrentSetting('animationSpeed', v), min: 0.10, max: 2.50, step: 0.05, formatter: (v: number) => `${v.toFixed(2)}x` },
        { id: 'animationDirection', label: 'Dirección de Animación', value: currentSettings.animationDirection, onChange: (v: number) => setCurrentSetting('animationDirection', v), min: 0, max: 360, step: 1, formatter: (v: number) => `${Math.round(v)}°` },
    ];

    return (
        <>
            <CollapsibleSection title="Controles de Textura">
                {sliders.map(s => (
                    <div key={s.id} className="flex items-center space-x-4">
                        <div className="flex-grow">
                            <SliderInput label={s.label} value={s.value} onChange={(e) => s.onChange(Number(e.target.value))} min={s.min} max={s.max} step={s.step} valueFormatter={s.formatter} />
                        </div>
                        <MidiLearnButton isLearning={learningMidiControl === s.id} isMapped={midiMappings[s.id] !== undefined} onClick={() => startMidiLearning(s.id)} />
                    </div>
                ))}
            </CollapsibleSection>
            
            <CollapsibleSection title="Controles de Borde">
              <div className="space-y-6">
                  <div className="space-y-3">
                      <div className="flex justify-between items-center">
                          <label htmlFor="borderColor" className="font-medium text-gray-300">
                              Color de Borde
                          </label>
                          <span className="text-sm font-mono bg-gray-700 text-cyan-300 px-2 py-1 rounded uppercase">
                              {currentSettings.scaleBorderColor}
                          </span>
                      </div>
                      <input
                          id="borderColor"
                          type="color"
                          value={currentSettings.scaleBorderColor}
                          onChange={(e) => setCurrentSetting('scaleBorderColor', e.target.value)}
                          className="w-full h-10 p-1 bg-gray-700 border-2 border-gray-600 rounded-lg cursor-pointer"
                      />
                  </div>
                  {borderSliders.map(s => (
                        <div key={s.id} className="flex items-center space-x-4">
                            <div className="flex-grow">
                                <SliderInput label={s.label} value={s.value} onChange={(e) => s.onChange(Number(e.target.value))} min={s.min} max={s.max} step={s.step} valueFormatter={s.formatter} />
                            </div>
                            <MidiLearnButton isLearning={learningMidiControl === s.id} isMapped={midiMappings[s.id] !== undefined} onClick={() => startMidiLearning(s.id)} />
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Transformación de Textura">
                {transformSliders.map(s => (
                    <div key={s.id} className="flex items-center space-x-4">
                        <div className="flex-grow">
                            <SliderInput label={s.label} value={s.value} onChange={(e) => s.onChange(Number(e.target.value))} min={s.min} max={s.max} step={s.step} valueFormatter={s.formatter} />
                        </div>
                        <MidiLearnButton isLearning={learningMidiControl === s.id} isMapped={midiMappings[s.id] !== undefined} onClick={() => startMidiLearning(s.id)} />
                    </div>
                ))}
            </CollapsibleSection>

            <CollapsibleSection title="Gradiente y Animación">
                <div className="space-y-6">
                    <div className="pb-6 border-b border-gray-700/50">
                        <GradientEditor
                            title="Gradiente de Escamas"
                            colors={currentSettings.gradientColors}
                            onColorsChange={(newColors) => setCurrentSetting('gradientColors', newColors)}
                            minColors={2}
                        />
                    </div>
                    {animationSliders.map(s => (
                        <div key={s.id} className="flex items-center space-x-4">
                            <div className="flex-grow">
                                <SliderInput label={s.label} value={s.value} onChange={(e) => s.onChange(Number(e.target.value))} min={s.min} max={s.max} step={s.step} valueFormatter={s.formatter} />
                            </div>
                            <MidiLearnButton isLearning={learningMidiControl === s.id} isMapped={midiMappings[s.id] !== undefined} onClick={() => startMidiLearning(s.id)} />
                        </div>
                    ))}
                </div>
            </CollapsibleSection>

            <CollapsibleSection title="Fondo">
                <GradientEditor
                    title="Gradiente de Fondo"
                    colors={currentSettings.backgroundGradientColors || []}
                    onColorsChange={(newColors) => setCurrentSetting('backgroundGradientColors', newColors)}
                    minColors={1}
                />
            </CollapsibleSection>
        </>
    );
}

export default ScaleTextureControls;
