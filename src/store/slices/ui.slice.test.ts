import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Project } from '../../types';

const setI18nLocaleMock = vi.fn();
const initializeI18nMock = vi.fn();
const validateRendererSettingsMock = vi.fn(() => ({ valid: true, errors: [], warnings: [] }));
const createInitialSettingsMock = vi.fn(() => ({
  common: {
    animationSpeed: 1,
  },
}));

vi.mock('../../i18n', () => ({
  setLocale: setI18nLocaleMock,
  initializeI18n: initializeI18nMock,
}));

vi.mock('../../utils/validation', () => ({
  validateRendererSettings: validateRendererSettingsMock,
}));

vi.mock('../../utils/settingsMigration', () => ({
  createInitialSettings: createInitialSettingsMock,
}));

vi.mock('../../components/renderers', () => ({
  renderers: {
    scales: {
      id: 'scales',
      name: 'Scales',
      controlSchema: [],
      component: () => null,
    },
  },
}));

vi.mock('../../config', () => ({
  config: {
    debug: {
      validation: false,
    },
  },
}));

let createUISlice: any;
let initialLocale: 'en' | 'es';

const makeProject = (): Project => ({
  version: '2.1.0',
  globalSettings: {
    midiMappings: {},
    isSequencerPlaying: false,
    renderer: 'scales',
  },
  sequences: [],
});

const createUIHarness = (withProject = true) => {
  const state: any = {
    project: withProject ? makeProject() : null,
    midiLog: [{ timestamp: Date.now(), message: 'x', type: 'info' }],
    viewportMode: 'horizontal',
    currentLocale: 'en',
    currentSettings: {
      common: {
        animationSpeed: 0.5,
      },
    },
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };

  const get = () => state;

  const actions = createUISlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state.setProject = vi.fn((project: Project) => {
    state.project = project;
  });

  return state;
};

beforeAll(async () => {
  const module = await import('./ui.slice');
  createUISlice = module.createUISlice;
  initialLocale = module.initialLocale;
});

beforeEach(() => {
  setI18nLocaleMock.mockClear();
  initializeI18nMock.mockClear();
  validateRendererSettingsMock.mockClear();
  createInitialSettingsMock.mockClear();
  localStorage.clear();
});

describe('ui.slice', () => {
  it('exports a valid initial locale from storage/browser detection', () => {
    expect(initialLocale === 'en' || initialLocale === 'es').toBe(true);
  });

  it('clearMidiLog clears store midi log', () => {
    const store = createUIHarness();

    store.clearMidiLog();

    expect(store.midiLog).toEqual([]);
  });

  it('setViewportMode updates viewport mode in state', () => {
    const store = createUIHarness();

    store.setViewportMode('vertical');

    expect(store.viewportMode).toBe('vertical');
  });

  it('setLocale updates i18n locale, persists localStorage, and updates state', () => {
    const store = createUIHarness();

    store.setLocale('es');

    expect(setI18nLocaleMock).toHaveBeenCalledWith('es');
    expect(localStorage.getItem('luxsequencer_locale')).toBe('es');
    expect(store.currentLocale).toBe('es');
  });

  it('setRenderer updates project renderer and resets current settings', () => {
    const store = createUIHarness();

    store.setRenderer('scales');

    expect(store.setProject).toHaveBeenCalledOnce();
    expect(store.project.globalSettings.renderer).toBe('scales');
    expect(validateRendererSettingsMock).toHaveBeenCalledOnce();
    expect(createInitialSettingsMock).toHaveBeenCalledOnce();
    expect(store.currentSettings).toEqual({ common: { animationSpeed: 1 } });
  });

  it('setRenderer is a no-op when project is null', () => {
    const store = createUIHarness(false);

    store.setRenderer('scales');

    expect(store.setProject).not.toHaveBeenCalled();
    expect(createInitialSettingsMock).not.toHaveBeenCalled();
    expect(validateRendererSettingsMock).not.toHaveBeenCalled();
  });
});
