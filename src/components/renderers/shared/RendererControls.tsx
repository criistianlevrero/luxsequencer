
import React from 'react';
import { useTextureStore } from '../../../store';
import MidiLearnButton from '../../midi/MidiLearnButton';
import SliderInput from '../../controls/SliderInput';
import CollapsibleSection from '../../shared/CollapsibleSection';
// FIX: Import `ControlSection` and `SliderControlConfig` from the root `types.ts` file.
import type { ControlSection, SliderControlConfig, ControlSettings } from '../../../types';

interface RendererControlsProps {
    schema: ControlSection[];
}

const RendererControls: React.FC<RendererControlsProps> = ({ schema }) => {
    const {
        currentSettings,
        midiMappings,
        learningMidiControl,
    } = useTextureStore((state) => ({
        currentSettings: state.currentSettings,
        midiMappings: state.project?.globalSettings.midiMappings ?? {},
        learningMidiControl: state.midi.learningControl,
    }));

    const {
        setCurrentSetting,
        startMidiLearning,
    } = useTextureStore.getState();
    
    return (
        <>
            {schema.map(section => (
                <CollapsibleSection key={section.title} title={section.title} defaultOpen={section.defaultOpen}>
                    <div className="space-y-6">
                        {section.controls.map(control => {
                            if (control.type === 'slider') {
                                const slider = control as SliderControlConfig;
                                const value = currentSettings[slider.id] as number ?? slider.min;
                                return (
                                    <div key={slider.id} className="flex items-center space-x-4">
                                        <div className="flex-grow">
                                            <SliderInput 
                                                label={slider.label} 
                                                value={value} 
                                                onChange={(e) => setCurrentSetting(slider.id, Number(e.target.value))} 
                                                min={slider.min} 
                                                max={slider.max} 
                                                step={slider.step} 
                                                valueFormatter={slider.formatter} 
                                            />
                                        </div>
                                        <MidiLearnButton 
                                            isLearning={learningMidiControl === slider.id} 
                                            isMapped={midiMappings[slider.id] !== undefined} 
                                            onClick={() => startMidiLearning(slider.id)} 
                                        />
                                    </div>
                                );
                            }
                            if (control.type === 'custom') {
                                const CustomComponent = control.component;
                                return <CustomComponent key={control.id} />;
                            }
                            return null;
                        })}
                    </div>
                </CollapsibleSection>
            ))}
        </>
    );
}

export default RendererControls;
