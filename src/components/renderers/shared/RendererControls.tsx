
import React from 'react';
import { useTextureStore } from '../../../store';
import { renderers } from '../index';
import MidiLearnButton from '../../midi/MidiLearnButton';
import { CollapsibleSection, SliderInput } from '../../ui';
// FIX: Import `AccordionItem`, `ControlSection` and `SliderControlConfig` from the root `types.ts` file.
import type { AccordionItem, ControlSection, SeparatorSection, SliderControlConfig, ControlSettings as _ControlSettings } from '../../../types';
import { getNestedProperty, toLegacySettings as _toLegacySettings, mapPropertyIdToPath } from '../../../utils/settingsMigration';
import { DeclarativeControlPanel } from '../../declarative/ControlRenderer';

interface RendererControlsProps {
    schema: AccordionItem[] | (() => AccordionItem[]);
}

const RendererControls: React.FC<RendererControlsProps> = ({ schema }) => {
    const {
        currentSettings,
        midiMappings,
        learningMidiControl,
        activeRenderer,
    } = useTextureStore((state) => ({
        currentSettings: state.currentSettings,
        midiMappings: state.project?.globalSettings.midiMappings ?? {},
        learningMidiControl: state.midi.learningControl,
        activeRenderer: state.project?.globalSettings.renderer ?? 'webgl',
    }));

    const {
        setCurrentSetting,
        startMidiLearning,
    } = useTextureStore.getState();
    
    // Check if the current renderer has a declarative schema
    const currentRenderer = renderers[activeRenderer];
    const declarativeSchema = currentRenderer?.declarativeSchema;
    
    // If declarative schema is available, use it
    if (declarativeSchema) {
        return (
            <DeclarativeControlPanel
                spec={declarativeSchema}
                settings={currentSettings}
                onSettingChange={(property, value) => setCurrentSetting(property, value)}
                rendererId={activeRenderer}
            />
        );
    }
    
    // Fallback to legacy schema system
    // Resolve schema function if it's a function
    const resolvedSchema = typeof schema === 'function' ? schema() : schema;
    
    return (
        <>
            {resolvedSchema.map((item, index) => {
                // Handle separator
                if ('type' in item && item.type === 'separator') {
                    const separator = item as SeparatorSection;
                    return (
                        <div key={separator.id || `separator-${index}`} className="my-1">
                            <div className="border-t border-gray-600"></div>
                        </div>
                    );
                }
                
                // Handle regular control section
                const section = item as ControlSection;
                return (
                    <CollapsibleSection key={section.title} title={section.title} defaultOpen={section.defaultOpen}>
                        <div className="space-y-6">
                            {section.controls.map(control => {
                                if (control.type === 'slider') {
                                    const slider = control as SliderControlConfig;
                                    
                                    // Get the correct hierarchical path for this property
                                    const hierarchicalPath = mapPropertyIdToPath(slider.id, activeRenderer);
                                    
                                    // Get value directly from hierarchical structure
                                    const value = getNestedProperty(currentSettings, hierarchicalPath) as number ?? slider.min;
                                    
                                    return (
                                        <div key={slider.id} className="flex items-center space-x-4">
                                            <div className="grow">
                                                <SliderInput 
                                                    label={slider.label} 
                                                    value={value} 
                                                    onChange={(e) => setCurrentSetting(hierarchicalPath, Number(e.target.value))} 
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
                );
            })}
        </>
    );
}

export default RendererControls;
