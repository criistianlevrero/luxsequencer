import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';
import { ControlSource } from '../../types';
import { createInitialSettings, setNestedProperty } from '../../utils/settingsMigration';

let createSequencerSlice: any;

beforeAll(async () => {
  ({ createSequencerSlice } = await import('./sequencer.slice'));
});

const makeProject = (): Project => {
  const baseSettings = createInitialSettings();
  const patternSettings = setNestedProperty(baseSettings, 'common.animationSpeed', 1.8);

  return {
    version: '2.1.0',
    globalSettings: {
      midiMappings: {},
      isSequencerPlaying: true,
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
            name: 'P1',
            settings: patternSettings,
          },
        ],
        rendererPatterns: {
          scales: [],
        },
        rendererSequencerStates: {
          scales: {
            steps: ['pattern-1', null, null, null],
            bpm: 120,
            numSteps: 4,
            propertyTracks: [
              {
                id: 'track-1',
                property: 'common.animationSpeed',
                keyframes: [
                  { step: 0, value: 1, interpolation: 'linear' },
                  { step: 2, value: 2, interpolation: 'linear' },
                ],
              },
            ],
          },
        },
      },
    ],
  };
};

const createSequencerHarness = () => {
  const state: any = {
    project: makeProject(),
    activeSequenceIndex: 0,
    selectedPatternId: null,
    currentSettings: createInitialSettings(),
    sequencerCurrentStep: -1,
    sequencerTimeoutId: null,
    sequencerStartTime: Date.now() - 125,
    sequencerLoopCount: 0,
    propertySequencerRafId: null,
    isPatternDirty: true,
    rendererAnimatableProperties: {
      scales: [
        {
          id: 'common.animationSpeed',
          label: 'Animation Speed',
          category: 'Test',
          min: 0,
          max: 3,
          step: 0.1,
          formatter: (v: number) => String(v),
        },
      ],
    },
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };
  const get = () => state;

  const actions = createSequencerSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state.requestPropertyChange = vi.fn();
  state.setProject = vi.fn((project: Project) => {
    state.project = project;
  });

  return state;
};

describe('sequencer.slice', () => {
  it('_tickSequencer advances playhead and schedules next tick', () => {
    const store = createSequencerHarness();
    const timeoutSpy = vi.spyOn(window, 'setTimeout').mockReturnValue(42 as any);

    store._tickSequencer();

    expect(store.sequencerCurrentStep).toBe(0);
    expect(store.sequencerTimeoutId).toBe(42);
    expect(timeoutSpy).toHaveBeenCalled();

    timeoutSpy.mockRestore();
  });

  it('_tickSequencer requests pattern property changes and selects loaded pattern', () => {
    const store = createSequencerHarness();
    const timeoutSpy = vi.spyOn(window, 'setTimeout').mockReturnValue(7 as any);

    store._tickSequencer();

    expect(store.requestPropertyChange).toHaveBeenCalled();
    expect(store.selectedPatternId).toBe('pattern-1');
    expect(store.isPatternDirty).toBe(false);

    timeoutSpy.mockRestore();
  });

  it('_updatePropertySequencer interpolates track and applies immediate property change', () => {
    const store = createSequencerHarness();
    const rafSpy = vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(99);

    store._updatePropertySequencer();

    expect(store.requestPropertyChange).toHaveBeenCalledWith(
      'common.animationSpeed',
      1,
      expect.any(Number),
      0,
      ControlSource.PropertySequencer,
      'linear'
    );
    expect(store.propertySequencerRafId).toBe(99);

    rafSpy.mockRestore();
  });

  it('_tickSequencer increments loop count when wrapping from last step to first', () => {
    const store = createSequencerHarness();
    store.sequencerCurrentStep = 3;
    store.sequencerLoopCount = 0;

    const timeoutSpy = vi.spyOn(window, 'setTimeout').mockReturnValue(21 as any);

    store._tickSequencer();

    expect(store.sequencerCurrentStep).toBe(0);
    expect(store.sequencerLoopCount).toBe(1);

    timeoutSpy.mockRestore();
  });

  it('_tickSequencer computes drift-aware positive delay when current time is before ideal next tick', () => {
    const store = createSequencerHarness();
    const now = Date.now();
    store.sequencerStartTime = now - 100;
    store.sequencerCurrentStep = -1;
    store.sequencerLoopCount = 0;

    const timeoutSpy = vi.spyOn(window, 'setTimeout').mockReturnValue(33 as any);

    store._tickSequencer();

    const delay = timeoutSpy.mock.calls[0]?.[1] as number;
    expect(delay).toBeGreaterThan(0);
    expect(delay).toBeLessThanOrEqual(125);

    timeoutSpy.mockRestore();
  });
});
