import type { 
  ControlSettings, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  ValidationRule,
  ValidationConfig,
  RendererValidationSpec,
  RuntimeValidationRule
} from '../types';
import type { RendererDefinition } from '../components/renderers/types';
import { getNestedProperty } from './settingsMigration';
import { env } from '../config';

/**
 * Validates renderer settings against their validation specification
 */
export const validateRendererSettings = (
  renderer: RendererDefinition,
  settings: ControlSettings
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Skip validation if no spec provided
  if (!renderer.validation) {
    return { valid: true, errors, warnings };
  }

  const { validation } = renderer;
  const { rules, strict = false, skipMissing = false } = validation.settings;

  // Validate each rule
  for (const [property, propertyRules] of Object.entries(rules)) {
    const value = getNestedProperty(settings, property);
    
    for (const rule of propertyRules) {
      const result = validateProperty(property, value, rule, settings, skipMissing);
      
      if (result.error) {
        if (strict || result.error.severity === 'error') {
          errors.push(result.error);
        } else {
          warnings.push({
            property: result.error.property,
            message: result.error.message,
            code: result.error.code,
            suggestion: result.error.suggestion
          });
        }
      }
    }
  }

  const valid = errors.length === 0;
  
  if (env.debug.validation) {
    console.log(`[VALIDATION] ${renderer.id}:`, {
      valid,
      errors: errors.length,
      warnings: warnings.length,
      settings: property => getNestedProperty(settings, property)
    });
  }

  return { valid, errors, warnings };
};

/**
 * Validates a single property against a rule
 */
const validateProperty = (
  property: string, 
  value: any, 
  rule: ValidationRule, 
  settings: ControlSettings,
  skipMissing: boolean
): { error?: ValidationError } => {
  
  // Handle missing values
  if (value === undefined || value === null) {
    if (rule.type === 'required' && !skipMissing) {
      return {
        error: {
          property,
          message: rule.message || `Property '${property}' is required`,
          severity: 'error',
          code: rule.code,
          suggestion: rule.suggestion || `Provide a value for ${property}`
        }
      };
    }
    // Skip other validations for missing values
    return {};
  }

  // Range validation
  if (rule.type === 'range') {
    const result = validateRange(property, value, rule);
    if (result.error) return result;
  }

  // Custom validation
  if (rule.type === 'custom' || rule.type === 'dependency') {
    try {
      const isValid = rule.validator(value, settings);
      if (!isValid) {
        return {
          error: {
            property,
            message: rule.message,
            severity: 'error',
            code: rule.code,
            suggestion: rule.suggestion
          }
        };
      }
    } catch (error) {
      return {
        error: {
          property,
          message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
          severity: 'error',
          code: 'VALIDATION_EXCEPTION',
          suggestion: 'Check the validation rule implementation'
        }
      };
    }
  }

  return {};
};

/**
 * Validates numeric range constraints
 */
const validateRange = (
  property: string, 
  value: any, 
  rule: ValidationRule
): { error?: ValidationError } => {
  
  if (typeof value !== 'number') {
    return {
      error: {
        property,
        message: `Expected number, got ${typeof value}`,
        severity: 'error',
        code: 'TYPE_MISMATCH',
        suggestion: 'Provide a numeric value'
      }
    };
  }

  // Extract min/max from rule message or use defaults
  // This is a simple implementation - in practice, you'd want more structured rule definitions
  const messageMatch = rule.message.match(/between (\d+(?:\.\d+)?) and (\d+(?:\.\d+)?)/);
  if (!messageMatch) {
    return {}; // Can't validate range without bounds
  }

  const min = parseFloat(messageMatch[1]);
  const max = parseFloat(messageMatch[2]);

  if (value < min || value > max) {
    return {
      error: {
        property,
        message: rule.message,
        severity: 'warning', // Range violations are typically warnings
        code: rule.code,
        suggestion: rule.suggestion || `Value should be between ${min} and ${max}`
      }
    };
  }

  return {};
};

/**
 * Runs runtime validation checks (performance, compatibility, etc.)
 */
export const validateRendererRuntime = async (
  renderer: RendererDefinition
): Promise<ValidationResult> => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!renderer.validation?.runtime) {
    return { valid: true, errors, warnings };
  }

  for (const rule of renderer.validation.runtime) {
    try {
      const result = await rule.check();
      if (!result) {
        const error: ValidationError = {
          property: 'runtime',
          message: rule.message,
          severity: rule.type === 'compatibility' ? 'error' : 'warning',
          code: rule.type.toUpperCase(),
          suggestion: rule.suggestion
        };

        if (error.severity === 'error') {
          errors.push(error);
        } else {
          warnings.push({
            property: error.property,
            message: error.message,
            code: error.code,
            suggestion: error.suggestion
          });
        }
      }
    } catch (error) {
      errors.push({
        property: 'runtime',
        message: `Runtime check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error',
        code: 'RUNTIME_CHECK_EXCEPTION',
        suggestion: 'Check the runtime validation implementation'
      });
    }
  }

  const valid = errors.length === 0;
  return { valid, errors, warnings };
};

/**
 * Built-in validation rule factories for common cases
 */
export const ValidationRules = {
  required: (message?: string): ValidationRule => ({
    type: 'required',
    message: message || 'This field is required',
    code: 'REQUIRED',
    validator: (value) => value !== undefined && value !== null
  }),

  range: (min: number, max: number, message?: string): ValidationRule => ({
    type: 'range',
    message: message || `Value must be between ${min} and ${max}`,
    code: 'OUT_OF_RANGE',
    validator: (value) => typeof value === 'number' && value >= min && value <= max,
    suggestion: `Provide a value between ${min} and ${max}`
  }),

  arrayLength: (minLength: number, maxLength?: number, message?: string): ValidationRule => ({
    type: 'custom',
    message: message || `Array must have at least ${minLength} items${maxLength ? ` and at most ${maxLength}` : ''}`,
    code: 'INVALID_ARRAY_LENGTH',
    validator: (value) => {
      if (!Array.isArray(value)) return false;
      if (value.length < minLength) return false;
      if (maxLength !== undefined && value.length > maxLength) return false;
      return true;
    }
  }),

  dependency: (dependsOn: string, condition: (depValue: any) => boolean, message?: string): ValidationRule => ({
    type: 'dependency',
    message: message || `This field depends on ${dependsOn}`,
    code: 'DEPENDENCY_NOT_MET',
    validator: (value, settings) => {
      const depValue = getNestedProperty(settings, dependsOn);
      return condition(depValue);
    },
    suggestion: `Check the value of ${dependsOn}`
  })
};

/**
 * Helper to create validation specs easily
 */
export const createValidationSpec = (
  rules: Record<string, ValidationRule[]>,
  options: { strict?: boolean; skipMissing?: boolean } = {}
): RendererValidationSpec => ({
  settings: {
    rules,
    strict: options.strict || false,
    skipMissing: options.skipMissing || false
  },
  runtime: []
});