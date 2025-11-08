
import React, { useMemo, useState } from 'react';
import { useTextureStore } from '../../store';
import { renderers } from '../renderers';
import { TrashIcon } from '../shared/icons';
import SliderInput from '../controls/SliderInput';
// FIX: SliderControlConfig will be available from ../types after the type definitions are moved.
import type { PropertyTrack, SliderControlConfig } from '../../types';

interface PropertyTrackLaneProps {
    track: PropertyTrack;
}

const PropertyTrackLane: React.FC<PropertyTrackLaneProps> = ({ track }) => {
    const { project, activeSequenceIndex, sequencerCurrentStep } = useTextureStore(state => ({
        project: state.project,
        activeSequenceIndex: state.activeSequenceIndex,
        sequencerCurrentStep: state.sequencerCurrentStep,
    }));
    const { addKeyframe, removeKeyframe, updateKeyframeValue, removePropertyTrack } = useTextureStore.getState();

    const [selectedStep, setSelectedStep] = useState<number | null>(null);

    const sequencer = project?.sequences[activeSequenceIndex].sequencer;
    const numSteps = sequencer?.numSteps ?? 16;

    const controlInfo = useMemo(() => {
        for (const renderer of Object.values(renderers)) {
            for (const section of renderer.controlSchema) {
                const control = section.controls.find(c => c.id === track.property);
                if (control && control.type === 'slider') {
                    // FIX: Also return the category (section title) to be used in the UI.
                    return { ...(control as SliderControlConfig), category: section.title };
                }
            }
        }
        return null;
    }, [track.property]);

    const selectedKeyframe = useMemo(() => {
        if (selectedStep === null) return null;
        return track.keyframes.find(k => k.step === selectedStep) || null;
    }, [track.keyframes, selectedStep]);
    
    const handleStepClick = (stepIndex: number) => {
        const keyframeExists = track.keyframes.some(k => k.step === stepIndex);

        if (selectedStep === stepIndex) {
            // Clicked on the already selected keyframe -> remove it
            if (keyframeExists) {
                removeKeyframe(track.id, stepIndex);
            }
            setSelectedStep(null);
        } else {
            // Clicked on a new step
            if (!keyframeExists) {
                // If it's an empty step, create a new keyframe
                addKeyframe(track.id, stepIndex);
            }
            // Select the step
            setSelectedStep(stepIndex);
        }
    };

    return (
        <div className="bg-gray-800/60 p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <div>
                     <span className="font-semibold text-gray-300">{controlInfo?.label || track.property}</span>
                     <span className="text-xs text-gray-500 ml-2">({controlInfo?.category})</span>
                </div>
                 <button 
                    onClick={() => removePropertyTrack(track.id)}
                    className="p-1 text-gray-500 hover:text-red-400"
                    title="Eliminar pista"
                >
                    <TrashIcon className="w-4 h-4"/>
                </button>
            </div>

            {/* Step Numbers Header */}
            <div className="grid" style={{ gridTemplateColumns: `repeat(${numSteps}, minmax(0, 1fr))` }}>
                {Array.from({ length: numSteps }).map((_, i) => (
                    <div key={`header-${i}`} className="text-center text-xs text-gray-500 pb-1">
                        {i + 1}
                    </div>
                ))}
            </div>

            <div className="relative grid items-center" style={{ gridTemplateColumns: `repeat(${numSteps}, minmax(0, 1fr))`}}>
                {/* Timeline background and guidelines */}
                {Array.from({ length: numSteps }).map((_, stepIndex) => (
                    <div
                        key={stepIndex}
                        onClick={() => handleStepClick(stepIndex)}
                        className={`
                            h-12 hover:bg-gray-600/50 cursor-pointer transition-colors duration-150 rounded-sm
                            ${sequencerCurrentStep === stepIndex ? 'bg-cyan-900/40' : 'bg-gray-700/50'}
                            ${stepIndex > 0 ? 'border-l' : ''}
                            ${(stepIndex + 1) % 4 === 0 ? 'border-gray-500' : 'border-gray-600'}
                        `}
                    />
                ))}
                
                {/* Keyframes */}
                {track.keyframes.map(keyframe => (
                    <div 
                        key={keyframe.step}
                        className={`absolute top-1/2 w-3 h-3 rounded-full shadow-lg border-2 border-gray-900 pointer-events-none transition-all ${
                            selectedStep === keyframe.step ? 'bg-yellow-400 w-4 h-4' : 'bg-cyan-400'
                        }`}
                        style={{ 
                            left: `calc(${(keyframe.step / numSteps) * 100}% + ${(0.5 / numSteps) * 100}%)`, 
                            transform: 'translate(-50%, -50%)' 
                        }}
                    />
                ))}
            </div>

            {/* Keyframe Editor */}
            {selectedStep !== null && selectedKeyframe && controlInfo && (
                <div className="mt-4 p-3 bg-gray-900/50 rounded-lg">
                     <SliderInput
                        label={`Valor en Paso ${selectedStep + 1}`}
                        value={selectedKeyframe.value}
                        onChange={(e) => updateKeyframeValue(track.id, selectedStep, Number(e.target.value))}
                        min={controlInfo.min}
                        max={controlInfo.max}
                        step={controlInfo.step}
                        valueFormatter={controlInfo.formatter}
                    />
                </div>
            )}
        </div>
    );
};

export default PropertyTrackLane;
