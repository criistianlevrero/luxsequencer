import { describe, expect, it } from 'vitest';
import { constraintValidator, schemaValidator, validationUtils } from './validationCore';

describe('validationCore', () => {
  it('validateRange fails when value is out of bounds', () => {
    const result = constraintValidator.validateRange(12, 0, 10);

    expect(result.passed).toBe(false);
    expect(result.error?.code).toBe('RANGE_VIOLATION');
  });

  it('validateRequired fails for empty values', () => {
    const result = constraintValidator.validateRequired('');

    expect(result.passed).toBe(false);
    expect(result.error?.code).toBe('REQUIRED_MISSING');
  });

  it('validateCustom returns explicit error when validator throws', () => {
    const result = constraintValidator.validateCustom(1, () => {
      throw new Error('boom');
    });

    expect(result.passed).toBe(false);
    expect(result.error?.code).toBe('CUSTOM_VALIDATION_ERROR');
  });

  it('schemaValidator warns when schema has no sections', () => {
    const result = schemaValidator.validateSchemaIntegrity({ sections: [] } as any);

    expect(result.valid).toBe(true);
    expect(result.warnings[0].code).toBe('SCHEMA_NO_SECTIONS');
  });

  it('validationUtils exposes property path helpers and blocking behavior', () => {
    const path = validationUtils.getPropertyPath('renderer.scales.scaleSize');

    expect(path).toEqual(['renderer', 'scales', 'scaleSize']);
    expect(validationUtils.isNestedProperty('common.animationSpeed')).toBe(true);
    expect(validationUtils.getPropertyRoot('common.animationSpeed')).toBe('common');
    expect(
      validationUtils.shouldBlockAction({ valid: false, errors: [{ property: 'x', message: 'e', severity: 'error', code: 'E' }], warnings: [] })
    ).toBe(true);
  });
});
