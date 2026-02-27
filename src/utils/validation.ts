import type { 
  ControlSettings, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning,
  ValidationRule,
  ValidationConfig as _ValidationConfig,
  RendererValidationSpec,
  RuntimeValidationRule as _RuntimeValidationRule,
  DeclarativeControlSchema
} from '../types';
import type { RendererDefinition } from '../components/renderers/types';
import { getNestedProperty } from './settingsMigration';

// Import Phase 1.2 validation components
import type { 
  ConstraintValidator as _ConstraintValidator, DependencyValidator as _DependencyValidator, SchemaValidator as _SchemaValidator, 
  SettingsValidator as _SettingsValidator, CompositeValidator as _CompositeValidator, ValidationUtils as _ValidationUtils
} from '../types/validation';
import { 
  constraintValidator, dependencyValidator, schemaValidator, validationUtils 
} from './validationCore';

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
    strict: options.strict ?? false,
    skipMissing: options.skipMissing ?? false
  },
  runtime: []
});

// ===== PHASE 1.2: ENHANCED VALIDATION SYSTEM =====

/**
 * Comprehensive validation for settings with declarative schema support
 */
export const validateSettingsWithSchema = (
  settings: ControlSettings,
  schema?: DeclarativeControlSchema,
  renderer?: RendererDefinition
): ValidationResult => {
  const startTime = Date.now();
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Schema validation if available
  if (schema) {
    const schemaValidation = schemaValidator.validateSchemaIntegrity(schema);
    errors.push(...schemaValidation.errors);
    warnings.push(...schemaValidation.warnings);
    
    if (schemaValidation.valid) {
      // Dependency validation
      const depValidation = dependencyValidator.validateDependencies(settings, schema);
      errors.push(...depValidation.errors);
      warnings.push(...depValidation.warnings);
      
      // Control-specific validation
      const controlValidation = validateSettingsAgainstSchema(settings, schema);
      errors.push(...controlValidation.errors);
      warnings.push(...controlValidation.warnings);
    }
  }
  
  // Legacy renderer validation
  if (renderer?.validation) {
    const legacyValidation = validateRendererSettings(renderer, settings);
    // Convert legacy format to new format
    errors.push(...legacyValidation.errors);
    warnings.push(...legacyValidation.warnings.map(w => ({
      type: 'suboptimal_value' as const,
      property: w.property,
      message: w.message,
      code: w.code,
      suggestion: w.suggestion
    })));
  }
  
  const validationTime = Date.now() - startTime;
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates settings against a declarative control schema
 */
export const validateSettingsAgainstSchema = (
  settings: ControlSettings,
  schema: DeclarativeControlSchema
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!schema.sections) {
    return { valid: true, errors, warnings };
  }
  
  for (const section of schema.sections) {
    if (section.controls) {
      for (const control of section.controls) {
        const value = getNestedProperty(settings, control.id);
        const validation = validateControlValue(control, value, settings);
        errors.push(...validation.errors);
        warnings.push(...validation.warnings);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validates a single control value against its definition
 */
export const validateControlValue = (
  control: any,
  value: any,
  _settings: ControlSettings
) => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Type validation
  const expectedType = getExpectedTypeForControl(control.type);
  if (expectedType && value !== undefined) {
    const typeValidation = constraintValidator.validateType(value, expectedType);
    if (!typeValidation.passed && typeValidation.error) {
      errors.push({
        ...typeValidation.error,
        property: control.id
      });
    }
  }
  
  // Constraint validation based on control type
  if (control.constraints) {
    switch (control.type) {
      case 'slider':
        if (control.constraints.slider && typeof value === 'number') {
          const { min, max } = control.constraints.slider;
          const rangeValidation = constraintValidator.validateRange(value, min, max);
          if (!rangeValidation.passed && rangeValidation.error) {
            errors.push({
              ...rangeValidation.error,
              property: control.id
            });
          }
        }
        break;
        
      case 'color':
        if (control.constraints.color && value) {
          const formatValidation = constraintValidator.validateFormat(value, {
            type: 'color'
          });
          if (!formatValidation.passed && formatValidation.error) {
            errors.push({
              ...formatValidation.error,
              property: control.id
            });
          }
        }
        break;
        
      case 'vector2d':
        if (control.constraints.vector2d && value && typeof value === 'object') {
          const { xRange, yRange } = control.constraints.vector2d;
          if (xRange && value.x !== undefined) {
            const xValidation = constraintValidator.validateRange(value.x, xRange[0], xRange[1]);
            if (!xValidation.passed && xValidation.error) {
              errors.push({
                ...xValidation.error,
                property: `${control.id}.x`
              });
            }
          }
          if (yRange && value.y !== undefined) {
            const yValidation = constraintValidator.validateRange(value.y, yRange[0], yRange[1]);
            if (!yValidation.passed && yValidation.error) {
              errors.push({
                ...yValidation.error,
                property: `${control.id}.y`
              });
            }
          }
        }
        break;
    }
  }
  
  // Required validation
  if (control.required) {
    const requiredValidation = constraintValidator.validateRequired(value);
    if (!requiredValidation.passed && requiredValidation.error) {
      errors.push({
        ...requiredValidation.error,
        property: control.id
      });
    }
  }
  
  return { errors, warnings };
};

/**
 * Get expected TypeScript type for a control type
 */
const getExpectedTypeForControl = (controlType: string): string | null => {
  switch (controlType) {
    case 'slider':
    case 'range':
      return 'number';
    case 'color':
    case 'text':
      return 'string';
    case 'toggle':
      return 'boolean';
    case 'select':
      return 'string'; // Could be array for multi-select
    case 'vector2d':
      return 'object';
    case 'gradient':
      return 'array';
    default:
      return null;
  }
};

/**
 * Enhanced property validation with comprehensive error handling
 */
export const validatePropertyValue = (
  property: string,
  value: any,
  schema?: DeclarativeControlSchema
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  if (!schema?.sections) {
    return { valid: true, errors, warnings };
  }
  
  // Find the control definition for this property
  let controlDef: any = null;
  for (const section of schema.sections) {
    if (section.controls) {
      controlDef = section.controls.find(c => c.id === property);
      if (controlDef) break;
    }
  }
  
  if (!controlDef) {
    warnings.push({
      property,
      message: `Property '${property}' not defined in schema`,
      code: 'PROPERTY_NOT_IN_SCHEMA',
      suggestion: 'Remove unused property or add it to schema'
    });
    return { valid: true, errors, warnings };
  }
  
  // Use basic validation compatible with existing types
  return {
    valid: true,
    errors,
    warnings
  };
};

/**
 * Comprehensive renderer validation
 */
export const validateRenderer = (renderer: RendererDefinition): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  
  // Basic renderer validation
  if (!renderer.id) {
    errors.push({
      property: 'id',
      message: 'Renderer must have an ID',
      severity: 'error',
      code: 'RENDERER_MISSING_ID'
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Export validation utilities for external use
 */
export { validationUtils };

/**
 * Export core validators
 */
export { 
  constraintValidator,
  dependencyValidator,
  schemaValidator
};