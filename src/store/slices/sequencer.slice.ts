import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, SequencerActions } from '../types';
import type { ControlSettings as _ControlSettings, PropertyTrack, Keyframe } from '../../types';
import { ControlSource } from '../../types';
import { normalizeSettings, findChangedPaths, getNestedProperty } from '../../utils/settingsMigration';
import { interpolateTrackValue } from '../utils/propertyInterpolation';

export const createSequencerSlice: StateCreator<StoreState, [], [], SequencerActions> = (set, get) => ({
    setIsSequencerPlaying: (isPlaying) => {
        const { project, sequencerTimeoutId, propertySequencerRafId } = get();
        if (!project) return;
        
        const newProject = produce(project, draft => {
            draft.globalSettings.isSequencerPlaying = isPlaying;
        });
        get().setProject(newProject);

        if (sequencerTimeoutId) clearTimeout(sequencerTimeoutId);
        if (propertySequencerRafId) cancelAnimationFrame(propertySequencerRafId);
        
        if (isPlaying) {
            set({ 
                sequencerCurrentStep: -1,
                sequencerStartTime: Date.now(),
                sequencerLoopCount: 0,
            }); 
            get()._tickSequencer();
            get()._updatePropertySequencer(); // Start RAF loop for property interpolation
        } else {
            set({ 
                sequencerTimeoutId: null,
                propertySequencerRafId: null,
            });
        }
    },
    
    setSequencerCurrentStep: (step) => {
        set({ sequencerCurrentStep: step });
    },
    
    _tickSequencer: () => {
        const { project, activeSequenceIndex, selectedPatternId, requestPropertyChange, currentSettings } = get();
        if (!project || !project.globalSettings.isSequencerPlaying) return;
        
        const activeSequence = project.sequences[activeSequenceIndex];
        const sequencer = activeSequence.rendererSequencerStates[activeSequence.activeRenderer];
        if (!sequencer) return; // No sequencer state for current renderer
        
        const numSteps = sequencer.numSteps;
        
        const nextStep = (get().sequencerCurrentStep + 1) % numSteps;
        
        // Track loop count for accurate timing calculation
        let newLoopCount = get().sequencerLoopCount;
        if (nextStep === 0 && get().sequencerCurrentStep !== -1) {
            newLoopCount++;
        }
        
        set({ 
            sequencerCurrentStep: nextStep,
            sequencerLoopCount: newLoopCount,
        });
        
        const patternIdToLoad = sequencer.steps[nextStep];
        
        // --- 1. Load base pattern if it changes (animate only differences) ---
        if (patternIdToLoad && patternIdToLoad !== selectedPatternId) {
            const newPattern = activeSequence.activePatterns.find(p => p.id === patternIdToLoad);
            const previousPattern = activeSequence.activePatterns.find(p => p.id === selectedPatternId);
            
            if (newPattern) {
                const interpolationSteps = activeSequence.interpolationSpeed;
                const _currentRenderer = project.globalSettings.renderer;
                
                // Normalize both patterns to new hierarchical structure
                const normalizedNewPattern = normalizeSettings(newPattern.settings);
                const normalizedBaseSettings = previousPattern 
                    ? normalizeSettings(previousPattern.settings) 
                    : currentSettings;
                
                // Find changed paths using hierarchical comparison
                const changedPaths = findChangedPaths(normalizedBaseSettings, normalizedNewPattern);
                
                // Request property changes using hierarchical paths
                changedPaths.forEach(path => {
                    const from = getNestedProperty(normalizedBaseSettings, path);
                    const to = getNestedProperty(normalizedNewPattern, path);
                    
                    requestPropertyChange(
                        path,
                        from,
                        to,
                        interpolationSteps,
                        ControlSource.PatternSequencer,
                        'linear'
                    );
                });
                
                // Update selection state
                set({
                    selectedPatternId: patternIdToLoad,
                    isPatternDirty: false
                });
            }
        }

        // Calculate next tick using precise timing
        const { sequencerStartTime, sequencerLoopCount } = get();
        const stepDuration = (60 / sequencer.bpm) * 1000 / 4;
        
        if (sequencerStartTime) {
            // Calculate the absolute step number (including all loops)
            const absoluteStep = (sequencerLoopCount * numSteps) + nextStep;
            const idealNextTime = sequencerStartTime + ((absoluteStep + 1) * stepDuration);
            const now = Date.now();
            const delay = Math.max(0, idealNextTime - now);
            
            const timeoutId = window.setTimeout(get()._tickSequencer, delay);
            set({ sequencerTimeoutId: timeoutId });
        } else {
            const timeoutId = window.setTimeout(get()._tickSequencer, stepDuration);
            set({ sequencerTimeoutId: timeoutId });
        }
    },

    setSequencerBpm: (bpm) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const rendererId = sequence.activeRenderer;
            
            if (!sequence.rendererSequencerStates[rendererId]) {
                sequence.rendererSequencerStates[rendererId] = {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
            }
            
            sequence.rendererSequencerStates[rendererId].bpm = bpm;
        });
        get().setProject(newProject);
    },

    setSequencerSteps: (steps) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const rendererId = sequence.activeRenderer;
            
            if (!sequence.rendererSequencerStates[rendererId]) {
                sequence.rendererSequencerStates[rendererId] = {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
            }
            
            sequence.rendererSequencerStates[rendererId].steps = steps;
        });
        get().setProject(newProject);
    },
    
    setSequencerNumSteps: (numSteps) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;

        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const rendererId = sequence.activeRenderer;
            
            if (!sequence.rendererSequencerStates[rendererId]) {
                sequence.rendererSequencerStates[rendererId] = {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
            }
            
            const seq = sequence.rendererSequencerStates[rendererId];
            seq.numSteps = numSteps;
            const currentLength = seq.steps.length;
            if (numSteps > currentLength) {
                seq.steps.push(...Array(numSteps - currentLength).fill(null));
            } else {
                seq.steps.length = numSteps;
            }
        });
        get().setProject(newProject);
    },
    
    addPropertyTrack: (property) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        
        const newTrack: PropertyTrack = {
            id: crypto.randomUUID(),
            property,
            keyframes: [],
        };

        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const activeRenderer = sequence.activeRenderer;
            if (!sequence.rendererSequencerStates[activeRenderer]) {
                sequence.rendererSequencerStates[activeRenderer] = {
                    steps: Array(16).fill(null),
                    bpm: 120,
                    numSteps: 16,
                    propertyTracks: []
                };
            }
            const sequencer = sequence.rendererSequencerStates[activeRenderer];
            if (!sequencer.propertyTracks) sequencer.propertyTracks = [];
            sequencer.propertyTracks.push(newTrack);
        });
        get().setProject(newProject);
    },

    removePropertyTrack: (trackId) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const activeRenderer = sequence.activeRenderer;
            const sequencer = sequence.rendererSequencerStates[activeRenderer];
            if (sequencer?.propertyTracks) {
                sequencer.propertyTracks = sequencer.propertyTracks.filter(t => t.id !== trackId);
            }
        });
        get().setProject(newProject);
    },

    addKeyframe: (trackId, step) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;

        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const activeRenderer = sequence.activeRenderer;
            const sequencer = sequence.rendererSequencerStates[activeRenderer];
            const track = sequencer?.propertyTracks?.find(t => t.id === trackId);
            if (!track || track.keyframes.some(k => k.step === step)) return;

            const sliderConfig = (get().rendererAnimatableProperties[activeRenderer] || [])
                .find(property => property.id === track.property);

            let defaultValue: number | null = null;
            if (sliderConfig) {
                defaultValue = sliderConfig.min + (sliderConfig.max - sliderConfig.min) * 0.5;
            } else {
                const currentValue = Number(getNestedProperty(get().currentSettings, track.property));
                if (Number.isFinite(currentValue)) {
                    defaultValue = currentValue;
                }
            }

            if (defaultValue === null) return;

            const newKeyframe: Keyframe = { step, value: defaultValue, interpolation: 'linear' };
            track.keyframes.push(newKeyframe);
        });
        get().setProject(newProject);
    },

    updateKeyframeValue: (trackId, step, value) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const activeRenderer = sequence.activeRenderer;
            const sequencer = sequence.rendererSequencerStates[activeRenderer];
            const track = sequencer?.propertyTracks?.find(t => t.id === trackId);
            if (!track) return;
            const keyframe = track.keyframes.find(k => k.step === step);
            if (keyframe) {
                keyframe.value = value;
            }
        });
        get().setProject(newProject);
    },

    removeKeyframe: (trackId, step) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const activeRenderer = sequence.activeRenderer;
            const sequencer = sequence.rendererSequencerStates[activeRenderer];
            const track = sequencer?.propertyTracks?.find(t => t.id === trackId);
            if (track) {
                track.keyframes = track.keyframes.filter(k => k.step !== step);
            }
        });
        get().setProject(newProject);
    },

    _updatePropertySequencer: () => {
        const { project, activeSequenceIndex, requestPropertyChange, sequencerStartTime } = get();
        
        if (!project || !project.globalSettings.isSequencerPlaying || !sequencerStartTime) {
            return;
        }

        const activeSequence = project.sequences[activeSequenceIndex];
        const sequencer = activeSequence.rendererSequencerStates[activeSequence.activeRenderer];
        
        if (!sequencer) {
            // No sequencer state for current renderer, keep RAF running
            const rafId = requestAnimationFrame(() => get()._updatePropertySequencer());
            set({ propertySequencerRafId: rafId });
            return;
        }
        
        const { propertyTracks, bpm, numSteps } = sequencer;
        
        if (!propertyTracks || propertyTracks.length === 0) {
            // No tracks, but keep RAF running
            const rafId = requestAnimationFrame(() => get()._updatePropertySequencer());
            set({ propertySequencerRafId: rafId });
            return;
        }

        // Calculate fractional step based on elapsed time
        const stepDuration = (60 / bpm) * 1000 / 4; // milliseconds per step
        const now = Date.now();
        const timeElapsed = now - sequencerStartTime;
        const fractionalStep = (timeElapsed / stepDuration) % numSteps;

        const rendererId = activeSequence.activeRenderer;
        const sliderConfigs = (get().rendererAnimatableProperties[rendererId] || [])
            .reduce((acc, c) => {
                acc[c.id] = c;
                return acc;
            }, {} as Record<string, { min: number; max: number; step: number }>);

        // Update each property track
        propertyTracks.forEach(track => {
            const interpolatedValue = interpolateTrackValue({
                keyframes: track.keyframes,
                fractionalStep,
                numSteps,
            });

            if (interpolatedValue === null) {
                return;
            }

            // Apply the interpolated value immediately
            if (sliderConfigs && sliderConfigs[track.property]) {
                const currentValue = getNestedProperty(get().currentSettings, track.property);
                requestPropertyChange(
                    track.property,
                    currentValue,
                    interpolatedValue,
                    0, // Immediate - smoothness comes from RAF frequency
                    ControlSource.PropertySequencer,
                    'linear'
                );
            }
        });

        // Continue RAF loop
        const rafId = requestAnimationFrame(() => get()._updatePropertySequencer());
        set({ propertySequencerRafId: rafId });
    },
});
