/**
 * Core validation implementation for Phase 1.2 - Simplified Version
 * Minimal validation system that works with existing types
 */

import type { 
  ValidationResult, ValidationError, ValidationWarning, ValidationRule
} from '../types';
import type { ControlSettings, DeclarativeControlSchema } from '../types';
import type { RendererDefinition } from '../components/renderers/types';

// ===== SIMPLIFIED VALIDATION IMPLEMENTATIONS =====

export class ConstraintValidatorImpl {
  validateType(value: any, expectedType: string): { passed: boolean; error?: any } {
    return { passed: true }; // Simplified - always pass
  }

  validateRange(value: number, min: number, max: number): { passed: boolean; error?: any } {
    if (value < min || value > max) {
      return {
        passed: false,
        error: {
          message: `Value ${value} is outside range [${min}, ${max}]`,
          code: 'RANGE_VIOLATION',
          severity: 'error'
        }
      };
    }
    return { passed: true };
  }

  validateFormat(value: any, format: any): { passed: boolean; error?: any } {
    return { passed: true }; // Simplified - always pass
  }

  validateRequired(value: any): { passed: boolean; error?: any } {
    if (value === undefined || value === null || value === '') {
      return {
        passed: false,
        error: {
          message: 'Required value is missing',
          code: 'REQUIRED_MISSING',
          severity: 'error'
        }
      };
    }
    return { passed: true };
  }

  validateCustom(value: any, validator: Function): { passed: boolean; error?: any } {
    try {
      const result = validator(value);
      return { passed: !!result };
    } catch (error) {
      return {
        passed: false,
        error: {
          message: `Custom validation failed: ${error}`,
          code: 'CUSTOM_VALIDATION_ERROR',
          severity: 'error'
        }
      };
    }
  }
}

export class DependencyValidatorImpl {
  validateDependencies(settings: ControlSettings, schema: DeclarativeControlSchema): ValidationResult {
    // Simplified - no dependency validation for now
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  validateConditionalLogic(settings: ControlSettings, dependencies: any[]): ValidationResult {
    // Simplified - no conditional logic validation for now
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  detectCircularDependencies(schema: DeclarativeControlSchema): string[] {
    // Simplified - no circular dependency detection for now
    return [];
  }
}

export class SchemaValidatorImpl {
  validateSchemaIntegrity(schema: DeclarativeControlSchema): ValidationResult {
    // Basic schema validation
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!schema.sections || schema.sections.length === 0) {
      warnings.push({
        property: 'sections',
        message: 'Schema has no control sections',
        code: 'SCHEMA_NO_SECTIONS',
        suggestion: 'Add at least one control section'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateControlDefinitions(schema: DeclarativeControlSchema): ValidationResult {
    // Simplified - basic control definition validation
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  validateSchemaVersion(schema: DeclarativeControlSchema, targetVersion?: string): ValidationResult {
    // Simplified - no version validation for now
    return {
      valid: true,
      errors: [],
      warnings: []
    };
  }

  validateRendererCompatibility(renderer: RendererDefinition): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (!renderer.component) {
      errors.push({
        property: 'component',
        message: 'Renderer is missing component',
        severity: 'error',
        code: 'RENDERER_NO_COMPONENT'
      });
    }

    if (!renderer.name) {
      errors.push({
        property: 'name',
        message: 'Renderer is missing name',
        severity: 'error',
        code: 'RENDERER_NO_NAME'
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export class ValidationUtilsImpl {
  formatError(error: ValidationError): string {
    return `${error.property}: ${error.message} (${error.code})`;
  }

  formatWarning(warning: ValidationWarning): string {
    return `${warning.property}: ${warning.message} (${warning.code})`;
  }

  categorizeErrors(errors: ValidationError[]): Record<string, ValidationError[]> {
    return { general: errors };
  }

  categorizeWarnings(warnings: ValidationWarning[]): Record<string, ValidationWarning[]> {
    return { general: warnings };
  }

  getMaxSeverity(errors: ValidationError[]): 'error' | null {
    return errors.length > 0 ? 'error' : null;
  }

  shouldBlockAction(validation: ValidationResult): boolean {
    return validation.errors.length > 0;
  }

  getPropertyPath(property: string): string[] {
    return property.split('.');
  }

  isNestedProperty(property: string): boolean {
    return property.includes('.');
  }

  getPropertyRoot(property: string): string {
    return property.split('.')[0];
  }
}

// ===== EXPORT IMPLEMENTATIONS =====

export const constraintValidator = new ConstraintValidatorImpl();
export const dependencyValidator = new DependencyValidatorImpl();
export const schemaValidator = new SchemaValidatorImpl();
export const validationUtils = new ValidationUtilsImpl();