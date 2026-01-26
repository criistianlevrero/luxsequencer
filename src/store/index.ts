import { createWithEqualityFn } from 'zustand/traditional';
import { shallow } from 'zustand/shallow';
import type { StoreState, State } from './types';
import { createProjectSlice } from './slices/project.slice';
import { createSettingsSlice } from './slices/settings.slice';
import { createSequencerSlice } from './slices/sequencer.slice';
import { createMidiSlice } from './slices/midi.slice';
import { createUISlice, initialLocale } from './slices/ui.slice';
import { createAnimationSlice } from './slices/animation.slice';
import { createDualScreenSlice } from './slices/dualScreen.slice';
import { createInitialSettings } from '../utils/settingsMigration';

// --- Initial State ---
const initialState: State = {
    project: null,
    activeSequenceIndex: 0,
    currentSettings: createInitialSettings(),  // Use new flexible structure
    textureRotation: 0,
    isPatternDirty: false,
    selectedPatternId: null,
    learningPatternMidiNote: null,
    sequencerCurrentStep: 0,
    sequencerTimeoutId: null,
    sequencerStartTime: null,
    sequencerLoopCount: 0,
    propertySequencerRafId: null,
    lastAppliedSettingsRef: null,
    midi: {
        devices: [],
        selectedDeviceId: null,
        learningControl: null,
        noteOnTime: {},
        connectionError: null,
    },
    midiLog: [],
    viewportMode: 'horizontal',
    currentLocale: initialLocale,
    
    // Dual screen system
    dualScreen: {
        enabled: false,
        isSecondaryWindow: false,
        secondaryWindow: null,
        broadcastChannel: null,
        channelName: 'luxsequencer-dualscreen'
    },
    
    // Animation system (updated for flexible property paths)
    activeAnimations: new Map(),
    
    // Legacy fields for gradient transitions (used by WebGL shaders)
    transitionProgress: 1,
    previousGradient: null,
    previousBackgroundGradient: null,
};

// --- Store Creation ---
export const useTextureStore = createWithEqualityFn<StoreState>(
    (set, get, api) => ({
        ...initialState,
        ...createProjectSlice(set, get, api),
        ...createSettingsSlice(set, get, api),
        ...createSequencerSlice(set, get, api),
        ...createMidiSlice(set, get, api),
        ...createUISlice(set, get, api),
        ...createAnimationSlice(set, get, api),
        ...createDualScreenSlice(set, get, api),
    }),
    shallow
);

