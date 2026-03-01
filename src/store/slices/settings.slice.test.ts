import { describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { ControlSource } from '../../types';
import { createInitialSettings, setNestedProperty } from '../../utils/settingsMigration';
import { createSettingsSlice } from './settings.slice';

const makeProject = (): Project => {
  const settingsA = createInitialSettings();
  const settingsB = setNestedProperty(settingsA, 'common.animationSpeed', 1.75);

  return {
    version: '2.1.0',
    globalSettings: {
      midiMappings: {},
      isSequencerPlaying: false,
      renderer: 'scales',
    },
    sequences: [
      {
        id: 'seq-1',
        name: 'Main',
        interpolationSpeed: 2,
        activeRenderer: 'scales',
        activePatterns: [
          {
            id: 'pattern-1',
            name: 'Pattern 1',
            settings: settingsB,
          },
        ],
        rendererPatterns: { scales: [] },
        rendererSequencerStates: {
          scales: {
            steps: Array(16).fill(null),
            bpm: 120,
            numSteps: 16,
            propertyTracks: [],
          },
        },
      },
    ],
  };
};

const createSettingsHarness = () => {
  const state: any = {
    project: makeProject(),
    activeSequenceIndex: 0,
    currentSettings: createInitialSettings(),
    selectedPatternId: null,
    isPatternDirty: false,
    learningPatternMidiNote: null,
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };
  const get = () => state;

  const actions = createSettingsSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state.requestPropertyChange = vi.fn();
  state.setProject = vi.fn((project: Project) => {
    state.project = project;
  });

  return state;
};

describe('settings.slice', () => {
  it('setCurrentSetting requests immediate UI change with previous nested value', () => {
    const store = createSettingsHarness();
    store.selectedPatternId = 'pattern-1';

    store.setCurrentSetting('common.animationSpeed', 1.5);

    expect(store.requestPropertyChange).toHaveBeenCalledWith(
      'common.animationSpeed',
      1,
      1.5,
      0,
      ControlSource.UI,
      'linear'
    );
    expect(store.isPatternDirty).toBe(true);
  });

  it('loadPattern requests only changed properties and updates selection state', () => {
    const store = createSettingsHarness();

    store.loadPattern('pattern-1');

    expect(store.requestPropertyChange).toHaveBeenCalledTimes(1);
    expect(store.requestPropertyChange).toHaveBeenCalledWith(
      'common.animationSpeed',
      1,
      1.75,
      2,
      ControlSource.UI,
      'linear'
    );
    expect(store.selectedPatternId).toBe('pattern-1');
    expect(store.isPatternDirty).toBe(false);
  });

  it('loadPattern is a no-op when pattern id does not exist', () => {
    const store = createSettingsHarness();

    store.loadPattern('missing-pattern');

    expect(store.requestPropertyChange).not.toHaveBeenCalled();
    expect(store.selectedPatternId).toBeNull();
  });
});
