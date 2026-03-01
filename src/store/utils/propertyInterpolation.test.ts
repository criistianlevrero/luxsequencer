import { describe, expect, it } from 'vitest';
import type { Keyframe } from '../../types';
import { interpolateTrackValue } from './propertyInterpolation';

describe('interpolateTrackValue', () => {
  it('returns null when there are no keyframes', () => {
    const value = interpolateTrackValue({
      keyframes: [],
      fractionalStep: 2,
      numSteps: 16,
    });

    expect(value).toBeNull();
  });

  it('returns the single keyframe value when only one keyframe exists', () => {
    const keyframes: Keyframe[] = [{ step: 4, value: 0.75, interpolation: 'linear' }];

    const value = interpolateTrackValue({
      keyframes,
      fractionalStep: 10,
      numSteps: 16,
    });

    expect(value).toBe(0.75);
  });

  it('interpolates linearly between surrounding keyframes', () => {
    const keyframes: Keyframe[] = [
      { step: 2, value: 0, interpolation: 'linear' },
      { step: 6, value: 100, interpolation: 'linear' },
    ];

    const value = interpolateTrackValue({
      keyframes,
      fractionalStep: 4,
      numSteps: 16,
    });

    expect(value).toBe(50);
  });

  it('supports wrap-around interpolation near loop boundary', () => {
    const keyframes: Keyframe[] = [
      { step: 12, value: 100, interpolation: 'linear' },
      { step: 4, value: 0, interpolation: 'linear' },
    ];

    const value = interpolateTrackValue({
      keyframes,
      fractionalStep: 14,
      numSteps: 16,
    });

    expect(value).toBe(75);
  });
});
