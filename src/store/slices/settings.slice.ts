import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, SettingsActions } from '../types';
import type { ControlSettings, Pattern } from '../../types';
import { ControlSource } from '../../types';
import { env } from '../../config';

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsActions> = (set, get) => ({
    setCurrentSetting: <K extends keyof ControlSettings>(key: K, value: ControlSettings[K]) => {
        const { requestPropertyChange, currentSettings } = get();
        
        // Request immediate change with UI priority
        requestPropertyChange(
            key,
            currentSettings[key],
            value,
            0, // Immediate (0 steps)
            ControlSource.UI,
            'linear'
        );

        // Mark pattern as dirty if one is selected
        set({
            isPatternDirty: !!get().selectedPatternId,
        });
    },

    saveCurrentPattern: (midiNote) => {
        const { project, activeSequenceIndex, currentSettings } = get();
        if (!project) return;

        const activeSequence = project.sequences[activeSequenceIndex];
        const newPattern: Pattern = {
            id: crypto.randomUUID(),
            name: `Memoria ${activeSequence.activePatterns.length + 1}`,
            settings: currentSettings,
            midiNote,
        };
        
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            sequence.activePatterns.push(newPattern);
            
            // Also add to the current renderer's cache
            const rendererId = sequence.activeRenderer;
            if (!sequence.rendererPatterns[rendererId]) {
                sequence.rendererPatterns[rendererId] = [];
            }
            sequence.rendererPatterns[rendererId].push(newPattern);
        });
        get().setProject(newProject);
        set({ selectedPatternId: newPattern.id, isPatternDirty: false });
    },

    overwriteSelectedPattern: () => {
        const { project, selectedPatternId, currentSettings, activeSequenceIndex } = get();
        if (!project || !selectedPatternId) return;

        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const pattern = sequence.activePatterns.find(p => p.id === selectedPatternId);
            if (pattern) {
                pattern.settings = currentSettings;
                
                // Also update in renderer cache
                const rendererId = sequence.activeRenderer;
                const cachedPattern = sequence.rendererPatterns[rendererId]?.find(p => p.id === selectedPatternId);
                if (cachedPattern) {
                    cachedPattern.settings = currentSettings;
                }
            }
        });
        get().setProject(newProject);
        set({ isPatternDirty: false });
    },

    loadPattern: (id) => {
        const { project, activeSequenceIndex, currentSettings, requestPropertyChange } = get();
        if (!project) return;

        const activeSequence = project.sequences[activeSequenceIndex];
        const pattern = activeSequence.activePatterns.find(p => p.id === id);
        if (!pattern) return;

        // Get interpolation settings
        const interpolationSteps = activeSequence.interpolationSpeed;

        // DEBUG: Log pattern load start
        if (env.debug.animation) {
            console.log('[ANIMATION] Pattern load start (UI)', {
                timestamp: Date.now(),
                patternId: id,
                patternName: pattern.name,
                interpolationSteps,
            });
        }

        // Calculate properties that differ and request animations for each
        const changedKeys = (Object.keys(pattern.settings) as Array<keyof ControlSettings>).filter(key => {
            const patternValue = pattern.settings[key];
            const currentValue = currentSettings[key];
            // Deep comparison for arrays (gradients)
            if (Array.isArray(patternValue) && Array.isArray(currentValue)) {
                return JSON.stringify(patternValue) !== JSON.stringify(currentValue);
            }
            return patternValue !== currentValue;
        });

        if (env.debug.animation) {
            console.log('[ANIMATION] Changed keys (UI)', {
                patternId: id,
                changedKeysCount: changedKeys.length,
                changedKeys,
            });
        }

        // Request property changes for each changed property
        // Use UI priority since this is called from user interaction
        changedKeys.forEach(key => {
            const from = currentSettings[key];
            const to = pattern.settings[key];
            requestPropertyChange(
                key,
                from,
                to,
                interpolationSteps,
                ControlSource.UI, // Higher priority than sequencer
                'linear'
            );
        });

        // Update selection state
        set({
            selectedPatternId: id,
            isPatternDirty: false
        });
    },

    deletePattern: (id) => {
        const { project, activeSequenceIndex, selectedPatternId } = get();
        if (!project) return;
        
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            
            // Remove from active patterns
            sequence.activePatterns = sequence.activePatterns.filter(p => p.id !== id);
            
            // Remove from renderer cache
            const rendererId = sequence.activeRenderer;
            if (sequence.rendererPatterns[rendererId]) {
                sequence.rendererPatterns[rendererId] = sequence.rendererPatterns[rendererId].filter(p => p.id !== id);
            }
            
            // Remove from sequencer steps
            const sequencerState = sequence.rendererSequencerStates[rendererId];
            if (sequencerState) {
                sequencerState.steps = sequencerState.steps.map(step => step === id ? null : step);
            }
        });
        
        get().setProject(newProject);
        if (selectedPatternId === id) set({ selectedPatternId: null, isPatternDirty: false });
    },

    startLearningPatternNote: (patternId) => {
        set(state => ({ learningPatternMidiNote: state.learningPatternMidiNote === patternId ? null : patternId }));
    },
    
    clearPatternMidiAssignment: (patternId) => {
        const { project, activeSequenceIndex } = get();
        if (!project) return;
        const newProject = produce(project, draft => {
            const sequence = draft.sequences[activeSequenceIndex];
            const pattern = sequence.activePatterns.find(p => p.id === patternId);
            if (pattern) {
                delete pattern.midiNote;
                
                // Also clear in renderer cache
                const rendererId = sequence.activeRenderer;
                const cachedPattern = sequence.rendererPatterns[rendererId]?.find(p => p.id === patternId);
                if (cachedPattern) {
                    delete cachedPattern.midiNote;
                }
            }
        });
        get().setProject(newProject);
    },
});
