import type { Keyframe } from '../../types';
import { lerp } from './helpers';

interface InterpolationParams {
  keyframes: Keyframe[];
  fractionalStep: number;
  numSteps: number;
}

export const interpolateTrackValue = ({
  keyframes,
  fractionalStep,
  numSteps,
}: InterpolationParams): number | null => {
  if (!keyframes || keyframes.length === 0) return null;

  const sortedKeyframes = [...keyframes].sort((a, b) => a.step - b.step);

  if (sortedKeyframes.length === 1) {
    return sortedKeyframes[0].value;
  }

  const nextIndex = sortedKeyframes.findIndex(k => k.step > fractionalStep);

  const prevKeyframe =
    nextIndex <= 0
      ? sortedKeyframes[sortedKeyframes.length - 1]
      : sortedKeyframes[nextIndex - 1];

  const nextKeyframe =
    nextIndex === -1 || nextIndex === 0
      ? sortedKeyframes[0]
      : sortedKeyframes[nextIndex];

  let stepDiff: number;
  let progress: number;

  if (nextKeyframe.step > prevKeyframe.step) {
    stepDiff = nextKeyframe.step - prevKeyframe.step;
    progress = fractionalStep - prevKeyframe.step;
  } else {
    stepDiff = (numSteps - prevKeyframe.step) + nextKeyframe.step;
    progress = fractionalStep > prevKeyframe.step
      ? fractionalStep - prevKeyframe.step
      : (numSteps - prevKeyframe.step) + fractionalStep;
  }

  if (stepDiff <= 0) {
    return prevKeyframe.value;
  }

  const t = Math.max(0, Math.min(1, progress / stepDiff));
  return lerp(prevKeyframe.value, nextKeyframe.value, t);
};
