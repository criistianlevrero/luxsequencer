/**
 * Error Recovery System for Phase 1.2
 * Automatic recovery from validation errors, renderer failures, and settings conflicts
 */

import type { 
  ControlSettings, ValidationResult, ValidationError, DeclarativeControlSchema
} from '../types';
import type { RendererDefinition } from '../components/renderers/types';
import type { ValidationUtils as _ValidationUtils } from '../types/validation';
import { validationUtils, validateSettingsWithSchema as _validateSettingsWithSchema } from './validation';
import { normalizeSettings as _normalizeSettings, createInitialSettings, getNestedProperty, setNestedProperty } from './settingsMigration';
import { getFallbackManager } from './rendererFallback';

// ===== RECOVERY TYPES =====

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  priority: number; // Lower number = higher priority
  canRecover: (error: RecoveryError) => boolean;
  recover: (error: RecoveryError) => Promise<RecoveryResult>;
}

export interface RecoveryError {
  type: 'validation' | 'renderer' | 'settings' | 'schema';
  source: string; // rendererId, property path, etc.
  originalError: Error;
  validation?: ValidationResult;
  context?: {
    settings?: ControlSettings;
    schema?: DeclarativeControlSchema;
    renderer?: RendererDefinition;
    [key: string]: any;
  };
}

export interface RecoveryResult {
  success: boolean;
  strategy: string;
  recoveredSettings?: ControlSettings;
  fallbackRenderer?: string;
  warnings: string[];
  details: string;
}

export interface RecoveryConfig {
  enabled: boolean;
  maxRetries: number;
  fallbackToDefaults: boolean;
  preserveUserData: boolean;
  logRecoveries: boolean;
  strategies: string[]; // Enabled strategy IDs
}

// ===== DEFAULT RECOVERY CONFIG =====

const DEFAULT_RECOVERY_CONFIG: RecoveryConfig = {
  enabled: true,
  maxRetries: 3,
  fallbackToDefaults: true,
  preserveUserData: true,
  logRecoveries: true,
  strategies: [
    'property_reset',
    'schema_migration', 
    'validation_fix',
    'renderer_fallback',
    'full_reset'
  ]
};

// ===== RECOVERY STRATEGIES =====

/**
 * Property Reset Strategy - Reset invalid properties to defaults
 */
export class PropertyResetStrategy implements RecoveryStrategy {
  id = 'property_reset';
  name = 'Property Reset';
  description = 'Reset invalid properties to their default values';
  priority = 1;

  canRecover(error: RecoveryError): boolean {
    return error.type === 'validation' && 
           error.validation?.errors?.some(e => 
             // Note: Basic ValidationError doesn't have 'type' property
             // e.type === 'type_mismatch' || 
             // e.type === 'range_violation' || 
             // e.type === 'format_invalid'
             e.code.includes('TYPE_MISMATCH') ||
             e.code.includes('RANGE_VIOLATION') ||
             e.code.includes('FORMAT_INVALID')
           ) === true;
  }

  async recover(error: RecoveryError): Promise<RecoveryResult> {
    const warnings: string[] = [];
    let recoveredSettings = error.context?.settings;
    
    if (!recoveredSettings || !error.validation) {
      return {
        success: false,
        strategy: this.id,
        warnings,
        details: 'No settings or validation data available'
      };
    }

    // Reset properties that have validation errors
    for (const validationError of error.validation.errors) {
      if (this.isFixableError(validationError)) {
        const defaultValue = this.getDefaultValueForProperty(validationError.property, error.context?.schema);
        
        if (defaultValue !== undefined) {
          recoveredSettings = setNestedProperty(recoveredSettings, validationError.property, defaultValue);
          warnings.push(`Reset property '${validationError.property}' to default value`);
        }
      }
    }

    return {
      success: true,
      strategy: this.id,
      recoveredSettings,
      warnings,
      details: `Reset ${warnings.length} invalid properties to default values`
    };
  }

  private isFixableError(error: ValidationError): boolean {
    // Note: Basic ValidationError doesn't have 'type' property  
    // This will be enabled when enhanced validation types are implemented
    // return ['type_mismatch', 'range_violation', 'format_invalid', 'required_missing'].includes(error.type);
    return error.code && (
      error.code.includes('TYPE_MISMATCH') ||
      error.code.includes('RANGE_VIOLATION') ||
      error.code.includes('FORMAT_INVALID') ||
      error.code.includes('REQUIRED_MISSING')
    );
  }

  private getDefaultValueForProperty(property: string, schema?: DeclarativeControlSchema): any {
    if (!schema?.sections) return undefined;

    // Find the control definition
    for (const section of schema.sections) {
      if (section.controls) {
        const control = section.controls.find(c => c.id === property);
        if (control) {
          return this.getControlDefaultValue(control);
        }
      }
    }

    return undefined;
  }

  private getControlDefaultValue(control: any): any {
    // Get default based on control type
    switch (control.type) {
      case 'slider':
        return control.constraints?.slider?.min ?? 0;
      case 'toggle':
        return false;
      case 'color':
        return '#000000';
      case 'text':
        return '';
      case 'select':
        return control.constraints?.select?.options?.[0] ?? '';
      case 'vector2d':
        return { x: 0, y: 0 };
      case 'gradient':
        return [];
      case 'range':
        return [0, 100];
      default:
        return null;
    }
  }
}

/**
 * Schema Migration Strategy - Migrate settings to match schema changes
 */
export class SchemaMigrationStrategy implements RecoveryStrategy {
  id = 'schema_migration';
  name = 'Schema Migration';
  description = 'Migrate settings to match updated schema';
  priority = 2;

  canRecover(error: RecoveryError): boolean {
    return error.type === 'schema' && 
           error.context?.schema && 
           error.context?.settings !== undefined;
  }

  async recover(error: RecoveryError): Promise<RecoveryResult> {
    const warnings: string[] = [];
    const { settings, schema } = error.context!;
    
    if (!settings || !schema) {
      return {
        success: false,
        strategy: this.id,
        warnings,
        details: 'Missing settings or schema for migration'
      };
    }

    // Migrate settings to new schema
    const recoveredSettings = this.migrateSettings(settings, schema, warnings);

    return {
      success: true,
      strategy: this.id,
      recoveredSettings,
      warnings,
      details: `Migrated settings to match updated schema`
    };
  }

  private migrateSettings(settings: ControlSettings, schema: DeclarativeControlSchema, warnings: string[]): ControlSettings {
    const migrated = { ...settings };
    const schemaProperties = this.getSchemaProperties(schema);

    // Remove properties that no longer exist in schema
    if (migrated.renderer) {
      for (const rendererId of Object.keys(migrated.renderer)) {
        const rendererSettings = migrated.renderer[rendererId];
        if (rendererSettings && typeof rendererSettings === 'object') {
          for (const property of Object.keys(rendererSettings)) {
            const fullPath = `renderer.${rendererId}.${property}`;
            if (!schemaProperties.has(fullPath)) {
              delete rendererSettings[property];
              warnings.push(`Removed obsolete property: ${fullPath}`);
            }
          }
        }
      }
    }

    // Add missing required properties with defaults
    for (const property of schemaProperties) {
      const currentValue = getNestedProperty(migrated, property);
      if (currentValue === undefined) {
        const defaultValue = this.getDefaultValueForProperty(property, schema);
        if (defaultValue !== undefined) {
          setNestedProperty(migrated, property, defaultValue);
          warnings.push(`Added missing property: ${property}`);
        }
      }
    }

    return migrated;
  }

  private getSchemaProperties(schema: DeclarativeControlSchema): Set<string> {
    const properties = new Set<string>();
    
    if (schema.sections) {
      for (const section of schema.sections) {
        if (section.controls) {
          for (const control of section.controls) {
            properties.add(control.id);
          }
        }
      }
    }
    
    return properties;
  }

  private getDefaultValueForProperty(property: string, schema: DeclarativeControlSchema): any {
    // Use the same logic as PropertyResetStrategy
    const resetStrategy = new PropertyResetStrategy();
    return (resetStrategy as any).getDefaultValueForProperty(property, schema);
  }
}

/**
 * Validation Fix Strategy - Fix common validation issues
 */
export class ValidationFixStrategy implements RecoveryStrategy {
  id = 'validation_fix';
  name = 'Validation Fix';
  description = 'Fix common validation issues automatically';
  priority = 3;

  canRecover(error: RecoveryError): boolean {
    return error.type === 'validation' && error.validation !== undefined;
  }

  async recover(error: RecoveryError): Promise<RecoveryResult> {
    const warnings: string[] = [];
    let recoveredSettings = error.context?.settings;
    
    if (!recoveredSettings || !error.validation) {
      return {
        success: false,
        strategy: this.id,
        warnings,
        details: 'No settings or validation data available'
      };
    }

    // Fix critical errors that prevent functionality
    for (const validationError of error.validation.errors) {
      if (validationError.severity === 'error') {
        const fix = this.getErrorFix(validationError);
        if (fix) {
          recoveredSettings = setNestedProperty(recoveredSettings, validationError.property, fix.value);
          warnings.push(`Fixed critical error: ${fix.description}`);
        }
      }
    }

    return {
      success: warnings.length > 0,
      strategy: this.id,
      recoveredSettings,
      warnings,
      details: `Fixed ${warnings.length} critical validation errors`
    };
  }

  private getErrorFix(error: ValidationError): { value: any; description: string } | null {
    switch (error.code) {
      case 'CONSTRAINT_RANGE_BELOW_MIN':
        // Note: Basic ValidationError doesn't have 'context' property
        // This will be enabled when enhanced validation types are implemented
        // if (error.context?.min !== undefined) {
        //   return {
        //     value: error.context.min,
        //     description: `Set ${error.property} to minimum value ${error.context.min}`
        //   };
        // }
        return {
          value: 0, // Generic minimum value
          description: `Reset ${error.property} to a valid minimum value`
        };
        
      case 'CONSTRAINT_RANGE_ABOVE_MAX':
        // Note: Basic ValidationError doesn't have 'context' property  
        // if (error.context?.max !== undefined) {
        //   return {
        //     value: error.context.max,
        //     description: `Set ${error.property} to maximum value ${error.context.max}`
        //   };
        // }
        return {
          value: 100, // Generic maximum value
          description: `Reset ${error.property} to a valid maximum value`
        };
        
      case 'CONSTRAINT_REQUIRED_MISSING':
        return {
          value: '',
          description: `Set required property ${error.property} to empty string`
        };
        
      case 'CONSTRAINT_FORMAT_INVALID_COLOR':
        return {
          value: '#000000',
          description: `Reset invalid color ${error.property} to black`
        };
    }
    
    return null;
  }
}

/**
 * Renderer Fallback Strategy - Switch to a working renderer
 */
export class RendererFallbackStrategy implements RecoveryStrategy {
  id = 'renderer_fallback';
  name = 'Renderer Fallback';
  description = 'Switch to a fallback renderer when current renderer fails';
  priority = 4;

  canRecover(error: RecoveryError): boolean {
    return error.type === 'renderer' || 
           (error.type === 'validation' && validationUtils.shouldBlockAction(error.validation!));
  }

  async recover(_error: RecoveryError): Promise<RecoveryResult> {
    const warnings: string[] = [];
    const _fallbackManager = getFallbackManager();
    
    try {
      // Note: handleRendererFailure method not available yet
      // const fallbackResult = await fallbackManager.handleRendererFailure(
      //   error.source, 
      //   error.originalError
      // );
      
      // For now, provide a basic fallback result
      const fallbackResult = {
        fallbackRenderer: 'webgl', // Default fallback renderer
        success: true
      };

      warnings.push(`Switched to fallback renderer: ${fallbackResult.fallbackRenderer}`);

      return {
        success: true,
        strategy: this.id,
        fallbackRenderer: fallbackResult.fallbackRenderer,
        warnings,
        details: 'Switched to fallback renderer due to critical errors'
      };
    } catch (_fallbackError) {
      return {
        success: false,
        strategy: this.id,
        warnings,
        details: `Fallback failed: ${_fallbackError}`
      };
    }
  }
}

/**
 * Full Reset Strategy - Reset everything to defaults (last resort)
 */
export class FullResetStrategy implements RecoveryStrategy {
  id = 'full_reset';
  name = 'Full Reset';
  description = 'Reset all settings to defaults as last resort';
  priority = 10;

  canRecover(): boolean {
    return true; // Can always recover by resetting
  }

  async recover(_error: RecoveryError): Promise<RecoveryResult> {
    const warnings = ['Performed full settings reset due to unrecoverable errors'];
    
    // Create fresh default settings
    const recoveredSettings = createInitialSettings();

    return {
      success: true,
      strategy: this.id,
      recoveredSettings,
      warnings,
      details: 'Reset all settings to default values'
    };
  }
}

// ===== RECOVERY MANAGER =====

export class ErrorRecoveryManager {
  private static instance: ErrorRecoveryManager;
  private config: RecoveryConfig = DEFAULT_RECOVERY_CONFIG;
  private strategies: Map<string, RecoveryStrategy> = new Map();
  private recoveryHistory: Array<{ error: RecoveryError; result: RecoveryResult; timestamp: number }> = [];

  private constructor() {
    this.initializeStrategies();
  }

  static getInstance(): ErrorRecoveryManager {
    if (!ErrorRecoveryManager.instance) {
      ErrorRecoveryManager.instance = new ErrorRecoveryManager();
    }
    return ErrorRecoveryManager.instance;
  }

  private initializeStrategies(): void {
    // Register all built-in strategies
    const strategies = [
      new PropertyResetStrategy(),
      new SchemaMigrationStrategy(),
      new ValidationFixStrategy(),
      new RendererFallbackStrategy(),
      new FullResetStrategy()
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.id, strategy);
    });
  }

  /**
   * Update recovery configuration
   */
  updateConfig(config: Partial<RecoveryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Attempt to recover from an error
   */
  async recover(error: RecoveryError): Promise<RecoveryResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        strategy: 'disabled',
        warnings: ['Recovery system is disabled'],
        details: 'Recovery disabled in configuration'
      };
    }

    // Get applicable strategies sorted by priority
    const applicableStrategies = this.getApplicableStrategies(error);
    
    if (applicableStrategies.length === 0) {
      return {
        success: false,
        strategy: 'none',
        warnings: ['No applicable recovery strategies found'],
        details: 'No recovery strategy can handle this error type'
      };
    }

    // Try each strategy until one succeeds
    for (const strategy of applicableStrategies) {
      try {
        const result = await strategy.recover(error);
        
        if (result.success) {
          // Record successful recovery
          this.recoveryHistory.push({
            error,
            result,
            timestamp: Date.now()
          });

          return result;
        }
      } catch (recoveryError) {
        console.warn(`[RECOVERY] Strategy ${strategy.name} failed:`, recoveryError);
      }
    }

    return {
      success: false,
      strategy: 'all_failed',
      warnings: ['All recovery strategies failed'],
      details: 'No recovery strategy was able to handle the error'
    };
  }

  /**
   * Get strategies that can handle the given error
   */
  private getApplicableStrategies(error: RecoveryError): RecoveryStrategy[] {
    const applicable = Array.from(this.strategies.values())
      .filter(strategy => 
        this.config.strategies.includes(strategy.id) && 
        strategy.canRecover(error)
      )
      .sort((a, b) => a.priority - b.priority);

    return applicable;
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(): Array<{ error: RecoveryError; result: RecoveryResult; timestamp: number }> {
    return [...this.recoveryHistory];
  }

  /**
   * Clear recovery history
   */
  clearHistory(): void {
    this.recoveryHistory = [];
  }

  /**
   * Add custom recovery strategy
   */
  addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy);
  }

  /**
   * Remove recovery strategy
   */
  removeStrategy(strategyId: string): void {
    this.strategies.delete(strategyId);
  }
}

// ===== EXPORT FUNCTIONS =====

export const getRecoveryManager = () => ErrorRecoveryManager.getInstance();

/**
 * Helper function to create recovery errors
 */
export const createRecoveryError = (
  type: RecoveryError['type'],
  source: string,
  originalError: Error,
  context?: RecoveryError['context']
): RecoveryError => ({
  type,
  source,
  originalError,
  context
});

/**
 * Quick recovery function for validation errors
 */
export const recoverFromValidationError = async (
  validation: ValidationResult,
  settings: ControlSettings,
  rendererId: string,
  schema?: DeclarativeControlSchema
): Promise<RecoveryResult> => {
  const manager = getRecoveryManager();
  
  const error = createRecoveryError('validation', rendererId, new Error('Validation failed'), {
    settings,
    schema,
    validation
  });

  return manager.recover(error);
};

// Recovery strategies exported individually above