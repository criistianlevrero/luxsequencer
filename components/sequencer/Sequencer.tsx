
import React from 'react';
import { useTextureStore } from '../../store';
import { PlayIcon, StopIcon, PlusIcon, TrashIcon } from '../shared/icons';
import CollapsibleSection from '../shared/CollapsibleSection';
import PropertySequencer from './PropertySequencer';
import type { Sequence } from '../../types';

const Sequencer: React.FC = () => {
    const {
        project,
        activeSequenceIndex,
        isSequencerPlaying,
        sequencerCurrentStep,
    } = useTextureStore((state) => ({
        project: state.project,
        activeSequenceIndex: state.activeSequenceIndex,
        isSequencerPlaying: state.project?.globalSettings.isSequencerPlaying ?? false,
        sequencerCurrentStep: state.sequencerCurrentStep,
    }));
    
    const { 
        setIsSequencerPlaying, 
        setSequencerBpm, 
        setSequencerSteps,
        setActiveSequenceIndex,
        updateActiveSequence,
        setSequencerNumSteps,
    } = useTextureStore.getState();


    if (!project) return null;
    const activeSequence = project.sequences[activeSequenceIndex];
    if (!activeSequence) return null;

    const { patterns, sequencer } = activeSequence;
    const { steps, bpm, numSteps } = sequencer;

    const handleStepClick = (patternId: string, stepIndex: number) => {
        const newSteps = [...steps];
        if (newSteps[stepIndex] === patternId) {
            newSteps[stepIndex] = null;
        } else {
            newSteps[stepIndex] = patternId;
        }
        setSequencerSteps(newSteps);
    };

    const handleSequenceChange = (key: keyof Sequence, value: any) => {
        updateActiveSequence({ [key]: value });
    };
    
    const StepSelectorButton: React.FC<{steps: number}> = ({ steps }) => {
        const isActive = numSteps === steps;
        return (
             <button 
                onClick={() => setSequencerNumSteps(steps)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    isActive ? 'bg-cyan-600 text-white font-semibold' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                }`}
            >
                {steps}
            </button>
        )
    };

    return (
        <div className="space-y-2">
            {/* --- TRANSPORT SECTION --- */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-x-6 gap-y-4 items-center p-4 bg-gray-800/50 rounded-lg">
                <div className="space-y-2">
                    <label htmlFor="sequence-selector" className="font-medium text-gray-300 text-sm">Secuencia Activa</label>
                    <div className="flex items-center space-x-2">
                        <select
                            id="sequence-selector"
                            value={activeSequenceIndex}
                            onChange={e => setActiveSequenceIndex(Number(e.target.value))}
                            className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-lg p-2 focus:ring-cyan-500 focus:border-cyan-500"
                        >
                            {project.sequences.map((seq, index) => (
                                <option key={seq.id} value={index}>{seq.name}</option>
                            ))}
                        </select>
                         <button className="p-2 bg-gray-600 hover:bg-gray-500 rounded-lg" title="Añadir secuencia (próximamente)" disabled><PlusIcon className="w-5 h-5 text-gray-400"/></button>
                         <button className="p-2 bg-gray-600 hover:bg-red-500/80 rounded-lg" title="Eliminar secuencia (próximamente)" disabled><TrashIcon className="w-5 h-5 text-gray-400"/></button>
                    </div>
                </div>

                <div className="flex items-center space-x-4">
                     <button
                        onClick={() => setIsSequencerPlaying(!isSequencerPlaying)}
                        className="flex items-center justify-center w-12 h-12 bg-gray-600 hover:bg-gray-500 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500"
                        aria-label={isSequencerPlaying ? 'Detener secuenciador' : 'Iniciar secuenciador'}
                    >
                        {isSequencerPlaying ? <StopIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                    </button>
                    <div className="flex-grow w-32">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="bpm" className="font-medium text-gray-300 text-sm">BPM</label>
                            <span className="text-sm font-mono bg-gray-900/50 text-cyan-300 px-2 py-0.5 rounded">
                                {bpm.toFixed(0)}
                            </span>
                        </div>
                        <input
                            id="bpm"
                            type="range"
                            min="30"
                            max="240"
                            step="1"
                            value={bpm}
                            onChange={(e) => setSequencerBpm(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="font-medium text-gray-300 text-sm">Pasos</label>
                     <div className="flex items-center space-x-2">
                        <div className="bg-gray-900/50 p-1 rounded-lg flex items-center space-x-1">
                            <StepSelectorButton steps={8} />
                            <StepSelectorButton steps={16} />
                            <StepSelectorButton steps={32} />
                        </div>
                        <div className="bg-gray-900/50 p-1 rounded-lg flex items-center space-x-1">
                            <StepSelectorButton steps={6} />
                            <StepSelectorButton steps={12} />
                            <StepSelectorButton steps={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PATTERN SEQUENCER --- */}
            <CollapsibleSection title="Secuenciador de Patrones">
                <div className="relative overflow-x-auto pb-2">
                    <div className="grid gap-1" style={{ gridTemplateColumns: `auto repeat(${numSteps}, minmax(0, 1fr))` }}>
                        <div className="sticky left-0 bg-gray-800 z-10 w-24"></div>
                        {Array.from({ length: numSteps }).map((_, i) => (
                             <div key={`header-${i}`} className="flex items-center justify-center text-xs text-gray-500 pb-1">
                                {i + 1}
                            </div>
                        ))}

                        {patterns.map((pattern) => (
                            <React.Fragment key={pattern.id}>
                                <div className="sticky left-0 bg-gray-800 z-10 text-xs text-gray-400 font-semibold truncate pr-2 flex items-center w-24" title={pattern.name}>
                                    {pattern.name}
                                </div>
                                {Array.from({ length: numSteps }).map((_, stepIndex) => (
                                    <div key={`${pattern.id}-${stepIndex}`} className={`relative w-full aspect-square ${sequencerCurrentStep === stepIndex ? 'bg-gray-600/50 rounded-md' : ''}`}>
                                        <button
                                            onClick={() => handleStepClick(pattern.id, stepIndex)}
                                            className={`absolute inset-0.5 rounded-md transition-all duration-100 ${
                                                steps[stepIndex] === pattern.id
                                                    ? 'bg-cyan-500 shadow-[0_0_8px_theme(colors.cyan.400)]'
                                                    : 'bg-gray-700 hover:bg-gray-600'
                                            }`}
                                            aria-label={`Activar patrón ${pattern.name} en el paso ${stepIndex + 1}`}
                                            aria-pressed={steps[stepIndex] === pattern.id}
                                        />
                                    </div>
                                ))}
                            </React.Fragment>
                        ))}
                    </div>
                     {patterns.length === 0 && (
                        <div className="text-center py-4 text-gray-500 text-sm">
                            Guarda algunos patrones para empezar a secuenciar.
                        </div>
                    )}
                </div>
            </CollapsibleSection>
            
            {/* --- PROPERTY SEQUENCER --- */}
            <CollapsibleSection title="Secuenciador de Propiedades">
                <PropertySequencer />
            </CollapsibleSection>
        </div>
    );
};

export default Sequencer;
