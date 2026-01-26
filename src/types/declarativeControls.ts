import type { ControlSettings } from './index';

// ============================================================================
// DECLARATIVE CONTROL SYSTEM TYPES
// ============================================================================

/**
 * Enhanced control types supported by the declarative system
 */
export type ControlType = 
  | 'slider' 
  | 'color' 
  | 'gradient' 
  | 'select' 
  | 'toggle'
  | 'vector2d'    // New: X,Y control
  | 'range'       // New: min/max range
  | 'curve'       // New: animation curve
  | 'matrix'      // New: matrix of values
  | 'text';       // New: text input

/**
 * Main specification for renderer controls
 */
export interface RendererControlSpec {
  // 90% of cases: completely declarative standard controls
  standard: StandardControlSpec[];
  
  // 10% of cases: custom components for special cases
  custom?: CustomControlSpec[];
}

/**
 * Standard control specification - fully declarative
 */
export interface StandardControlSpec {
  id: keyof ControlSettings;
  type: ControlType;
  category: string;
  label: string;
  constraints: ControlConstraints;
  
  // Metadata for automatic generation
  metadata?: {
    description?: string;
    tooltip?: string;
    units?: string;
    presets?: PresetValue[];
    dependencies?: PropertyDependency[]; // Controls that depend on others
  };
}

/**
 * Custom control specification for special cases
 */
export interface CustomControlSpec {
  id: string;
  component: React.FC<any>;
  category: string;
  label?: string;
  metadata?: {
    description?: string;
    tooltip?: string;
  };
}

/**
 * Constraints for different control types
 */
export interface ControlConstraints {
  slider?: SliderConstraints;
  color?: ColorConstraints;
  gradient?: GradientConstraints;
  select?: SelectConstraints;
  toggle?: ToggleConstraints;
  vector2d?: Vector2DConstraints;
  range?: RangeConstraints;
  text?: TextConstraints;
}

/**
 * Advanced slider constraints with new features
 */
export interface SliderConstraints {
  min: number;
  max: number;
  step: number;
  logarithmic?: boolean;
  formatter: (value: number) => string;
  
  // Advanced characteristics
  curves?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  bipolar?: boolean; // For controls that go from -N to +N with 0 in center
  detents?: number[]; // Values that "attract" the control
}

/**
 * Color control constraints
 */
export interface ColorConstraints {
  format?: 'hex' | 'rgb' | 'hsl';
  alpha?: boolean;
  palette?: string[]; // Preset colors
}

/**
 * Gradient control constraints
 */
export interface GradientConstraints {
  minColors: number;
  maxColors: number;
  allowHardStops: boolean;
  presetPalettes?: ColorPalette[];
  colorSpace?: 'rgb' | 'hsl' | 'lab';
}

/**
 * Select dropdown constraints
 */
export interface SelectConstraints {
  options: SelectOption[];
  searchable?: boolean;
  multiple?: boolean;
}

/**
 * Toggle/checkbox constraints
 */
export interface ToggleConstraints {
  style?: 'switch' | 'checkbox' | 'button';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * 2D Vector control constraints
 */
export interface Vector2DConstraints {
  xRange: [number, number];
  yRange: [number, number];
  lockAspectRatio?: boolean;
  polarMode?: boolean; // Show as radius/angle instead of X/Y
  gridSnap?: boolean;
  gridSize?: number;
}

/**
 * Range (min/max) control constraints
 */
export interface RangeConstraints {
  min: number;
  max: number;
  step: number;
  allowOverlap?: boolean;
  formatter?: (value: number) => string;
}

/**
 * Text input constraints
 */
export interface TextConstraints {
  maxLength?: number;
  pattern?: RegExp;
  placeholder?: string;
  multiline?: boolean;
}

/**
 * Property dependencies for conditional display
 */
export interface PropertyDependency {
  property: keyof ControlSettings;
  condition: (value: any) => boolean;
  effect: 'show' | 'hide' | 'enable' | 'disable';
}

/**
 * Preset value for controls
 */
export interface PresetValue {
  name: string;
  value: any;
  description?: string;
}

/**
 * Color palette for gradients
 */
export interface ColorPalette {
  id: string;
  name: string;
  colors: string[];
  description?: string;
}

/**
 * Select option
 */
export interface SelectOption {
  value: any;
  label: string;
  description?: string;
  icon?: string;
}

/**
 * Context provided to controls during rendering
 */
export interface ControlRenderContext {
  settings: ControlSettings;
  rendererId: string;
  timestamp: number;
  deviceType?: 'desktop' | 'tablet' | 'mobile';
}

/**
 * Props passed to control components
 */
export interface BaseControlProps<T = any> {
  spec: StandardControlSpec;
  value: T;
  onChange: (value: T) => void;
  context: ControlRenderContext;
  disabled?: boolean;
}

// Type-specific control props
export interface SliderControlProps extends BaseControlProps<number> {
  spec: StandardControlSpec & { constraints: { slider: SliderConstraints } };
}

export interface ColorControlProps extends BaseControlProps<string> {
  spec: StandardControlSpec & { constraints: { color: ColorConstraints } };
}

export interface GradientControlProps extends BaseControlProps<any[]> {
  spec: StandardControlSpec & { constraints: { gradient: GradientConstraints } };
}

export interface Vector2DControlProps extends BaseControlProps<{ x: number; y: number }> {
  spec: StandardControlSpec & { constraints: { vector2d: Vector2DConstraints } };
}

export interface SelectControlProps extends BaseControlProps<any> {
  spec: StandardControlSpec & { constraints: { select: SelectConstraints } };
}

export interface ToggleControlProps extends BaseControlProps<boolean> {
  spec: StandardControlSpec & { constraints: { toggle: ToggleConstraints } };
}

export interface RangeControlProps extends BaseControlProps<{ min: number; max: number }> {
  spec: StandardControlSpec & { constraints: { range: RangeConstraints } };
}

export interface TextControlProps extends BaseControlProps<string> {
  spec: StandardControlSpec & { constraints: { text: TextConstraints } };
}