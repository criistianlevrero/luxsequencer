/**
 * Validation system types and interfaces for Phase 1.2
 * Comprehensive validation for settings, schemas, and renderer configurations
 */

import type { 
  ControlSettings, DeclarativeControlSchema, 
  ValidationResult, ValidationError, ValidationWarning 
} from '../types';
import type { RendererDefinition } from '../components/renderers/types';

// ===== ENHANCED VALIDATION RESULT TYPES =====

// Keep compatibility with existing ValidationResult but extend it
export interface EnhancedValidationResult extends ValidationResult {
  isValid: boolean; // Additional property for new system
  metadata?: ValidationMetadata;
}

// Enhanced error type with additional properties
export interface EnhancedValidationError extends ValidationError {
  type: ValidationErrorType;
  context?: any;
}

// Enhanced warning type  
export interface EnhancedValidationWarning extends ValidationWarning {
  type: ValidationWarType;
}

export interface ValidationMetadata {
  validatedAt: number;
  validatorVersion: string;
  schemaVersion?: string;
  rendererId?: string;
  performance?: {
    validationTime: number;
    rulesEvaluated: number;
  };
}

// ===== ERROR AND WARNING TYPES =====

export type ValidationErrorType = 
  | 'type_mismatch'
  | 'range_violation'
  | 'required_missing'
  | 'format_invalid'
  | 'dependency_violation'
  | 'circular_dependency'
  | 'schema_integrity'
  | 'compatibility_error';

export type ValidationWarType =
  | 'deprecated_property'
  | 'performance_impact'
  | 'suboptimal_value'
  | 'missing_dependency'
  | 'version_mismatch'
  | 'unused_property';

// ===== VALIDATION RULE INTERFACES =====

export interface ValidationRule {
  id: string;
  name: string;
  description?: string;
  priority: ValidationPriority;
  validator: ValidatorFunction;
  applicableTypes?: string[];
  skipCondition?: (context: ValidationContext) => boolean;
}

export interface ValidatorFunction {
  (value: any, context: ValidationContext): ValidationRuleResult;
}

export interface ValidationRuleResult {
  passed: boolean;
  error?: Omit<ValidationError, 'property'>;
  warning?: Omit<ValidationWarning, 'property'>;
}

export interface ValidationContext {
  property: string;
  value: any;
  settings: ControlSettings;
  schema?: DeclarativeControlSchema;
  renderer?: RendererDefinition;
  path: string[];
  parentValues?: Record<string, any>;
}

export type ValidationPriority = 'low' | 'medium' | 'high' | 'critical';

// ===== CONSTRAINT VALIDATION =====

export interface ConstraintValidator {
  // Type constraints
  validateType(value: any, expectedType: string): ValidationRuleResult;
  
  // Range constraints
  validateRange(value: number, min?: number, max?: number): ValidationRuleResult;
  
  // Format constraints
  validateFormat(value: any, format: FormatConstraint): ValidationRuleResult;
  
  // Required constraints
  validateRequired(value: any, isRequired: boolean): ValidationRuleResult;
  
  // Custom constraints
  validateCustom(value: any, validator: (val: any) => boolean, errorMessage: string): ValidationRuleResult;
}

export interface FormatConstraint {
  type: 'regex' | 'email' | 'url' | 'color' | 'json' | 'custom';
  pattern?: string | RegExp;
  validator?: (value: any) => boolean;
  errorMessage?: string;
}

// ===== DEPENDENCY VALIDATION =====

export interface DependencyValidator {
  validateDependencies(settings: ControlSettings, schema: DeclarativeControlSchema): ValidationResult;
  detectCircularDependencies(schema: DeclarativeControlSchema): string[];
  validateConditionalLogic(settings: ControlSettings, dependencies: any[]): ValidationResult;
}

// ===== SCHEMA VALIDATION =====

export interface SchemaValidator {
  validateSchemaIntegrity(schema: DeclarativeControlSchema): ValidationResult;
  validateControlDefinitions(schema: DeclarativeControlSchema): ValidationResult;
  validateSchemaVersion(schema: DeclarativeControlSchema, targetVersion?: string): ValidationResult;
  validateRendererCompatibility(renderer: RendererDefinition): ValidationResult;
}

// ===== SETTINGS VALIDATION =====

export interface SettingsValidator {
  validateSettings(settings: ControlSettings, schema?: DeclarativeControlSchema): ValidationResult;
  validateSettingProperty(property: string, value: any, schema?: DeclarativeControlSchema): ValidationResult;
  validateSettingsStructure(settings: ControlSettings): ValidationResult;
  migrateAndValidate(settings: any): { settings: ControlSettings; validation: ValidationResult };
}

// ===== COMPOSITE VALIDATOR =====

export interface CompositeValidator {
  // Main validation entry points
  validateAll(settings: ControlSettings, renderer: RendererDefinition): ValidationResult;
  validateSettingsOnly(settings: ControlSettings): ValidationResult;
  validateSchemaOnly(schema: DeclarativeControlSchema): ValidationResult;
  
  // Incremental validation for performance
  validateProperty(property: string, value: any, context: ValidationContext): ValidationResult;
  validateDelta(oldSettings: ControlSettings, newSettings: ControlSettings): ValidationResult;
  
  // Batch validation
  validateBatch(validations: Array<{ settings: ControlSettings; renderer?: RendererDefinition }>): ValidationResult[];
}

// ===== VALIDATION CONFIG =====

export interface ValidationConfig {
  enabled: boolean;
  strictMode: boolean;
  failFast: boolean;
  maxErrors: number;
  maxWarnings: number;
  
  // Performance settings
  timeoutMs: number;
  maxValidationDepth: number;
  enableCaching: boolean;
  
  // Rule configuration
  enabledRules: string[];
  disabledRules: string[];
  customRules: ValidationRule[];
  
  // Error handling
  onValidationError?: (error: ValidationError) => void;
  onValidationWarning?: (warning: ValidationWarning) => void;
}

// ===== VALIDATION STORE =====

export interface ValidationState {
  // Current validation status
  isValidating: boolean;
  lastValidation?: ValidationResult;
  validationHistory: ValidationResult[];
  
  // Configuration
  config: ValidationConfig;
  
  // Error tracking
  currentErrors: ValidationError[];
  currentWarnings: ValidationWarning[];
  errorCount: number;
  warningCount: number;
  
  // Performance tracking
  validationStats: {
    totalValidations: number;
    averageValidationTime: number;
    lastValidationTime: number;
    cacheHitRate: number;
  };
}

export interface ValidationActions {
  // Validation operations
  validate: (settings: ControlSettings, renderer?: RendererDefinition) => Promise<ValidationResult>;
  validateProperty: (property: string, value: any) => Promise<ValidationResult>;
  
  // Configuration
  updateConfig: (config: Partial<ValidationConfig>) => void;
  resetConfig: () => void;
  
  // Error management
  clearErrors: () => void;
  clearWarnings: () => void;
  acknowledgeError: (errorCode: string) => void;
  
  // Rule management
  addCustomRule: (rule: ValidationRule) => void;
  removeCustomRule: (ruleId: string) => void;
  enableRule: (ruleId: string) => void;
  disableRule: (ruleId: string) => void;
}

// ===== VALIDATION HOOK TYPES =====

export interface UseValidationResult {
  // Current state
  validation: ValidationResult | null;
  isValidating: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  
  // Validation functions
  validate: (settings?: ControlSettings) => Promise<ValidationResult>;
  validateProperty: (property: string, value: any) => Promise<ValidationResult>;
  
  // Utilities
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  clearErrors: () => void;
  clearWarnings: () => void;
}

// ===== VALIDATION UTILITIES =====

export interface ValidationUtils {
  // Error formatting
  formatError: (error: ValidationError) => string;
  formatWarning: (warning: ValidationWarning) => string;
  
  // Error categorization
  categorizeErrors: (errors: ValidationError[]) => Record<ValidationErrorType, ValidationError[]>;
  categorizeWarnings: (warnings: ValidationWarning[]) => Record<ValidationWarType, ValidationWarning[]>;
  
  // Severity assessment
  getMaxSeverity: (errors: ValidationError[]) => 'error' | 'critical' | null;
  shouldBlockAction: (validation: ValidationResult) => boolean;
  
  // Property path utilities
  getPropertyPath: (property: string) => string[];
  isNestedProperty: (property: string) => boolean;
  getPropertyRoot: (property: string) => string;
}

// ===== EXPORT ALL TYPES =====

export type ValidationSystem = {
  validator: CompositeValidator;
  config: ValidationConfig;
  utils: ValidationUtils;
};