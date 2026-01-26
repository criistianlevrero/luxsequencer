import { produce } from 'immer';
import type { StateCreator } from 'zustand';
import type { StoreState, SettingsActions } from '../types';
import type { ControlSettings, AnyControlSettings, Pattern } from '../../types';
import { ControlSource } from '../../types';
import { env } from '../../config';
import { 
    getNestedProperty, 
    setNestedProperty, 
    normalizeSettings, 
    isNewControlSettings,
    toLegacySettings
} from '../../utils/settingsMigration';

// Helper function to find changed property paths between two settings objects
const findChangedPaths = (current: ControlSettings, target: ControlSettings, basePath = ''): string[] => {
    const paths: string[] = [];
    
    const traverse = (currentObj: any, targetObj: any, path: string) => {
        if (!currentObj || !targetObj) return;
        
        for (const key in targetObj) {
            const currentPath = path ? `${path}.${key}` : key;
            const currentValue = currentObj[key];
            const targetValue = targetObj[key];
            
            if (typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
                // Recursively traverse nested objects
                traverse(currentValue, targetValue, currentPath);
            } else {
                // Compare primitive values or arrays
                let isChanged = false;
                if (Array.isArray(targetValue) && Array.isArray(currentValue)) {
                    isChanged = JSON.stringify(currentValue) !== JSON.stringify(targetValue);
                } else {
                    isChanged = currentValue !== targetValue;
                }
                
                if (isChanged) {
                    paths.push(currentPath);
                }
            }
        }
    };
    
    traverse(current, target, basePath);
    return paths;
};

export const createSettingsSlice: StateCreator<StoreState, [], [], SettingsActions> = (set, get) => ({
    setCurrentSetting: (propertyPath: string, value: any) => {
        const { requestPropertyChange, currentSettings } = get();
        
        // Get current value using the property path
        const currentValue = getNestedProperty(currentSettings, propertyPath);
        
        // Request immediate change with UI priority
        requestPropertyChange(
            propertyPath,
            currentValue,
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

        // Normalize pattern settings to new structure if needed
        const normalizedPatternSettings = normalizeSettings(pattern.settings);

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

        // Compare settings and find changed properties
        const changedPaths = findChangedPaths(currentSettings, normalizedPatternSettings);

        if (env.debug.animation) {
            console.log('[ANIMATION] Changed paths (UI)', {
                patternId: id,
                changedPathsCount: changedPaths.length,
                changedPaths,
            });
        }

        // Request property changes for each changed property
        // Use UI priority since this is called from user interaction
        changedPaths.forEach(propertyPath => {
            const from = getNestedProperty(currentSettings, propertyPath);
            const to = getNestedProperty(normalizedPatternSettings, propertyPath);
            requestPropertyChange(
                propertyPath,
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
