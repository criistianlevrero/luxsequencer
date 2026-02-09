/**
 * Validation slice for Zustand store - Phase 1.2 (Simplified)
 * Real-time validation integration with settings changes
 */

import { StateCreator } from 'zustand';
import type { 
  ValidationResult, ValidationError, ValidationWarning,
  ControlSettings, DeclarativeControlSchema as _DeclarativeControlSchema 
} from '../../types';
import { validateRendererSettings } from '../../utils/validation';
import { renderers } from '../../components/renderers';
import { env } from '../../config';

// ===== SIMPLIFIED VALIDATION STATE =====

export interface ValidationState {
  // Current validation status
  isValidating: boolean;
  lastValidation: ValidationResult | null;
  
  // Real-time validation results
  propertyValidations: Map<string, ValidationResult>;
  
  // Error tracking
  currentErrors: ValidationError[];
  currentWarnings: ValidationWarning[];
  
  // Performance tracking
  validationStats: {
    totalValidations: number;
    lastValidationTime: number;
  };
}

// ===== SIMPLIFIED VALIDATION ACTIONS =====

export interface ValidationActions {
  // Validation operations
  validateAll: () => Promise<ValidationResult>;
  validateProperty: (property: string, value: any) => Promise<ValidationResult>;
  
  // Error management
  clearErrors: () => void;
  clearWarnings: () => void;
}

// ===== VALIDATION SLICE =====

export type ValidationSlice = ValidationState & ValidationActions;

export const createValidationSlice: StateCreator<
  ValidationSlice,
  [],
  [],
  ValidationSlice
> = (set, get) => ({
  // ===== INITIAL STATE =====
  isValidating: false,
  lastValidation: null,
  propertyValidations: new Map(),
  currentErrors: [],
  currentWarnings: [],
  validationStats: {
    totalValidations: 0,
    lastValidationTime: 0
  },

  // ===== VALIDATION OPERATIONS =====

  validateAll: async () => {
    const state = get();
    const startTime = Date.now();
    
    set({ isValidating: true });

    try {
      // Get current settings and renderer info
      const settings = (state as any).currentSettings as ControlSettings;
      const activeRenderer = (state as any).project?.globalSettings?.renderer ?? 'webgl';
      const renderer = renderers[activeRenderer];

      // Perform basic validation using existing system
      const validation = renderer?.validation 
        ? validateRendererSettings(renderer, settings)
        : { valid: true, errors: [], warnings: [] };
      
      // Update validation statistics
      const validationTime = Date.now() - startTime;
      const newStats = {
        totalValidations: state.validationStats.totalValidations + 1,
        lastValidationTime: validationTime
      };

      // Update state with validation results
      set({
        isValidating: false,
        lastValidation: validation,
        currentErrors: validation.errors,
        currentWarnings: validation.warnings,
        validationStats: newStats
      });

      if (env.debug.validation) {
        console.log('[VALIDATION SLICE] Validation completed:', {
          valid: validation.valid,
          errors: validation.errors.length,
          warnings: validation.warnings.length,
          time: validationTime
        });
      }

      return validation;
    } catch (error) {
      const errorResult: ValidationResult = {
        valid: false,
        errors: [{
          property: 'validation',
          message: `Validation failed: ${error}`,
          code: 'VALIDATION_ERROR',
          severity: 'error'
        }],
        warnings: []
      };

      set({
        isValidating: false,
        lastValidation: errorResult,
        currentErrors: errorResult.errors
      });

      return errorResult;
    }
  },

  validateProperty: async (property: string, _value: any) => {
    const validation: ValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    };

    // Update property-specific validation
    const state = get();
    const newPropertyValidations = new Map(state.propertyValidations);
    newPropertyValidations.set(property, validation);

    set({
      propertyValidations: newPropertyValidations
    });

    if (env.debug.validation) {
      console.log(`[VALIDATION SLICE] Property validation for ${property}:`, validation);
    }

    return validation;
  },

  // ===== ERROR MANAGEMENT =====

  clearErrors: () => {
    set({ 
      currentErrors: []
    });
  },

  clearWarnings: () => {
    set({
      currentWarnings: []
    });
  }
});

// ===== SIMPLIFIED VALIDATION MIDDLEWARE =====

export const validationMiddleware = () => {
  return (storeInitializer: any) => (set: any, get: any, api: any) => {
    return storeInitializer(set, get, api);
  };
};

// ===== VALIDATION HOOK =====

export const useValidation = () => {
  return {
    isValid: true,
    errors: [],
    warnings: [],
    isValidating: false,
    clearErrors: () => {},
    validate: async () => ({ valid: true, errors: [], warnings: [] })
  };
};

// ===== EXPORTS =====

// Validation types exported individually above