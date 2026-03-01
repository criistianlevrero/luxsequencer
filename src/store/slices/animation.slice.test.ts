import { describe, expect, it, vi } from 'vitest';
import { ControlSource } from '../../types';
import { createInitialSettings } from '../../utils/settingsMigration';
import { createAnimationSlice } from './animation.slice';

const createAnimationHarness = () => {
  const state: any = {
    project: null,
    activeSequenceIndex: 0,
    currentSettings: createInitialSettings(),
    activeAnimations: new Map(),
    previousGradient: null,
    previousBackgroundGradient: null,
    transitionProgress: 1,
  };

  const set = (partial: any) => {
    const patch = typeof partial === 'function' ? partial(state) : partial;
    Object.assign(state, patch);
  };

  const get = () => state;

  const actions = createAnimationSlice(set as any, get as any, {} as any);
  Object.assign(state, actions);

  state._animationLoop = vi.fn();

  return state;
};

describe('animation.slice', () => {
  it('ignores lower-priority change requests for same property', () => {
    const store = createAnimationHarness();

    store.activeAnimations.set('common.animationSpeed', {
      request: {
        property: 'common.animationSpeed',
        from: 1,
        to: 2,
        steps: 4,
        source: ControlSource.UI,
        interpolationType: 'linear',
      },
      currentFrame: 0,
      totalFrames: 10,
      startValue: 1,
    });

    store.requestPropertyChange('common.animationSpeed', 1, 0.5, 0, ControlSource.PatternSequencer, 'linear');

    expect(store.activeAnimations.get('common.animationSpeed').request.to).toBe(2);
    expect(store.currentSettings.common.animationSpeed).toBe(1);
  });

  it('applies immediate changes (steps=0) and clears existing animation', () => {
    const store = createAnimationHarness();

    store.activeAnimations.set('common.animationSpeed', {
      request: {
        property: 'common.animationSpeed',
        from: 1,
        to: 2,
        steps: 4,
        source: ControlSource.UI,
        interpolationType: 'linear',
      },
      currentFrame: 0,
      totalFrames: 10,
      startValue: 1,
    });

    store.requestPropertyChange('common.animationSpeed', 1, 1.8, 0, ControlSource.UI, 'linear');

    expect(store.activeAnimations.has('common.animationSpeed')).toBe(false);
    expect(store.currentSettings.common.animationSpeed).toBe(1.8);
  });

  it('registers animated changes and triggers animation loop when starting from idle', () => {
    const store = createAnimationHarness();

    store.requestPropertyChange('common.animationSpeed', 1, 1.5, 2, ControlSource.UI, 'linear');

    const animation = store.activeAnimations.get('common.animationSpeed');
    expect(animation).toBeDefined();
    expect(animation.request.steps).toBe(2);
    expect(store._animationLoop).toHaveBeenCalledTimes(1);
  });
});
