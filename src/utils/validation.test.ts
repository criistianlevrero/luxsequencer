import React from 'react';
import { describe, expect, it } from 'vitest';
import type { RendererDefinition } from '../components/renderers/types';
import { createInitialSettings, setNestedProperty } from './settingsMigration';
import {
  ValidationRules,
  createValidationSpec,
  validatePropertyValue,
  validateRenderer,
  validateRendererRuntime,
  validateRendererSettings,
} from './validation';

const baseRenderer: RendererDefinition = {
  id: 'scales',
  name: 'Scales',
  component: (() => null) as React.FC<{ className?: string }>,
  workerEntry: 'data:text/javascript,self.onmessage=()=>{}',
  controlSchema: [],
};

describe('validation utilities', () => {
  it('validateRendererSettings returns valid when renderer has no validation spec', () => {
    const result = validateRendererSettings(baseRenderer, createInitialSettings());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('validateRendererSettings reports warning for out-of-range values in non-strict mode', () => {
    const renderer: RendererDefinition = {
      ...baseRenderer,
      validation: createValidationSpec({
        'common.animationSpeed': [ValidationRules.range(0.1, 2.5)],
      }),
    };

    const settings = setNestedProperty(createInitialSettings(), 'common.animationSpeed', 5);
    const result = validateRendererSettings(renderer, settings);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe('OUT_OF_RANGE');
  });

  it('validateRendererSettings reports errors for out-of-range values in strict mode', () => {
    const renderer: RendererDefinition = {
      ...baseRenderer,
      validation: createValidationSpec(
        {
          'common.animationSpeed': [ValidationRules.range(0.1, 2.5)],
        },
        { strict: true }
      ),
    };

    const settings = setNestedProperty(createInitialSettings(), 'common.animationSpeed', 5);
    const result = validateRendererSettings(renderer, settings);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('OUT_OF_RANGE');
  });

  it('validateRendererRuntime returns error when compatibility check fails', async () => {
    const renderer: RendererDefinition = {
      ...baseRenderer,
      validation: {
        settings: { rules: {}, strict: false, skipMissing: false },
        runtime: [
          {
            type: 'compatibility',
            check: async () => false,
            message: 'Not compatible',
            suggestion: 'Use supported browser',
          },
        ],
      },
    };

    const result = await validateRendererRuntime(renderer);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe('COMPATIBILITY');
  });

  it('validatePropertyValue warns when property is not present in schema', () => {
    const result = validatePropertyValue(
      'renderer.scales.unknownProperty',
      1,
      {
        sections: [
          {
            title: 'Main',
            controls: [
              { id: 'common.animationSpeed', type: 'slider' },
            ],
          },
        ],
      } as any
    );

    expect(result.valid).toBe(true);
    expect(result.warnings[0].code).toBe('PROPERTY_NOT_IN_SCHEMA');
  });

  it('validateRenderer reports missing renderer id', () => {
    const result = validateRenderer({ ...baseRenderer, id: '' } as RendererDefinition);

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe('RENDERER_MISSING_ID');
  });
});
