import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Project } from '../../types';
import { createMidiSlice } from './midi.slice';

const makeProject = (): Project => ({
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
      activePatterns: [],
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
});

const createMidiHarness = () => {
  const state: any = {
    project: makeProject(),
    activeSequenceIndex: 0,
    currentSettings: { animationSpeed: 1 },
    midi: {
      devices: [],
      selectedDeviceId: null,
      learningControl: null,
      noteOnTime: {},
      connectionError: null,
    },
    midiLog: [],
    learningPatternMidiNote: null,
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };
  const get = () => state;

  const actions = createMidiSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state.requestPropertyChange = vi.fn();
  state.setProject = vi.fn((project: Project) => {
    state.project = project;
  });
  state.saveCurrentPattern = vi.fn();
  state.loadPattern = vi.fn();

  return state;
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('midi.slice', () => {
  it('connectMidi sets connection error when Web MIDI API is unavailable', async () => {
    const store = createMidiHarness();
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: undefined,
    });

    await store.connectMidi();

    expect(store.midi.connectionError).toContain('Web MIDI');
  });

  it('connectMidi loads available MIDI input devices', async () => {
    const store = createMidiHarness();
    const fakeInput = {
      id: 'dev-1',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as any;

    Object.defineProperty(navigator, 'requestMIDIAccess', {
      configurable: true,
      value: vi.fn().mockResolvedValue({
        inputs: new Map([['dev-1', fakeInput]]),
      }),
    });

    await store.connectMidi();

    expect(store.midi.devices).toHaveLength(1);
    expect(store.midi.devices[0].id).toBe('dev-1');
    expect(store.midi.connectionError).toBeNull();
  });

  it('startMidiLearning toggles learning state for same control id', () => {
    const store = createMidiHarness();

    store.startMidiLearning('animationSpeed');
    expect(store.midi.learningControl).toBe('animationSpeed');

    store.startMidiLearning('animationSpeed');
    expect(store.midi.learningControl).toBeNull();
  });

  it('_handleMidiMessage learns CC mapping and exits learning mode', () => {
    const store = createMidiHarness();
    store.midi.learningControl = 'animationSpeed';

    store._handleMidiMessage({
      data: new Uint8Array([176, 21, 64]),
      timeStamp: 1000,
    } as MIDIMessageEvent);

    expect(store.setProject).toHaveBeenCalledOnce();
    expect(store.project.globalSettings.midiMappings.animationSpeed).toBe(21);
    expect(store.midi.learningControl).toBeNull();
  });

  it('_handleMidiMessage applies mapped CC value via requestPropertyChange', () => {
    const store = createMidiHarness();
    store.project.globalSettings.midiMappings = { animationSpeed: 21 };

    store._handleMidiMessage({
      data: new Uint8Array([176, 21, 127]),
      timeStamp: 1100,
    } as MIDIMessageEvent);

    expect(store.requestPropertyChange).toHaveBeenCalledWith(
      'animationSpeed',
      1,
      2.5,
      0,
      3,
      'linear'
    );
  });
});
