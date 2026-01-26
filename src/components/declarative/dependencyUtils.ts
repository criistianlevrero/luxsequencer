/**
 * Utility functions for declarative control dependencies
 * Common condition functions and dependency helpers
 */

/**
 * Common condition functions for PropertyDependency
 */
export const DependencyConditions = {
  // Value comparisons
  equals: (expectedValue: any) => (value: any) => value === expectedValue,
  notEquals: (expectedValue: any) => (value: any) => value !== expectedValue,
  greaterThan: (threshold: number) => (value: number) => value > threshold,
  lessThan: (threshold: number) => (value: number) => value < threshold,
  greaterThanOrEqual: (threshold: number) => (value: number) => value >= threshold,
  lessThanOrEqual: (threshold: number) => (value: number) => value <= threshold,
  
  // Range conditions
  inRange: (min: number, max: number) => (value: number) => value >= min && value <= max,
  outOfRange: (min: number, max: number) => (value: number) => value < min || value > max,
  
  // Boolean conditions
  isTrue: (value: boolean) => value === true,
  isFalse: (value: boolean) => value === false,
  isTruthy: (value: any) => Boolean(value),
  isFalsy: (value: any) => !Boolean(value),
  
  // String conditions
  contains: (substring: string) => (value: string) => 
    typeof value === 'string' && value.includes(substring),
  startsWith: (prefix: string) => (value: string) => 
    typeof value === 'string' && value.startsWith(prefix),
  endsWith: (suffix: string) => (value: string) => 
    typeof value === 'string' && value.endsWith(suffix),
  matches: (regex: RegExp) => (value: string) => 
    typeof value === 'string' && regex.test(value),
  isEmpty: (value: string) => typeof value === 'string' && value.length === 0,
  isNotEmpty: (value: string) => typeof value === 'string' && value.length > 0,
  
  // Array conditions
  includesValue: (expectedValue: any) => (value: any[]) => 
    Array.isArray(value) && value.includes(expectedValue),
  hasLength: (length: number) => (value: any[]) => 
    Array.isArray(value) && value.length === length,
  hasMinLength: (minLength: number) => (value: any[]) => 
    Array.isArray(value) && value.length >= minLength,
  hasMaxLength: (maxLength: number) => (value: any[]) => 
    Array.isArray(value) && value.length <= maxLength,
  
  // Object conditions
  hasProperty: (property: string) => (value: object) => 
    typeof value === 'object' && value !== null && property in value,
  
  // Multiple values (OR condition)
  isOneOf: (values: any[]) => (value: any) => values.includes(value),
  isNotOneOf: (values: any[]) => (value: any) => !values.includes(value),
  
  // Custom validators
  custom: (validator: (value: any) => boolean) => validator
};

/**
 * Dependency builder for fluent API
 */
export class DependencyBuilder {
  private dependencies: import('../types/declarativeControls').PropertyDependency[] = [];
  
  /**
   * Add a show dependency
   */
  showWhen(property: string, condition: (value: any) => boolean) {
    this.dependencies.push({
      property,
      condition,
      effect: 'show'
    });
    return this;
  }
  
  /**
   * Add a hide dependency  
   */
  hideWhen(property: string, condition: (value: any) => boolean) {
    this.dependencies.push({
      property,
      condition,
      effect: 'hide'
    });
    return this;
  }
  
  /**
   * Add an enable dependency
   */
  enableWhen(property: string, condition: (value: any) => boolean) {
    this.dependencies.push({
      property,
      condition,
      effect: 'enable'
    });
    return this;
  }
  
  /**
   * Add a disable dependency
   */
  disableWhen(property: string, condition: (value: any) => boolean) {
    this.dependencies.push({
      property,
      condition,
      effect: 'disable'
    });
    return this;
  }
  
  /**
   * Build the dependencies array
   */
  build() {
    return this.dependencies;
  }
}

/**
 * Create a new dependency builder
 */
export const createDependencies = () => new DependencyBuilder();

/**
 * Common dependency patterns for quick setup
 */
export const CommonDependencies = {
  /**
   * Show control only when another control is enabled
   */
  showWhenEnabled: (property: string) => 
    createDependencies().showWhen(property, DependencyConditions.isTrue).build(),
    
  /**
   * Hide control when another control is disabled
   */
  hideWhenDisabled: (property: string) =>
    createDependencies().hideWhen(property, DependencyConditions.isFalse).build(),
    
  /**
   * Enable control only when value is in range
   */
  enableWhenInRange: (property: string, min: number, max: number) =>
    createDependencies().enableWhen(property, DependencyConditions.inRange(min, max)).build(),
    
  /**
   * Show control only when mode matches
   */
  showWhenMode: (property: string, mode: string) =>
    createDependencies().showWhen(property, DependencyConditions.equals(mode)).build(),
    
  /**
   * Complex animation dependency - show only when animation is enabled
   */
  showForAnimation: (animationProperty: string = 'enableAnimation') =>
    createDependencies()
      .showWhen(animationProperty, DependencyConditions.isTrue)
      .build(),
  
  /**
   * Advanced controls - show only when advanced mode is enabled
   */
  showForAdvanced: (advancedProperty: string = 'showAdvanced') =>
    createDependencies()
      .showWhen(advancedProperty, DependencyConditions.isTrue)
      .build()
};

/**
 * Evaluation helper for testing dependency conditions
 */
export const evaluateDependency = (
  dependency: import('../types/declarativeControls').PropertyDependency,
  settings: any
): boolean => {
  const getValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };
  
  const value = getValue(settings, dependency.property);
  return dependency.condition(value);
};

/**
 * Batch evaluate all dependencies for a control
 */
export const evaluateAllDependencies = (
  dependencies: import('../types/declarativeControls').PropertyDependency[],
  settings: any
): { visible: boolean; enabled: boolean } => {
  let visible = true;
  let enabled = true;
  
  for (const dependency of dependencies) {
    const conditionMet = evaluateDependency(dependency, settings);
    
    switch (dependency.effect) {
      case 'show':
        if (!conditionMet) visible = false;
        break;
      case 'hide':
        if (conditionMet) visible = false;
        break;
      case 'enable':
        if (!conditionMet) enabled = false;
        break;
      case 'disable':
        if (conditionMet) enabled = false;
        break;
    }
  }
  
  return { visible, enabled };
};