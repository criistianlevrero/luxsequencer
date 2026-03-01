import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { createInitialSettings } from '../../utils/settingsMigration';
import { LOCAL_STORAGE_KEY } from '../utils/helpers';

vi.mock('../../components/renderers', () => ({
  renderers: {},
}));

vi.mock('../../config', () => ({
  config: {
    debug: {
      validation: false,
    },
  },
}));

let createProjectSlice: any;

const makeProject = (): Project => {
  const base = createInitialSettings();

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
            id: 'scales-pattern-1',
            name: 'Scales P1',
            settings: base,
          },
        ],
        rendererPatterns: {
          scales: [],
          'dvd-screensaver': [
            {
              id: 'dvd-pattern-1',
              name: 'DVD P1',
              settings: base,
            },
          ],
        },
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

const createProjectHarness = () => {
  const state: any = {
    project: makeProject(),
    activeSequenceIndex: 0,
    currentSettings: createInitialSettings(),
    selectedPatternId: null,
    isPatternDirty: true,
    sequencerCurrentStep: 3,
    sequencerStartTime: 1234,
    sequencerLoopCount: 1,
    textureRotation: 0,
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };

  const get = () => state;

  const actions = createProjectSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state._tickSequencer = vi.fn();
  state._updatePropertySequencer = vi.fn();

  return state;
};

beforeAll(async () => {
  ({ createProjectSlice } = await import('./project.slice'));
});

describe('project.slice', () => {
  it('setProject persists project in localStorage', () => {
    const store = createProjectHarness();
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

    store.setProject(store.project);

    expect(setItemSpy).toHaveBeenCalledWith(LOCAL_STORAGE_KEY, JSON.stringify(store.project));
    setItemSpy.mockRestore();
  });

  it('changeRenderer caches current renderer patterns and loads target renderer patterns', () => {
    const store = createProjectHarness();

    store.changeRenderer('dvd-screensaver');

    const sequence = store.project.sequences[0];

    expect(sequence.activeRenderer).toBe('dvd-screensaver');
    expect(sequence.rendererPatterns.scales).toHaveLength(1);
    expect(sequence.activePatterns[0].id).toBe('dvd-pattern-1');
    expect(store.project.globalSettings.renderer).toBe('dvd-screensaver');
    expect(store.selectedPatternId).toBe('dvd-pattern-1');
    expect(store.isPatternDirty).toBe(false);
    expect(store.sequencerCurrentStep).toBe(0);
    expect(store.sequencerStartTime).toBeNull();
  });

  it('changeRenderer initializes missing target sequencer state', () => {
    const store = createProjectHarness();

    store.changeRenderer('concentric');

    const seqState = store.project.sequences[0].rendererSequencerStates.concentric;

    expect(seqState).toBeDefined();
    expect(seqState.bpm).toBe(120);
    expect(seqState.numSteps).toBe(16);
    expect(seqState.steps).toHaveLength(16);
    expect(store.selectedPatternId).toBeNull();
    expect(store.isPatternDirty).toBe(false);
  });
});
