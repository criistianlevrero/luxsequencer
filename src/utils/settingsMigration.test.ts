import { describe, expect, it } from 'vitest';
import type { LegacyControlSettings } from '../types';
import {
  createInitialSettings,
  findChangedPaths,
  getNestedProperty,
  migrateLegacySettings,
  normalizeSettings,
  setNestedProperty,
} from './settingsMigration';

describe('settingsMigration', () => {
  it('normalizes legacy settings into hierarchical structure', () => {
    const legacy: LegacyControlSettings = {
      scaleSize: 120,
      scaleSpacing: 0.1,
      verticalOverlap: 0.2,
      horizontalOffset: 0.3,
      shapeMorph: 0.4,
      animationSpeed: 1.25,
      animationDirection: 180,
      textureRotation: 15,
      textureRotationSpeed: 2,
      scaleBorderColor: '#ffffff',
      scaleBorderWidth: 1,
      gradientColors: [{ id: 'g1', color: '#ff0000', hardStop: false }],
      backgroundGradientColors: [{ id: 'bg1', color: '#000000', hardStop: false }],
    };

    const normalized = normalizeSettings(legacy);

    expect(normalized.common.animationSpeed).toBe(1.25);
    expect(normalized.renderer.scales.textureRotationSpeed).toBe(2);
    expect(normalized.renderer.concentric.initialSize).toBe(10);
  });

  it('sets and reads nested properties without mutating original object', () => {
    const original = createInitialSettings();

    const updated = setNestedProperty(original, 'renderer.scales.scaleSize', 222);

    expect(getNestedProperty(updated, 'renderer.scales.scaleSize')).toBe(222);
    expect(getNestedProperty(original, 'renderer.scales.scaleSize')).not.toBe(222);
  });

  it('finds changed paths for nested values and arrays', () => {
    const base = createInitialSettings();
    const changed = setNestedProperty(base, 'common.animationSpeed', 1.5);
    const changedWithArray = setNestedProperty(
      changed,
      'common.backgroundGradientColors',
      [{ id: 'bg-new', color: '#123456', hardStop: true }]
    );

    const paths = findChangedPaths(base, changedWithArray);

    expect(paths).toContain('common.animationSpeed');
    expect(paths).toContain('common.backgroundGradientColors');
  });

  it('migrates legacy concentric defaults when optional values are missing', () => {
    const legacy: LegacyControlSettings = {
      scaleSize: 100,
      scaleSpacing: 0,
      verticalOverlap: 0,
      horizontalOffset: 0,
      shapeMorph: 0,
      animationSpeed: 1,
      animationDirection: 90,
      textureRotation: 0,
      textureRotationSpeed: 0,
      scaleBorderColor: '#000000',
      scaleBorderWidth: 0,
      gradientColors: [],
      backgroundGradientColors: [],
    };

    const migrated = migrateLegacySettings(legacy);

    expect(migrated.renderer.concentric.repetitionSpeed).toBe(0.5);
    expect(migrated.renderer.concentric.fillMode).toBe('stroke');
  });
});
